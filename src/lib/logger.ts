type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown>;

function serializeMeta(meta?: LogMeta) {
  if (!meta) return '';
  try {
    return JSON.stringify(meta);
  } catch {
    return '{"meta":"unserializable"}';
  }
}

function write(level: LogLevel, message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  const payload = serializeMeta(meta);

  if (level === 'error') {
    console.error(line, payload);
    return;
  }

  if (level === 'warn') {
    console.warn(line, payload);
    return;
  }

  if (level === 'debug') {
    console.debug(line, payload);
    return;
  }

  console.info(line, payload);
}

export const logger = {
  debug(message: string, meta?: LogMeta) {
    write('debug', message, meta);
  },
  info(message: string, meta?: LogMeta) {
    write('info', message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    write('warn', message, meta);
  },
  error(message: string, meta?: LogMeta) {
    write('error', message, meta);
  },
};
