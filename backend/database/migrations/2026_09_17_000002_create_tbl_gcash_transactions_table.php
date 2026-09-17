<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_gcash_transactions', function (Blueprint $table) {
            $table->id('gcash_transaction_id');
            $table->foreignId('store_id')->constrained('tbl_stores', 'store_id')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('tbl_users', 'user_id')->onDelete('cascade');
            $table->enum('transaction_type', ['cash_in', 'cash_out'])->index();
            $table->string('customer_name', 150)->nullable();
            $table->string('customer_phone', 20)->index();
            $table->decimal('amount', 12, 2);
            $table->decimal('fee', 12, 2)->default(0.00);
            $table->decimal('total_amount', 12, 2);
            $table->string('reference_number', 100)->nullable()->index();
            $table->enum('status', ['completed', 'cancelled'])->default('completed')->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_gcash_transactions');
    }
};
