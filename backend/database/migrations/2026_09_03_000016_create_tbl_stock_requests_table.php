<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_stock_requests', function (Blueprint $table) {
            $table->id('request_id');
            $table->foreignId('store_id')->constrained('tbl_stores', 'store_id')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('tbl_products', 'product_id')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('tbl_users', 'user_id')->cascadeOnDelete();
            $table->decimal('requested_quantity', 10, 2);
            $table->enum('urgency', ['normal', 'urgent', 'critical'])->default('normal');
            $table->enum('status', ['pending', 'approved', 'converted_to_po', 'rejected'])->default('pending');
            $table->text('notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('tbl_users', 'user_id')->nullOnDelete();
            $table->foreignId('po_id')->nullable()->constrained('tbl_purchase_orders', 'po_id')->nullOnDelete();
            $table->timestamps();

            $table->index(['store_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_stock_requests');
    }
};
