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
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->constrained()->restrictOnDelete();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('location_id')->constrained()->restrictOnDelete();
            $table->string('model', 100);
            $table->string('slug', 150)->unique();
            $table->unsignedSmallInteger('year');
            $table->string('plate_number', 20)->unique();
            $table->string('color', 50);
            $table->string('transmission', 20)->index();
            $table->string('fuel', 20)->index();
            $table->unsignedTinyInteger('seats');
            $table->unsignedTinyInteger('doors');
            $table->unsignedTinyInteger('luggage');
            $table->boolean('air_conditioning')->default(true);
            $table->unsignedInteger('mileage')->default(0);
            $table->decimal('price_per_day', 10, 2)->index();
            $table->decimal('deposit_amount', 10, 2);
            $table->string('status', 20)->default('available')->index();
            $table->text('description')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
