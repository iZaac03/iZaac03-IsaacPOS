<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_stock_movements', function (Blueprint $table) {
            $table->id('movement_id');
            $table->foreignId('product_id')->constrained('tbl_products', 'product_id')->onDelete('restrict');
            $table->foreignId('store_id')->constrained('tbl_stores', 'store_id')->onDelete('restrict');
            $table->foreignId('user_id')->constrained('tbl_users', 'user_id')->onDelete('restrict');
            $table->enum('type', ['sale', 'restock', 'adjustment', 'refund', 'po_receive', 'initial']);
            $table->decimal('quantity_change', 12, 2);
            $table->decimal('previous_quantity', 12, 2);
            $table->decimal('new_quantity', 12, 2);
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reason', 255)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'created_at']);
            $table->index(['store_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_stock_movements');
    }
};
