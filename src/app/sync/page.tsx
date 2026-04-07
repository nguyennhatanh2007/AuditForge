import { SyncClient } from '@/components/sync/sync-client';

export const metadata = {
  title: 'Sync Hệ Thống - AuditForge',
  description: 'Đồng bộ dữ liệu giữa iTOP và ESXi',
};

export default function SyncPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔄 Sync Thủ Công</h1>
          <p className="text-gray-600">
            Đồng bộ dữ liệu giữa iTOP CMDB (hệ thống tham chiếu) và ESXi (hệ thống nguồn).
            Hệ thống sẽ so sánh tất cả VMs, Servers và Storage để tìm các vấn đề.
          </p>
        </div>

        {/* Main Content */}
        <SyncClient />

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📖 Hướng Dẫn</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Nhấn <strong>Sync Thủ Công</strong> để bắt đầu so sánh các hệ thống</li>
            <li>• <strong>Vấn đề CRITICAL 🔴</strong>: Lỗi trường (Field Mismatch) - cần chú ý ngay</li>
            <li>• <strong>Vấn đề MEDIUM 🟡</strong>: Dữ liệu thiếu hoặc thừa - cần kiểm tra</li>
            <li>• <strong>Vấn đề LOW 🟢</strong>: Thông tin tham khảo</li>
            <li>• Kết quả được lưu để theo dõi lịch sử đồng bộ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
