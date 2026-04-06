<?php

declare(strict_types=1);

namespace AuditForge\Core;

final class Router
{
    /** @var array<int, array{method:string, pattern:string, handler:callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => rtrim($pattern, '/') ?: '/',
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $request): bool
    {
        $path = $request->path();
        $method = $request->method();

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $params = $this->match($route['pattern'], $path);
            if ($params === null) {
                continue;
            }

            ($route['handler'])($request, $params);
            return true;
        }

        return false;
    }

    /** @return array<string, string>|null */
    private function match(string $pattern, string $path): ?array
    {
        $patternSegments = explode('/', trim($pattern, '/'));
        $pathSegments = explode('/', trim($path, '/'));

        if ($pattern === '/' && $path === '/') {
            return [];
        }

        if (count($patternSegments) !== count($pathSegments)) {
            return null;
        }

        $params = [];
        foreach ($patternSegments as $index => $patternSegment) {
            $pathSegment = $pathSegments[$index] ?? '';
            if (preg_match('/^\{([a-zA-Z0-9_]+)\}$/', $patternSegment, $matches) === 1) {
                $params[$matches[1]] = $pathSegment;
                continue;
            }

            if ($patternSegment !== $pathSegment) {
                return null;
            }
        }

        return $params;
    }
}
