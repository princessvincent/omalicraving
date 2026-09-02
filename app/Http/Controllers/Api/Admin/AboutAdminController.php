<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AboutResource;
use App\Models\AboutContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/** Where the seller edits her own About Me photo + write-up. */
class AboutAdminController extends Controller
{
    public function show()
    {
        return new AboutResource(AboutContent::load());
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'heading' => ['sometimes', 'nullable', 'string', 'max:200'],
            'subheading' => ['sometimes', 'nullable', 'string', 'max:200'],
            'bio' => ['sometimes', 'nullable', 'string'],
            'years_experience' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'photo' => ['sometimes', 'nullable', 'file', 'image', 'max:5120'],
        ]);

        $about = AboutContent::load();

        foreach (['heading', 'subheading', 'bio'] as $field) {
            if (array_key_exists($field, $data)) {
                $about->{$field} = $data[$field] ?? '';
            }
        }
        if (array_key_exists('years_experience', $data)) {
            $about->years_experience = $data['years_experience'];
        }

        if ($request->hasFile('photo')) {
            if ($about->photo) {
                Storage::disk('public')->delete($about->photo);
            }
            $about->photo = $request->file('photo')->store('about', 'public');
        }

        $about->save();

        return new AboutResource($about);
    }
}
