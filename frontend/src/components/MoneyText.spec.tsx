import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/render-with-providers';
import { MoneyText } from './MoneyText';

describe('MoneyText', () => {
  it('renders the formatted amount', () => {
    renderWithProviders(<MoneyText amountMinor={2250000} currencyCode="INR" minorUnitDigits={2} />);

    expect(screen.getByText('₹22,500.00')).toBeInTheDocument();
  });

  it('sets the monospace font family so every figure lines up in tabular columns', () => {
    renderWithProviders(<MoneyText amountMinor={2250000} currencyCode="INR" minorUnitDigits={2} />);

    const el = screen.getByText('₹22,500.00');
    expect(el).toHaveStyle({ fontVariantNumeric: 'tabular-nums' });
  });

  it('defaults to a null-safe dash when amountMinor is null', () => {
    renderWithProviders(<MoneyText amountMinor={null} currencyCode="INR" minorUnitDigits={2} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
