<?php

declare(strict_types=1);

namespace AuditForge\Core;

final class App
{
    private Router $router;

    public function __construct()
    {
        $this->router = new Router();
        $this->registerRoutes();
    }

    public function run(): void
    {
        $request = new Request();

        try {
            if ($this->router->dispatch($request)) {
                return;
            }
            Response::json(['error' => 'Endpoint không tồn tại.'], 404);
        } catch (\Throwable $exception) {
            Logger::error('Unhandled application error', ['message' => $exception->getMessage()]);
            Response::json([
                'error' => 'Đã xảy ra lỗi hệ thống.',
                'details' => $exception->getMessage(),
            ], 500);
        }
    }

    private function registerRoutes(): void
    {
        $this->router->add('GET', '/', fn(Request $request, array $params) => (new \AuditForge\Controllers\HomeController())->index($request, $params));

        $this->router->add('GET', '/api/health', fn(Request $request, array $params) => (new \AuditForge\Controllers\HealthController())->index($request, $params));

        $this->router->add('GET', '/api/configurations', fn(Request $request, array $params) => (new \AuditForge\Controllers\ConfigurationController())->index($request, $params));
        $this->router->add('POST', '/api/configurations', fn(Request $request, array $params) => (new \AuditForge\Controllers\ConfigurationController())->store($request, $params));
        $this->router->add('PUT', '/api/configurations/{id}', fn(Request $request, array $params) => (new \AuditForge\Controllers\ConfigurationController())->update($request, $params));
        $this->router->add('DELETE', '/api/configurations/{id}', fn(Request $request, array $params) => (new \AuditForge\Controllers\ConfigurationController())->delete($request, $params));
        $this->router->add('POST', '/api/configurations/{id}/test', fn(Request $request, array $params) => (new \AuditForge\Controllers\ConfigurationController())->test($request, $params));

        $this->router->add('GET', '/api/storage', fn(Request $request, array $params) => (new \AuditForge\Controllers\StorageController())->index($request, $params));
        $this->router->add('GET', '/api/inventory', fn(Request $request, array $params) => (new \AuditForge\Controllers\InventoryController())->index($request, $params));
        $this->router->add('POST', '/api/sync-live', fn(Request $request, array $params) => (new \AuditForge\Controllers\SyncController())->syncLive($request, $params));

        $this->router->add('GET', '/api/discrepancies', fn(Request $request, array $params) => (new \AuditForge\Controllers\DiscrepancyController())->index($request, $params));
        $this->router->add('POST', '/api/discrepancies/{id}/exception', fn(Request $request, array $params) => (new \AuditForge\Controllers\DiscrepancyController())->markException($request, $params));

        $this->router->add('GET', '/api/exceptions', fn(Request $request, array $params) => (new \AuditForge\Controllers\ExceptionController())->index($request, $params));
        $this->router->add('POST', '/api/exceptions', fn(Request $request, array $params) => (new \AuditForge\Controllers\ExceptionController())->store($request, $params));
        $this->router->add('PUT', '/api/exceptions/{id}', fn(Request $request, array $params) => (new \AuditForge\Controllers\ExceptionController())->update($request, $params));
        $this->router->add('DELETE', '/api/exceptions/{id}', fn(Request $request, array $params) => (new \AuditForge\Controllers\ExceptionController())->delete($request, $params));
    }
}
