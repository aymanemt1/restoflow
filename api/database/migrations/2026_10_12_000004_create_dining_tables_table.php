<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dining_tables', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('number')->unique(); // human-facing table number
            $table->string('label')->nullable();         // e.g. "Terrace", "Window"
            $table->unsignedInteger('seats')->default(2);
            $table->string('status', 20)->default('free'); // free | occupied | reserved
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dining_tables');
    }
};
