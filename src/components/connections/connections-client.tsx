'use client';

import { useEffect, useRef, useState } from 'react';
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
  port?: number;
  apiPath?: string;
  secretMasked: string;
  enabled: boolean;
  lastTestStatus?: string;
  lastTestCode?: string;
  lastTestMessage?: string;
};

type FormState = {
  systemType: SystemConfig['systemType'];
  name: string;
  url: string;
  username: string;
  password: string;
  port: number | '';
  enabled: boolean;
};

type ConnectionTestResult = {
  ok: boolean;
  systemType: SystemConfig['systemType'];
  targetName?: string;
  checkedUrl: string;
  startedAt: string;
  durationMs: number;
  statusCode?: number;
  message: string;
  details: string;
};

type TestModalState = {
  open: boolean;
  running: boolean;
  title: string;
  progress: number;
  result: ConnectionTestResult | null;
};

const emptyForm: FormState = {
  systemType: 'vcenter',
  name: '',
  url: '',
  username: '',
  password: '',
  port: '',
  enabled: true,
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

export function ConnectionsClient() {
  const [items, setItems] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [portError, setPortError] = useState<string | null>(null);
  const [testingTarget, setTestingTarget] = useState<string | null>(null);
  const [testModal, setTestModal] = useState<TestModalState>({
    open: false,
    running: false,
    title: '',
    progress: 0,
    result: null,
  });
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTestRequestRef = useRef<AbortController | null>(null);

  function validatePortValue(value: number | string | undefined) {
    if (value === undefined || value === '' || value === null) return null;
    const num = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isInteger(num) || num < 1 || num > 65535) return 'Port phải là số nguyên hợp lệ (1-65535).';
    return null;
  }

  useEffect(() => {
    setPortError(validatePortValue(form.port));
  }, [form.port]);

  useEffect(() => {
    if (!testModal.running) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      return;
    }

    progressTimerRef.current = setInterval(() => {
      setTestModal((current) => ({
        ...current,
        progress: current.progress >= 92 ? current.progress : current.progress + 6,
      }));
    }, 450);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [testModal.running]);

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
      port: item.port ?? '',
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
        port: form.port === '' || form.port === undefined ? undefined : Number(form.port),
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
    const itemSnapshot = items.find((entry) => entry.id === id);
    console.info('[ConnectionsClient] start saved connection test', { id });
    setError('');
    setTestingTarget(id);
    setTestModal({
      open: true,
      running: true,
      title: 'Đang kiểm tra kết nối đã lưu',
      progress: 8,
      result: null,
    });

    try {
      const controller = new AbortController();
      activeTestRequestRef.current = controller;
      const response = await fetch(`/api/configurations/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      const result = payload?.data as ConnectionTestResult | undefined;

      if (!result) {
        throw new Error(`${payload?.error ?? 'Không nhận được kết quả kiểm tra kết nối.'} ${payload?.details ?? ''} ${payload?.requestId ? `(Mã tra cứu: ${payload.requestId})` : ''}`.trim());
      }

      setTestModal({
        open: true,
        running: false,
        title: result.ok ? 'Kết nối thành công' : 'Kết nối thất bại',
        progress: 100,
        result,
      });
    } catch (exception) {
      const isAbort = exception instanceof DOMException && exception.name === 'AbortError';
      setTestModal({
        open: true,
        running: false,
        title: isAbort ? 'Đã hủy kiểm tra kết nối' : 'Kết nối thất bại',
        progress: 100,
        result: {
          ok: false,
          systemType: itemSnapshot?.systemType ?? form.systemType,
          checkedUrl: itemSnapshot?.url ?? form.url ?? 'Không xác định',
          startedAt: new Date().toISOString(),
          durationMs: 0,
          message: isAbort ? 'Người dùng đã hủy thao tác kiểm tra.' : 'Không kiểm tra được kết nối.',
          details: isAbort ? 'Yêu cầu kiểm tra đã được hủy trước khi hoàn tất.' : exception instanceof Error ? exception.message : 'Lỗi không xác định.',
        },
      });
      console.error('[ConnectionsClient] saved connection test failed', {
        id,
        message: exception instanceof Error ? exception.message : 'Unknown error',
      });
    } finally {
      activeTestRequestRef.current = null;
      setTestingTarget(null);
    }
  }

  async function handleTestDraftConnection() {
    if (!form.name.trim() || !form.url.trim()) {
      setError('Cần nhập ít nhất Tên kết nối và IP/Host trước khi kiểm tra.');
      return;
    }

    if (portError) {
      setError(portError);
      return;
    }

    console.info('[ConnectionsClient] start draft connection test', { systemType: form.systemType, name: form.name, url: form.url });
    setError('');
    setTestingTarget('draft');
    setTestModal({
      open: true,
      running: true,
      title: 'Đang kiểm tra kết nối nháp',
      progress: 8,
      result: null,
    });

    try {
      const payload = {
        systemType: form.systemType,
        name: form.name,
        url: form.url,
        username: form.username || undefined,
        password: form.password || undefined,
        port: form.port === '' ? undefined : Number(form.port),
      };

      const controller = new AbortController();
      activeTestRequestRef.current = controller;
      const response = await fetch('/api/configurations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      const result = data?.data as ConnectionTestResult | undefined;

      if (!result) {
        throw new Error(`${data?.error ?? 'Không nhận được kết quả kiểm tra kết nối.'} ${data?.details ?? ''} ${data?.requestId ? `(Mã tra cứu: ${data.requestId})` : ''}`.trim());
      }

      setTestModal({
        open: true,
        running: false,
        title: result.ok ? 'Kết nối thành công' : 'Kết nối thất bại',
        progress: 100,
        result,
      });
    } catch (exception) {
      const isAbort = exception instanceof DOMException && exception.name === 'AbortError';
      setTestModal({
        open: true,
        running: false,
        title: isAbort ? 'Đã hủy kiểm tra kết nối' : 'Kết nối thất bại',
        progress: 100,
        result: {
          ok: false,
          systemType: form.systemType,
          checkedUrl: form.url || 'Không xác định',
          startedAt: new Date().toISOString(),
          durationMs: 0,
          message: isAbort ? 'Người dùng đã hủy thao tác kiểm tra.' : 'Không kiểm tra được kết nối.',
          details: isAbort ? 'Yêu cầu kiểm tra đã được hủy trước khi hoàn tất.' : exception instanceof Error ? exception.message : 'Lỗi không xác định.',
        },
      });
      console.error('[ConnectionsClient] draft connection test failed', {
        message: exception instanceof Error ? exception.message : 'Unknown error',
      });
    } finally {
      activeTestRequestRef.current = null;
      setTestingTarget(null);
    }
  }

  function handleCancelRunningTest() {
    if (activeTestRequestRef.current) {
      console.info('[ConnectionsClient] cancel running test request');
      activeTestRequestRef.current.abort();
      activeTestRequestRef.current = null;
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <Card className="min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Danh sách kết nối</h3>
            <p className="text-sm text-mutedFg">Danh sách cấu hình cho vCenter và các tủ đĩa, lưu vào MySQL.</p>
          </div>
          <Button variant="ghost" onClick={() => void loadItems()}>Tải lại</Button>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
        {loading ? <p className="mt-4 text-sm text-mutedFg">Đang tải dữ liệu...</p> : null}

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="truncate font-medium">{item.name}</div>
                  <div className="truncate text-sm text-mutedFg">{item.systemType.toUpperCase()} · {item.url}</div>
                  <div className="truncate text-xs text-mutedFg">Người dùng: {item.username || 'Chưa có'} · Trạng thái: {item.enabled ? 'Đang bật' : 'Đang tắt'}</div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button className="whitespace-nowrap" type="button" variant="secondary" onClick={() => void handleTestConnection(item.id)} disabled={testingTarget === item.id || testingTarget === 'draft'}>
                    {testingTarget === item.id ? 'Đang kiểm tra...' : 'Kiểm tra'}
                  </Button>
                  <Button className="whitespace-nowrap" type="button" variant="ghost" onClick={() => startEdit(item)}>Sửa</Button>
                  <Button className="whitespace-nowrap" type="button" variant="danger" onClick={() => void handleDelete(item.id)}>Xóa</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <button
        type="button"
        aria-label="Thêm kết nối"
        className="fixed bottom-8 right-8 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accentFg text-3xl leading-none shadow-soft transition hover:opacity-90"
        onClick={openCreateModal}
      >
        +
      </button>

      {formModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/10 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-panel p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold">{editingId ? 'Chỉnh sửa kết nối' : 'Thêm kết nối mới'}</h4>
                <p className="mt-1 text-sm text-mutedFg">Nhập thông tin kết nối và lưu vào hệ thống.</p>
              </div>
              <Button type="button" variant="ghost" onClick={closeFormModal} disabled={saving}>Đóng</Button>
            </div>

            {error ? <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                <Input placeholder="Tên kết nối" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                <Select value={form.systemType} onChange={(event) => setForm({ ...form, systemType: event.target.value as FormState['systemType'] })}>
                  <option value="vcenter">VMware vCenter</option>
                  <option value="unity">Dell Unity</option>
                  <option value="pure">Pure Storage</option>
                  <option value="alletra">HPE Alletra</option>
                  <option value="itop">iTop</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input placeholder="IP / Host" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
                <Input
                  placeholder="Port (tùy chọn)"
                  inputMode="numeric"
                  value={form.port}
                  onChange={(event) => {
                    const raw = event.target.value.trim();
                    setForm({ ...form, port: raw === '' ? '' : Number(raw) });
                  }}
                />
              </div>
              {portError ? <div className="text-xs text-danger mt-1">{portError}</div> : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input placeholder="Tên đăng nhập" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
                <Input placeholder="Mật khẩu / token" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => void handleTestDraftConnection()} disabled={testingTarget !== null}>Kiểm tra kết nối</Button>
                <Button type="submit" disabled={saving || Boolean(portError)}>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {testModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-panel p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold">{testModal.title}</h4>
                <p className="mt-1 text-sm text-mutedFg">Timeout tối đa 15 giây. Hệ thống đang kiểm tra khả năng kết nối và phản hồi API.</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setTestModal((current) => ({ ...current, open: false }))} disabled={testModal.running}>Đóng</Button>
            </div>

            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
                <div className={`h-full transition-all duration-300 ${testModal.result?.ok ? 'bg-accent' : 'bg-danger'}`} style={{ width: `${testModal.progress}%` }} />
              </div>
              <div className="mt-2 text-xs text-mutedFg">Tiến trình: {testModal.progress}%</div>
            </div>

            {testModal.running ? (
              <div className="mt-4 rounded-xl border border-border bg-slate-50 p-3 text-sm text-mutedFg">
                Đang mở kết nối và chờ phản hồi từ endpoint. Vui lòng đợi...
                <div className="mt-3">
                  <Button type="button" variant="danger" onClick={handleCancelRunningTest}>Hủy kiểm tra</Button>
                </div>
              </div>
            ) : null}

            {testModal.result ? (
                <div className="mt-4 space-y-2 rounded-xl border border-border bg-slate-50 p-4 text-sm">
                <div className="font-medium">{testModal.result.message}</div>
                <div className="text-mutedFg">Chi tiết: {testModal.result.details}</div>
                <div className="text-mutedFg">URL kiểm tra: {testModal.result.checkedUrl}</div>
                <div className="text-mutedFg">Thời gian phản hồi: {testModal.result.durationMs}ms</div>
                {testModal.result.statusCode ? <div className="text-mutedFg">HTTP status: {testModal.result.statusCode}</div> : null}
                <div className="text-mutedFg">Hệ thống: {testModal.result.systemType.toUpperCase()}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
