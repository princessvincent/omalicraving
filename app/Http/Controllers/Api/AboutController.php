<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AboutResource;
use App\Models\AboutContent;

class AboutController extends Controller
{
    /** What the "About Me" page shows — a single always-there row. */
    public function show()
    {
        return new AboutResource(AboutContent::load());
    }
}
