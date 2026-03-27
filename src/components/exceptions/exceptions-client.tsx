'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

type ExceptionItem = {
  id: string;
  objectType: 'vm' | 'host' | 'lun';
  identifier: string;
  sourceSystem: string;
  reason: string;
  createdBy: string;
};

type FormState = {
  objectType: ExceptionItem['objectType'];
  identifier: string;
  sourceSystem: string;
  reason: string;
  createdBy: string;
};

const emptyForm: FormState = {
  objectType: 'vm',
  identifier: '',
  sourceSystem: '',
  reason: '',
  createdBy: '',
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

export function ExceptionsClient() {
  const [items, setItems] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);

  async function loadItems() {
    setLoading(true);
    setError('');
    try {
      const data = await requestJson<ExceptionItem[]>(`/api/exceptions?search=${encodeURIComponent(search)}`);
      setItems(data);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không tải được danh sách ngoại lệ.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadItems();
  }

  function startEdit(item: ExceptionItem) {
    setEditingId(item.id);
    setForm({
      objectType: item.objectType,
      identifier: item.identifier,
      sourceSystem: item.sourceSystem,
      reason: item.reason,
      createdBy: item.createdBy,
    });
    setFormModalOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function openCreateModal() {
    resetForm();
    setError('');
    setFormModalOpen(true);
  }

  function closeFormModal() {
    if (saving) return;
    setFormModalOpen(false);
    resetForm();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        objectType: form.objectType,
        identifier: form.identifier,
        sourceSystem: form.sourceSystem,
        reason: form.reason,
        createdBy: form.createdBy,
      };

      if (editingId) {
        await requestJson<ExceptionItem>(`/api/exceptions/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await requestJson<ExceptionItem>('/api/exceptions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      await loadItems();
      setFormModalOpen(false);
      resetForm();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không lưu được ngoại lệ.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa ngoại lệ này?')) return;
    try {
      await requestJson(`/api/exceptions/${id}`, { method: 'DELETE' });
      await loadItems();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không xóa được ngoại lệ.');
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold">Danh sách ngoại lệ</h3>
            <p className="text-sm text-mutedFg">Quản lý các bản ghi loại trừ khỏi danh sách sai lệch.</p>
          </div>
          <form className="flex gap-2" onSubmit={handleSearch}>
            <Input placeholder="Tìm kiếm" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button type="submit" variant="secondary">Lọc</Button>
          </form>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
        {loading ? <p className="mt-4 text-sm text-mutedFg">Đang tải dữ liệu...</p> : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/15 text-mutedFg">
              <tr>
                <th className="px-4 py-3">Định danh</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Nguồn</th>
                <th className="px-4 py-3">Lý do</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-border/70">
                  <td className="px-4 py-4">
                    <div className="font-medium truncate">{item.identifier}</div>
                    <div className="text-xs text-mutedFg truncate">Người tạo: {item.createdBy}</div>
                  </td>
                  <td className="px-4 py-4 text-mutedFg uppercase text-xs">{item.objectType}</td>
                  <td className="px-4 py-4 text-mutedFg text-sm">{item.sourceSystem}</td>
                  <td className="px-4 py-4 truncate text-sm">{item.reason}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-nowrap gap-2">
                      <Button className="text-xs" type="button" variant="ghost" onClick={() => startEdit(item)}>Sửa</Button>
                      <Button className="text-xs" type="button" variant="danger" onClick={() => void handleDelete(item.id)}>Xóa</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <button
        type="button"
        aria-label="Thêm ngoại lệ"
        className="fixed bottom-8 right-8 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accentFg text-3xl leading-none shadow-soft transition hover:opacity-90"
        onClick={openCreateModal}
      >
        +
      </button>

      {formModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-panel p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold">{editingId ? 'Chỉnh sửa ngoại lệ' : 'Thêm ngoại lệ'}</h4>
                <p className="mt-1 text-sm text-mutedFg">Loại trừ bản ghi rác hoặc dữ liệu không cần đồng bộ.</p>
              </div>
              <Button type="button" variant="ghost" onClick={closeFormModal} disabled={saving}>Đóng</Button>
            </div>

            {error ? <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select value={form.objectType} onChange={(event) => setForm({ ...form, objectType: event.target.value as FormState['objectType'] })}>
                  <option value="vm">Máy ảo</option>
                  <option value="host">Máy chủ</option>
                  <option value="lun">LUN / Volume</option>
                </Select>
                <Input placeholder="Định danh đối tượng" value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} />
              </div>
              <Input placeholder="Hệ thống nguồn" value={form.sourceSystem} onChange={(event) => setForm({ ...form, sourceSystem: event.target.value })} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input placeholder="Lý do ngoại lệ" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
                <Input placeholder="Người tạo" value={form.createdBy} onChange={(event) => setForm({ ...form, createdBy: event.target.value })} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu ngoại lệ'}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
