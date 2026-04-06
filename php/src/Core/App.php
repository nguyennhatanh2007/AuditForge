<?php

declare(strict_types=1);

namespace AuditForge\Core;

use AuditForge\Controllers\ConfigurationController;
use AuditForge\Controllers\DiscrepancyController;
use AuditForge\Controllers\ExceptionController;
use AuditForge\Controllers\HealthController;
use AuditForge\Controllers\HomeController;
use AuditForge\Controllers\InventoryController;
use AuditForge\Controllers\StorageController;
use AuditForge\Controllers\SyncController;

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
        $health = new HealthController();
        $home = new HomeController();
        $config = new ConfigurationController();
        $storage = new StorageController();
        $inventory = new InventoryController();
        $sync = new SyncController();
        $discrepancy = new DiscrepancyController();
        $exception = new ExceptionController();

        $this->router->add('GET', '/', [$home, 'index']);

        $this->router->add('GET', '/api/health', [$health, 'index']);

        $this->router->add('GET', '/api/configurations', [$config, 'index']);
        $this->router->add('POST', '/api/configurations', [$config, 'store']);
        $this->router->add('PUT', '/api/configurations/{id}', [$config, 'update']);
        $this->router->add('DELETE', '/api/configurations/{id}', [$config, 'delete']);
        $this->router->add('POST', '/api/configurations/{id}/test', [$config, 'test']);

        $this->router->add('GET', '/api/storage', [$storage, 'index']);
        $this->router->add('GET', '/api/inventory', [$inventory, 'index']);
        $this->router->add('POST', '/api/sync-live', [$sync, 'syncLive']);

        $this->router->add('GET', '/api/discrepancies', [$discrepancy, 'index']);
        $this->router->add('POST', '/api/discrepancies/{id}/exception', [$discrepancy, 'markException']);

        $this->router->add('GET', '/api/exceptions', [$exception, 'index']);
        $this->router->add('POST', '/api/exceptions', [$exception, 'store']);
        $this->router->add('PUT', '/api/exceptions/{id}', [$exception, 'update']);
        $this->router->add('DELETE', '/api/exceptions/{id}', [$exception, 'delete']);
    }
}
