<?php

declare(strict_types=1);

namespace AuditForge\Controllers;

use AuditForge\Core\Request;
use AuditForge\Repositories\SystemConfigRepository;
use AuditForge\Services\ConnectionTestService;

final class ConfigurationController extends BaseController
{
    private SystemConfigRepository $repo;
    private ConnectionTestService $tester;

    public function __construct()
    {
        $this->repo = new SystemConfigRepository();
        $this->tester = new ConnectionTestService();
    }

    public function index(Request $request, array $params = []): void
    {
        try {
            $data = $this->repo->list((string) $request->query('search', ''));
            $sanitized = array_map(static function (array $item): array {
                unset($item['password']);
                return $item;
            }, $data);
            $this->ok($sanitized);
        } catch (\Throwable $exception) {
            $this->fail('Không thể tải cấu hình.', $exception->getMessage(), 500);
        }
    }

    public function store(Request $request, array $params = []): void
    {
        try {
            $payload = $request->jsonBody();
            $created = $this->repo->create($payload);
            if ($created === null) {
                $this->fail('Không thể tạo cấu hình.', 'Không nhận được bản ghi sau khi tạo.', 400);
                return;
            }
            unset($created['password']);
            $this->ok($created, 201);
        } catch (\Throwable $exception) {
            $this->fail('Không thể tạo cấu hình.', $exception->getMessage(), 400);
        }
    }

    public function update(Request $request, array $params): void
    {
        try {
            $id = (int) ($params['id'] ?? 0);
            if ($id <= 0) {
                $this->fail('ID cấu hình không hợp lệ.', 'Vui lòng truyền ID số nguyên dương.', 400);
                return;
            }

            $updated = $this->repo->update($id, $request->jsonBody());
            if ($updated === null) {
                $this->fail('Không tìm thấy cấu hình.', 'Bản ghi đã bị xóa hoặc không tồn tại.', 404);
                return;
            }

            unset($updated['password']);
            $this->ok($updated);
        } catch (\Throwable $exception) {
            $this->fail('Không thể cập nhật cấu hình.', $exception->getMessage(), 400);
        }
    }

    public function delete(Request $request, array $params): void
    {
        try {
            $id = (int) ($params['id'] ?? 0);
            if ($id <= 0) {
                $this->fail('ID cấu hình không hợp lệ.', 'Vui lòng truyền ID số nguyên dương.', 400);
                return;
            }

            $this->repo->delete($id);
            $this->ok(['ok' => true]);
        } catch (\Throwable $exception) {
            $this->fail('Không thể xóa cấu hình.', $exception->getMessage(), 400);
        }
    }

    public function test(Request $request, array $params): void
    {
        try {
            $id = (int) ($params['id'] ?? 0);
            if ($id <= 0) {
                $this->fail('ID cấu hình không hợp lệ.', 'Vui lòng truyền ID số nguyên dương.', 400);
                return;
            }

            $config = $this->repo->findById($id);
            if ($config === null) {
                $this->fail('Không tìm thấy cấu hình.', 'Không thể chạy test trên cấu hình đã xóa.', 404);
                return;
            }

            $result = $this->tester->test($config);
            $status = ($result['ok'] ?? false) === true ? 200 : 503;
            $this->ok($result, $status);
        } catch (\Throwable $exception) {
            $this->fail('Không thể kiểm tra kết nối.', $exception->getMessage(), 500);
        }
    }
}
