<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_orders', function (Blueprint $table) {
            $table->id('order_id');
            $table->string('order_number', 50)->unique();
            $table->foreignId('store_id')->constrained('tbl_stores', 'store_id')->onDelete('restrict');
            $table->foreignId('user_id')->constrained('tbl_users', 'user_id')->onDelete('restrict');
            $table->foreignId('customer_id')->nullable()->constrained('tbl_customers', 'customer_id')->onDelete('set null');
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('vatable_sales', 12, 2)->default(0.00);
            $table->decimal('vat_amount', 12, 2)->default(0.00);
            $table->decimal('vat_exempt_sales', 12, 2)->default(0.00);
            $table->enum('discount_type', ['none', 'percentage', 'fixed', 'senior_pwd', 'custom'])->default('none');
            $table->decimal('discount_rate', 5, 2)->default(0.00);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('total_amount', 12, 2)->default(0.00);
            $table->decimal('amount_paid', 12, 2)->default(0.00);
            $table->decimal('change_amount', 12, 2)->default(0.00);
            $table->enum('payment_status', ['paid', 'partial', 'refunded', 'partially_refunded'])->default('paid');
            $table->enum('order_status', ['completed', 'voided', 'cancelled'])->default('completed');
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['store_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_orders');
    }
};
