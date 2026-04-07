<?php

declare(strict_types=1);

namespace AuditForge\Core;

final class Crypto
{
    private const CIPHER = 'aes-256-gcm';

    private static function key(): string
    {
        $seed = Env::get('SYNC_ENCRYPTION_KEY', 'auditforge-dev-key');
        return hash('sha256', (string) $seed, true);
    }

    public static function encrypt(string $plainText): string
    {
        $iv = random_bytes(12);
        $tag = '';
        $encrypted = openssl_encrypt($plainText, self::CIPHER, self::key(), OPENSSL_RAW_DATA, $iv, $tag);
        if ($encrypted === false) {
            throw new \RuntimeException('Không thể mã hóa dữ liệu bí mật.');
        }

        return base64_encode($iv . $tag . $encrypted);
    }

    public static function decrypt(string $cipherText): string
    {
        $raw = base64_decode($cipherText, true);
        if ($raw === false || strlen($raw) < 29) {
            throw new \RuntimeException('Dữ liệu mã hóa không hợp lệ.');
        }

        $iv = substr($raw, 0, 12);
        $tag = substr($raw, 12, 16);
        $payload = substr($raw, 28);

        $decrypted = openssl_decrypt($payload, self::CIPHER, self::key(), OPENSSL_RAW_DATA, $iv, $tag);
        if ($decrypted === false) {
            throw new \RuntimeException('Không thể giải mã dữ liệu bí mật.');
        }

        return $decrypted;
    }
}
