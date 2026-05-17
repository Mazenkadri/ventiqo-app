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
        Schema::create('plan_sections', function (Blueprint $table) {
            $table->id();
            $table->string('section_name');
            $table->json('input_json')->nullable();
            $table->longText('generated_text')->nullable();
            $table->string('validation_status')->default('pending');
            $table->boolean('edited')->default(false);
            $table->foreignId('business_plan_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_sections');
    }
};
