'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useInventory } from '@/lib/hooks/useInventory';

type SystemStats = {
  systemType: string;
  itemCount: number;
  lastFetch?: string;
};

export function InvenuoryClient() {
  const { loading, error, data, fetchInventory, syncSystem, reset } = useInventory();
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [stats, setStats] = useState<SystemStats[]>([]);
  const [syncingSystem, setSyncingSystem] = useState<string | null>(null);

  useEffect(() => {
    void fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    if (data) {
      const newStats: SystemStats[] = [];
      for (const [systemType, systemData] of Object.entries(data)) {
        let itemCount = 0;
        if (Array.isArray(systemData)) {
          itemCount = systemData.length;
        } else if (typeof systemData === 'object' && systemData !== null) {
          itemCount = Object.values(systemData as Record<string, unknown[]>)
            .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        }
        newStats.push({
          systemType,
          itemCount,
          lastFetch: new Date().toLocaleString(),
        });
      }
      setStats(newStats);
    }
  }, [data]);

  async function handleSyncSystem(systemType: string) {
    setSyncingSystem(systemType);
    try {
      await syncSystem(systemType);
    } finally {
      setSyncingSystem(null);
    }
  }

  const systemName: Record<string, string> = {
    vcenter: 'VMware vCenter',
    itop: 'iTop CMDB',
    unity: 'Dell Unity',
    pure: 'Pure Storage',
    alletra: 'HPE Alletra',
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.systemType} className="relative overflow-hidden">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-mutedFg">{systemName[stat.systemType] || stat.systemType}</div>
              <div className="text-3xl font-bold">{stat.itemCount}</div>
              <div className="text-xs text-mutedFg truncate">{stat.lastFetch}</div>
            </div>
            <Button
              className="absolute top-2 right-2 h-8 w-8 p-0"
              variant="ghost"
              onClick={() => void handleSyncSystem(stat.systemType)}
              disabled={syncingSystem === stat.systemType}
              title={`Đồng bộ ${systemName[stat.systemType]}`}
            >
              {syncingSystem === stat.systemType ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </Card>
        ))}
      </div>

      {/* Error Display */}
      {error ? (
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger animate-in fade-in">
          <p className="font-semibold">Lỗi tải dữ liệu</p>
          <p className="mt-1">{error}</p>
          <Button className="mt-3" variant="secondary" onClick={() => void fetchInventory()}>
            Thử lại
          </Button>
        </div>
      ) : null}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-black/20 py-12 animate-in fade-in">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="text-mutedFg">Đang tải dữ liệu từ các hệ thống...</span>
        </div>
      ) : null}

      {/* System Data Display */}
      {!loading && data ? (
        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-semibold">Chi tiết hệ thống</h3>
              <p className="text-sm text-mutedFg">Chọn hệ thống để xem chi tiết dữ liệu đã đồng bộ.</p>
            </div>
            <Button variant="ghost" onClick={() => void fetchInventory()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tải lại'}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat) => (
              <button
                key={stat.systemType}
                onClick={() => setSelectedSystem(stat.systemType)}
                className={`rounded-lg border-2 p-3 text-left transition ${
                  selectedSystem === stat.systemType
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-border bg-black/20 text-mutedFg hover:bg-black/30'
                }`}
              >
                <div className="text-sm font-semibold">{systemName[stat.systemType]}</div>
                <div className="mt-1 text-2xl font-bold">{stat.itemCount}</div>
                <div className="mt-2 text-xs opacity-70">Nhấp để xem chi tiết</div>
              </button>
            ))}
          </div>

          {selectedSystem && data[selectedSystem] ? (
            <div className="mt-6 space-y-4">
              <div>
                <h4 className="font-semibold mb-3">{systemName[selectedSystem]} - Chi tiết dữ liệu</h4>
                <div className="rounded-lg bg-black/30 p-4 overflow-auto max-h-96">
                  <pre className="text-xs text-mutedFg font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(data[selectedSystem], null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Empty State */}
      {!loading && !data ? (
        <div className="rounded-xl border border-dashed border-border/50 bg-black/20 p-8 text-center">
          <p className="text-mutedFg">Không có dữ liệu. Nhấp vào nút &quot;Tải lại&quot; để lấy dữ liệu từ các hệ thống.</p>
        </div>
      ) : null}
    </div>
  );
}
