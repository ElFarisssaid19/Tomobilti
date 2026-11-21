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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->unique()->constrained()->restrictOnDelete();
            $table->string('number', 20)->unique();
            $table->dateTime('issued_at');
            $table->decimal('subtotal_ht', 10, 2);
            $table->decimal('vat_rate', 5, 2)->default(20.00);
            $table->decimal('vat_amount', 10, 2);
            $table->decimal('total_ttc', 10, 2);
            $table->string('status', 20)->default('unpaid')->index();
            $table->dateTime('paid_at')->nullable();
            $table->string('payment_method', 20)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
