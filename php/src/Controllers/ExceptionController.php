<?php

declare(strict_types=1);

namespace AuditForge\Controllers;

use AuditForge\Core\Request;
use AuditForge\Repositories\ExceptionRepository;

final class ExceptionController extends BaseController
{
    private ExceptionRepository $repo;

    public function __construct()
    {
        $this->repo = new ExceptionRepository();
    }

    public function index(Request $request, array $params = []): void
    {
        try {
            $this->ok($this->repo->list((string) ($request->query('search', '') ?? '')));
        } catch (\Throwable $exception) {
            $this->fail('Không thể lấy danh sách ngoại lệ.', $exception->getMessage(), 500);
        }
    }

    public function store(Request $request, array $params = []): void
    {
        try {
            $created = $this->repo->create($request->jsonBody());
            if ($created === null) {
                $this->fail('Không thể tạo ngoại lệ.', 'Không nhận được bản ghi sau khi tạo.', 400);
                return;
            }

            $this->ok($created, 201);
        } catch (\Throwable $exception) {
            $this->fail('Không thể tạo ngoại lệ.', $exception->getMessage(), 400);
        }
    }

    public function update(Request $request, array $params): void
    {
        try {
            $id = (int) ($params['id'] ?? 0);
            if ($id <= 0) {
                $this->fail('ID ngoại lệ không hợp lệ.', 'Vui lòng truyền ID số nguyên dương.', 400);
                return;
            }

            $updated = $this->repo->update($id, $request->jsonBody());
            if ($updated === null) {
                $this->fail('Không tìm thấy ngoại lệ.', 'Bản ghi có thể đã bị xóa.', 404);
                return;
            }

            $this->ok($updated);
        } catch (\Throwable $exception) {
            $this->fail('Không thể cập nhật ngoại lệ.', $exception->getMessage(), 400);
        }
    }

    public function delete(Request $request, array $params): void
    {
        try {
            $id = (int) ($params['id'] ?? 0);
            if ($id <= 0) {
                $this->fail('ID ngoại lệ không hợp lệ.', 'Vui lòng truyền ID số nguyên dương.', 400);
                return;
            }

            $this->repo->delete($id);
            $this->ok(['ok' => true]);
        } catch (\Throwable $exception) {
            $this->fail('Không thể xóa ngoại lệ.', $exception->getMessage(), 400);
        }
    }
}
