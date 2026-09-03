<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Services\TaxService;

class TaxServiceTest extends TestCase
{
    protected TaxService $taxService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->taxService = new TaxService();
    }

    public function test_standard_12_percent_vat_calculation(): void
    {
        // For ₱112.00 gross total:
        // Vatable sales = 112 / 1.12 = 100.00
        // VAT amount = 12.00
        $result = $this->taxService->calculateStandardVat(112.00);

        $this->assertEquals(100.00, $result['vatable_sales']);
        $this->assertEquals(12.00, $result['vat_amount']);
        $this->assertEquals(0.00, $result['vat_exempt_sales']);
    }

    public function test_senior_citizen_and_pwd_vat_exemption_and_20_percent_discount(): void
    {
        // Under PH Republic Act 9994:
        // Gross amount: ₱112.00
        // Net of VAT (Vatable / 1.12) = ₱100.00
        // 20% discount on ₱100.00 = ₱20.00
        // Total payable = ₱80.00
        // Total discount benefit = ₱112.00 - ₱80.00 = ₱32.00
        $result = $this->taxService->calculateSeniorPwdDiscount(112.00);

        $this->assertEquals(112.00, $result['subtotal']);
        $this->assertEquals(0.00, $result['vatable_sales']);
        $this->assertEquals(0.00, $result['vat_amount']);
        $this->assertEquals(80.00, $result['vat_exempt_sales']);
        $this->assertEquals(32.00, $result['discount_amount']);
        $this->assertEquals(80.00, $result['total_amount']);
    }
}
