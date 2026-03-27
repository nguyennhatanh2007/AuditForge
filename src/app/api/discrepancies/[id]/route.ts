import { NextResponse } from 'next/server';
import { deleteDiscrepancy, updateDiscrepancy } from '@/lib/crud';
import { z } from 'zod';

const discrepancySchema = z.object({
  objectType: z.enum(['vm', 'host', 'lun']).optional(),
  identifier: z.string().min(1).optional(),
  sourceSystem: z.string().min(1).optional(),
  type: z.enum(['missing_in_itop', 'extra_in_itop', 'field_mismatch']).optional(),
  field: z.string().optional().nullable(),
  itopValue: z.string().optional().nullable(),
  sourceValue: z.string().optional().nullable(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  summary: z.string().min(1).optional(),
});

function parseId(id: string) {
  const value = Number(id);
  return Number.isNaN(value) ? null : value;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numericId = parseId(id);
    if (!numericId) {
      return NextResponse.json({ error: 'ID không hợp lệ.' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = discrepancySchema.parse(body);
    const updated = await updateDiscrepancy(numericId, parsed);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Không thể cập nhật discrepancy.' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numericId = parseId(id);
    if (!numericId) {
      return NextResponse.json({ error: 'ID không hợp lệ.' }, { status: 400 });
    }

    await deleteDiscrepancy(numericId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Không thể xóa discrepancy.' }, { status: 400 });
  }
}
