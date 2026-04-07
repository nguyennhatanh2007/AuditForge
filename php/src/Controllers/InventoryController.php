<?php

declare(strict_types=1);

namespace AuditForge\Controllers;

use AuditForge\Core\Request;
use AuditForge\Repositories\SystemConfigRepository;
use AuditForge\Services\StorageService;

final class InventoryController extends BaseController
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
            $systemType = trim((string) ($request->query('systemType', '') ?? ''));
            $enabled = $this->configs->listEnabledByTypes(['itop', 'vcenter', 'unity', 'pure', 'alletra']);

            if ($systemType !== '') {
                $enabled = array_values(array_filter($enabled, static fn(array $item): bool => strcasecmp((string) $item['systemType'], $systemType) === 0));
            }

            $result = [];
            foreach ($enabled as $item) {
                if (in_array($item['systemType'], ['unity', 'pure', 'alletra'], true)) {
                    $result[$item['systemType']] = $this->storage->collect($item);
                    continue;
                }

                $result[$item['systemType']] = [
                    'summary' => [
                        'sourceSystem' => $item['name'],
                        'systemType' => $item['systemType'],
                        'name' => $item['name'],
                        'url' => $item['url'],
                        'lastFetch' => gmdate('c'),
                        'counts' => ['arrays' => 0, 'pools' => 0, 'luns' => 0, 'hosts' => 0],
                        'capacity' => [],
                    ],
                    'luns' => [],
                ];
            }

            $this->ok($result);
        } catch (\Throwable $exception) {
            $this->fail('Không thể lấy inventory.', $exception->getMessage(), 500);
        }
    }
}
