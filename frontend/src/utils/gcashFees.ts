import { GcashRateTier } from '../types';

export const GCASH_RATE_TIERS: GcashRateTier[] = [
  { min: 1, max: 100, fee: 5 },
  { min: 101, max: 500, fee: 10 },
  { min: 501, max: 1000, fee: 20 },
  { min: 1001, max: 1500, fee: 30 },
  { min: 1501, max: 2000, fee: 40 },
  { min: 2001, max: 2500, fee: 50 },
  { min: 2501, max: 3000, fee: 60 },
  { min: 3001, max: 3500, fee: 70 },
  { min: 3501, max: 4000, fee: 80 },
  { min: 4001, max: 4500, fee: 90 },
  { min: 4501, max: 5000, fee: 100 },
  { min: 5001, max: 5500, fee: 110 },
  { min: 5501, max: 6000, fee: 120 },
  { min: 6001, max: 6500, fee: 130 },
  { min: 6501, max: 7000, fee: 140 },
  { min: 7001, max: 7500, fee: 150 },
  { min: 7501, max: 8000, fee: 160 },
  { min: 8001, max: 8500, fee: 170 },
  { min: 8501, max: 9000, fee: 180 },
  { min: 9001, max: 9500, fee: 190 },
  { min: 9501, max: 10000, fee: 200 },
];

/**
 * Calculates the exact GCash service charge fee for any principal amount
 * based on the store's posted rate sheet.
 */
export function calculateGCashFee(amount: number): number {
  if (!amount || amount <= 0) return 0;
  if (amount <= 100) return 5;
  if (amount <= 500) return 10;
  if (amount <= 10000) {
    const step = Math.ceil((amount - 500) / 500);
    return 10 + step * 10;
  }
  // For amounts beyond 10,000 (10 pesos per 500)
  const extraSteps = Math.ceil((amount - 10000) / 500);
  return 200 + extraSteps * 10;
}
