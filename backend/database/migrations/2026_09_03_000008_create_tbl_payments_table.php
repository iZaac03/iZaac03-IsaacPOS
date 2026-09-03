<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_payments', function (Blueprint $table) {
            $table->id('payment_id');
            $table->foreignId('order_id')->constrained('tbl_orders', 'order_id')->onDelete('cascade');
            $table->foreignId('store_id')->constrained('tbl_stores', 'store_id')->onDelete('restrict');
            $table->enum('payment_method', ['cash', 'gcash', 'maya', 'card']);
            $table->decimal('amount', 12, 2)->default(0.00);
            $table->decimal('tendered_amount', 12, 2)->nullable();
            $table->decimal('change_amount', 12, 2)->nullable();
            $table->string('reference_no', 100)->nullable();
            $table->enum('status', ['completed', 'refunded', 'voided'])->default('completed');
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->index(['order_id', 'payment_method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_payments');
    }
};
