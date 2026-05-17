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
        Schema::create('bmc', function (Blueprint $table) {
            $table->id();
            $table->text('key_partners');
            $table->text('key_activities');
            $table->text('key_resources');
            $table->text('value_propositions');
            $table->text('customer_relationships');
            $table->text('customer_segments');
            $table->text('channels');
            $table->text('cost');
            $table->text('revenue_streams');
            $table->foreignId('business_plan_id')->unique()->constrained('business_plans')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bmc');
    }
};
