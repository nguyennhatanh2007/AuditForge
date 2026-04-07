import { NextResponse } from 'next/server';
import { createSystemConfig, listSystemConfigs } from '@/lib/crud';
import { systemConfigSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    logger.info('List system configurations requested', { requestId, search });
    const data = await listSystemConfigs(search);
    return NextResponse.json({ data, requestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('List system configurations failed', { requestId, message });
    return NextResponse.json({ error: 'Chưa cấu hình kết nối MySQL hoặc truy vấn thất bại.', details: message, requestId }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const parsed = systemConfigSchema.parse(body);
    logger.info('Create system configuration requested', {
      requestId,
      systemType: parsed.systemType,
      name: parsed.name,
      url: parsed.url,
      port: parsed.port ?? null,
    });
    const created = await createSystemConfig(parsed);
    return NextResponse.json({ data: created, requestId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((issue) => `${issue.path.join('.') || 'payload'}: ${issue.message}`).join('; ');
      logger.warn('Create system configuration validation failed', { requestId, details });
      return NextResponse.json({ error: 'Dữ liệu đầu vào không hợp lệ.', details, requestId }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Create system configuration failed', { requestId, message });
    return NextResponse.json({ error: 'Không thể tạo cấu hình.', details: message, requestId }, { status: 400 });
  }
}
