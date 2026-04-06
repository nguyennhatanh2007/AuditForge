<?php

declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    $prefix = 'AuditForge\\';
    if (str_starts_with($class, $prefix) === false) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $path = __DIR__ . '/src/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) {
        require_once $path;
    }
});

AuditForge\Core\Env::bootstrap(__DIR__ . '/../.env.local');
