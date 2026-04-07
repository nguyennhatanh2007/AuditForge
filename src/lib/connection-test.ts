import { decryptSecret } from '@/lib/crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export type ConnectionSystemType = 'itop' | 'vcenter' | 'unity' | 'pure' | 'alletra';

export type ConnectionTestInput = {
  systemType: ConnectionSystemType;
  name?: string;
  url: string;
  username?: string | null;
  password?: string | null;
  encryptedPassword?: string | null;
  port?: number | null;
  apiPath?: string | null;
};

export type ConnectionTestResult = {
  ok: boolean;
  code?: TestErrorCode;
  systemType: ConnectionSystemType;
  targetName?: string;
  checkedUrl: string;
  startedAt: string;
  durationMs: number;
  statusCode?: number;
  message: string;
  details: string;
};

type TestErrorCode =
  | 'INVALID_URL'
  | 'TIMEOUT'
  | 'AUTH_FAILED'
  | 'NOT_FOUND'
  | 'SSL_ERROR'
  | 'REFUSED'
  | 'DNS_ERROR'
  | 'NETWORK_ERROR'
  | 'UNEXPECTED';

class ConnectionTestError extends Error {
  readonly code: TestErrorCode;
  readonly details: string;
  readonly statusCode?: number;

  constructor(code: TestErrorCode, message: string, details: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}

const privateIpv4Ranges = [
  ['10.0.0.0', 8],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['100.64.0.0', 10],
] as const;

const privateIpv6Prefixes = ['::1', 'fc', 'fd', 'fe80'];

const defaultApiPath: Record<ConnectionSystemType, string> = {
  itop: '/webservices/rest.php',
  vcenter: '/sdk',
  unity: '/api/types/system/instances',
  pure: '/api/2.0/array',
  alletra: '/api/v1',
};

function ipToNumber(ip: string) {
  return ip
    .split('.')
    .map((part) => Number(part))
    .reduce((acc, octet) => ((acc << 8) | octet) >>> 0, 0);
}

function isIpv4Private(ip: string) {
  const number = ipToNumber(ip);
  return privateIpv4Ranges.some(([base, mask]) => {
    const shift = 32 - mask;
    return (number >>> shift) === (ipToNumber(base) >>> shift);
  });
}

function isIpv6Private(ip: string) {
  const lower = ip.toLowerCase();
  return privateIpv6Prefixes.some((prefix) => lower.startsWith(prefix));
}

function isPrivateIp(ip: string) {
  const version = isIP(ip);
  if (version === 4) return isIpv4Private(ip);
  if (version === 6) return isIpv6Private(ip);
  return false;
}

function parseAllowList() {
  return (process.env.CONNECTION_TEST_ALLOWLIST ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function hostMatchesAllowList(hostname: string, allowList: string[]) {
  const lowerHost = hostname.toLowerCase();
  return allowList.some((item) => {
    if (item.startsWith('*.')) {
      const suffix = item.slice(1);
      return lowerHost.endsWith(suffix);
    }
    return lowerHost === item;
  });
}

async function resolveHostAddresses(hostname: string) {
  if (isIP(hostname)) {
    return [hostname];
  }

  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
}

async function normalizeTargetUrl(input: ConnectionTestInput): Promise<URL> {
  const raw = input.url.trim();
  if (!raw) {
    throw new ConnectionTestError('INVALID_URL', 'Thiếu địa chỉ kết nối.', 'Vui lòng nhập IP/Host hoặc URL hợp lệ.');
  }

  const allowHttp = (process.env.CONNECTION_TEST_ALLOW_HTTP ?? 'false').toLowerCase() === 'true';
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new ConnectionTestError('INVALID_URL', 'URL không hợp lệ.', `Không thể phân tích URL: ${raw}`);
  }

  if (parsed.protocol !== 'https:' && !(allowHttp && parsed.protocol === 'http:')) {
    throw new ConnectionTestError('INVALID_URL', 'Chỉ hỗ trợ HTTPS cho kiểm tra kết nối.', 'Hãy dùng URL HTTPS hoặc bật CONNECTION_TEST_ALLOW_HTTP=true nếu thực sự cần HTTP.');
  }

  if (input.port && Number.isInteger(input.port) && input.port > 0 && input.port <= 65535) {
    parsed.port = String(input.port);
  }

  const path = (input.apiPath ?? '').trim() || defaultApiPath[input.systemType] || '/';
  if (path.startsWith('/')) {
    parsed.pathname = path;
  } else {
    parsed.pathname = `/${path}`;
  }

  const allowList = parseAllowList();
  if (allowList.length > 0 && !hostMatchesAllowList(parsed.hostname, allowList)) {
    throw new ConnectionTestError(
      'NETWORK_ERROR',
      'Host không nằm trong danh sách cho phép.',
      'Vui lòng cấu hình CONNECTION_TEST_ALLOWLIST để cho phép host này.',
    );
  }

  const allowPrivate = (process.env.CONNECTION_TEST_ALLOW_PRIVATE ?? 'false').toLowerCase() === 'true';
  if (!allowPrivate) {
    const addresses = await resolveHostAddresses(parsed.hostname);
    if (addresses.some((address) => isPrivateIp(address))) {
      throw new ConnectionTestError(
        'NETWORK_ERROR',
        'Host nội bộ/private bị chặn theo chính sách an toàn.',
        'Bật CONNECTION_TEST_ALLOW_PRIVATE=true nếu bạn muốn cho phép kiểm tra mạng nội bộ.',
      );
    }
  }

  return parsed;
}

function mapFetchError(error: unknown): ConnectionTestError {
  if (error instanceof ConnectionTestError) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ConnectionTestError(
      'TIMEOUT',
      'Kết nối bị timeout sau 15 giây.',
      'Đích không phản hồi trong giới hạn 15 giây. Hãy kiểm tra mạng, firewall hoặc URL/Port.',
    );
  }

  const message = error instanceof Error ? error.message : 'Lỗi không xác định';
  const cause = (error as { cause?: { code?: string; message?: string } })?.cause;
  const code = cause?.code ?? '';

  if (code === 'ECONNREFUSED') {
    return new ConnectionTestError('REFUSED', 'Từ chối kết nối.', 'Máy đích từ chối kết nối. Kiểm tra IP/Port hoặc dịch vụ chưa chạy.');
  }

  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    return new ConnectionTestError('DNS_ERROR', 'Không phân giải được hostname.', 'DNS không tìm thấy host. Vui lòng kiểm tra tên miền/IP.');
  }

  if (code === 'CERT_HAS_EXPIRED' || code === 'DEPTH_ZERO_SELF_SIGNED_CERT' || code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
    return new ConnectionTestError('SSL_ERROR', 'Lỗi chứng chỉ SSL/TLS.', `Chi tiết SSL: ${code}`);
  }

  if (message.toLowerCase().includes('fetch failed')) {
    return new ConnectionTestError('NETWORK_ERROR', 'Lỗi mạng khi kết nối.', cause?.message ?? message);
  }

  return new ConnectionTestError('UNEXPECTED', 'Lỗi kiểm tra kết nối.', message);
}

function resolvePassword(input: ConnectionTestInput) {
  if (input.password) return input.password;
  if (input.encryptedPassword) {
    try {
      return decryptSecret(input.encryptedPassword);
    } catch {
      return null;
    }
  }
  return null;
}

export async function runConnectionTest(input: ConnectionTestInput): Promise<ConnectionTestResult> {
  const startedAt = new Date();
  const timeoutMs = 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const targetUrl = await normalizeTargetUrl(input);
    const headers: Record<string, string> = {
      Accept: 'application/json,text/plain,*/*',
    };

    const username = input.username?.trim();
    const password = resolvePassword(input);
    if (username && password) {
      const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
      headers.Authorization = `Basic ${basicAuth}`;
    }

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    const durationMs = Date.now() - startedAt.getTime();

    if (response.status === 401 || response.status === 403) {
      throw new ConnectionTestError(
        'AUTH_FAILED',
        'Xác thực thất bại.',
        `Server trả về ${response.status}. Kiểm tra lại username/password hoặc quyền API.`,
        response.status,
      );
    }

    if (response.status === 404) {
      throw new ConnectionTestError(
        'NOT_FOUND',
        'Không tìm thấy endpoint API.',
        `Server trả về 404 tại ${targetUrl.pathname}. Hãy kiểm tra API Path.`,
        response.status,
      );
    }

    if (response.status >= 400) {
      throw new ConnectionTestError(
        'NETWORK_ERROR',
        `Server trả lỗi ${response.status}.`,
        `Không thể xác nhận kết nối thành công. HTTP status: ${response.status}.`,
        response.status,
      );
    }

    return {
      ok: true,
      code: undefined,
      systemType: input.systemType,
      targetName: input.name,
      checkedUrl: targetUrl.toString(),
      startedAt: startedAt.toISOString(),
      durationMs,
      statusCode: response.status,
      message: 'Kết nối thành công.',
      details: `Đích phản hồi HTTP ${response.status} trong ${durationMs}ms.`,
    };
  } catch (error) {
    const mapped = mapFetchError(error);
    const durationMs = Date.now() - startedAt.getTime();

    return {
      ok: false,
      code: mapped.code,
      systemType: input.systemType,
      targetName: input.name,
      checkedUrl: input.url,
      startedAt: startedAt.toISOString(),
      durationMs,
      statusCode: mapped.statusCode,
      message: mapped.message,
      details: mapped.details,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function mapConnectionTestStatusCode(result: ConnectionTestResult) {
  if (result.ok) return 200;

  switch (result.code) {
    case 'TIMEOUT':
      return 408;
    case 'AUTH_FAILED':
      return result.statusCode ?? 401;
    case 'NOT_FOUND':
      return 404;
    case 'INVALID_URL':
      return 422;
    case 'SSL_ERROR':
      return 502;
    case 'REFUSED':
    case 'DNS_ERROR':
    case 'NETWORK_ERROR':
      return 502;
    default:
      return 500;
  }
}
