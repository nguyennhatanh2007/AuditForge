<?php

declare(strict_types=1);

namespace AuditForge\Services;

use AuditForge\Core\HttpClient;

final class StorageService
{
    private HttpClient $http;

    public function __construct()
    {
        $this->http = new HttpClient();
    }

    /** @return array{summary:array<string,mixed>,luns:array<int,array<string,mixed>>} */
    public function collect(array $config): array
    {
        $type = (string) $config['systemType'];
        $baseUrl = rtrim((string) $config['url'], '/');

        $endpoints = match ($type) {
            'unity' => ['arrays' => '/api/instances/system', 'pools' => '/api/instances/pool', 'luns' => '/api/instances/lun', 'hosts' => '/api/instances/host'],
            'pure' => ['arrays' => '/api/2.0/arrays', 'pools' => '/api/2.0/volume-groups', 'luns' => '/api/2.0/volumes', 'hosts' => '/api/2.0/hosts'],
            'alletra' => ['arrays' => '/api/v1/arrays', 'pools' => '/api/v1/storage-pools', 'luns' => '/api/v1/volumes', 'hosts' => '/api/v1/system'],
            default => ['arrays' => '', 'pools' => '', 'luns' => '', 'hosts' => ''],
        };

        $headers = ['Accept' => 'application/json'];
        if ($type === 'pure' && !empty($config['password'])) {
            $headers['X-Auth-Token'] = (string) $config['password'];
        } elseif (!empty($config['username']) && !empty($config['password'])) {
            $headers['Authorization'] = 'Basic ' . base64_encode((string) $config['username'] . ':' . (string) $config['password']);
        }

        $arrays = $this->fetchList($baseUrl . $endpoints['arrays'], $headers);
        $pools = $this->fetchList($baseUrl . $endpoints['pools'], $headers);
        $luns = $this->fetchList($baseUrl . $endpoints['luns'], $headers);
        $hosts = $this->fetchList($baseUrl . $endpoints['hosts'], $headers);

        return [
            'summary' => [
                'sourceSystem' => $config['name'] ?? $type,
                'systemType' => $type,
                'name' => $config['name'] ?? $type,
                'url' => $config['url'],
                'lastFetch' => gmdate('c'),
                'counts' => [
                    'arrays' => count($arrays),
                    'pools' => count($pools),
                    'luns' => count($luns),
                    'hosts' => count($hosts),
                ],
                'capacity' => $this->aggregateCapacity($arrays, $pools),
            ],
            'luns' => array_map(static function (array $lun) use ($config, $type): array {
                $name = (string) ($lun['name'] ?? $lun['id'] ?? 'unknown-lun');
                $wwn = (string) ($lun['wwn'] ?? $lun['naa'] ?? $lun['world_wide_name'] ?? '');
                $size = isset($lun['size']) ? (float) $lun['size'] : (isset($lun['size_total']) ? (float) $lun['size_total'] : null);
                return [
                    'sourceSystem' => $config['name'] ?? $type,
                    'systemType' => $type,
                    'name' => $name,
                    'wwn' => $wwn,
                    'host' => (string) ($lun['host'] ?? $lun['host_name'] ?? '-'),
                    'sizeBytes' => $size !== null ? (int) $size : null,
                    'sizeLabel' => $size !== null ? (string) ((int) round($size / 1024 / 1024 / 1024)) . ' GB' : '-',
                    'provisioning' => (string) ($lun['provisioning'] ?? 'unknown'),
                    'creator' => (string) ($lun['creator'] ?? '-'),
                    'raw' => $lun,
                ];
            }, $luns),
        ];
    }

    /** @return array<int, array<string,mixed>> */
    private function fetchList(string $url, array $headers): array
    {
        if (trim($url) === '') {
            return [];
        }

        try {
            $response = $this->http->request('GET', $url, $headers, null, 30);
            if ($response['status'] >= 400) {
                return [];
            }
            $body = $response['body'];
            return is_array($body) ? array_values(array_filter($body, 'is_array')) : [];
        } catch (\Throwable) {
            return [];
        }
    }

    /** @return array<string,int|null> */
    private function aggregateCapacity(array $arrays, array $pools): array
    {
        $total = 0;
        $used = 0;
        $free = 0;

        foreach ($arrays as $item) {
            $total += (int) ($item['total_bytes'] ?? $item['total_capacity_bytes'] ?? $item['capacity'] ?? 0);
            $used += (int) ($item['used_bytes'] ?? $item['used_capacity_bytes'] ?? $item['used'] ?? 0);
            $free += (int) ($item['free_bytes'] ?? $item['free_capacity_bytes'] ?? $item['available'] ?? 0);
        }

        foreach ($pools as $item) {
            $total += (int) ($item['total'] ?? $item['capacity'] ?? 0);
            $free += (int) ($item['free'] ?? $item['available'] ?? 0);
        }

        return [
            'totalBytes' => $total > 0 ? $total : null,
            'usedBytes' => $used > 0 ? $used : null,
            'freeBytes' => $free > 0 ? $free : null,
            'provisionedBytes' => null,
            'usableBytes' => null,
        ];
    }
}
