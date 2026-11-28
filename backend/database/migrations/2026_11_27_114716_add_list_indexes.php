<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indexes for the list queries checked with EXPLAIN (Phase 7B). The demo tables are
 * small enough for MySQL to scan them, but each of these filters or sorts a list that
 * grows with the agency's activity:
 * - reservations: the "À traiter" tab (status, sorted by pick-up), "Aujourd'hui" and the
 *   date filters (pick-up or return in a range), the "newest first" sort, and "Mes
 *   réservations" (one customer, sorted by pick-up);
 * - invoices: newest first and the issue-date filter;
 * - users: the clients list, newest first by default;
 * - notifications: one user's list, newest first (the bell and its page).
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->index(['status', 'start_at']);
            $table->index('start_at');
            $table->index('end_at');
            $table->index('created_at');
            $table->index(['user_id', 'start_at']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index('issued_at');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index(['role', 'created_at']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_type', 'notifiable_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['status', 'start_at']);
            $table->dropIndex(['start_at']);
            $table->dropIndex(['end_at']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['user_id', 'start_at']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['issued_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role', 'created_at']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['notifiable_type', 'notifiable_id', 'created_at']);
        });
    }
};
