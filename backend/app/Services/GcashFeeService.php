<?php

namespace App\Services;

class GcashFeeService
{
    /**
     * Standard GCash Cash In / Cash Out rate tiers as displayed in the store rate sheet.
     */
    public static function getRates(): array
    {
        return [
            ['min' => 1, 'max' => 100, 'fee' => 5.00],
            ['min' => 101, 'max' => 500, 'fee' => 10.00],
            ['min' => 501, 'max' => 1000, 'fee' => 20.00],
            ['min' => 1001, 'max' => 1500, 'fee' => 30.00],
            ['min' => 1501, 'max' => 2000, 'fee' => 40.00],
            ['min' => 2001, 'max' => 2500, 'fee' => 50.00],
            ['min' => 2501, 'max' => 3000, 'fee' => 60.00],
            ['min' => 3001, 'max' => 3500, 'fee' => 70.00],
            ['min' => 3501, 'max' => 4000, 'fee' => 80.00],
            ['min' => 4001, 'max' => 4500, 'fee' => 90.00],
            ['min' => 4501, 'max' => 5000, 'fee' => 100.00],
            ['min' => 5001, 'max' => 5500, 'fee' => 110.00],
            ['min' => 5501, 'max' => 6000, 'fee' => 120.00],
            ['min' => 6001, 'max' => 6500, 'fee' => 130.00],
            ['min' => 6501, 'max' => 7000, 'fee' => 140.00],
            ['min' => 7001, 'max' => 7500, 'fee' => 150.00],
            ['min' => 7501, 'max' => 8000, 'fee' => 160.00],
            ['min' => 8001, 'max' => 8500, 'fee' => 170.00],
            ['min' => 8501, 'max' => 9000, 'fee' => 180.00],
            ['min' => 9001, 'max' => 9500, 'fee' => 190.00],
            ['min' => 9501, 'max' => 10000, 'fee' => 200.00],
        ];
    }

    /**
     * Calculate GCash service charge fee for a given principal amount.
     */
    public static function calculateFee(float $amount): float
    {
        if ($amount <= 0) {
            return 0.00;
        }

        if ($amount <= 100) {
            return 5.00;
        }

        if ($amount <= 500) {
            return 10.00;
        }

        if ($amount <= 10000) {
            // For 501 to 10000:
            // 501 - 1000: 20
            // 1001 - 1500: 30
            // ...
            // ceil((amount - 500) / 500) * 10 + 10
            $step = (int) ceil(($amount - 500) / 500);
            return (float) (10 + ($step * 10));
        }

        // For amounts above 10,000, follows same tier of 10 pesos per 500
        $extraSteps = (int) ceil(($amount - 10000) / 500);
        return (float) (200 + ($extraSteps * 10));
    }
}
