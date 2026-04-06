<?php

declare(strict_types=1);

namespace AuditForge\Core;

final class HttpClient
{
    /** @return array{status:int, body:array<string,mixed>|null, raw:string} */
    public function request(string $method, string $url, array $headers = [], ?string $body = null, int $timeoutSeconds = 30): array
    {
        $ch = curl_init($url);
        if ($ch === false) {
            throw new \RuntimeException('Không thể khởi tạo HTTP client.');
        }

        $normalizedHeaders = [];
        foreach ($headers as $name => $value) {
            $normalizedHeaders[] = $name . ': ' . $value;
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_HTTPHEADER => $normalizedHeaders,
            CURLOPT_TIMEOUT => $timeoutSeconds,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
        ]);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $raw = curl_exec($ch);
        if ($raw === false) {
            $message = curl_error($ch);
            curl_close($ch);
            throw new \RuntimeException('Không thể gọi API đích: ' . $message);
        }

        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        $decoded = json_decode($raw, true);

        return [
            'status' => $status,
            'body' => is_array($decoded) ? $decoded : null,
            'raw' => $raw,
        ];
    }
}
