import { NextResponse } from 'next/server';
import { mapConnectionTestStatusCode, runConnectionTest } from '@/lib/connection-test';
import { systemConfigSchema } from '@/lib/validation';
import { consumeRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const first = forwarded.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const clientIp = getClientIp(request);

  try {
    const limiter = consumeRateLimit(`test-draft:${clientIp}`, { windowMs: 60_000, max: 20 });
    if (!limiter.allowed) {
      logger.warn('Draft connection test rate-limited', { requestId, clientIp, retryAfterMs: limiter.retryAfterMs });
      return NextResponse.json(
        {
          error: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
          details: `Thử lại sau ${Math.ceil(limiter.retryAfterMs / 1000)} giây.`,
          requestId,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = systemConfigSchema.parse(body);
    logger.info('Draft connection test started', {
      requestId,
      clientIp,
      systemType: parsed.systemType,
      name: parsed.name,
      url: parsed.url,
      port: parsed.port ?? null,
    });

    const result = await runConnectionTest({
      systemType: parsed.systemType,
      name: parsed.name,
      url: parsed.url,
      username: parsed.username,
      password: parsed.password,
      port: parsed.port,
      apiPath: parsed.apiPath,
    });

    const status = mapConnectionTestStatusCode(result);
    logger.info('Draft connection test completed', {
      requestId,
      clientIp,
      ok: result.ok,
      code: result.code,
      durationMs: result.durationMs,
      status,
      checkedUrl: result.checkedUrl,
    });

    return NextResponse.json({ data: result, requestId }, { status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((issue) => `${issue.path.join('.') || 'payload'}: ${issue.message}`).join('; ');
      logger.warn('Draft connection test validation failed', { requestId, clientIp, details });
      return NextResponse.json(
        {
          error: 'Dữ liệu đầu vào không hợp lệ.',
          details,
          requestId,
        },
        { status: 422 },
      );
    }

    const message = error instanceof Error ? error.message : 'Lỗi không xác định.';
    logger.error('Draft connection test crashed', { requestId, clientIp, message });
    return NextResponse.json(
      {
        error: 'Không thể kiểm tra kết nối.',
        details: message,
        requestId,
      },
      { status: 500 },
    );
  }
}
