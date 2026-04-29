import logging
from dataclasses import dataclass
from typing import AsyncGenerator, Literal

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode
from opentelemetry import trace
from sap_cloud_sdk.agent_decorators import agent_config, agent_model, prompt_section

from tools.map_country_to_currency_tool import map_country_to_currency
from tools.get_exchange_rate_tool import get_exchange_rate
from tools.convert_amount_tool import convert_amount

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

_LOCAL_TOOLS = [map_country_to_currency, get_exchange_rate, convert_amount]


@agent_model(
    key="config.model",
    label="LLM Model",
    description="The language model powering this agent",
)
def get_model_name() -> str:
    return "sap/anthropic--claude-4.5-sonnet"


@agent_config(
    key="config.temperature",
    label="LLM Temperature",
    description="Controls randomness of responses (0.0 = deterministic, 1.0 = creative)",
)
def get_temperature() -> float:
    return 0.0


@prompt_section(
    key="prompts.system",
    label="System Prompt",
    description="The full system prompt defining the agent's role and behavior",
    validation={"format": "markdown", "max_length": 5000},
)
def get_system_prompt() -> str:
    return """You are a Currency Rate Agent — a conversational AI assistant that provides real-time currency exchange rates and amount conversions.

## Capabilities
- Retrieve current exchange rates between any two currencies
- Convert specific monetary amounts between currencies
- Map country names to their ISO 4217 currency codes

## How to handle requests
1. When the user mentions a country name (e.g. "Germany", "Japan"), use the `map_country_to_currency` tool first to resolve it to a currency code.
2. When the user asks for an exchange rate (e.g. "USD to EUR"), use the `get_exchange_rate` tool.
3. When the user wants to convert an amount (e.g. "Convert 500 USD to Thai Baht"), use `map_country_to_currency` if needed to resolve the target, then use the `convert_amount` tool.

## Response format
Always include in your response:
- The exchange rate value
- The source of the data
- The timestamp of the rate
- A warning if the rate is stale (cached due to API unavailability)

## Rules
- Never hallucinate exchange rates — always call the tools to get real data
- Accept both country names and ISO 4217 codes as input
- If a country-to-currency mapping is ambiguous, ask the user to clarify
- You are strictly read-only — never modify any financial records
- If the external rate API is unavailable, clearly indicate that cached rates are being served and show the cache timestamp
"""


@dataclass
class AgentResponse:
    status: Literal["input_required", "completed", "error"]
    message: str


class SampleAgent:
    SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]

    def __init__(self):
        from langchain_litellm import ChatLiteLLM
        self.llm = ChatLiteLLM(model=get_model_name(), temperature=get_temperature())
        self._graph = None

    def _build_graph(self, tools):
        llm_with_tools = self.llm.bind_tools(tools)
        tool_node = ToolNode(tools)

        def should_continue(state: MessagesState) -> Literal["tools", "__end__"]:
            last = state["messages"][-1]
            if hasattr(last, "tool_calls") and last.tool_calls:
                return "tools"
            return "__end__"

        async def call_model(state: MessagesState):
            response = await llm_with_tools.ainvoke(state["messages"])
            return {"messages": [response]}

        builder = StateGraph(MessagesState)
        builder.add_node("model", call_model)
        builder.add_node("tools", tool_node)
        builder.add_edge(START, "model")
        builder.add_conditional_edges("model", should_continue, {"tools": "tools", "__end__": END})
        builder.add_edge("tools", "model")
        return builder.compile()

    async def _get_graph(self):
        if self._graph is None:
            logger.info(
                "Building graph with %d local tool(s): %s",
                len(_LOCAL_TOOLS),
                [t.name for t in _LOCAL_TOOLS],
            )
            self._graph = self._build_graph(_LOCAL_TOOLS)
        return self._graph

    def _emit_m3(self, query: str):
        """Emit milestone M3: Currency Pair Queried."""
        with tracer.start_as_current_span("M3_currency_pair_queried") as span:
            span.set_attribute("user_input", query[:200])
            logger.info("M3.achieved: currency pair query received, input=%s", query[:200])

    async def stream(self, query: str, context_id: str) -> AsyncGenerator[dict, None]:
        yield {
            "is_task_complete": False,
            "require_user_input": False,
            "content": "Processing...",
        }
        try:
            self._emit_m3(query)
            messages = [
                SystemMessage(content=get_system_prompt()),
                HumanMessage(content=query),
            ]
            result = await (await self._get_graph()).ainvoke({"messages": messages})
            response = result["messages"][-1].content
            yield {
                "is_task_complete": True,
                "require_user_input": False,
                "content": response,
            }
        except Exception as e:
            logger.warning("M3.missed: currency pair query could not be parsed, input=%s", query[:200])
            yield {
                "is_task_complete": True,
                "require_user_input": False,
                "content": f"Error: {e}",
            }

    async def invoke(self, query: str, context_id: str) -> AgentResponse:
        try:
            self._emit_m3(query)
            messages = [
                SystemMessage(content=get_system_prompt()),
                HumanMessage(content=query),
            ]
            result = await (await self._get_graph()).ainvoke({"messages": messages})
            response = result["messages"][-1].content
            return AgentResponse(status="completed", message=response)
        except Exception as e:
            logger.warning("M3.missed: currency pair query could not be parsed, input=%s", query[:200])
            return AgentResponse(status="error", message=f"Error: {e}")
