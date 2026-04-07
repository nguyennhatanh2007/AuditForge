'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Server, Database, AlertTriangle } from 'lucide-react';
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
  const [selectedDataType, setSelectedDataType] = useState<string | null>(null);

  useEffect(() => {
    void fetchInventory();
  }, [fetchInventory]);

  const systemName: Record<string, string> = {
    vcenter: '🖥️ VMware vCenter/ESXi',
    itop: '📋 iTOP CMDB',
    unity: '💾 Dell Unity',
    pure: '💾 Pure Storage',
    alletra: '💾 HPE Alletra',
  };

  const systemIcon: Record<string, any> = {
    vcenter: <Server className="h-5 w-5 text-blue-600" />,
    itop: <Database className="h-5 w-5 text-purple-600" />,
    unity: <Database className="h-5 w-5 text-gray-600" />,
    pure: <Database className="h-5 w-5 text-orange-600" />,
    alletra: <Database className="h-5 w-5 text-green-600" />,
  };

  const getDataTypeLabel = (key: string) => {
    const labels: Record<string, string> = {
      arrays: '🧩 Array',
      pools: '🗂️ Pool',
      capacity: '📈 Capacity',
      virtualMachines: '☁️ Máy Ảo',
      servers: '🖥️ Máy Chủ',
      hosts: '🖥️ ESXi Hosts',
      datastores: '💾 Kho Dữ Liệu',
      logicalVolumes: '💾 Ổ Đĩa Logic',
    };
    return labels[key] || key;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Kho dữ liệu hệ thống</h2>
          <p className="text-sm text-slate-600">
            Tổng hợp dữ liệu thô từ tất cả nguồn kết nối.
          </p>
        </div>
        <Button variant="ghost" onClick={() => void fetchInventory()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Tải lại
        </Button>
      </div>

      {/* Error Display */}
      {error ? (
        <div className="rounded-lg border border-red-400/30 bg-red-50 p-4 text-sm text-red-700 animate-in fade-in">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Lỗi tải dữ liệu</p>
              <p className="mt-1">{error}</p>
              <Button className="mt-3" variant="secondary" onClick={() => void fetchInventory()}>
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Loading State */}
      {loading ? (
        <Card className="py-12">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-slate-600">Đang tải dữ liệu từ các hệ thống...</span>
          </div>
        </Card>
      ) : null}

      {/* Systems Overview */}
      {!loading && data && Object.keys(data).length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data).map(([systemType, systemData]: [string, any]) => {
              let totalItems = 0;
              if (systemData.data) {
                Object.values(systemData.data).forEach((category: any) => {
                  if (category.count) totalItems += category.count;
                });
              }

              return (
                <Card
                  key={systemType}
                  className={`p-4 cursor-pointer transition ${ selectedSystem === systemType ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300'}`}
                  onClick={() => setSelectedSystem(systemType)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      {systemIcon[systemType]}
                      <div>
                        <div className="font-semibold text-slate-900">{systemName[systemType] || systemType}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{systemData.url || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-blue-600">{totalItems}</div>
                  <div className="text-xs text-slate-500">
                    {systemData.lastFetch ? new Date(systemData.lastFetch).toLocaleString('vi-VN') : 'N/A'}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Selected System Details */}
          {selectedSystem && data[selectedSystem] ? (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{systemName[selectedSystem]}</h3>
                </div>

                {/* Data Type Tabs */}
                <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
                  {data[selectedSystem].data ? (
                    Object.entries(data[selectedSystem].data).map(([dataType]: [string, any]) => (
                      <button
                        key={dataType}
                        onClick={() => setSelectedDataType(dataType)}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition ${ selectedDataType === dataType
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                      >
                        {getDataTypeLabel(dataType)}
                      </button>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">Không có dữ liệu</div>
                  )}
                </div>

                {/* Data Display */}
                {selectedDataType && data[selectedSystem].data?.[selectedDataType] ? (
                  <div className="space-y-3">
                    <div className="text-sm text-slate-600">
                      Tổng: <span className="font-semibold">{data[selectedSystem].data[selectedDataType].count}</span> mục
                    </div>

                    {/* Table */}
                    {data[selectedSystem].data[selectedDataType].items?.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-slate-900">Tên</th>
                              <th className="px-4 py-2 text-left font-semibold text-slate-900">ID</th>
                              {/* Dynamic columns */}
                              {data[selectedSystem].data[selectedDataType].items[0] && (
                                Object.keys(data[selectedSystem].data[selectedDataType].items[0])
                                  .filter((k) => k !== 'name' && k !== 'id')
                                  .slice(0, 4)
                                  .map((key) => (
                                    <th key={key} className="px-4 py-2 text-left font-semibold text-slate-900 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </th>
                                  ))
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {data[selectedSystem].data[selectedDataType].items.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-blue-700">{item.name}</td>
                                <td className="px-4 py-2 text-xs text-slate-500 font-mono">{item.id}</td>
                                {Object.entries(item)
                                  .filter(([k]) => k !== 'name' && k !== 'id')
                                  .slice(0, 4)
                                  .map(([key, value]) => (
                                    <td key={key} className="px-4 py-2 text-slate-600">
                                      {String(value)}
                                    </td>
                                  ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 text-center py-4">Không có mục nào</div>
                    )}
                  </div>
                ) : !selectedDataType ? (
                  <div className="text-sm text-slate-500 text-center py-4">Chọn một loại dữ liệu để xem</div>
                ) : (
                  <div className="text-sm text-slate-500 text-center py-4">Không có dữ liệu</div>
                )}
              </div>
            </Card>
          ) : null}
        </>
      ) : !loading ? (
        <Card className="py-8 text-center">
          <p className="text-slate-600">Không có hệ thống nào được kết nối. Hãy cấu hình kết nối trong trang Cấu hình.</p>
        </Card>
      ) : null}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-900">Kho dữ liệu dùng để làm gì?</h4>
          <p className="text-sm text-blue-800">
            Hiển thị đầy đủ đối tượng lấy từ từng hệ thống:
          </p>
          <ul className="text-sm text-blue-800 space-y-1 ml-4">
            <li>✓ <strong>iTOP</strong>: Máy ảo, Máy chủ, Ổ đĩa logic</li>
            <li>✓ <strong>vCenter/ESXi</strong>: VMs, ESXi Hosts, Datastores</li>
          </ul>
          <p className="text-sm text-blue-800 mt-2">
            Dữ liệu này được dùng để phát hiện sai lệch.
          </p>
        </div>
      </Card>
    </div>
  );
}
