'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  RefreshCcw,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type StorageSummaryDto = {
  sourceSystem: string;
  systemType: string;
  name: string;
  url: string;
  lastFetch: string;
  counts: {
    arrays: number;
    pools: number;
    luns: number;
    hosts: number;
  };
  capacity: {
    totalBytes?: number | null;
    usedBytes?: number | null;
    freeBytes?: number | null;
    provisionedBytes?: number | null;
    usableBytes?: number | null;
    dataReduction?: number | string | null;
  };
};

type InventoryResponse = {
  data: Record<string, {
    system?: string;
    url?: string;
    lastFetch?: string;
    data?: Record<string, { count?: number; items?: Array<Record<string, unknown>> }>;
  }>;
  timestamp: string;
  totalSystems: number;
};

type ConfigurationRecord = {
  id: string;
  systemType: string;
  name: string;
  url: string;
  enabled: boolean;
};

type ConfigurationResponse = {
  data: ConfigurationRecord[];
};

type SyncJobRecord = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'success' | 'failed' | 'partial';
  totalSources: number;
  succeededSources: number;
  discrepancies: number;
  note?: string;
};

type SyncJobsResponse = {
  data: SyncJobRecord[];
};

type MonthlyTrendPoint = {
  key: string;
  label: string;
  jobs: number;
  discrepancies: number;
  successRate: number;
};

type InventorySystemSummary = {
  key: string;
  label: string;
  url: string;
  lastFetch?: string;
  arrays: number;
  pools: number;
  luns: number;
  vms: number;
  hosts: number;
  datastores: number;
  servers: number;
  logicalVolumes: number;
};

type InventoryTotals = {
  arrays: number;
  pools: number;
  luns: number;
  vms: number;
  hosts: number;
  datastores: number;
  servers: number;
  logicalVolumes: number;
};

type PlanningSignal = {
  label: string;
  value: number;
  note: string;
};

const FIXED_GROWTH_RATE = 0.05;
const FIXED_SCENARIO_NOTE = 'Tăng trưởng 5%/tháng (Bảo thủ)';

function formatBytes(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) {
    return '-';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDays(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }

  return `${Math.max(0, Math.ceil(value))} ngày`;
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function effectiveUsedBytes(summary: StorageSummaryDto) {
  const { totalBytes, usedBytes, freeBytes } = summary.capacity;
  if (typeof usedBytes === 'number') {
    return usedBytes;
  }
  if (typeof totalBytes === 'number' && typeof freeBytes === 'number') {
    return Math.max(totalBytes - freeBytes, 0);
  }
  return 0;
}

function effectiveFreeBytes(summary: StorageSummaryDto) {
  const { totalBytes, usedBytes, freeBytes } = summary.capacity;
  if (typeof freeBytes === 'number') {
    return freeBytes;
  }
  if (typeof totalBytes === 'number' && typeof usedBytes === 'number') {
    return Math.max(totalBytes - usedBytes, 0);
  }
  return 0;
}

function aggregateStorageSummaries(summaries: StorageSummaryDto[]) {
  return summaries.reduce(
    (accumulator, summary) => {
      accumulator.totalBytes += safeNumber(summary.capacity.totalBytes);
      accumulator.usedBytes += effectiveUsedBytes(summary);
      accumulator.freeBytes += effectiveFreeBytes(summary);
      accumulator.provisionedBytes += safeNumber(summary.capacity.provisionedBytes);
      accumulator.usableBytes += safeNumber(summary.capacity.usableBytes);
      accumulator.systems += 1;
      accumulator.luns += summary.counts.luns;
      accumulator.pools += summary.counts.pools;
      accumulator.arrays += summary.counts.arrays;
      return accumulator;
    },
    {
      totalBytes: 0,
      usedBytes: 0,
      freeBytes: 0,
      provisionedBytes: 0,
      usableBytes: 0,
      systems: 0,
      luns: 0,
      pools: 0,
      arrays: 0,
    },
  );
}

function buildPlanningSignals(inventory: InventoryResponse | null): PlanningSignal[] {
  if (!inventory) {
    return [];
  }

  const signalTotals = Object.values(inventory.data ?? {}).reduce(
    (accumulator, systemData) => {
      const sections = systemData.data ?? {};
      accumulator.vms += safeNumber(sections.virtualMachines?.count);
      accumulator.hosts += safeNumber(sections.hosts?.count);
      accumulator.datastores += safeNumber(sections.datastores?.count);
      accumulator.logicalVolumes += safeNumber(sections.logicalVolumes?.count);
      accumulator.arrays += safeNumber(sections.arrays?.count);
      return accumulator;
    },
    { vms: 0, hosts: 0, datastores: 0, logicalVolumes: 0, arrays: 0 },
  );

  return [
    { label: 'Máy ảo', value: signalTotals.vms, note: 'Tác động trực tiếp đến tăng trưởng lưu trữ và datastore.' },
    { label: 'ESXi/Host', value: signalTotals.hosts, note: 'Hạ tầng compute tăng thường kéo theo nhu cầu storage.' },
    { label: 'Datastore', value: signalTotals.datastores, note: 'Điểm quan sát để kiểm tra ngưỡng đầy.' },
    { label: 'Logical Volumes', value: signalTotals.logicalVolumes, note: 'Tổng volume/LUN có thể phản ánh mức tiêu thụ.' },
    { label: 'Array', value: signalTotals.arrays, note: 'Số hệ storage đang được tính vào report.' },
  ];
}

function summarizeInventory(inventory: InventoryResponse | null) {
  const systems = Object.entries(inventory?.data ?? {}).map(([key, systemData]) => {
    const sections = systemData.data ?? {};
    return {
      key,
      label: systemData.system ?? key,
      url: systemData.url ?? '',
      lastFetch: systemData.lastFetch,
      arrays: safeNumber(sections.arrays?.count),
      pools: safeNumber(sections.pools?.count),
      luns: safeNumber(sections.logicalVolumes?.count),
      vms: safeNumber(sections.virtualMachines?.count),
      hosts: safeNumber(sections.hosts?.count),
      datastores: safeNumber(sections.datastores?.count),
      servers: safeNumber(sections.servers?.count),
      logicalVolumes: safeNumber(sections.logicalVolumes?.count),
    };
  });

  const totals = systems.reduce<InventoryTotals>(
    (accumulator, system) => ({
      arrays: accumulator.arrays + system.arrays,
      pools: accumulator.pools + system.pools,
      luns: accumulator.luns + system.luns,
      vms: accumulator.vms + system.vms,
      hosts: accumulator.hosts + system.hosts,
      datastores: accumulator.datastores + system.datastores,
      servers: accumulator.servers + system.servers,
      logicalVolumes: accumulator.logicalVolumes + system.logicalVolumes,
    }),
    { arrays: 0, pools: 0, luns: 0, vms: 0, hosts: 0, datastores: 0, servers: 0, logicalVolumes: 0 },
  );

  return { systems, totals };
}

function summarizeConfigurations(configs: ConfigurationRecord[] | null) {
  const list = configs ?? [];
  const enabled = list.filter((item) => item.enabled);
  const disabled = list.length - enabled.length;
  const byType = enabled.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.systemType] = (accumulator[item.systemType] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    total: list.length,
    enabled: enabled.length,
    disabled,
    byType,
    enabledLabels: enabled.map((item) => `${item.name} · ${item.systemType.toUpperCase()}`),
  };
}

function summarizeSyncJobsMonthly(jobs: SyncJobRecord[]) {
  const now = new Date();
  const buckets = new Map<string, { jobs: number; discrepancies: number; succeeded: number }>();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, { jobs: 0, discrepancies: 0, succeeded: 0 });
  }

  jobs.forEach((job) => {
    const startedAt = new Date(job.startedAt);
    if (Number.isNaN(startedAt.getTime())) {
      return;
    }
    const key = `${startedAt.getFullYear()}-${String(startedAt.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key);
    if (!bucket) {
      return;
    }

    bucket.jobs += 1;
    bucket.discrepancies += job.discrepancies;
    if (job.status === 'success') {
      bucket.succeeded += 1;
    }
  });

  return Array.from(buckets.entries()).map(([key, value]) => {
    const [year, month] = key.split('-').map(Number);
    const date = new Date(year, (month || 1) - 1, 1);
    const successRate = value.jobs > 0 ? (value.succeeded / value.jobs) * 100 : 0;

    return {
      key,
      label: date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
      jobs: value.jobs,
      discrepancies: value.discrepancies,
      successRate,
    };
  });
}

function classifyRisk(utilizationPercent: number, daysToExhaustion: number | null) {
  if (daysToExhaustion !== null && daysToExhaustion <= 90) {
    return { label: 'Nguy cơ cao', tone: 'text-red-700 bg-red-50 border-red-200', icon: AlertTriangle };
  }

  if (utilizationPercent >= 85 || (daysToExhaustion !== null && daysToExhaustion <= 180)) {
    return { label: 'Cần theo dõi', tone: 'text-amber-700 bg-amber-50 border-amber-200', icon: ShieldAlert };
  }

  return { label: 'An toàn ngắn hạn', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function addDays(reference: Date, days: number) {
  const next = new Date(reference);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(reference: Date, months: number) {
  const next = new Date(reference);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatShortDate(value: Date | string | null | undefined) {
  if (!value) {
    return '-';
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function escapeCsvCell(value: unknown) {
  const raw = value === null || value === undefined ? '' : String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

function escapeHtml(value: unknown) {
  const raw = value === null || value === undefined ? '' : String(value);
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type GaugeCardProps = {
  label: string;
  value: string;
  percent: number | null;
  caption: string;
  accent: string;
  footnote?: string;
};

function GaugeCard({ label, value, percent, caption, accent, footnote }: GaugeCardProps) {
  const normalized = percent === null || Number.isNaN(percent) ? 0 : clamp(percent, 0, 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - normalized / 100);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-mutedFg">Gauge</p>
          <h3 className="mt-1 text-lg font-semibold">{label}</h3>
        </div>
        <div className="rounded-xl bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{caption}</div>
      </div>
      <div className="relative mx-auto mt-5 h-44 w-44">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={accent}
            strokeLinecap="round"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-semibold text-fg">{value}</div>
          <div className="mt-1 text-xs text-mutedFg">{normalized.toFixed(1)}%</div>
        </div>
      </div>
      {footnote ? <p className="mt-2 text-xs text-mutedFg">{footnote}</p> : null}
    </Card>
  );
}

type MiniGaugeProps = {
  label: string;
  value: string;
  percent: number | null;
  theme: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';
  note: string;
};

function MiniGauge({ label, value, percent, theme, note }: MiniGaugeProps) {
  const colors: Record<MiniGaugeProps['theme'], string> = {
    blue: '#2563eb',
    emerald: '#10b981',
    amber: '#f59e0b',
    violet: '#7c3aed',
    rose: '#f43f5e',
    slate: '#64748b',
  };

  const background: Record<MiniGaugeProps['theme'], string> = {
    blue: 'from-blue-50 to-white',
    emerald: 'from-emerald-50 to-white',
    amber: 'from-amber-50 to-white',
    violet: 'from-violet-50 to-white',
    rose: 'from-rose-50 to-white',
    slate: 'from-slate-50 to-white',
  };

  const normalized = percent === null || Number.isNaN(percent) ? 0 : clamp(percent, 0, 100);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - normalized / 100);

  return (
    <Card className={`h-full overflow-hidden border border-border bg-gradient-to-br ${background[theme]} p-4`}>
      <div className="flex h-full flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-mutedFg">{theme}</p>
            <h4 className="mt-1 truncate text-sm font-semibold">{label}</h4>
          </div>
          <div className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm">{note}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
              <circle cx="48" cy="48" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke={colors[theme]}
                strokeLinecap="round"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-lg font-semibold text-fg">{value}</div>
              <div className="text-[10px] text-mutedFg">{normalized.toFixed(0)}%</div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-xs text-mutedFg">Chủ đề</div>
            <p className="mt-1 text-sm leading-5 text-fg/80">{note}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

type PieSegment = {
  label: string;
  value: number;
  color: string;
};

type PieCardProps = {
  title: string;
  subtitle: string;
  segments: PieSegment[];
  centerLabel: string;
  centerValue: string;
};

function PieCard({ title, subtitle, segments, centerLabel, centerValue }: PieCardProps) {
  const total = segments.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0);
  const usableSegments = total > 0 ? segments.filter((segment) => segment.value > 0) : [];

  let start = 0;
  const stops = usableSegments.map((segment) => {
    const slice = (segment.value / total) * 100;
    const next = start + slice;
    const stop = `${segment.color} ${start}% ${next}%`;
    start = next;
    return stop;
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-mutedFg">Pie</p>
          <h3 className="mt-1 text-lg font-semibold">{title}</h3>
        </div>
        <div className="rounded-xl bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{subtitle}</div>
      </div>

      <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="relative mx-auto h-52 w-52 shrink-0 rounded-full p-2">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: total > 0 ? `conic-gradient(${stops.join(', ')})` : 'conic-gradient(#cbd5e1 0% 100%)',
            }}
          />
          <div className="absolute inset-10 rounded-full bg-white shadow-inner" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-xs uppercase tracking-[0.16em] text-mutedFg">{centerLabel}</div>
            <div className="mt-1 text-2xl font-semibold">{centerValue}</div>
            <div className="mt-1 text-xs text-mutedFg">{total > 0 ? `${total.toLocaleString('vi-VN')} điểm dữ liệu` : 'Chưa có dữ liệu'}</div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {segments.map((segment) => {
            const percentage = total > 0 ? (Math.max(segment.value, 0) / total) * 100 : 0;
            return (
              <div key={segment.label} className="rounded-xl border border-border bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                    <div>
                      <div className="text-sm font-medium">{segment.label}</div>
                      <div className="text-xs text-mutedFg">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{formatBytes(segment.value)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

type TimelineEntry = {
  title: string;
  date: string;
  detail: string;
  tone: 'blue' | 'amber' | 'emerald' | 'rose' | 'slate';
};

function TimelineCard({ title, subtitle, entries }: { title: string; subtitle: string; entries: TimelineEntry[] }) {
  const palette: Record<TimelineEntry['tone'], string> = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-500',
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-mutedFg">Timeline</p>
          <h3 className="mt-1 text-lg font-semibold">{title}</h3>
        </div>
        <div className="rounded-xl bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{subtitle}</div>
      </div>

      <div className="mt-5 space-y-4">
        {entries.map((entry, index) => (
          <div key={`${entry.title}-${entry.date}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className={`mt-1 h-3 w-3 rounded-full ${palette[entry.tone]}`} />
              {index < entries.length - 1 ? <span className="mt-2 h-full w-px flex-1 bg-border" /> : null}
            </div>
            <div className="min-w-0 pb-4">
              <div className="text-sm font-semibold">{entry.title}</div>
              <div className="text-xs text-mutedFg">{formatShortDate(entry.date)}</div>
              <p className="mt-1 text-sm text-fg/80">{entry.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CapacityPlanningClient() {
  const [summaries, setSummaries] = useState<StorageSummaryDto[]>([]);
  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [configurations, setConfigurations] = useState<ConfigurationRecord[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const growthRate = FIXED_GROWTH_RATE;
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(body?.error || `Không thể tải ${url}`);
    }

    return body as T;
  }

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [storageResult, inventoryResult, configResult, syncJobsResult] = await Promise.allSettled([
        fetchJson<{ data: StorageSummaryDto[] }>('/api/storage?view=summary'),
        fetchJson<InventoryResponse>('/api/inventory'),
        fetchJson<ConfigurationResponse>('/api/configurations'),
        fetchJson<SyncJobsResponse>('/api/sync-jobs?limit=100'),
      ]);

      if (storageResult.status === 'fulfilled') {
        setSummaries(storageResult.value.data ?? []);
      } else {
        setSummaries([]);
      }

      if (inventoryResult.status === 'fulfilled') {
        setInventory(inventoryResult.value);
      } else {
        setInventory(null);
      }

      if (configResult.status === 'fulfilled') {
        setConfigurations(configResult.value.data ?? []);
      } else {
        setConfigurations([]);
      }

      if (syncJobsResult.status === 'fulfilled') {
        setSyncJobs(syncJobsResult.value.data ?? []);
      } else {
        setSyncJobs([]);
      }

      const issues = [storageResult, inventoryResult, configResult, syncJobsResult]
        .filter((result) => result.status === 'rejected')
        .map((result) => (result as PromiseRejectedResult).reason instanceof Error ? (result as PromiseRejectedResult).reason.message : 'Không rõ lỗi');

      if (issues.length > 0) {
        setError(`Một số nguồn dữ liệu chưa sẵn sàng: ${issues.join(' | ')}`);
      }

      setUpdatedAt(new Date().toISOString());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu capacity planning');
    } finally {
      setLoading(false);
    }
  }

  const aggregate = aggregateStorageSummaries(summaries);
  const inventorySummary = summarizeInventory(inventory);
  const configurationSummary = summarizeConfigurations(configurations);
  const hasStorageMetrics = summaries.some((summary) =>
    [summary.capacity.totalBytes, summary.capacity.usedBytes, summary.capacity.freeBytes, summary.capacity.provisionedBytes, summary.capacity.usableBytes].some(
      (value) => typeof value === 'number' && Number.isFinite(value) && value > 0,
    ),
  );
  const utilizationPercent = aggregate.totalBytes > 0 ? (aggregate.usedBytes / aggregate.totalBytes) * 100 : 0;
  const freePercent = aggregate.totalBytes > 0 ? (aggregate.freeBytes / aggregate.totalBytes) * 100 : 0;
  const dailyGrowthBytes = aggregate.usedBytes > 0 ? (aggregate.usedBytes * growthRate) / 30 : aggregate.totalBytes > 0 ? (aggregate.totalBytes * growthRate) / 30 : 0;
  const daysToExhaustion = dailyGrowthBytes > 0 ? aggregate.freeBytes / dailyGrowthBytes : null;
  const projectedUsedAfter12Months = aggregate.usedBytes > 0 ? aggregate.usedBytes * Math.pow(1 + growthRate, 12) : 0;
  const projectedUtilization12Months = aggregate.totalBytes > 0 ? Math.min((projectedUsedAfter12Months / aggregate.totalBytes) * 100, 999) : 0;
  const risk = hasStorageMetrics ? classifyRisk(utilizationPercent, daysToExhaustion) : { label: 'Thiếu dữ liệu', tone: 'text-amber-700 bg-amber-50 border-amber-200', icon: AlertTriangle };
  const RiskIcon = risk.icon;

  const daysToExhaustionDisplay = hasStorageMetrics ? formatDays(daysToExhaustion) : 'N/A';
  const projectedUtilizationDisplay = hasStorageMetrics ? formatPercent(projectedUtilization12Months) : 'N/A';
  const freePercentDisplay = hasStorageMetrics ? formatPercent(freePercent) : 'N/A';

  const recommendations = [
    !hasStorageMetrics
      ? 'Chưa có dữ liệu storage đủ để lập kế hoạch. Hãy kiểm tra kết nối tới array trước.'
      : utilizationPercent >= 85
        ? 'Dung lượng đang cao. Nên lên kế hoạch mở rộng hoặc dọn dẹp sớm.'
        : 'Dung lượng hiện tại còn an toàn cho kế hoạch ngắn hạn.',
    daysToExhaustion !== null && daysToExhaustion <= 180
      ? 'Với tốc độ tăng trưởng hiện tại, ngưỡng đầy có thể đến trong 6 tháng. Cần đưa vào kế hoạch mua sắm.'
      : 'Chưa thấy ngưỡng cạn trong 6 tháng theo mô hình hiện tại.',
    aggregate.provisionedBytes > aggregate.totalBytes
      ? 'Provisioned capacity đang vượt total capacity. Cần kiểm tra oversubscription và thin provisioning.'
      : 'Chưa phát hiện oversubscription rõ ràng từ số liệu tổng hợp.',
  ];

  const storageSystems = [...summaries].sort((left, right) => {
    const leftUtilization = left.capacity.totalBytes ? (effectiveUsedBytes(left) / left.capacity.totalBytes) * 100 : 0;
    const rightUtilization = right.capacity.totalBytes ? (effectiveUsedBytes(right) / right.capacity.totalBytes) * 100 : 0;
    return rightUtilization - leftUtilization;
  });

  const physicalNodeTotal = inventorySummary.totals.servers + inventorySummary.totals.hosts;
  const virtualizationNodeTotal = inventorySummary.totals.vms + inventorySummary.totals.datastores;
  const storageNodeTotal = inventorySummary.totals.arrays + inventorySummary.totals.pools + inventorySummary.totals.luns;

  const monthlyTrend = summarizeSyncJobsMonthly(syncJobs);
  const maxMonthlyDiscrepancies = Math.max(1, ...monthlyTrend.map((item) => item.discrepancies));
  const latestSyncJob = syncJobs[0] ?? null;
  const gaugeMetrics = [
    {
      label: 'Utilization',
      value: hasStorageMetrics ? formatPercent(utilizationPercent) : 'N/A',
      percent: hasStorageMetrics ? utilizationPercent : null,
      theme: 'blue' as const,
      note: 'Storage',
    },
    {
      label: 'Headroom',
      value: hasStorageMetrics ? formatPercent(freePercent) : 'N/A',
      percent: hasStorageMetrics ? freePercent : null,
      theme: 'emerald' as const,
      note: 'Storage',
    },
    {
      label: '12-month forecast',
      value: hasStorageMetrics ? formatPercent(projectedUtilization12Months) : 'N/A',
      percent: hasStorageMetrics ? projectedUtilization12Months : null,
      theme: 'amber' as const,
      note: 'Storage',
    },
    {
      label: 'Storage systems',
      value: summaries.length.toLocaleString('vi-VN'),
      percent: summaries.length > 0 ? 100 : null,
      theme: 'violet' as const,
      note: 'Inventory',
    },
    {
      label: 'Arrays',
      value: inventorySummary.totals.arrays.toLocaleString('vi-VN'),
      percent: storageNodeTotal > 0 ? (inventorySummary.totals.arrays / Math.max(storageNodeTotal, 1)) * 100 : null,
      theme: 'rose' as const,
      note: 'Storage',
    },
    {
      label: 'Pools',
      value: inventorySummary.totals.pools.toLocaleString('vi-VN'),
      percent: storageNodeTotal > 0 ? (inventorySummary.totals.pools / Math.max(storageNodeTotal, 1)) * 100 : null,
      theme: 'slate' as const,
      note: 'Storage',
    },
    {
      label: 'LUNs',
      value: inventorySummary.totals.luns.toLocaleString('vi-VN'),
      percent: storageNodeTotal > 0 ? (inventorySummary.totals.luns / Math.max(storageNodeTotal, 1)) * 100 : null,
      theme: 'blue' as const,
      note: 'Storage',
    },
    {
      label: 'VMs',
      value: inventorySummary.totals.vms.toLocaleString('vi-VN'),
      percent: virtualizationNodeTotal > 0 ? (inventorySummary.totals.vms / Math.max(virtualizationNodeTotal, 1)) * 100 : null,
      theme: 'emerald' as const,
      note: 'Infra',
    },
    {
      label: 'Hosts & servers',
      value: physicalNodeTotal.toLocaleString('vi-VN'),
      percent: physicalNodeTotal > 0 ? 100 : null,
      theme: 'amber' as const,
      note: 'Infra',
    },
  ];

  function downloadCsv(fileName: string, rows: Array<Array<string | number>>) {
    const csv = rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportPrintableTable(title: string, headers: string[], rows: Array<Array<string | number>>) {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      return;
    }

    const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
    const rowsHtml = rows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: Segoe UI, Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            p { margin: 0 0 16px; font-size: 12px; color: #475569; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(title)}</h1>
          <p>Generated at ${escapeHtml(new Date().toLocaleString('vi-VN'))}</p>
          <table>
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <script>
            window.onload = function(){ window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function exportStorageCsv() {
    const rows: Array<Array<string | number>> = [
      ['System', 'Type', 'Total', 'Used', 'Free', 'Utilization', 'Days to full'],
      ...storageSystems.map((system) => {
        const utilization = system.capacity.totalBytes ? (effectiveUsedBytes(system) / system.capacity.totalBytes) * 100 : null;
        const days = system.capacity.totalBytes && growthRate > 0
          ? effectiveFreeBytes(system) / (((effectiveUsedBytes(system) > 0 ? effectiveUsedBytes(system) : system.capacity.totalBytes ?? 0) * growthRate) / 30)
          : null;

        return [
          system.name,
          system.systemType.toUpperCase(),
          formatBytes(system.capacity.totalBytes),
          formatBytes(effectiveUsedBytes(system)),
          formatBytes(effectiveFreeBytes(system)),
          utilization !== null ? formatPercent(utilization) : 'N/A',
          formatDays(days),
        ];
      }),
    ];

    downloadCsv(`capacity-storage-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  function exportStoragePdf() {
    const headers = ['System', 'Type', 'Total', 'Used', 'Free', 'Utilization', 'Days to full'];
    const rows = storageSystems.map((system) => {
      const utilization = system.capacity.totalBytes ? (effectiveUsedBytes(system) / system.capacity.totalBytes) * 100 : null;
      const days = system.capacity.totalBytes && growthRate > 0
        ? effectiveFreeBytes(system) / (((effectiveUsedBytes(system) > 0 ? effectiveUsedBytes(system) : system.capacity.totalBytes ?? 0) * growthRate) / 30)
        : null;

      return [
        system.name,
        system.systemType.toUpperCase(),
        formatBytes(system.capacity.totalBytes),
        formatBytes(effectiveUsedBytes(system)),
        formatBytes(effectiveFreeBytes(system)),
        utilization !== null ? formatPercent(utilization) : 'N/A',
        formatDays(days),
      ];
    });

    exportPrintableTable('Capacity Planning - Storage Report', headers, rows);
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-mutedFg">Capacity planning</p>
          <h2 className="text-3xl font-semibold">Hoạch định dung lượng hạ tầng</h2>
          <p className="text-sm text-mutedFg">
            Theo dõi nhanh mức dùng, headroom và dự báo dung lượng.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => void loadData()} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex gap-3 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Dữ liệu chưa đầy đủ</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="py-10 text-center">
          <div className="flex items-center justify-center gap-3 text-slate-600">
            <RefreshCcw className="h-5 w-5 animate-spin" />
            Đang tổng hợp dữ liệu capacity planning...
          </div>
        </Card>
      ) : null}

      <Card className="border-blue-200 bg-blue-50/70">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Kịch bản dự báo</h3>
            <p className="text-sm text-blue-800">{FIXED_SCENARIO_NOTE}</p>
          </div>
          <div className="text-xs text-blue-900/80">Cập nhật: {updatedAt ? new Date(updatedAt).toLocaleString('vi-VN') : 'Chưa có'}</div>
        </div>
      </Card>

      <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-mutedFg">Gauge board</p>
                <h3 className="mt-1 text-lg font-semibold">Các chỉ số theo chủ đề</h3>
              </div>
              <div className="text-xs text-mutedFg">9 gauge, bố cục 3x3</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {gaugeMetrics.map((metric) => (
                <MiniGauge
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  percent={metric.percent}
                  theme={metric.theme}
                  note={metric.note}
                />
              ))}
            </div>
          </div>

          <Card className="h-full">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-mutedFg">Storage report</p>
                <h3 className="mt-1 text-lg font-semibold">Storage capacity và LUN planning</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-mutedFg">
                  <span>Ngày đầy: {daysToExhaustionDisplay}</span>
                  <span>Projection: {projectedUtilizationDisplay}</span>
                  <span>Headroom: {freePercentDisplay}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={exportStorageCsv}>Xuất CSV</Button>
                <Button type="button" size="sm" variant="secondary" onClick={exportStoragePdf}>Xuất PDF</Button>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium ${risk.tone}`}>
                  <RiskIcon className="h-4 w-4" />
                  {risk.label}
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-border">
              <div className="max-h-[28rem] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-mutedFg">
                    <tr>
                      <th className="px-4 py-3">System</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Used</th>
                      <th className="px-4 py-3">Free</th>
                      <th className="px-4 py-3">Utilization</th>
                      <th className="px-4 py-3">Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storageSystems.length > 0 ? (
                      storageSystems.map((system) => {
                        const systemUtilization = system.capacity.totalBytes ? (effectiveUsedBytes(system) / system.capacity.totalBytes) * 100 : null;
                        const systemDays = system.capacity.totalBytes && growthRate > 0
                          ? effectiveFreeBytes(system) / (((effectiveUsedBytes(system) > 0 ? effectiveUsedBytes(system) : system.capacity.totalBytes ?? 0) * growthRate) / 30)
                          : null;
                        const systemRisk = classifyRisk(systemUtilization ?? 0, systemDays);

                        return (
                          <tr key={system.name} className="border-t border-border/60">
                            <td className="px-4 py-4">
                              <div className="font-medium text-fg">{system.name}</div>
                              <div className="text-xs text-mutedFg">{system.systemType.toUpperCase()}</div>
                            </td>
                            <td className="px-4 py-4 font-mono text-xs">{hasStorageMetrics ? formatBytes(system.capacity.totalBytes) : '-'}</td>
                            <td className="px-4 py-4 font-mono text-xs">{hasStorageMetrics ? formatBytes(effectiveUsedBytes(system)) : '-'}</td>
                            <td className="px-4 py-4 font-mono text-xs">{hasStorageMetrics ? formatBytes(effectiveFreeBytes(system)) : '-'}</td>
                            <td className="px-4 py-4 text-sm font-semibold">{hasStorageMetrics && systemUtilization !== null ? formatPercent(systemUtilization) : 'N/A'}</td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`inline-flex rounded-full border px-3 py-1 ${systemRisk.tone}`}>{hasStorageMetrics ? formatDays(systemDays) : 'N/A'}</span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="px-4 py-6 text-center text-mutedFg" colSpan={6}>
                          Chưa có dữ liệu storage để lập báo cáo chi tiết.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
      </div>
    </div>
  );
}