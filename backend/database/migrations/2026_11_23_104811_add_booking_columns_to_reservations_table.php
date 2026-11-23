<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Booking flow (Phase 4):
 *  - one_way_fee: snapshot of the fee charged when the return agency differs;
 *  - cancellation_reason: optional reason given by the customer who cancels;
 *  - rejected_at: when the agency (or the expiry command) refused the request.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->decimal('one_way_fee', 10, 2)->default(0)->after('extras_total');
            $table->text('cancellation_reason')->nullable()->after('rejection_reason');
            $table->dateTime('rejected_at')->nullable()->after('cancelled_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn(['one_way_fee', 'cancellation_reason', 'rejected_at']);
        });
    }
};
