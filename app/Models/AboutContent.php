<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * The "About Me" page content — a single row the seller edits from her own
 * admin dashboard (photo, heading, bio). Deliberately a singleton (always
 * id=1) rather than letting one get created per edit.
 */
#[Fillable(['heading', 'subheading', 'bio', 'years_experience', 'photo'])]
class AboutContent extends Model
{
    const CREATED_AT = null;

    protected $table = 'about_content';

    protected $casts = [
        'years_experience' => 'integer',
        'updated_at' => 'datetime',
    ];

    public static function load(): self
    {
        return static::firstOrCreate(['id' => 1]);
    }

    public function save(array $options = [])
    {
        $this->id = 1;

        return parent::save($options);
    }

    public function delete()
    {
        return false; // the singleton row is never deleted, only ever re-saved
    }
}
