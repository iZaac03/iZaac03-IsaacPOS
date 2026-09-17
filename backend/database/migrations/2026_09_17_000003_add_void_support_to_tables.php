<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add 'voided' to tbl_orders payment_status enum
        DB::statement("ALTER TABLE tbl_orders MODIFY COLUMN payment_status ENUM('paid', 'partial', 'refunded', 'partially_refunded', 'voided') DEFAULT 'paid'");

        // 2. Add 'void' to tbl_stock_movements type enum
        DB::statement("ALTER TABLE tbl_stock_movements MODIFY COLUMN type ENUM('sale', 'restock', 'adjustment', 'refund', 'po_receive', 'initial', 'void') NOT NULL");

        // 3. Add 'voided' to tbl_gcash_transactions status enum
        DB::statement("ALTER TABLE tbl_gcash_transactions MODIFY COLUMN status ENUM('completed', 'cancelled', 'voided') DEFAULT 'completed'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE tbl_orders MODIFY COLUMN payment_status ENUM('paid', 'partial', 'refunded', 'partially_refunded') DEFAULT 'paid'");
        DB::statement("ALTER TABLE tbl_stock_movements MODIFY COLUMN type ENUM('sale', 'restock', 'adjustment', 'refund', 'po_receive', 'initial') NOT NULL");
        DB::statement("ALTER TABLE tbl_gcash_transactions MODIFY COLUMN status ENUM('completed', 'cancelled') DEFAULT 'completed'");
    }
};
