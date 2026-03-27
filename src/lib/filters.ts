import type { DiscrepancyRecord, ExceptionRecord } from '@/lib/types';

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function isException(discrepancy: DiscrepancyRecord, exceptions: ExceptionRecord[]) {
  return exceptions.some((exception) => {
    return (
      exception.objectType === discrepancy.objectType &&
      normalize(exception.identifier) === normalize(discrepancy.identifier) &&
      normalize(exception.sourceSystem) === normalize(discrepancy.sourceSystem)
    );
  });
}
