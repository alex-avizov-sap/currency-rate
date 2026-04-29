import React, { useState } from 'react';
import {
  Card, CardHeader, Button, Input, Label,
  MessageStrip, BusyIndicator, Text
} from '@ui5/webcomponents-react';

const API_BASE = '/currency';

export default function CurrencySearch() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async () => {
    const f = from.trim().toUpperCase();
    const t = to.trim().toUpperCase();
    if (!f || !t) { setError('Please enter both currencies.'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/getRate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromCurrency: f, toCurrency: t })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data.value ?? data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <Card>
        <CardHeader titleText="Search Exchange Rate" />
        <div style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <Label>From (e.g. USD)</Label>
            <Input
              value={from}
              onInput={e => setFrom(e.target.value)}
              placeholder="USD"
              style={{ width: '120px', display: 'block' }}
            />
          </div>
          <div>
            <Label>To (e.g. EUR)</Label>
            <Input
              value={to}
              onInput={e => setTo(e.target.value)}
              placeholder="EUR"
              style={{ width: '120px', display: 'block' }}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
          </div>
          <Button design="Emphasized" onClick={search} disabled={loading}>
            Search
          </Button>
        </div>

        {loading && <BusyIndicator active style={{ margin: '1rem' }} />}
        {error && <MessageStrip design="Negative" style={{ margin: '0 1rem 1rem' }}>{error}</MessageStrip>}

        {result && (
          <div style={{ padding: '0 1rem 1rem' }}>
            <Text style={{ fontSize: '2rem', fontWeight: 'bold', display: 'block' }}>
              1 {result.fromCurrency} = {result.rate?.toFixed(6)} {result.toCurrency}
            </Text>
            {result.isStale && (
              <MessageStrip design="Warning" style={{ marginTop: '0.5rem' }}>
                Cached rate from {new Date(result.updatedAt).toLocaleString()} — live rate unavailable
              </MessageStrip>
            )}
            <Text style={{ color: '#6a6a6a', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
              Source: {result.source} · Updated: {result.updatedAt ? new Date(result.updatedAt).toLocaleString() : '—'}
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
}
