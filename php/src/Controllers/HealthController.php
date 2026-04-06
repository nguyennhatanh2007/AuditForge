<?php

declare(strict_types=1);

namespace AuditForge\Controllers;

use AuditForge\Core\Database;

final class HealthController extends BaseController
{
    public function index(\AuditForge\Core\Request $request, array $params = []): void
    {
        try {
            Database::connection();
            $this->ok([
                'ok' => true,
                'service' => 'auditforge-php',
                'timestamp' => gmdate('c'),
            ]);
        } catch (\Throwable $exception) {
            $this->fail('Hệ thống chưa sẵn sàng.', $exception->getMessage(), 503);
        }
    }
}
