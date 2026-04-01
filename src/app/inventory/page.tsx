import { InvenuoryClient } from '@/components/inventory/inventory-client';

export default function InventoryPage() {
  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold">Kho dữ liệu hệ thống</h1>
        <p className="mt-2 text-sm text-mutedFg">Xem và quản lý dữ liệu từ các hệ thống kết nối.</p>
      </div>
      <InvenuoryClient />
    </div>
  );
}
