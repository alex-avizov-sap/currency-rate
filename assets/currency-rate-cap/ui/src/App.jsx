import React, { useState, useCallback } from 'react';
import {
  ShellBar, ShellBarItem, Title
} from '@ui5/webcomponents-react';
import DefaultRateCards from './DefaultRateCards.jsx';
import CountrySelector from './CountrySelector.jsx';
import CurrencySearch from './CurrencySearch.jsx';
import ChatPanel from './ChatPanel.jsx';
import { detectUserCurrency } from './GeolocationService.js';

export default function App() {
  const [localCurrency, setLocalCurrency] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [detectionDone, setDetectionDone] = useState(false);

  // Auto-detect on first render
  React.useEffect(() => {
    detectUserCurrency().then(result => {
      if (result?.currencyCode) setLocalCurrency(result.currencyCode);
      setDetectionDone(true);
    });
  }, []);

  const handleCurrencySelect = useCallback((code) => {
    setLocalCurrency(code);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Header */}
      <ShellBar
        primaryTitle="Currency Rates"
        secondaryTitle="Real-time FX Dashboard"
        style={{ marginBottom: 0 }}
      />

      {/* Location override bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e0e0e0',
        padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'
      }}>
        <CountrySelector
          selected={localCurrency}
          onSelect={handleCurrencySelect}
          label="📍 Your currency:"
        />
        {localCurrency && (
          <span style={{ color: '#6a6a6a', fontSize: '0.85rem' }}>
            Showing rates for <strong>{localCurrency}</strong>
          </span>
        )}
      </div>

      {/* Main content */}
      <div style={{ padding: '1.5rem', paddingRight: chatOpen ? '380px' : '1.5rem', transition: 'padding-right 0.2s' }}>

        {/* Default Rate Cards */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Title level="H3" style={{ padding: '0 1rem 0.5rem' }}>
            Default Rates {localCurrency ? `→ ${localCurrency}` : ''}
          </Title>
          {detectionDone ? (
            <DefaultRateCards
              localCurrency={localCurrency}
              onNoCurrency={() => {}} 
            />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              Detecting your location…
            </div>
          )}
        </div>

        {/* Currency Search */}
        <div>
          <Title level="H3" style={{ padding: '0 1rem 0.5rem' }}>
            Search Any Pair
          </Title>
          <CurrencySearch />
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel open={chatOpen} onToggle={() => setChatOpen(v => !v)} />
    </div>
  );
}
