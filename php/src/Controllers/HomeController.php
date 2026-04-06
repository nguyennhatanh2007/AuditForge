<?php

declare(strict_types=1);

namespace AuditForge\Controllers;

use AuditForge\Core\Database;

final class HomeController extends BaseController
{
    public function index(\AuditForge\Core\Request $request, array $params = []): void
    {
        $dbStatus = 'ok';
        try {
            Database::connection();
        } catch (\Throwable) {
            $dbStatus = 'failed';
        }

        $content = '<h1>AuditForge PHP Version</h1>'
            . '<p class="muted">Bản chuyển đổi PHP để chạy trực tiếp dưới Apache (/var/www/html).</p>'
            . '<p>Database: <strong>' . htmlspecialchars($dbStatus, ENT_QUOTES, 'UTF-8') . '</strong></p>'
            . '<div class="grid">'
            . '<a class="chip" href="/api/health">GET /api/health</a>'
            . '<a class="chip" href="/api/configurations">GET /api/configurations</a>'
            . '<a class="chip" href="/api/storage">GET /api/storage</a>'
            . '<a class="chip" href="/api/inventory">GET /api/inventory</a>'
            . '<a class="chip" href="/api/discrepancies">GET /api/discrepancies</a>'
            . '<a class="chip" href="/api/exceptions">GET /api/exceptions</a>'
            . '</div>';

        $this->render('AuditForge PHP', $content);
    }
}
