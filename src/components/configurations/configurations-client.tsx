'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

type SystemConfig = {
  id: string;
  systemType: 'itop' | 'vcenter' | 'unity' | 'pure' | 'alletra';
  name: string;
  url: string;
  username?: string;
  secretMasked: string;
  enabled: boolean;
};

type FormState = {
  systemType: SystemConfig['systemType'];
  name: string;
  url: string;
  username: string;
  password: string;
  enabled: boolean;
  port?: number | '';
  apiPath?: string;
};

const emptyForm: FormState = {
  systemType: 'itop',
  name: '',
  url: '',
  username: '',
  password: '',
  enabled: true,
  port: '',
  apiPath: '',
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

export function ConfigurationsClient() {
  const [items, setItems] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [portError, setPortError] = useState<string | null>(null);

  function validatePortValue(value: number | string | undefined) {
    if (value === undefined || value === '' || value === null) return null;
    const num = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isInteger(num) || num < 1 || num > 65535) return 'Port phải là số nguyên hợp lệ (1-65535).';
    return null;
  }

  useEffect(() => {
    setPortError(validatePortValue(form.port));
  }, [form.port]);

  async function loadItems() {
    setLoading(true);
    setError('');
    try {
      const data = await requestJson<SystemConfig[]>('/api/configurations');
      setItems(data);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không tải được danh sách cấu hình.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  function startEdit(item: SystemConfig) {
    setEditingId(item.id);
    setForm({
      systemType: item.systemType,
      name: item.name,
      url: item.url,
      username: item.username ?? '',
      password: '',
      enabled: item.enabled,
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
        systemType: form.systemType,
        name: form.name,
        url: form.url,
        username: form.username || undefined,
        password: form.password || undefined,
        enabled: form.enabled,
        port: form.port === '' || form.port === undefined ? undefined : Number(form.port),
        apiPath: form.apiPath || undefined,
      };

      if (editingId) {
        await requestJson<SystemConfig>(`/api/configurations/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await requestJson<SystemConfig>('/api/configurations', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      await loadItems();
      setFormModalOpen(false);
      resetForm();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không lưu được cấu hình.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa cấu hình này?')) return;
    try {
      await requestJson(`/api/configurations/${id}`, { method: 'DELETE' });
      await loadItems();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không xóa được cấu hình.');
    }
  }

  async function handleTestConnection(id: string) {
    try {
      await requestJson(`/api/configurations/${id}/test`, { method: 'POST' });
      alert('Kiểm tra kết nối thành công.');
    } catch (exception) {
      alert(exception instanceof Error ? exception.message : 'Không kiểm tra được kết nối.');
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Danh sách cấu hình</h3>
            <p className="text-sm text-mutedFg">Quản lý kết nối iTop, vCenter, Dell Unity, Pure Storage và HPE Alletra từ MySQL.</p>
          </div>
          <Button variant="ghost" onClick={() => void loadItems()}>Tải lại</Button>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
        {loading ? <p className="mt-4 text-sm text-mutedFg">Đang tải dữ liệu...</p> : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/15 text-mutedFg">
              <tr>
                <th className="px-4 py-3">Tên cấu hình</th>
                <th className="px-4 py-3">Hệ thống</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-border/70">
                  <td className="px-4 py-4">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-mutedFg truncate">User: {item.username || 'Chưa có'}</div>
                  </td>
                  <td className="px-4 py-4 text-mutedFg uppercase text-xs">{item.systemType}</td>
                  <td className="px-4 py-4 text-mutedFg truncate text-sm">{item.url}</td>
                  <td className="px-4 py-4">
                    <span className={item.enabled ? 'text-emerald-300 text-xs font-medium' : 'text-amber-300 text-xs font-medium'}>
                      {item.enabled ? 'Bật' : 'Tắt'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-nowrap gap-2">
                      <Button className="text-xs" type="button" variant="secondary" onClick={() => handleTestConnection(item.id)}>Kiểm tra</Button>
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
        aria-label="Thêm cấu hình"
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
                <h4 className="text-lg font-semibold">{editingId ? 'Chỉnh sửa cấu hình' : 'Thêm cấu hình kết nối'}</h4>
                <p className="mt-1 text-sm text-mutedFg">Nhập thông tin kết nối cho iTop, vCenter, hoặc hệ thống lưu trữ.</p>
              </div>
              <Button type="button" variant="ghost" onClick={closeFormModal} disabled={saving}>Đóng</Button>
            </div>

            {error ? <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select value={form.systemType} onChange={(event) => setForm({ ...form, systemType: event.target.value as FormState['systemType'] })}>
                  <option value="itop">iTop</option>
                  <option value="vcenter">vCenter</option>
                  <option value="unity">Dell Unity</option>
                  <option value="pure">Pure Storage</option>
                  <option value="alletra">HPE Alletra</option>
                </Select>
                <Input placeholder="Tên cấu hình" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <Input placeholder="URL hoặc IP" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input placeholder="Port (tùy chọn)" inputMode="numeric" value={form.port ?? ''} onChange={(event) => setForm({ ...form, port: event.target.value ? Number(event.target.value) : '' as unknown as number })} />
                <Input placeholder="API Path (tùy chọn)" value={form.apiPath ?? ''} onChange={(event) => setForm({ ...form, apiPath: event.target.value })} />
              </div>
              {portError ? <div className="text-xs text-danger">{portError}</div> : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input placeholder="Tên đăng nhập" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
                <Input placeholder="Mật khẩu / token" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-mutedFg">
                <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
                Kích hoạt cấu hình
              </label>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => handleTestConnection(editingId || '')} disabled={!editingId}>Kiểm tra kết nối</Button>
                <Button type="submit" disabled={saving || Boolean(portError)}>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
