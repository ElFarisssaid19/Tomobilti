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
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('client')->after('password')->index();
            $table->string('phone', 20)->nullable()->after('role');
            $table->string('city', 100)->nullable()->after('phone');
            $table->string('address')->nullable()->after('city');
            $table->date('birth_date')->nullable()->after('address');
            $table->string('cin', 20)->nullable()->unique()->after('birth_date');
            $table->string('driving_license_number', 30)->nullable()->after('cin');
            $table->date('driving_license_issued_at')->nullable()->after('driving_license_number');
            $table->boolean('is_active')->default(true)->after('driving_license_issued_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropUnique(['cin']);
            $table->dropColumn([
                'role',
                'phone',
                'city',
                'address',
                'birth_date',
                'cin',
                'driving_license_number',
                'driving_license_issued_at',
                'is_active',
            ]);
        });
    }
};
