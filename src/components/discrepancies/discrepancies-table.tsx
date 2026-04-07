'use client';

import { Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DiscrepancyItem {
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
}

interface DiscrepanciesTableProps {
  items: DiscrepancyItem[];
  title: string;
  icon: string;
  onAddException: (item: DiscrepancyItem) => void;
  addingExceptionId?: string | null;
  loadingId?: string | null;
}

const severityColor = {
  low: 'bg-blue-50 border-blue-200 text-blue-900',
  medium: 'bg-amber-50 border-amber-200 text-amber-900',
  high: 'bg-red-50 border-red-200 text-red-900',
};

const severityLabel = {
  low: '🔵 Thấp',
  medium: '🟡 Trung bình',
  high: '🔴 Cao',
};

const typeLabel = {
  missing_in_itop: '❌ Thiếu trong iTOP',
  extra_in_itop: '⚠️ Thừa trong iTOP',
  field_mismatch: '🔄 Sai khác trường',
};

export function DiscrepanciesTable({
  items,
  title,
  icon,
  onAddException,
  addingExceptionId,
  loadingId,
}: DiscrepanciesTableProps) {
  if (items.length === 0) {
    return (
      <Card className="border-green-200/50 bg-green-50/30">
        <div className="py-8 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-700 font-medium">{title} đồng bộ hoàn toàn</p>
          <p className="text-sm text-green-600 mt-1">Không có sai lệch nào được phát hiện</p>
        </div>
      </Card>
    );
  }

  const getDiscrepancyColor = (severity: string) => {
    return severityColor[severity as keyof typeof severityColor] || severityColor.low;
  };

  return (
    <Card className="border-border/70 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-border/70">
            <tr>
              <th className="px-4 py-3 text-left text-mutedFg font-semibold">{icon} Tên</th>
              <th className="px-4 py-3 text-left text-mutedFg font-semibold">Loại Sai Lệch</th>
              <th className="px-4 py-3 text-left text-mutedFg font-semibold">Mức Độ</th>
              <th className="px-4 py-3 text-left text-mutedFg font-semibold">Chi Tiết</th>
              <th className="px-4 py-3 text-left text-mutedFg font-semibold">Hệ Thống</th>
              <th className="px-4 py-3 text-center text-mutedFg font-semibold">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={`border-b border-border/30 hover:bg-slate-100 transition ${getDiscrepancyColor(item.severity)}`}>
                {/* Tên */}
                <td className="px-4 py-3 font-semibold text-slate-900">
                  <div className="truncate max-w-xs">{item.identifier}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </div>
                </td>

                {/* Loại Sai Lệch */}
                <td className="px-4 py-3">
                  <div className="inline-block px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                    {typeLabel[item.type]}
                  </div>
                </td>

                {/* Mức Độ */}
                <td className="px-4 py-3 font-medium">
                  {severityLabel[item.severity]}
                </td>

                {/* Chi Tiết */}
                <td className="px-4 py-3 text-xs">
                  {item.type === 'field_mismatch' ? (
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">Trường: {item.field}</div>
                      <div>iTOP: <span className="font-mono bg-blue-100/50 px-1.5 py-0.5 rounded">{item.itopValue || '-'}</span></div>
                      <div>Hệ thống: <span className="font-mono bg-amber-100/50 px-1.5 py-0.5 rounded">{item.sourceValue || '-'}</span></div>
                    </div>
                  ) : (
                    <div className="text-slate-600">{item.summary}</div>
                  )}
                </td>

                {/* Hệ Thống */}
                <td className="px-4 py-3 text-xs font-medium">
                  <div className="inline-block px-2 py-1 bg-slate-100 rounded">
                    {item.sourceSystem === 'esxi' ? '🖥️ ESXi' : item.sourceSystem === 'storage' ? '💾 Storage' : item.sourceSystem}
                  </div>
                </td>

                {/* Hành Động */}
                <td className="px-4 py-3 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddException(item)}
                    disabled={loadingId === item.id || item.isException}
                    className="gap-1 text-xs"
                  >
                    {loadingId === item.id ? (
                      <>
                        <div className="h-3 w-3 bg-current rounded-full animate-pulse" />
                      </>
                    ) : item.isException ? (
                      <>
                        <Check className="h-3 w-3" />
                        Ngoại lệ
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        Đánh dấu
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
