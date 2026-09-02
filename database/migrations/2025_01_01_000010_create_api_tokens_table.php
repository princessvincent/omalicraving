<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A deliberately simple, DRF-authtoken-style table: one plain bearer
        // token per user, sent as `Authorization: Token <token>` — exactly
        // what the existing React frontend already sends, so it needed zero
        // changes when the backend moved from Django to Laravel.
        Schema::create('api_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('token', 80)->unique();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_tokens');
    }
};
