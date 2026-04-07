'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SyncJob {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'success' | 'failed' | 'partial';
  totalSources: number;
  succeededSources: number;
  discrepancies: number;
  note?: string;
}

const statusColor = {
  success: 'bg-green-500/20 border-green-500/50 text-green-700',
  failed: 'bg-red-500/20 border-red-500/50 text-red-700',
  running: 'bg-blue-500/20 border-blue-500/50 text-blue-700',
  partial: 'bg-amber-500/20 border-amber-500/50 text-amber-700',
};

const statusLabel = {
  success: '✅ Thành công',
  failed: '❌ Thất bại',
  running: '⏳ Đang chạy',
  partial: '⚠️ Một phần',
};

interface TimeCacheEntry {
  timestamp: string;
  displayText: string;
  lastUpdated: number;
}

export function SyncDataTable() {
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [timeDiffs, setTimeDiffs] = useState<Record<string, string>>({});

  async function loadSyncJobs() {
    try {
      const response = await fetch('/api/sync-jobs');
      const data = await response.json();
      setSyncJobs(data.data || []);
    } catch (error) {
      console.error('Failed to load sync jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadSyncJobs();
    setRefreshing(false);
  }

  // Initial load and refresh interval
  useEffect(() => {
    loadSyncJobs();
    const interval = setInterval(loadSyncJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Hydration - only run on client after mount
  useEffect(() => {
    setHydrated(true);

    // Calculate time diffs
    const updateTimeDiffs = () => {
      const diffs: Record<string, string> = {};
      syncJobs.forEach((job) => {
        const diff = Date.now() - new Date(job.startedAt).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) diffs[job.startedAt] = `${days} ngày trước`;
        else if (hours > 0) diffs[job.startedAt] = `${hours} giờ trước`;
        else if (minutes > 0) diffs[job.startedAt] = `${minutes} phút trước`;
        else diffs[job.startedAt] = 'Vừa xong';
      });
      setTimeDiffs(diffs);
    };

    updateTimeDiffs();
    const interval = setInterval(updateTimeDiffs, 60000);
    return () => clearInterval(interval);
  }, [syncJobs]);

  const getTimeDiff = (timestamp: string): string => {
    return timeDiffs[timestamp] || 'Vừa xong';
  };

  const getDuration = (startedAt: string, finishedAt?: string) => {
    if (!finishedAt) return '-';
    const diff = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    return `${(diff / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Dữ Liệu Được Sync</h2>
          <p className="text-sm text-mutedFg">Lịch sử đồng bộ từ các hệ thống nguồn (3 lần gần nhất)</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void handleRefresh()}
          disabled={refreshing || loading}
          className="gap-2"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {refreshing ? 'Đang cập nhật...' : 'Cập nhật'}
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-8 text-mutedFg">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải dữ liệu...
          </div>
        </Card>
      ) : syncJobs.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-mutedFg">Chưa có dữ liệu đồng bộ</div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-border/70">
                  <th className="px-4 py-3 text-left text-mutedFg font-medium">Job ID</th>
                  <th className="px-4 py-3 text-left text-mutedFg font-medium">Thời Gian</th>
                  <th className="px-4 py-3 text-left text-mutedFg font-medium">Trạng Thái</th>
                  <th className="px-4 py-3 text-center text-mutedFg font-medium">Nguồn</th>
                  <th className="px-4 py-3 text-center text-mutedFg font-medium">Sai Lệch</th>
                  <th className="px-4 py-3 text-center text-mutedFg font-medium">Thời Gian Chạy</th>
                  <th className="px-4 py-3 text-left text-mutedFg font-medium">Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {syncJobs.map((job) => (
                  <tr key={job.id} className="border-b border-border/70 hover:bg-slate-100 transition">
                    <td className="px-4 py-3 font-medium">#{job.id}</td>
                    <td className="px-4 py-3">
                      {hydrated ? (
                        <>
                          <div className="text-sm">{new Date(job.startedAt).toLocaleString('vi-VN')}</div>
                          <div className="text-xs text-mutedFg">{getTimeDiff(job.startedAt)}</div>
                        </>
                      ) : (
                        <div className="text-sm">{new Date(job.startedAt).toISOString().split('T')[0]}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-3 py-1 rounded-full border text-xs font-medium ${statusColor[job.status]}`}>
                        {statusLabel[job.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="font-medium">{job.succeededSources}/{job.totalSources}</div>
                      <div className="text-xs text-mutedFg">kết nối</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`font-medium ${job.discrepancies > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {job.discrepancies}
                      </div>
                      {job.discrepancies > 0 ? (
                        <div className="text-xs text-red-500">vấn đề</div>
                      ) : (
                        <div className="text-xs text-green-500">OK</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium">
                      {getDuration(job.startedAt, job.finishedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-mutedFg truncate max-w-[200px]">{job.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {syncJobs.length > 0 && (
            <div className="border-t border-border/70 px-4 py-3 bg-slate-50 text-sm text-mutedFg">
              Hiển thị {syncJobs.length}/3 sync jobs gần nhất · Cập nhật tự động mỗi 30 giây
            </div>
          )}
        </Card>
      )}

      {syncJobs.length > 0 && (
        <Card className="bg-blue-50/50 border-blue-200/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-blue-700/70">Sync Thành Công</div>
              <div className="text-2xl font-semibold text-blue-900">
                {syncJobs.filter((j) => j.status === 'success').length}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-700/70">Tất Cả Sync</div>
              <div className="text-2xl font-semibold text-blue-900">{syncJobs.length}</div>
            </div>
            <div>
              <div className="text-xs text-blue-700/70">Tổng Sai Lệch</div>
              <div className="text-2xl font-semibold text-blue-900">
                {syncJobs.reduce((sum, j) => sum + j.discrepancies, 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-700/70">Lần Sync Gần Nhất</div>
              <div className="text-sm font-medium text-blue-900">{getTimeDiff(syncJobs[0].startedAt)}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
