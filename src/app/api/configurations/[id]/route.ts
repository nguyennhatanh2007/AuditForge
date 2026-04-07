import { NextResponse } from 'next/server';
import { deleteSystemConfig, updateSystemConfig } from '@/lib/crud';
import { systemConfigSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { z } from 'zod';

function parseId(id: string) {
  const value = Number(id);
  return Number.isNaN(value) ? null : value;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    const { id } = await params;
    const numericId = parseId(id);
    if (!numericId) {
      logger.warn('Update system configuration rejected invalid ID', { requestId, id });
      return NextResponse.json({ error: 'ID không hợp lệ.', requestId }, { status: 400 });
    }

    const body = await request.json();
    const parsed = systemConfigSchema.partial().parse(body);
    logger.info('Update system configuration requested', {
      requestId,
      configId: numericId,
      fields: Object.keys(parsed),
    });
    const updated = await updateSystemConfig(numericId, parsed);
    return NextResponse.json({ data: updated, requestId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((issue) => `${issue.path.join('.') || 'payload'}: ${issue.message}`).join('; ');
      logger.warn('Update system configuration validation failed', { requestId, details });
      return NextResponse.json({ error: 'Dữ liệu cập nhật không hợp lệ.', details, requestId }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Update system configuration failed', { requestId, message });
    return NextResponse.json({ error: 'Không thể cập nhật cấu hình.', details: message, requestId }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    const { id } = await params;
    const numericId = parseId(id);
    if (!numericId) {
      logger.warn('Delete system configuration rejected invalid ID', { requestId, id });
      return NextResponse.json({ error: 'ID không hợp lệ.', requestId }, { status: 400 });
    }

    logger.info('Delete system configuration requested', { requestId, configId: numericId });
    await deleteSystemConfig(numericId);
    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Delete system configuration failed', { requestId, message });
    return NextResponse.json({ error: 'Không thể xóa cấu hình.', details: message, requestId }, { status: 400 });
  }
}
