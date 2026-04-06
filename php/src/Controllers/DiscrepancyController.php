<?php

declare(strict_types=1);

namespace AuditForge\Controllers;

use AuditForge\Core\Request;
use AuditForge\Repositories\DiscrepancyRepository;
use AuditForge\Repositories\ExceptionRepository;

final class DiscrepancyController extends BaseController
{
    private DiscrepancyRepository $discrepancies;
    private ExceptionRepository $exceptions;

    public function __construct()
    {
        $this->discrepancies = new DiscrepancyRepository();
        $this->exceptions = new ExceptionRepository();
    }

    public function index(Request $request, array $params = []): void
    {
        try {
            $page = max(1, (int) ($request->query('page', '1') ?? '1'));
            $pageSize = max(1, min(500, (int) ($request->query('pageSize', '100') ?? '100')));
            $search = (string) ($request->query('search', '') ?? '');
            $this->ok($this->discrepancies->list($page, $pageSize, $search));
        } catch (\Throwable $exception) {
            $this->fail('Không thể lấy danh sách sai lệch.', $exception->getMessage(), 500);
        }
    }

    public function markException(Request $request, array $params): void
    {
        try {
            $id = (int) ($params['id'] ?? 0);
            if ($id <= 0) {
                $this->fail('ID sai lệch không hợp lệ.', 'Vui lòng truyền ID số nguyên dương.', 400);
                return;
            }

            $body = $request->jsonBody();
            $reason = (string) ($body['reason'] ?? 'Đánh dấu từ màn hình sai lệch');
            $createdBy = (string) ($body['createdBy'] ?? 'system');

            $updated = $this->discrepancies->markAsException($id);
            if ($updated === null) {
                $this->fail('Không tìm thấy sai lệch.', 'Bản ghi không còn tồn tại.', 404);
                return;
            }

            $this->exceptions->create([
                'objectType' => $updated['objectType'],
                'identifier' => $updated['identifier'],
                'sourceSystem' => $updated['sourceSystem'],
                'reason' => $reason,
                'createdBy' => $createdBy,
            ]);

            $this->ok($updated, 201);
        } catch (\Throwable $exception) {
            $this->fail('Không thể đánh dấu ngoại lệ.', $exception->getMessage(), 400);
        }
    }
}
