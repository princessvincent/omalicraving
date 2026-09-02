<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            // Set once at creation and never changed automatically afterward — even if
            // the seller edits the name later — so a link she's already shared on
            // WhatsApp never breaks.
            $table->string('slug', 220)->unique();
            $table->string('category', 100)->default('General');
            $table->unsignedInteger('price'); // whole currency units, e.g. Naira (not kobo)
            $table->text('description')->default('');
            $table->string('image')->nullable(); // storage path, e.g. products/xyz.jpg
            $table->boolean('active')->default(true);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
