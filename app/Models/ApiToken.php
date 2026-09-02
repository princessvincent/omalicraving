<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * A DRF-authtoken-style bearer token: one per user, sent as
 * `Authorization: Token <token>`. See App\Http\Middleware\TokenAuthenticate.
 */
#[Fillable(['user_id', 'token'])]
class ApiToken extends Model
{
    const UPDATED_AT = null;

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public static function issueFor(User $user): self
    {
        return static::firstOrCreate(
            ['user_id' => $user->id],
            ['token' => static::generate()],
        );
    }

    public static function generate(): string
    {
        return Str::random(40);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
