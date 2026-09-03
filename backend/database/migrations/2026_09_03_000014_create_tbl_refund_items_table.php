<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_refund_items', function (Blueprint $table) {
            $table->id('refund_item_id');
            $table->foreignId('refund_id')->constrained('tbl_refunds', 'refund_id')->onDelete('cascade');
            $table->foreignId('order_item_id')->constrained('tbl_order_items', 'order_item_id')->onDelete('restrict');
            $table->foreignId('product_id')->constrained('tbl_products', 'product_id')->onDelete('restrict');
            $table->decimal('quantity', 12, 2);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('refund_amount', 12, 2);
            $table->boolean('restock_item')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_refund_items');
    }
};
