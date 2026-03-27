import path from 'node:path';

export function getExportRootDir() {
  return process.env.AUDIT_EXPORT_DIR || path.join(process.cwd(), 'data', 'exports');
}

export function getSystemExportDir(systemName: string) {
  return path.join(getExportRootDir(), systemName);
}
