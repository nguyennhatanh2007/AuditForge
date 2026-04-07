<?php

declare(strict_types=1);

namespace AuditForge\Repositories;

use AuditForge\Core\Database;
use PDO;

final class DiscrepancyRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    /** @return array<int, array<string,mixed>> */
    public function list(int $page = 1, int $pageSize = 100, string $search = ''): array
    {
        $offset = max(0, ($page - 1) * $pageSize);
        $sql = 'SELECT * FROM discrepancies';
        $countSql = 'SELECT COUNT(*) AS total FROM discrepancies';
        $params = [];

        if (trim($search) !== '') {
            $where = ' WHERE identifier LIKE :search OR source_system LIKE :search OR summary LIKE :search';
            $sql .= $where;
            $countSql .= $where;
            $params['search'] = '%' . trim($search) . '%';
        }

        $sql .= ' ORDER BY created_at DESC LIMIT :limit OFFSET :offset';

        $stmt = $this->db->prepare($countSql);
        $stmt->execute($params);
        $total = (int) (($stmt->fetch()['total'] ?? 0));

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'items' => array_map([$this, 'mapRow'], $stmt->fetchAll()),
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
        ];
    }

    public function markAsException(int $id): ?array
    {
        $stmt = $this->db->prepare('UPDATE discrepancies SET is_exception = 1, updated_at = NOW() WHERE id = :id');
        $stmt->execute(['id' => $id]);

        $find = $this->db->prepare('SELECT * FROM discrepancies WHERE id = :id LIMIT 1');
        $find->execute(['id' => $id]);
        $row = $find->fetch();

        return is_array($row) ? $this->mapRow($row) : null;
    }

    private function mapRow(array $row): array
    {
        return [
            'id' => (string) $row['id'],
            'objectType' => $row['object_type'],
            'identifier' => $row['identifier'],
            'sourceSystem' => $row['source_system'],
            'type' => $row['discrepancy_type'],
            'field' => $row['field_name'] ?? null,
            'itopValue' => $row['itop_value'] ?? null,
            'sourceValue' => $row['source_value'] ?? null,
            'severity' => $row['severity'],
            'summary' => $row['summary'],
            'isException' => (bool) $row['is_exception'],
            'createdAt' => $row['created_at'],
        ];
    }
}
