<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('business_plans', function (Blueprint $table) {
            $table->unsignedInteger('total_tokens')->default(0)->after('language');
            $table->unsignedInteger('total_tokens_input')->default(0)->after('total_tokens');
            $table->unsignedInteger('total_tokens_output')->default(0)->after('total_tokens_input');
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('business_plans', function (Blueprint $table) {
            $table->dropColumn(['total_tokens', 'total_tokens_input', 'total_tokens_output']);
        });
    }
};
