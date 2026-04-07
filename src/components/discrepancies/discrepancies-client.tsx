'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Cloud, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DiscrepanciesVMTable } from './discrepancies-vm-table';
import { DiscrepanciesTable } from './discrepancies-table';

type DiscrepancyItem = {
  id: string;
  objectType: 'vm' | 'host' | 'lun';
  identifier: string;
  sourceSystem: string;
  type: 'missing_in_itop' | 'extra_in_itop' | 'field_mismatch';
  field?: string;
  itopValue?: string;
  sourceValue?: string;
  severity: 'low' | 'medium' | 'high';
  summary: string;
  createdAt: string;
  isException?: boolean;
};

type DiscrepancyPage = {
  items: DiscrepancyItem[];
  total: number;
  page: number;
  pageSize: number;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? 'Yêu cầu không thành công.');
    }
    return payload.data as T;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Không thể gửi yêu cầu đến máy chủ.');
  }
}

const severityColor = {
  low: 'text-blue-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
};

export function DiscrepanciesClient() {
  const [pageData, setPageData] = useState<DiscrepancyPage>({ items: [], total: 0, page: 1, pageSize: 100 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [addingException, setAddingException] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [search, setSearch] = useState('');
  const [objectType] = useState<'all' | 'vm' | 'host' | 'lun'>('all');
  const [type] = useState<'all' | 'missing_in_itop' | 'extra_in_itop' | 'field_mismatch'>('all');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pageData.total / pageData.pageSize)), [pageData.total, pageData.pageSize]);

  async function loadItems(nextPage = pageData.page) {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(pageData.pageSize),
        search,
        objectType,
        type,
      });
      const data = await requestJson<DiscrepancyPage>(`/api/discrepancies?${query.toString()}`);
      setPageData(data);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không tải được danh sách sai lệch.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage('');
    try {
      const response = await fetch('/api/sync-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sync thất bại');
      }

      setSyncMessage(`✅ Sync thành công! Tìm thấy ${result.data?.discrepancies?.length || 0} sai lệch.`);
      
      // Reload discrepancies after sync
      setTimeout(() => {
        setPageData({ items: [], total: 0, page: 1, pageSize: 10 });
        void loadItems(1);
      }, 1000);
    } catch (exception) {
      setSyncMessage(`❌ Không thể sync lúc này: ${exception instanceof Error ? exception.message : 'Không rõ lỗi'}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleUpdateItop() {
    setSyncing(true);
    setSyncMessage('');
    try {
      const response = await fetch('/api/sync-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyItopUpdates: true }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Không thể đẩy cập nhật lên iTOP.');
      }

      const updates = result.data?.itopUpdates;
      setSyncMessage(`✅ Đã xử lý cập nhật iTOP: ${updates?.updated || 0} thành công, ${updates?.failed || 0} lỗi, ${updates?.skipped || 0} bỏ qua.`);
      void loadItems(pageData.page);
    } catch (exception) {
      setSyncMessage(`❌ Không thể cập nhật iTOP: ${exception instanceof Error ? exception.message : 'Không rõ lỗi'}`);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    void loadItems(1);
  }, [search, objectType, type]);

  async function handleAddException(item: DiscrepancyItem) {
    try {
      setAddingException(item.id);
      await requestJson(`/api/discrepancies/${item.id}/exception`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Đánh dấu trực tiếp từ màn hình sai lệch', createdBy: 'admin' }),
      });
      await loadItems(pageData.page);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không thể đánh dấu ngoại lệ.');
    } finally {
      setAddingException(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Báo cáo sai lệch dữ liệu</h2>
          <p className="text-sm text-mutedFg">Đối chiếu dữ liệu giữa iTOP và hệ thống nguồn.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => void handleSync()}
            disabled={syncing || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : '🔄'}
            {syncing ? 'Đang Sync...' : 'Sync Thủ Công'}
          </Button>
          <Button variant="secondary" onClick={() => void handleUpdateItop()} disabled={syncing || loading}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : '⬆️'}
            {syncing ? 'Đang Cập Nhật...' : 'Cập Nhật iTOP'}
          </Button>
          <Button variant="ghost" onClick={() => void loadItems(pageData.page)} disabled={loading || syncing}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '↻'} Tải lại
          </Button>
        </div>
      </div>

      {syncMessage ? (
        <div
          className={`rounded-lg border p-3 text-sm animate-in fade-in ${
            syncMessage.startsWith('✅')
              ? 'border-green-400/30 bg-green-400/10 text-green-700'
              : 'border-red-400/30 bg-red-400/10 text-red-700'
          }`}
        >
          {syncMessage}
        </div>
      ) : null}

      {error ? <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-700 animate-in fade-in">{error}</div> : null}

      {loading ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-8 text-mutedFg">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải dữ liệu sai lệch...
          </div>
        </Card>
      ) : (
        <>
          {/* Bảng VM */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Máy Ảo (Virtual Machines)</h3>
              <span className="ml-auto text-sm text-mutedFg">
                {pageData.items.filter((i) => i.objectType === 'vm').length} sai lệch
              </span>
            </div>
            <DiscrepanciesVMTable
              items={pageData.items.filter((i) => i.objectType === 'vm')}
              onAddException={handleAddException}
              addingExceptionId={addingException}
            />
          </div>

          {/* Bảng Logical Volume */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Bộ Nhớ (Logical Volumes)</h3>
              <span className="ml-auto text-sm text-mutedFg">
                {pageData.items.filter((i) => i.objectType === 'lun').length} sai lệch
              </span>
            </div>
            <DiscrepanciesTable
              items={pageData.items.filter((i) => i.objectType === 'lun')}
              title="Bộ Nhớ"
              icon="💾"
              onAddException={handleAddException}
              addingExceptionId={addingException}
              loadingId={addingException}
            />
          </div>

          {/* Thống kê */}
          <Card className="border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs text-slate-600">Tổng Sai Lệch</div>
                <div className="text-3xl font-bold text-slate-900">{pageData.total}</div>
              </div>
              <div>
                <div className="text-xs text-slate-600">VM</div>
                <div className="text-3xl font-bold text-blue-600">{pageData.items.filter((i) => i.objectType === 'vm').length}</div>
              </div>
              <div>
                <div className="text-xs text-slate-600">Logical Volumes</div>
                <div className="text-3xl font-bold text-purple-600">{pageData.items.filter((i) => i.objectType === 'lun').length}</div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
