<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Response;

/**
 * PHP only populates $_POST/$_FILES for multipart/form-data on POST
 * requests — never on PUT/PATCH. The React admin dashboard genuinely sends
 * `method: "PATCH"` with a FormData body for product/about updates (so it
 * can include an optional new photo), and since the frontend was kept
 * unchanged when this backend moved from Django to Laravel, the server
 * side has to cope with that instead. This middleware manually parses a
 * multipart PUT/PATCH body and merges the result into the request, so
 * `$request->input(...)` and `$request->file(...)` work exactly as they
 * would on a POST.
 */
class ParseMultipartFormRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->method(), ['PUT', 'PATCH'], true) && $this->isMultipart($request)) {
            $this->parseInto($request);
        }

        return $next($request);
    }

    private function isMultipart(Request $request): bool
    {
        return str_contains((string) $request->headers->get('Content-Type', ''), 'multipart/form-data');
    }

    private function parseInto(Request $request): void
    {
        $contentType = (string) $request->headers->get('Content-Type', '');

        if (! preg_match('/boundary=(?:"([^"]+)"|([^;]+))/', $contentType, $m)) {
            return;
        }
        $boundary = $m[1] !== '' ? $m[1] : $m[2];
        $boundary = trim($boundary);

        $body = $request->getContent();
        if ($body === '' || $body === false) {
            return;
        }

        $parts = explode('--'.$boundary, $body);
        $fields = [];
        $files = [];

        foreach ($parts as $part) {
            $part = ltrim($part, "\r\n");
            if ($part === '' || $part === '--' || str_starts_with($part, '--')) {
                continue;
            }

            [$rawHeaders, $content] = array_pad(explode("\r\n\r\n", $part, 2), 2, '');
            // Drop the trailing CRLF that precedes the next boundary marker.
            $content = preg_replace('/\r\n$/', '', $content) ?? $content;

            if (! preg_match('/name="([^"]+)"/', $rawHeaders, $nameMatch)) {
                continue;
            }
            $name = $nameMatch[1];

            if (preg_match('/filename="([^"]*)"/', $rawHeaders, $fileMatch)) {
                $filename = $fileMatch[1];
                if ($filename === '') {
                    continue; // an empty file input — nothing was chosen
                }

                $mime = 'application/octet-stream';
                if (preg_match('/Content-Type:\s*([^\r\n]+)/i', $rawHeaders, $mimeMatch)) {
                    $mime = trim($mimeMatch[1]);
                }

                $tmpPath = tempnam(sys_get_temp_dir(), 'up_');
                file_put_contents($tmpPath, $content);

                $files[$name] = new UploadedFile($tmpPath, $filename, $mime, null, true);
            } else {
                $fields[$name] = $content;
            }
        }

        $request->request->add($fields);
        foreach ($files as $name => $file) {
            $request->files->set($name, $file);
        }
    }
}
