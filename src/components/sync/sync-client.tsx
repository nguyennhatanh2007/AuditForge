'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Discrepancy {
  objectType: string;
  identifier: string;
  sourceSystem: string;
  type: 'missing_in_itop' | 'extra_in_itop' | 'field_mismatch';
  field?: string | null;
  itopValue?: string | null;
  sourceValue?: string | null;
  severity: 'low' | 'medium' | 'high';
  summary: string;
}

interface SyncResult {
  ok: boolean;
  data?: {
    systems: string[];
    discrepancies: Discrepancy[];
    itopUpdates?: {
      attempted: number;
      updated: number;
      skipped: number;
      failed: number;
      details: Array<{ identifier: string; message: string }>;
    };
    vmComparison: {
      itopVMs: number;
      esxiVMs: number;
    };
    timestamp: string;
  };
  error?: string;
}

export function SyncClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/sync-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Không thể hoàn tất đồng bộ.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đồng bộ vì lỗi không xác định.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAndUpdateItop = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/sync-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyItopUpdates: true }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Không thể cập nhật iTOP từ dữ liệu vừa lấy.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật iTOP vì lỗi không xác định.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <Button
          onClick={handleSync}
          disabled={loading}
          className="px-8 py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
        >
          {loading ? '⏳ Đang Sync...' : '🔄 Sync Thủ Công'}
        </Button>
        <Button
          onClick={handleSyncAndUpdateItop}
          disabled={loading}
          variant="secondary"
          className="px-8 py-6 text-lg font-semibold"
        >
          {loading ? '⏳ Đang Cập Nhật iTOP...' : '⬆️ Sync + Update iTOP'}
        </Button>
        {result?.data?.timestamp && (
          <span className="text-sm text-gray-600">
            Lần sync cuối: {new Date(result.data.timestamp).toLocaleString('vi-VN')}
          </span>
        )}
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <p className="text-red-800 font-semibold">❌ Lỗi: {error}</p>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Hệ Thống</p>
                <p className="text-2xl font-bold text-blue-600">{result.data?.systems.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">VMs trong iTOP</p>
                <p className="text-2xl font-bold text-green-600">{result.data?.vmComparison.itopVMs || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">VMs trong ESXi</p>
                <p className="text-2xl font-bold text-purple-600">{result.data?.vmComparison.esxiVMs || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vấn Đề Tìm Thấy</p>
                <p className={`text-2xl font-bold ${result.data?.discrepancies.length === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.data?.discrepancies.length || 0}
                </p>
              </div>
            </div>
          </Card>

          {result.data?.itopUpdates && (
            <Card className="p-4 bg-white border border-slate-200">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-lg font-semibold text-slate-900">Cập nhật iTOP</h3>
                <span className="text-sm text-slate-600">
                  {result.data.itopUpdates.updated}/{result.data.itopUpdates.attempted} đã cập nhật
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-lg bg-green-50 p-3">
                  <div className="text-slate-600">Thành công</div>
                  <div className="text-2xl font-bold text-green-700">{result.data.itopUpdates.updated}</div>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <div className="text-slate-600">Lỗi</div>
                  <div className="text-2xl font-bold text-red-700">{result.data.itopUpdates.failed}</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <div className="text-slate-600">Bỏ qua</div>
                  <div className="text-2xl font-bold text-amber-700">{result.data.itopUpdates.skipped}</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="text-slate-600">Đã thử</div>
                  <div className="text-2xl font-bold text-blue-700">{result.data.itopUpdates.attempted}</div>
                </div>
              </div>
              {result.data.itopUpdates.details.length > 0 && (
                <div className="mt-4 space-y-2 max-h-64 overflow-auto pr-1">
                  {result.data.itopUpdates.details.slice(0, 10).map((item, index) => (
                    <div key={`${item.identifier}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <span className="font-semibold">{item.identifier}</span>: {item.message}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Discrepancies List */}
          {result.data && result.data.discrepancies.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">🔍 Chi Tiết Vấn Đề</h3>
              {result.data.discrepancies.map((disc, idx) => (
                <Card key={idx} className="p-4 border-l-4" style={{
                  borderLeftColor: disc.severity === 'high' ? '#dc2626' : disc.severity === 'medium' ? '#f59e0b' : '#10b981'
                }}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{idx + 1}. {disc.identifier}</span>
                      <span className="text-xs px-2 py-1 rounded" style={{
                        backgroundColor: disc.severity === 'high' ? '#fee2e2' : disc.severity === 'medium' ? '#fef3c7' : '#dcfce7',
                        color: disc.severity === 'high' ? '#991b1b' : disc.severity === 'medium' ? '#92400e' : '#166534'
                      }}>
                        {disc.severity === 'high' ? '🔴 CRITICAL' : disc.severity === 'medium' ? '🟡 MEDIUM' : '🟢 LOW'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700">{disc.summary}</p>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        📋 {disc.objectType}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {disc.type === 'missing_in_itop' ? '❌ Missing in iTOP' : 
                         disc.type === 'extra_in_itop' ? '⚠️ Extra in iTOP' :
                         '🔄 Field Mismatch'}
                      </span>
                      {disc.field && (
                        <span className="bg-yellow-50 px-2 py-1 rounded text-yellow-800">
                          📊 {disc.field}: iTOP="{disc.itopValue}" vs ESXi="{disc.sourceValue}"
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 bg-green-50 border border-green-200 text-center">
              <p className="text-green-800 font-semibold text-lg">✅ Không có vấn đề! Tất cả hệ thống đồng bộ hoàn hảo 🎉</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
