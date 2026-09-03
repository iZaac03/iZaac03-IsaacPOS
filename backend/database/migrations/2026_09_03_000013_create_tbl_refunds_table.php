<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_refunds', function (Blueprint $table) {
            $table->id('refund_id');
            $table->string('refund_number', 50)->unique();
            $table->foreignId('order_id')->constrained('tbl_orders', 'order_id')->onDelete('restrict');
            $table->foreignId('store_id')->constrained('tbl_stores', 'store_id')->onDelete('restrict');
            $table->foreignId('user_id')->constrained('tbl_users', 'user_id')->onDelete('restrict');
            $table->foreignId('approved_by')->nullable()->constrained('tbl_users', 'user_id')->onDelete('set null');
            $table->decimal('total_amount', 12, 2);
            $table->enum('reason_code', [
                'damaged_item',
                'wrong_item',
                'customer_dissatisfied',
                'cashier_error',
                'expired_product',
                'other'
            ]);
            $table->boolean('requires_approval')->default(false);
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_refunds');
    }
};
