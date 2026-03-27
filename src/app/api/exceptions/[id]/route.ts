import { NextResponse } from 'next/server';
import { deleteException, updateException } from '@/lib/crud';
import { exceptionSchema } from '@/lib/validation';

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
    const parsed = exceptionSchema.partial().parse(body);
    const updated = await updateException(numericId, parsed);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Không thể cập nhật ngoại lệ.' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numericId = parseId(id);
    if (!numericId) {
      return NextResponse.json({ error: 'ID không hợp lệ.' }, { status: 400 });
    }

    await deleteException(numericId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Không thể xóa ngoại lệ.' }, { status: 400 });
  }
}
