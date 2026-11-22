<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations: credit the origin of each photo (required by CC BY / CC BY-SA).
     */
    public function up(): void
    {
        Schema::table('car_images', function (Blueprint $table) {
            $table->string('source_url', 500)->nullable()->after('sort_order');
            $table->string('author')->nullable()->after('source_url');
            $table->string('license', 50)->nullable()->after('author');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('car_images', function (Blueprint $table) {
            $table->dropColumn(['source_url', 'author', 'license']);
        });
    }
};
