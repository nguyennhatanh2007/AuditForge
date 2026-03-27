import { NextResponse } from 'next/server';
import { markDiscrepancyAsException } from '@/lib/crud';
import { z } from 'zod';

const exceptionMarkSchema = z.object({
  reason: z.string().min(3),
  createdBy: z.string().min(1),
});

function parseId(id: string) {
  const value = Number(id);
  return Number.isNaN(value) ? null : value;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numericId = parseId(id);
    if (!numericId) {
      return NextResponse.json({ error: 'ID không hợp lệ.' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = exceptionMarkSchema.parse(body);
    const created = await markDiscrepancyAsException(numericId, parsed.reason, parsed.createdBy);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Không thể đánh dấu ngoại lệ.' }, { status: 400 });
  }
}
