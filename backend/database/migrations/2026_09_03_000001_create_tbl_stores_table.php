<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_stores', function (Blueprint $table) {
            $table->id('store_id');
            $table->string('store_name', 150);
            $table->string('branch_code', 50)->unique();
            $table->text('address');
            $table->string('phone', 50);
            $table->string('email', 100)->nullable();
            $table->string('vat_tin', 50);
            $table->text('receipt_header')->nullable();
            $table->text('receipt_footer')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_stores');
    }
};
