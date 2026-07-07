import { Text, type TextProps } from '@mantine/core';
import { formatMoney } from '../lib/money';

export interface MoneyTextProps extends Omit<TextProps, 'children' | 'ff'> {
  amountMinor: number | null;
  currencyCode: string;
  minorUnitDigits: number;
}

/**
 * Every money figure in the app renders through this component — the pitch's
 * one deliberate typographic risk (tabular mono figures, sized up wherever
 * they're the point) applied consistently instead of ad-hoc per screen.
 */
export function MoneyText({
  amountMinor,
  currencyCode,
  minorUnitDigits,
  ...textProps
}: MoneyTextProps) {
  if (amountMinor === null) {
    return (
      <Text ff="monospace" style={{ fontVariantNumeric: 'tabular-nums' }} {...textProps}>
        —
      </Text>
    );
  }

  return (
    <Text ff="monospace" style={{ fontVariantNumeric: 'tabular-nums' }} {...textProps}>
      {formatMoney(amountMinor, currencyCode, minorUnitDigits)}
    </Text>
  );
}
