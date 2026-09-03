<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_order_items', function (Blueprint $table) {
            $table->id('order_item_id');
            $table->foreignId('order_id')->constrained('tbl_orders', 'order_id')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('tbl_products', 'product_id')->onDelete('restrict');
            $table->string('product_name', 200);
            $table->decimal('quantity', 12, 2)->default(1.00);
            $table->decimal('unit_cost', 12, 2)->default(0.00);
            $table->decimal('unit_price', 12, 2)->default(0.00);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('total', 12, 2)->default(0.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_order_items');
    }
};
