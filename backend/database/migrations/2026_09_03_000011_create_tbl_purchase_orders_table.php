<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_purchase_orders', function (Blueprint $table) {
            $table->id('po_id');
            $table->string('po_number', 50)->unique();
            $table->foreignId('store_id')->constrained('tbl_stores', 'store_id')->onDelete('restrict');
            $table->foreignId('supplier_id')->constrained('tbl_suppliers', 'supplier_id')->onDelete('restrict');
            $table->foreignId('user_id')->constrained('tbl_users', 'user_id')->onDelete('restrict');
            $table->enum('status', ['draft', 'sent', 'partially_received', 'received', 'closed', 'cancelled'])->default('draft');
            $table->decimal('total_amount', 12, 2)->default(0.00);
            $table->date('expected_delivery_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_purchase_orders');
    }
};
