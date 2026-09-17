<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_time_logs', function (Blueprint $table) {
            $table->id('time_log_id');
            $table->foreignId('store_id')->constrained('tbl_stores', 'store_id')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('tbl_users', 'user_id')->onDelete('cascade');
            $table->dateTime('time_in');
            $table->dateTime('time_out')->nullable();
            $table->decimal('total_hours', 5, 2)->nullable();
            $table->string('status', 20)->default('timed_in'); // timed_in, timed_out
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_time_logs');
    }
};
