'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

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
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? 'Yêu cầu không thành công.');
  }
  return payload.data as T;
}

const severityColor = {
  low: 'text-blue-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
};

export function DiscrepanciesClient() {
  const [pageData, setPageData] = useState<DiscrepancyPage>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [addingException, setAddingException] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [objectType, setObjectType] = useState<'all' | 'vm' | 'host' | 'lun'>('all');
  const [type, setType] = useState<'all' | 'missing_in_itop' | 'extra_in_itop' | 'field_mismatch'>('all');

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
          <h2 className="text-2xl font-semibold">Sai lệch dữ liệu</h2>
          <p className="text-sm text-mutedFg">Danh sách sai lệch được lọc theo ngoại lệ và phân trang từ MySQL.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[720px] transition-all">
          <Input placeholder="Tìm theo định danh, nguồn hoặc mô tả" value={search} onChange={(event) => setSearch(event.target.value)} disabled={loading} />
          <Select value={objectType} onChange={(event) => setObjectType(event.target.value as typeof objectType)} disabled={loading}>
            <option value="all">Tất cả loại đối tượng</option>
            <option value="vm">Máy ảo</option>
            <option value="host">Máy chủ</option>
            <option value="lun">LUN / Volume</option>
          </Select>
          <Select value={type} onChange={(event) => setType(event.target.value as typeof type)} disabled={loading}>
            <option value="all">Tất cả kiểu sai lệch</option>
            <option value="missing_in_itop">Thiếu trong iTop</option>
            <option value="extra_in_itop">Thừa trong iTop</option>
            <option value="field_mismatch">Sai khác trường</option>
          </Select>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Danh sách sai lệch</h3>
            <p className="text-sm text-mutedFg">Danh sách full width, thao tác thêm ngoại lệ trực tiếp trên từng dòng.</p>
          </div>
          <Button variant="ghost" onClick={() => void loadItems(pageData.page)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tải lại'}
          </Button>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger animate-in fade-in">{error}</div> : null}
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-mutedFg animate-in fade-in">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải dữ liệu...
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/15 text-mutedFg">
              <tr>
                <th className="px-4 py-3">Định danh</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Nguồn</th>
                <th className="px-4 py-3">Mức độ</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pageData.items.map((item) => (
                <tr key={item.id} className="border-t border-border/70 transition hover:bg-white/3 animate-in fade-in">
                  <td className="px-4 py-4">
                    <div className="font-medium">{item.identifier}</div>
                    <div className="text-xs text-mutedFg truncate">{item.summary}</div>
                  </td>
                  <td className="px-4 py-4 uppercase text-mutedFg text-xs">{item.type.replaceAll('_', ' ')}</td>
                  <td className="px-4 py-4 text-sm">{item.sourceSystem}</td>
                  <td className={`px-4 py-4 font-medium text-sm capitalize ${severityColor[item.severity] || 'text-gray-400'}`}>
                    {item.severity}
                  </td>
                  <td className="px-4 py-4">
                    <Button type="button" variant="secondary" onClick={() => void handleAddException(item)} disabled={addingException === item.id}>
                      {addingException === item.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      {addingException === item.id ? 'Đang xử lý...' : 'Thêm ngoại lệ'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-mutedFg">
          <span>Trang {pageData.page} / {totalPages} · Tổng {pageData.total} bản ghi</span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={pageData.page <= 1 || loading} onClick={() => void loadItems(pageData.page - 1)}>
              Trước
            </Button>
            <Button type="button" variant="secondary" disabled={pageData.page >= totalPages || loading} onClick={() => void loadItems(pageData.page + 1)}>
              Sau
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
