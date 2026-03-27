import { NextResponse } from 'next/server';
import {
  createDiscrepancy,
  getLatestSyncJobId,
  listDiscrepancies,
} from '@/lib/crud';
import { compareExportDatasets } from '@/lib/discrepancy-engine';
import { readExportDatasets } from '@/lib/export-reader';
import { z } from 'zod';

const discrepancySchema = z.object({
  objectType: z.enum(['vm', 'host', 'lun']),
  identifier: z.string().min(1),
  sourceSystem: z.string().min(1),
  type: z.enum(['missing_in_itop', 'extra_in_itop', 'field_mismatch']),
  field: z.string().optional().nullable(),
  itopValue: z.string().optional().nullable(),
  sourceValue: z.string().optional().nullable(),
  severity: z.enum(['low', 'medium', 'high']),
  summary: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const syncJobParam = searchParams.get('syncJobId');
    const syncJobId = syncJobParam ? Number(syncJobParam) : await getLatestSyncJobId();
    const data = await listDiscrepancies({
      search: searchParams.get('search') ?? '',
      objectType: (searchParams.get('objectType') as 'vm' | 'host' | 'lun' | 'all' | null) ?? 'all',
      type: (searchParams.get('type') as 'missing_in_itop' | 'extra_in_itop' | 'field_mismatch' | 'all' | null) ?? 'all',
      page: Number(searchParams.get('page') ?? '1'),
      pageSize: Number(searchParams.get('pageSize') ?? '10'),
      syncJobId: Number.isNaN(syncJobId as number) ? null : (syncJobId as number | null),
    });
    return NextResponse.json({ data });
  } catch (error) {
    try {
      const datasets = await readExportDatasets();
      const generated = compareExportDatasets(datasets);
      const payload = {
        items: generated.map((item, index) => ({
          id: `export-${index + 1}`,
          objectType: item.objectType,
          identifier: item.identifier,
          sourceSystem: item.sourceSystem,
          type: item.type,
          field: item.field ?? undefined,
          itopValue: item.itopValue ?? undefined,
          sourceValue: item.sourceValue ?? undefined,
          severity: item.severity,
          summary: item.summary,
          createdAt: new Date().toISOString(),
          isException: false,
        })),
        total: generated.length,
        page: 1,
        pageSize: generated.length || 10,
      };

      return NextResponse.json({ data: payload });
    } catch {
      return NextResponse.json({ error: 'Không đọc được dữ liệu export hoặc MySQL chưa cấu hình.' }, { status: 503 });
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = discrepancySchema.parse(body);
    const created = await createDiscrepancy(parsed);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Không thể tạo discrepancy.' }, { status: 400 });
  }
}
