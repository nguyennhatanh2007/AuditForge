'use client';

import { AlertCircle } from 'lucide-react';
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

interface DiscrepanciesVMTableProps {
  items: DiscrepancyItem[];
  onAddException: (item: DiscrepancyItem) => void;
  addingExceptionId?: string | null;
}

const typeLabel = {
  missing_in_itop: '❌ Thiếu trong iTOP',
  extra_in_itop: '⚠️ Thừa trong iTOP',
  field_mismatch: '🔄 Sai khác trường',
};

const getVietnameseSummary = (type: string, identifier: string, field?: string, itopValue?: string, sourceValue?: string, sourceSystem?: string): string => {
  if (type === 'extra_in_itop') {
    return `VM "${identifier}" có trong iTOP nhưng không có trong ESXi (có thể đã bị xóa hoặc chưa được đồng bộ)`;
  } else if (type === 'missing_in_itop') {
    return `VM "${identifier}" có trong ESXi nhưng không có trong iTOP`;
  } else if (type === 'field_mismatch') {
    const fieldName: { [key: string]: string } = {
      'memory': 'Bộ nhớ RAM',
      'cpu': 'Số lõi CPU',
      'disk': 'Dung lượng ổ đĩa',
    };
    const displayField = fieldName[field || ''] || field || 'Trường';
    return `${displayField} không khớp: iTOP có "${itopValue}", ESXi có "${sourceValue}"`;
  }
  return '';
};

export function DiscrepanciesVMTable({
  items,
  onAddException,
  addingExceptionId,
}: DiscrepanciesVMTableProps) {
  if (items.length === 0) {
    return (
      <Card className="border-green-200/50 bg-green-50/30">
        <div className="py-8 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-700 font-medium">Máy ảo đồng bộ hoàn toàn</p>
          <p className="text-sm text-green-600 mt-1">Không có sai lệch nào được phát hiện</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/10 border-b border-border/70">
            <tr>
              <th className="px-4 py-3 text-left text-mutedFg font-semibold">☁️ Tên Máy Ảo</th>
              <th className="px-4 py-3 text-left text-mutedFg font-semibold">Loại Sai Lệch</th>
              <th className="px-4 py-3 text-left text-mutedFg font-semibold">Mô Tả Chi Tiết</th>
              <th className="px-4 py-3 text-center text-mutedFg font-semibold">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border/30 hover:bg-black/3 transition">
                {/* Tên Máy Ảo */}
                <td className="px-4 py-3 font-semibold">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <div>
                      <div className="truncate max-w-xs font-medium text-blue-700">{item.identifier}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Loại Sai Lệch */}
                <td className="px-4 py-3">
                  <div className="inline-block px-2 py-1 bg-black/5 rounded text-xs font-medium whitespace-nowrap">
                    {typeLabel[item.type]}
                  </div>
                </td>

                {/* Mô Tả Chi Tiết */}
                <td className="px-4 py-3 text-sm text-slate-700">
                  {getVietnameseSummary(
                    item.type,
                    item.identifier,
                    item.field,
                    item.itopValue,
                    item.sourceValue,
                    item.sourceSystem
                  )}
                </td>

                {/* Hành Động */}
                <td className="px-4 py-3 text-center">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onAddException(item)}
                    disabled={addingExceptionId === item.id || item.isException}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs"
                  >
                    {addingExceptionId === item.id ? (
                      <>
                        <div className="h-3 w-3 bg-white rounded-full animate-pulse" />
                        Đang xử lý...
                      </>
                    ) : item.isException ? (
                      <>
                        ✓ Ngoại lệ
                      </>
                    ) : (
                      <>
                        + Thêm ngoại lệ
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
