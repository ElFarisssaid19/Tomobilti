<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * When the pick-up reminder (24 h before) was sent: the scheduled command sends it
     * only once per reservation.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dateTime('reminder_sent_at')->nullable()->after('rejected_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn('reminder_sent_at');
        });
    }
};
