<?php

declare(strict_types=1);

namespace AuditForge\Repositories;

use AuditForge\Core\Database;
use PDO;

final class ExceptionRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    /** @return array<int,array<string,mixed>> */
    public function list(string $search = ''): array
    {
        $sql = 'SELECT * FROM exceptions';
        $params = [];
        if (trim($search) !== '') {
            $sql .= ' WHERE identifier LIKE :search OR source_system LIKE :search OR reason LIKE :search';
            $params['search'] = '%' . trim($search) . '%';
        }

        $sql .= ' ORDER BY updated_at DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return array_map([$this, 'mapRow'], $stmt->fetchAll());
    }

    public function create(array $payload): ?array
    {
        $stmt = $this->db->prepare(
            'INSERT INTO exceptions (object_type, identifier, source_system, reason, created_by, created_at, updated_at)
             VALUES (:object_type, :identifier, :source_system, :reason, :created_by, NOW(), NOW())'
        );
        $stmt->execute([
            'object_type' => $payload['objectType'],
            'identifier' => $payload['identifier'],
            'source_system' => $payload['sourceSystem'],
            'reason' => $payload['reason'],
            'created_by' => $payload['createdBy'],
        ]);

        return $this->findById((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $payload): ?array
    {
        $fields = [];
        $params = ['id' => $id];
        $map = [
            'reason' => 'reason',
            'createdBy' => 'created_by',
        ];
        foreach ($map as $key => $column) {
            if (array_key_exists($key, $payload)) {
                $fields[] = $column . ' = :' . $column;
                $params[$column] = $payload[$key];
            }
        }

        if ($fields !== []) {
            $sql = 'UPDATE exceptions SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
        }

        return $this->findById($id);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM exceptions WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    private function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM exceptions WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return is_array($row) ? $this->mapRow($row) : null;
    }

    private function mapRow(array $row): array
    {
        return [
            'id' => (string) $row['id'],
            'objectType' => $row['object_type'],
            'identifier' => $row['identifier'],
            'sourceSystem' => $row['source_system'],
            'reason' => $row['reason'],
            'createdBy' => $row['created_by'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }
}
