<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            // Nullable + null-on-delete so deleting a product later never
            // breaks historical orders.
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 200); // snapshot at time of order
            $table->unsignedInteger('price'); // snapshot at time of order
            $table->unsignedInteger('qty');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
