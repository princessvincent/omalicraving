<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The "About Me" page content — a single row the seller edits from her
        // own admin dashboard (photo, heading, bio). Deliberately a singleton
        // (always id=1), enforced in the AboutContent model, not the schema.
        Schema::create('about_content', function (Blueprint $table) {
            $table->id();
            $table->string('heading', 200)->default('');
            $table->string('subheading', 200)->default('');
            $table->text('bio')->default('');
            $table->unsignedInteger('years_experience')->nullable();
            $table->string('photo')->nullable();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('about_content');
    }
};
