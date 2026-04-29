import React, { useEffect, useState } from 'react';
import { Card, CardHeader, Text, MessageStrip, BusyIndicator } from '@ui5/webcomponents-react';

const API_BASE = '/currency';

async function fetchDefaultRates(localCurrency) {
  const res = await fetch(`${API_BASE}/getDefaultRates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ localCurrency })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.value || data;
}

export default function DefaultRateCards({ localCurrency, onNoCurrency }) {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!localCurrency) { onNoCurrency?.(); return; }
    setLoading(true);
    setError(null);
    fetchDefaultRates(localCurrency)
      .then(setRates)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [localCurrency]);

  if (loading) return <BusyIndicator active size="Large" style={{ marginTop: '2rem' }} />;
  if (error) return <MessageStrip design="Negative">Failed to load rates: {error}</MessageStrip>;

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem' }}>
      {rates.map((r, i) => (
        <Card key={i} style={{ minWidth: '240px', flex: 1 }}>
          <CardHeader titleText={`${r.fromCurrency} → ${r.toCurrency}`} />
          <div style={{ padding: '1rem' }}>
            <Text style={{ fontSize: '2rem', fontWeight: 'bold' }}>{r.rate?.toFixed(4)}</Text>
            {r.isStale && (
              <MessageStrip design="Warning" style={{ marginTop: '0.5rem' }}>
                Cached rate from {new Date(r.updatedAt).toLocaleString()} — live rate unavailable
              </MessageStrip>
            )}
            <Text style={{ display: 'block', color: '#6a6a6a', marginTop: '0.5rem', fontSize: '0.8rem' }}>
              Source: {r.source} · {r.updatedAt ? new Date(r.updatedAt).toLocaleTimeString() : ''}
            </Text>
          </div>
        </Card>
      ))}
    </div>
  );
}
