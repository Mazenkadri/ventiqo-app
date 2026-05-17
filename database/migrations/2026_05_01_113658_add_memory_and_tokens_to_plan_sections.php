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
        Schema::table('plan_sections', function (Blueprint $table) {
            $table->text('memory_summary')->nullable()->after('generated_text');
            $table->unsignedInteger('tokens_input')->default(0)->after('memory_summary');
            $table->unsignedInteger('tokens_output')->default(0)->after('tokens_input');
            $table->unsignedInteger('tokens_total')->default(0)->after('tokens_output');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plan_sections', function (Blueprint $table) {
            $table->dropColumn(['memory_summary', 'tokens_input', 'tokens_output', 'tokens_total']);
        });
    }
};
