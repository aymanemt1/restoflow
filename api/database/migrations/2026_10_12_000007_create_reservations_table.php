<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('phone')->nullable();
            $table->date('date');
            $table->time('time'); // arrival time; each reservation holds the table for 2 hours
            $table->unsignedInteger('party_size')->default(2);
            $table->foreignId('dining_table_id')->nullable()->constrained()->nullOnDelete();
            // pending → confirmed → seated ; cancelled / no_show are terminal
            $table->string('status', 20)->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
