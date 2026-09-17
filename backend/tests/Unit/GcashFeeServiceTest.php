<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Services\GcashFeeService;

class GcashFeeServiceTest extends TestCase
{
    /**
     * Test exact fee calculation for all rate tiers shown in the user's rate sheet photo.
     */
    public function test_gcash_fee_tiers_matching_photo_schedule(): void
    {
        // 1-100: Fee 5
        $this->assertEquals(5.00, GcashFeeService::calculateFee(1.00));
        $this->assertEquals(5.00, GcashFeeService::calculateFee(50.00));
        $this->assertEquals(5.00, GcashFeeService::calculateFee(100.00));

        // 101-500: Fee 10
        $this->assertEquals(10.00, GcashFeeService::calculateFee(101.00));
        $this->assertEquals(10.00, GcashFeeService::calculateFee(250.00));
        $this->assertEquals(10.00, GcashFeeService::calculateFee(500.00));

        // 501-1000: Fee 20
        $this->assertEquals(20.00, GcashFeeService::calculateFee(501.00));
        $this->assertEquals(20.00, GcashFeeService::calculateFee(750.00));
        $this->assertEquals(20.00, GcashFeeService::calculateFee(1000.00));

        // 1001-1500: Fee 30
        $this->assertEquals(30.00, GcashFeeService::calculateFee(1001.00));
        $this->assertEquals(30.00, GcashFeeService::calculateFee(1500.00));

        // 1501-2000: Fee 40
        $this->assertEquals(40.00, GcashFeeService::calculateFee(2000.00));

        // 2001-2500: Fee 50
        $this->assertEquals(50.00, GcashFeeService::calculateFee(2500.00));

        // 2501-3000: Fee 60
        $this->assertEquals(60.00, GcashFeeService::calculateFee(3000.00));

        // 3001-3500: Fee 70
        $this->assertEquals(70.00, GcashFeeService::calculateFee(3500.00));

        // 3501-4000: Fee 80
        $this->assertEquals(80.00, GcashFeeService::calculateFee(4000.00));

        // 4001-4500: Fee 90
        $this->assertEquals(90.00, GcashFeeService::calculateFee(4500.00));

        // 4501-5000: Fee 100
        $this->assertEquals(100.00, GcashFeeService::calculateFee(5000.00));

        // 5001-5500: Fee 110
        $this->assertEquals(110.00, GcashFeeService::calculateFee(5500.00));

        // 5501-6000: Fee 120
        $this->assertEquals(120.00, GcashFeeService::calculateFee(6000.00));

        // 6001-6500: Fee 130
        $this->assertEquals(130.00, GcashFeeService::calculateFee(6500.00));

        // 6501-7000: Fee 140
        $this->assertEquals(140.00, GcashFeeService::calculateFee(7000.00));

        // 7001-7500: Fee 150
        $this->assertEquals(150.00, GcashFeeService::calculateFee(7500.00));

        // 7501-8000: Fee 160
        $this->assertEquals(160.00, GcashFeeService::calculateFee(8000.00));

        // 8001-8500: Fee 170
        $this->assertEquals(170.00, GcashFeeService::calculateFee(8500.00));

        // 8501-9000: Fee 180
        $this->assertEquals(180.00, GcashFeeService::calculateFee(9000.00));

        // 9001-9500: Fee 190
        $this->assertEquals(190.00, GcashFeeService::calculateFee(9500.00));

        // 9501-10000: Fee 200
        $this->assertEquals(200.00, GcashFeeService::calculateFee(10000.00));

        // Amounts above 10,000 follow the same ₱10 per ₱500 tier
        $this->assertEquals(210.00, GcashFeeService::calculateFee(10500.00));
        $this->assertEquals(220.00, GcashFeeService::calculateFee(11000.00));
    }
}
