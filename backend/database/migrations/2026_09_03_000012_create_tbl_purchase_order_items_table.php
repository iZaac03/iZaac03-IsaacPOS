<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_purchase_order_items', function (Blueprint $table) {
            $table->id('po_item_id');
            $table->foreignId('po_id')->constrained('tbl_purchase_orders', 'po_id')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('tbl_products', 'product_id')->onDelete('restrict');
            $table->decimal('quantity_ordered', 12, 2);
            $table->decimal('quantity_received', 12, 2)->default(0.00);
            $table->decimal('unit_cost', 12, 2);
            $table->decimal('total_cost', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_purchase_order_items');
    }
};
