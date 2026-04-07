import { SyncClient } from '@/components/sync/sync-client';

export const metadata = {
  title: 'Đồng bộ dữ liệu - AuditForge',
  description: 'Thực thi đối soát dữ liệu giữa các hệ thống nguồn và hệ thống tham chiếu',
};

export default function SyncPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Đồng bộ thủ công</h1>
          <p className="text-gray-600">
            Chạy một phiên đối soát theo yêu cầu và ghi nhận sai lệch.
          </p>
        </div>

        {/* Main Content */}
        <SyncClient />

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="mb-2 font-semibold text-blue-900">Hướng dẫn nhanh</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Chạy Sync để tạo phiên đối soát mới.</li>
            <li>• Xử lý sai lệch mức cao trước.</li>
            <li>• Có thể đẩy cập nhật hợp lệ lên iTOP.</li>
            <li>• Phiên chạy được lưu trong lịch sử.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
