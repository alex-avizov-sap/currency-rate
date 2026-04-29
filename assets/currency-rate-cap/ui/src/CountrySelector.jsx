import React, { useState } from 'react';
import { ComboBox, ComboBoxItem, Label } from '@ui5/webcomponents-react';

const COUNTRIES = [
  { code: 'AED', label: 'UAE (AED)' }, { code: 'ARS', label: 'Argentina (ARS)' },
  { code: 'AUD', label: 'Australia (AUD)' }, { code: 'BDT', label: 'Bangladesh (BDT)' },
  { code: 'BRL', label: 'Brazil (BRL)' }, { code: 'CAD', label: 'Canada (CAD)' },
  { code: 'CHF', label: 'Switzerland (CHF)' }, { code: 'CLP', label: 'Chile (CLP)' },
  { code: 'CNY', label: 'China (CNY)' }, { code: 'COP', label: 'Colombia (COP)' },
  { code: 'CZK', label: 'Czech Republic (CZK)' }, { code: 'DKK', label: 'Denmark (DKK)' },
  { code: 'EGP', label: 'Egypt (EGP)' }, { code: 'EUR', label: 'Euro zone (EUR)' },
  { code: 'GBP', label: 'United Kingdom (GBP)' }, { code: 'GHS', label: 'Ghana (GHS)' },
  { code: 'HKD', label: 'Hong Kong (HKD)' }, { code: 'HUF', label: 'Hungary (HUF)' },
  { code: 'IDR', label: 'Indonesia (IDR)' }, { code: 'ILS', label: 'Israel (ILS)' },
  { code: 'INR', label: 'India (INR)' }, { code: 'JOD', label: 'Jordan (JOD)' },
  { code: 'JPY', label: 'Japan (JPY)' }, { code: 'KES', label: 'Kenya (KES)' },
  { code: 'KRW', label: 'South Korea (KRW)' }, { code: 'LKR', label: 'Sri Lanka (LKR)' },
  { code: 'MXN', label: 'Mexico (MXN)' }, { code: 'MYR', label: 'Malaysia (MYR)' },
  { code: 'NGN', label: 'Nigeria (NGN)' }, { code: 'NOK', label: 'Norway (NOK)' },
  { code: 'NZD', label: 'New Zealand (NZD)' }, { code: 'PHP', label: 'Philippines (PHP)' },
  { code: 'PKR', label: 'Pakistan (PKR)' }, { code: 'PLN', label: 'Poland (PLN)' },
  { code: 'QAR', label: 'Qatar (QAR)' }, { code: 'RON', label: 'Romania (RON)' },
  { code: 'RUB', label: 'Russia (RUB)' }, { code: 'SAR', label: 'Saudi Arabia (SAR)' },
  { code: 'SEK', label: 'Sweden (SEK)' }, { code: 'SGD', label: 'Singapore (SGD)' },
  { code: 'THB', label: 'Thailand (THB)' }, { code: 'TRY', label: 'Turkey (TRY)' },
  { code: 'TWD', label: 'Taiwan (TWD)' }, { code: 'UAH', label: 'Ukraine (UAH)' },
  { code: 'USD', label: 'United States (USD)' }, { code: 'VND', label: 'Vietnam (VND)' },
  { code: 'ZAR', label: 'South Africa (ZAR)' },
];

export default function CountrySelector({ selected, onSelect, label = 'Select currency / country' }) {
  const [filter, setFilter] = useState('');
  const filtered = COUNTRIES.filter(c =>
    c.label.toLowerCase().includes(filter.toLowerCase()) || c.code === selected
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Label>{label}</Label>
      <ComboBox
        value={selected || ''}
        onInput={e => setFilter(e.target.value)}
        onChange={e => {
          const match = COUNTRIES.find(c => c.label === e.target.value || c.code === e.target.value);
          if (match) onSelect(match.code);
        }}
        style={{ minWidth: '200px' }}
      >
        {filtered.map(c => (
          <ComboBoxItem key={c.code} text={c.label} />
        ))}
      </ComboBox>
    </div>
  );
}
