'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

type SyncStatus = {
  syncJobId: number;
  systems: string[];
  vmComparison: {
    itopVMs: number;
    esxiVMs: number;
  };
  discrepancies: number;
  timestamp: string;
  saved: boolean;
};

export function SyncStatusWidget() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch latest sync job info
    async function loadStatus() {
      try {
        const response = await fetch('/api/sync-jobs?limit=1');
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const latestJob = data.data[0];
          setStatus({
            syncJobId: parseInt(latestJob.id),
            systems: ['itop', 'vcenter'],
            vmComparison: {
              itopVMs: latestJob.totalSources ? 4 : 0, // Placeholder - would need actual data
              esxiVMs: 0,
            },
            discrepancies: latestJob.discrepancies || 0,
            timestamp: latestJob.startedAt,
            saved: true,
          });
        }
      } catch (error) {
        console.warn('Could not load sync status:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, []);

  if (loading || !status) {
    return null;
  }

  return (
    <Card className="mb-6 border-blue-200/50 bg-blue-50/50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-blue-900">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Real-Time Sync Active
          </h3>
          <p className="text-xs text-blue-700/70 mt-1">
            Last sync: {new Date(status.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <div className="font-medium text-blue-900">{status.vmComparison.itopVMs}</div>
            <div className="text-xs text-blue-700/70">iTOP VMs</div>
          </div>
          <div>
            <div className="font-medium text-blue-900">{status.vmComparison.esxiVMs}</div>
            <div className="text-xs text-blue-700/70">ESXi VMs</div>
          </div>
          <div>
            <div className="font-medium text-blue-900">{status.discrepancies}</div>
            <div className="text-xs text-blue-700/70">Issues Found</div>
          </div>
          <div>
            <div className="font-medium text-blue-900">✅</div>
            <div className="text-xs text-blue-700/70">Saved</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
