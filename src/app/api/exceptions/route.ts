import { NextResponse } from 'next/server';
import { createException, listExceptions } from '@/lib/crud';
import { exceptionSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await listExceptions(searchParams.get('search') ?? '');
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Chưa cấu hình kết nối MySQL hoặc truy vấn thất bại.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = exceptionSchema.parse(body);
    const created = await createException(parsed);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Không thể tạo ngoại lệ.' }, { status: 400 });
  }
}
