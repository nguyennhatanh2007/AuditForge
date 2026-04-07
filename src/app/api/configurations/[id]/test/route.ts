import { NextResponse } from 'next/server';
import { getSystemConfigForTest, recordSystemConfigTestOutcome } from '@/lib/crud';
import { mapConnectionTestStatusCode, runConnectionTest } from '@/lib/connection-test';
import { consumeRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

function parseId(id: string) {
  const value = Number(id);
  return Number.isNaN(value) ? null : value;
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const first = forwarded.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const clientIp = getClientIp(request);

  try {
    const limiter = consumeRateLimit(`test-config:${clientIp}`, { windowMs: 60_000, max: 40 });
    if (!limiter.allowed) {
      logger.warn('Connection test rate-limited', { requestId, clientIp, retryAfterMs: limiter.retryAfterMs });
      return NextResponse.json(
        {
          error: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
          details: `Thử lại sau ${Math.ceil(limiter.retryAfterMs / 1000)} giây.`,
          requestId,
        },
        { status: 429 },
      );
    }

    const { id } = await params;
    const numericId = parseId(id);
    if (!numericId) {
      logger.warn('Connection test rejected invalid ID', { requestId, id, clientIp });
      return NextResponse.json({ error: 'ID không hợp lệ.', requestId }, { status: 400 });
    }

    logger.info('Connection test started from saved configuration', { requestId, configId: numericId, clientIp });

    const found = await getSystemConfigForTest(numericId);
    if (!found) {
      logger.warn('Connection test config not found', { requestId, configId: numericId });
      return NextResponse.json({ error: 'Không tìm thấy cấu hình.', requestId }, { status: 404 });
    }

    const result = await runConnectionTest({
      systemType: found.systemType,
      name: found.name,
      url: found.url,
      username: found.username,
      encryptedPassword: found.encryptedPassword,
      port: found.port,
      apiPath: found.apiPath,
    });
    await recordSystemConfigTestOutcome(numericId, result);

    const status = mapConnectionTestStatusCode(result);
    logger.info('Connection test completed from saved configuration', {
      requestId,
      configId: numericId,
      ok: result.ok,
      code: result.code,
      status,
      durationMs: result.durationMs,
      checkedUrl: result.checkedUrl,
    });

    return NextResponse.json({ data: result, requestId }, { status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định.';
    logger.error('Connection test crashed on saved configuration', { requestId, clientIp, message });
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
