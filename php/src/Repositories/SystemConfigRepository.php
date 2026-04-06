<?php

declare(strict_types=1);

namespace AuditForge\Repositories;

use AuditForge\Core\Crypto;
use AuditForge\Core\Database;
use PDO;

final class SystemConfigRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    /** @return array<int, array<string, mixed>> */
    public function list(string $search = ''): array
    {
        $sql = 'SELECT * FROM system_configs';
        $params = [];
        if (trim($search) !== '') {
            $sql .= ' WHERE name LIKE :search OR url LIKE :search';
            $params['search'] = '%' . trim($search) . '%';
        }
        $sql .= ' ORDER BY updated_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return array_map([$this, 'mapRow'], $rows);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM system_configs WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return is_array($row) ? $this->mapRow($row) : null;
    }

    /** @return array<int, array<string,mixed>> */
    public function listEnabledByTypes(array $types): array
    {
        if ($types === []) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($types), '?'));
        $sql = sprintf('SELECT * FROM system_configs WHERE enabled = 1 AND system_type IN (%s) ORDER BY updated_at DESC', $placeholders);
        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_values($types));
        $rows = $stmt->fetchAll();

        return array_map([$this, 'mapRow'], $rows);
    }

    public function create(array $payload): ?array
    {
        $sql = 'INSERT INTO system_configs (system_type, name, url, username, encrypted_password, enabled, port, api_path, created_at, updated_at)
                VALUES (:system_type, :name, :url, :username, :encrypted_password, :enabled, :port, :api_path, NOW(), NOW())';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'system_type' => $payload['systemType'],
            'name' => $payload['name'],
            'url' => $payload['url'],
            'username' => $payload['username'] ?? null,
            'encrypted_password' => isset($payload['password']) && $payload['password'] !== '' ? Crypto::encrypt((string) $payload['password']) : null,
            'enabled' => isset($payload['enabled']) ? (int) ((bool) $payload['enabled']) : 1,
            'port' => $payload['port'] ?? null,
            'api_path' => $payload['apiPath'] ?? null,
        ]);

        return $this->findById((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $payload): ?array
    {
        $fields = [];
        $params = ['id' => $id];

        $map = [
            'systemType' => 'system_type',
            'name' => 'name',
            'url' => 'url',
            'username' => 'username',
            'enabled' => 'enabled',
            'port' => 'port',
            'apiPath' => 'api_path',
        ];

        foreach ($map as $inputKey => $column) {
            if (array_key_exists($inputKey, $payload)) {
                $fields[] = $column . ' = :' . $column;
                $params[$column] = $inputKey === 'enabled' ? (int) ((bool) $payload[$inputKey]) : $payload[$inputKey];
            }
        }

        if (array_key_exists('password', $payload)) {
            $fields[] = 'encrypted_password = :encrypted_password';
            $password = $payload['password'];
            $params['encrypted_password'] = $password !== null && $password !== '' ? Crypto::encrypt((string) $password) : null;
        }

        if ($fields === []) {
            return $this->findById($id);
        }

        $sql = 'UPDATE system_configs SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->findById($id);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM system_configs WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    private function mapRow(array $row): array
    {
        return [
            'id' => (string) $row['id'],
            'systemType' => $row['system_type'],
            'name' => $row['name'],
            'url' => $row['url'],
            'username' => $row['username'] ?? '',
            'password' => isset($row['encrypted_password']) && $row['encrypted_password'] !== null
                ? Crypto::decrypt((string) $row['encrypted_password'])
                : null,
            'secretMasked' => isset($row['encrypted_password']) && $row['encrypted_password'] !== null ? '••••••••' : '',
            'enabled' => (bool) $row['enabled'],
            'port' => isset($row['port']) ? (int) $row['port'] : null,
            'apiPath' => $row['api_path'] ?? null,
            'lastCheckedAt' => $row['last_checked_at'] ?? null,
            'lastTestStatus' => $row['last_test_status'] ?? null,
            'lastTestCode' => $row['last_test_code'] ?? null,
            'lastTestMessage' => $row['last_test_message'] ?? null,
        ];
    }
}
