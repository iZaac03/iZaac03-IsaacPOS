<?php

namespace App\Services;

class TaxService
{
    public const VAT_RATE = 0.12;
    public const SENIOR_PWD_DISCOUNT_RATE = 0.20;

    /**
     * Calculate standard Philippine 12% VAT breakdown from a gross total.
     */
    public function calculateStandardVat(float $grossTotal): array
    {
        if ($grossTotal <= 0) {
            return [
                'vatable_sales' => 0.00,
                'vat_amount' => 0.00,
                'vat_exempt_sales' => 0.00,
            ];
        }

        $vatableSales = round($grossTotal / (1 + self::VAT_RATE), 2);
        $vatAmount = round($grossTotal - $vatableSales, 2);

        return [
            'vatable_sales' => $vatableSales,
            'vat_amount' => $vatAmount,
            'vat_exempt_sales' => 0.00,
        ];
    }

    /**
     * Calculate Philippine Senior Citizen or PWD 20% discount + VAT exemption (RA 9994 / RA 10754).
     */
    public function calculateSeniorPwdDiscount(float $grossTotal): array
    {
        if ($grossTotal <= 0) {
            return [
                'subtotal' => 0.00,
                'vatable_sales' => 0.00,
                'vat_amount' => 0.00,
                'vat_exempt_sales' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => 0.00,
            ];
        }

        // 1. Remove 12% VAT to get Net of VAT
        $netOfVat = round($grossTotal / (1 + self::VAT_RATE), 2);

        // 2. Apply 20% discount on the Net of VAT amount
        $seniorDiscount = round($netOfVat * self::SENIOR_PWD_DISCOUNT_RATE, 2);

        // 3. Final payable is Net of VAT minus 20% discount
        $totalPayable = round($netOfVat - $seniorDiscount, 2);

        // 4. Total discount benefit granted to customer
        $totalDiscountAmount = round($grossTotal - $totalPayable, 2);

        return [
            'subtotal' => round($grossTotal, 2),
            'vatable_sales' => 0.00,
            'vat_amount' => 0.00,
            'vat_exempt_sales' => $totalPayable,
            'discount_amount' => $totalDiscountAmount,
            'total_amount' => $totalPayable,
        ];
    }
}
