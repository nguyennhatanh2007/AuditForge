<?php

declare(strict_types=1);

namespace AuditForge\Controllers;

use AuditForge\Core\Request;
use AuditForge\Repositories\SystemConfigRepository;
use AuditForge\Services\StorageService;

final class StorageController extends BaseController
{
    private SystemConfigRepository $configs;
    private StorageService $storage;

    public function __construct()
    {
        $this->configs = new SystemConfigRepository();
        $this->storage = new StorageService();
    }

    public function index(Request $request, array $params = []): void
    {
        try {
            $view = (string) ($request->query('view', 'all') ?? 'all');
            $source = trim((string) ($request->query('sourceSystem', '') ?? ''));

            $configs = $this->configs->listEnabledByTypes(['unity', 'pure', 'alletra']);
            if ($source !== '') {
                $configs = array_values(array_filter($configs, static fn(array $item): bool => strcasecmp((string) $item['name'], $source) === 0 || strcasecmp((string) $item['id'], $source) === 0));
            }

            $snapshots = array_map(fn(array $config): array => $this->storage->collect($config), $configs);

            if ($view === 'summary') {
                $this->ok(array_map(static fn(array $snapshot): array => $snapshot['summary'], $snapshots));
                return;
            }

            if ($view === 'luns') {
                $luns = [];
                foreach ($snapshots as $snapshot) {
                    foreach ($snapshot['luns'] as $lun) {
                        $luns[] = $lun;
                    }
                }
                $this->ok($luns);
                return;
            }

            $this->ok([
                'summary' => array_map(static fn(array $snapshot): array => $snapshot['summary'], $snapshots),
                'luns' => array_values(array_merge(...array_map(static fn(array $snapshot): array => $snapshot['luns'], $snapshots ?: [['luns' => []]]))),
            ]);
        } catch (\Throwable $exception) {
            $this->fail('Không thể lấy dữ liệu storage.', $exception->getMessage(), 500);
        }
    }
}
