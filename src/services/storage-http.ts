import axios, { AxiosInstance } from 'axios';
import https from 'node:https';

type PageMode = 'none' | 'token' | 'index';

type FetchPagedListOptions = {
  endpoint: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  timeoutMs?: number;
  mode?: PageMode;
  tokenParam?: string;
  tokenFields?: string[];
  pageParam?: string;
  pageSizeParam?: string;
  pageSize?: number;
  maxPages?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeObjectList(list: unknown[]) {
  return list
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      if (isRecord(item.content)) {
        return item.content;
      }

      if (isRecord(item.attributes)) {
        return item.attributes;
      }

      return item;
    })
    .filter((item): item is Record<string, unknown> => item !== null);
}

export function extractRecords(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return normalizeObjectList(payload);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const directArrayKeys = [
    'data',
    'items',
    'entries',
    'result_list',
    'records',
    'result',
    'objects',
    'members',
    'content',
  ];

  for (const key of directArrayKeys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return normalizeObjectList(value);
    }
  }

  const embedded = payload._embedded;
  if (isRecord(embedded)) {
    const embeddedArray = Object.values(embedded).find((value) => Array.isArray(value));
    if (Array.isArray(embeddedArray)) {
      return normalizeObjectList(embeddedArray);
    }
  }

  const nestedData = payload.data;
  if (isRecord(nestedData)) {
    const nestedArray = Object.values(nestedData).find((value) => Array.isArray(value));
    if (Array.isArray(nestedArray)) {
      return normalizeObjectList(nestedArray);
    }
  }

  return [];
}

function extractNextToken(payload: unknown, candidateFields: string[]) {
  if (!isRecord(payload)) {
    return null;
  }

  for (const field of candidateFields) {
    const value = payload[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function hasMoreFlag(payload: unknown) {
  if (!isRecord(payload)) {
    return false;
  }

  const candidateFields = ['more_items_remaining', 'has_more', 'has_more_items', 'more', 'remaining'];
  return candidateFields.some((field) => payload[field] === true);
}

function createPageSignature(records: Record<string, unknown>[]) {
  if (records.length === 0) {
    return 'empty';
  }

  const first = records[0] ?? {};
  const last = records[records.length - 1] ?? {};
  const firstId = String(first.id ?? first.name ?? first.key ?? first.wwn ?? 'na');
  const lastId = String(last.id ?? last.name ?? last.key ?? last.wwn ?? 'na');
  return `${records.length}:${firstId}:${lastId}`;
}

export function createStorageClient(options: {
  baseURL: string;
  username?: string;
  password?: string;
  tokenHeader?: string;
}) {
  const { baseURL, username, password, tokenHeader = 'X-Auth-Token' } = options;
  const trimmedUser = username?.trim();
  const trimmedSecret = password?.trim();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (!trimmedUser && trimmedSecret) {
    headers[tokenHeader] = trimmedSecret;
    headers.Authorization = `Bearer ${trimmedSecret}`;
  }

  const client = axios.create({
    baseURL,
    headers,
    auth: trimmedUser && trimmedSecret ? { username: trimmedUser, password: trimmedSecret } : undefined,
    timeout: 30000,
    validateStatus: (status) => status < 500,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  });

  return client;
}

export async function fetchPagedList(client: AxiosInstance, options: FetchPagedListOptions) {
  const {
    endpoint,
    params,
    timeoutMs = 30000,
    mode = 'none',
    tokenParam = 'continuation_token',
    tokenFields = ['continuation_token', 'next_token', 'nextToken', 'bookmark', 'next'],
    pageParam = 'page',
    pageSizeParam = 'page_size',
    pageSize = 200,
    maxPages = 20,
  } = options;

  const result: Record<string, unknown>[] = [];
  const seenPageSignatures = new Set<string>();

  let page = 1;
  let token: string | null = null;

  for (let count = 0; count < maxPages; count += 1) {
    const requestParams: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== null && value !== undefined) {
        requestParams[key] = value;
      }
    }

    if (mode === 'token' && token) {
      requestParams[tokenParam] = token;
    }

    if (mode === 'index') {
      requestParams[pageParam] = page;
      if (!Object.prototype.hasOwnProperty.call(requestParams, pageSizeParam)) {
        requestParams[pageSizeParam] = pageSize;
      }
    }

    const response = await client.get(endpoint, { params: requestParams, timeout: timeoutMs });

    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status} for ${endpoint}`);
    }

    const records = extractRecords(response.data);
    const signature = createPageSignature(records);
    if (seenPageSignatures.has(signature)) {
      break;
    }
    seenPageSignatures.add(signature);

    result.push(...records);

    if (mode === 'none') {
      break;
    }

    if (mode === 'token') {
      const next = extractNextToken(response.data, tokenFields);
      if (!next || next === token) {
        break;
      }
      token = next;
      if (!hasMoreFlag(response.data) && records.length === 0) {
        break;
      }
      continue;
    }

    if (mode === 'index') {
      if (records.length === 0) {
        break;
      }

      if (records.length < pageSize) {
        break;
      }

      page += 1;
      continue;
    }
  }

  return result;
}
