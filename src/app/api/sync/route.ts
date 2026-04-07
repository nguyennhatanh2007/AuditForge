import { NextResponse } from 'next/server';
import { compareExportDatasets } from '@/lib/discrepancy-engine';
import { readExportDatasets } from '@/lib/export-reader';
import {
  createSyncJob,
  deleteDiscrepanciesBySyncJob,
  insertDiscrepancies,
  updateSyncJob,
} from '@/lib/crud';

export async function POST() {
  try {
    const startedAt = new Date().toISOString();
    const startedJob = await createSyncJob({
      startedAt,
      status: 'running',
      totalSources: 0,
      succeededSources: 0,
      discrepancies: 0,
      note: 'Đang đọc dữ liệu export từ thư mục dùng chung.',
    });

    if (!startedJob) {
      return NextResponse.json({ error: 'Không tạo được sync job.' }, { status: 500 });
    }

    const datasets = await readExportDatasets();
    const generated = compareExportDatasets(datasets);
    const sourceSystems = new Set(datasets.filter((dataset) => dataset.systemName.toLowerCase() !== 'itop').map((dataset) => dataset.systemName));
    const completedSuccessfully = datasets.length > 0;

    await deleteDiscrepanciesBySyncJob(Number(startedJob.id));
    await insertDiscrepancies(
      Number(startedJob.id),
      generated.map((item) => ({
        objectType: item.objectType,
        identifier: item.identifier,
        sourceSystem: item.sourceSystem,
        type: item.type,
        field: item.field ?? null,
        itopValue: item.itopValue ?? null,
        sourceValue: item.sourceValue ?? null,
        severity: item.severity,
        summary: item.summary,
      })),
    );

    const finishedAt = new Date().toISOString();
    const updatedJob = await updateSyncJob(Number(startedJob.id), {
      finishedAt,
      status: completedSuccessfully ? 'success' : 'partial',
      totalSources: sourceSystems.size,
      succeededSources: sourceSystems.size,
      discrepancies: generated.length,
      note: generated.length
        ? 'Đồng bộ hoàn tất từ dữ liệu export JSON/CSV.'
        : 'Không tìm thấy dữ liệu export hợp lệ trong thư mục chung.',
    });

    return NextResponse.json({
      ok: true,
      data: {
        syncJob: updatedJob,
        discrepancies: generated.length,
        sources: sourceSystems.size,
      },
    });
  } catch (error) {
    try {
      const datasets = await readExportDatasets();
      const generated = compareExportDatasets(datasets);
      const sourceSystems = new Set(datasets.filter((dataset) => dataset.systemName.toLowerCase() !== 'itop').map((dataset) => dataset.systemName));

      return NextResponse.json({
        ok: true,
        mode: 'demo',
        data: {
          syncJob: null,
          discrepancies: generated.length,
          sources: sourceSystems.size,
        },
      });
    } catch {
      return NextResponse.json({ error: 'Không thể thực hiện đồng bộ từ file export.' }, { status: 500 });
    }
  }
}
