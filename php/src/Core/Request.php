<?php

declare(strict_types=1);

namespace AuditForge\Core;

final class Request
{
    public function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function path(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH);
        return is_string($path) ? rtrim($path, '/') ?: '/' : '/';
    }

    public function query(string $key, ?string $default = null): ?string
    {
        if (!isset($_GET[$key])) {
            return $default;
        }
        $value = $_GET[$key];
        return is_string($value) ? $value : $default;
    }

    public function jsonBody(): array
    {
        $input = file_get_contents('php://input');
        if ($input === false || trim($input) === '') {
            return [];
        }

        $decoded = json_decode($input, true);
        return is_array($decoded) ? $decoded : [];
    }
}
