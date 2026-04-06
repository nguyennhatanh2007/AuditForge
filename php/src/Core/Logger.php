<?php

declare(strict_types=1);

namespace AuditForge\Core;

final class Logger
{
    public static function info(string $message, array $context = []): void
    {
        self::write('INFO', $message, $context);
    }

    public static function warn(string $message, array $context = []): void
    {
        self::write('WARN', $message, $context);
    }

    public static function error(string $message, array $context = []): void
    {
        self::write('ERROR', $message, $context);
    }

    private static function write(string $level, string $message, array $context): void
    {
        $line = sprintf('[%s] [%s] %s %s', date('c'), $level, $message, $context !== [] ? json_encode($context, JSON_UNESCAPED_UNICODE) : '');
        error_log($line);
    }
}
