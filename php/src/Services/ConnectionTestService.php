<?php

declare(strict_types=1);

namespace AuditForge\Services;

use AuditForge\Core\HttpClient;

final class ConnectionTestService
{
    private HttpClient $http;

    public function __construct()
    {
        $this->http = new HttpClient();
    }

    public function test(array $config): array
    {
        $startedAt = microtime(true);
        try {
            $url = rtrim((string) $config['url'], '/');
            $path = $this->apiPath((string) $config['systemType'], (string) ($config['apiPath'] ?? ''));
            $target = $url . $path;

            $headers = ['Accept' => 'application/json,text/plain,*/*'];
            if (!empty($config['username']) && !empty($config['password'])) {
                $headers['Authorization'] = 'Basic ' . base64_encode((string) $config['username'] . ':' . (string) $config['password']);
            }

            $response = $this->http->request('GET', $target, $headers, null, 15);
            $duration = (int) round((microtime(true) - $startedAt) * 1000);

            if ($response['status'] >= 400) {
                return [
                    'ok' => false,
                    'checkedUrl' => $target,
                    'durationMs' => $duration,
                    'message' => 'Kết nối thất bại.',
                    'details' => 'Server trả về HTTP ' . $response['status'] . '. Vui lòng kiểm tra URL, API path hoặc tài khoản.',
                ];
            }

            return [
                'ok' => true,
                'checkedUrl' => $target,
                'durationMs' => $duration,
                'message' => 'Kết nối thành công.',
                'details' => 'Server phản hồi HTTP ' . $response['status'] . '.',
            ];
        } catch (\Throwable $exception) {
            $duration = (int) round((microtime(true) - $startedAt) * 1000);
            return [
                'ok' => false,
                'checkedUrl' => (string) ($config['url'] ?? ''),
                'durationMs' => $duration,
                'message' => 'Không thể kiểm tra kết nối.',
                'details' => $exception->getMessage(),
            ];
        }
    }

    private function apiPath(string $systemType, string $custom): string
    {
        if (trim($custom) !== '') {
            return str_starts_with($custom, '/') ? $custom : '/' . $custom;
        }

        return match ($systemType) {
            'itop' => '/webservices/rest.php',
            'vcenter' => '/sdk',
            'unity' => '/api/types',
            'pure' => '/api/2.0/app/info',
            'alletra' => '/api/v1/system',
            default => '/',
        };
    }
}
