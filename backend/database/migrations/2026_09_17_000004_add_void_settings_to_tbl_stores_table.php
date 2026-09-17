<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_stores', function (Blueprint $table) {
            $table->json('void_settings')->nullable()->after('receipt_footer');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_stores', function (Blueprint $table) {
            $table->dropColumn('void_settings');
        });
    }
};
