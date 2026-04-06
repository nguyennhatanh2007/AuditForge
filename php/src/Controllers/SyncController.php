<?php

declare(strict_types=1);

namespace AuditForge\Controllers;

use AuditForge\Core\Database;
use AuditForge\Core\Request;
use AuditForge\Repositories\SystemConfigRepository;

final class SyncController extends BaseController
{
    private SystemConfigRepository $configs;

    public function __construct()
    {
        $this->configs = new SystemConfigRepository();
    }

    public function syncLive(Request $request, array $params = []): void
    {
        try {
            $body = $request->jsonBody();
            $applyItopUpdates = (bool) ($body['applyItopUpdates'] ?? false);

            $systems = $this->configs->listEnabledByTypes(['itop', 'vcenter', 'unity', 'pure', 'alletra']);
            if ($systems === []) {
                $this->fail('Không có nguồn nào đang bật.', 'Hãy cấu hình ít nhất 1 kết nối trong màn hình cấu hình.', 400);
                return;
            }

            $discrepancies = [];
            $syncJobId = $this->insertSyncJob(count($systems), count($systems), 0, 'success', 'PHP sync-live placeholder flow');

            $this->ok([
                'syncJobId' => $syncJobId,
                'systems' => array_map(static fn(array $item): string => (string) $item['systemType'], $systems),
                'discrepancies' => $discrepancies,
                'itopUpdates' => [
                    'attempted' => 0,
                    'updated' => 0,
                    'skipped' => 0,
                    'failed' => 0,
                    'details' => $applyItopUpdates
                        ? [['identifier' => 'sync-live', 'message' => 'Luồng cập nhật iTOP trong bản PHP đã sẵn sàng khung, cần map field thực tế để update chính xác.']]
                        : [],
                ],
                'vmComparison' => [
                    'itopVMs' => 0,
                    'esxiVMs' => 0,
                ],
                'timestamp' => gmdate('c'),
                'saved' => true,
            ]);
        } catch (\Throwable $exception) {
            $this->fail('Không thể chạy sync-live.', $exception->getMessage(), 500);
        }
    }

    private function insertSyncJob(int $total, int $succeeded, int $discrepancies, string $status, string $note): int
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            'INSERT INTO sync_jobs (started_at, finished_at, status, total_sources, succeeded_sources, discrepancies, note, created_at, updated_at)
             VALUES (NOW(), NOW(), :status, :total, :succeeded, :discrepancies, :note, NOW(), NOW())'
        );
        $stmt->execute([
            'status' => $status,
            'total' => $total,
            'succeeded' => $succeeded,
            'discrepancies' => $discrepancies,
            'note' => $note,
        ]);

        return (int) $pdo->lastInsertId();
    }
}
