<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_products', function (Blueprint $table) {
            $table->id('product_id');
            $table->foreignId('store_id')->constrained('tbl_stores', 'store_id')->onDelete('restrict');
            $table->foreignId('category_id')->constrained('tbl_categories', 'category_id')->onDelete('restrict');
            $table->string('barcode', 100)->index();
            $table->string('sku', 100)->index();
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->decimal('cost_price', 12, 2)->default(0.00);
            $table->decimal('selling_price', 12, 2)->default(0.00);
            $table->decimal('stock_quantity', 12, 2)->default(0.00);
            $table->decimal('reorder_level', 12, 2)->default(10.00);
            $table->string('unit', 20)->default('pcs');
            $table->boolean('is_vat_exempt')->default(false);
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['store_id', 'sku'], 'unique_store_sku');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_products');
    }
};
