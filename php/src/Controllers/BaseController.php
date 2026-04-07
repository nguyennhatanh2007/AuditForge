<?php

declare(strict_types=1);

namespace AuditForge\Controllers;

use AuditForge\Core\Response;

abstract class BaseController
{
    protected function ok(array $data, int $status = 200): void
    {
        Response::json(['data' => $data], $status);
    }

    protected function fail(string $message, string $details = '', int $status = 400): void
    {
        Response::json([
            'error' => $message,
            'details' => $details,
        ], $status);
    }

    protected function render(string $title, string $content): void
    {
        $html = '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'
            . htmlspecialchars($title, ENT_QUOTES, 'UTF-8')
            . '</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;margin:0;padding:32px;color:#0f172a}.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:24px;max-width:980px;margin:0 auto}.muted{color:#475569}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.chip{display:inline-block;padding:8px 12px;border-radius:999px;background:#eff6ff;color:#1d4ed8;text-decoration:none;font-size:14px}</style></head><body><div class="card">'
            . $content
            . '</div></body></html>';
        \AuditForge\Core\Response::html($html);
    }
}
