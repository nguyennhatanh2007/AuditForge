# 🔄 Sync Thủ Công - Hướng Dẫn Sử Dụng

## Tính Năng

Bạn có thể **sync thủ công** dữ liệu giữa **iTOP CMDB** (hệ thống tham chiếu chính) và **ESXi** (hệ thống nguồn) bất kỳ lúc nào.

### 🎯 Mục Đích

- So sánh tất cả các máy ảo, máy chủ vật lý và lưu trữ
- Tìm các vấn đề không đồng bộ
- Xác định những đối tượng bị thiếu hoặc thừa
- Đánh dấu những thay đổi cần chú ý

---

## 📍 Cách Truy Cập

1. Mở ứng dụng AuditForge tại http://localhost:3000
2. Trong menu bên trái, chọn **🔄 Sync Thủ Công**
3. Hoặc truy cập trực tiếp: http://localhost:3000/sync

---

## 🚀 Cách Sử Dụng

### Bước 1: Nhấn Nút Sync
```
Nhấp vào nút "🔄 Sync Thủ Công" để bắt đầu quá trình đồng bộ
```

### Bước 2: Chờ Kết Quả
- **Trạng thái**: Hiển thị "⏳ Đang Sync..." trong khi quá trình đang chạy
- **Thời gian**: Thường mất 30-90 giây tùy vào số lượng đối tượng

### Bước 3: Xem Kết Quả
Kết quả hiển thị dưới dạng:

#### 📊 Thống Kê Tóm Tắt
- **Hệ Thống**: Số lượng hệ thống được kiểm tra
- **VMs trong iTOP**: Tổng số máy ảo trong CMDB
- **VMs trong ESXi**: Tổng số máy ảo trong ESXi
- **Vấn Đề Tìm Thấy**: Có bao nhiêu vấn đề được phát hiện

#### 🔍 Chi Tiết Vấn Đề
Mỗi vấn đề hiển thị:
- **Tên đối tượng**: Tên máy ảo/máy chủ
- **Mức độ nghiêm trọng**: CRITICAL 🔴 | MEDIUM 🟡 | LOW 🟢
- **Loại vấn đề**: 
  - ❌ **Missing in iTOP** - Tồn tại trong ESXi nhưng không có trong iTOP
  - ⚠️ **Extra in iTOP** - Tồn tại trong iTOP nhưng không có trong ESXi
  - 🔄 **Field Mismatch** - Cùng một đối tượng nhưng có giá trị khác nhau
- **Mô tả chi tiết**

---

## 📋 Ví Dụ Kết Quả

```
✅ Không có vấn đề! Tất cả hệ thống đồng bộ hoàn hảo 🎉
```

Hoặc

```
🔴 CRITICAL - Field Mismatch - db-server-01
   → Memory mismatch for VM "db-server-01": 
     iTOP=16384MB, ESXi=16768MB

🟡 MEDIUM - Missing in iTOP - new-vm-02
   → VM "new-vm-02" exists in ESXi but not in iTOP CMDB
   
🟡 MEDIUM - Extra in iTOP - legacy-server
   → VM "legacy-server" exists in iTOP but not in ESXi 
     (may have been deleted)
```

---

## 🎨 Mã Màu

| Màu | Mức Độ | Ý Nghĩa |
|-----|--------|--------|
| 🔴 Đỏ | CRITICAL | Lỗi trường - cần xử lý ngay |
| 🟡 Vàng | MEDIUM | Dữ liệu thiếu/thừa - cần kiểm tra |
| 🟢 Xanh | LOW | Thông tin tham khảo |

---

## 🔗 API Endpoints

Nếu bạn muốn integrate vào hệ thống khác:

### Real Sync (Kết nối đến hệ thống thực)
```bash
POST /api/sync-live
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "systems": ["itop", "vcenter"],
    "discrepancies": [
      {
        "objectType": "vm",
        "identifier": "web-server-01",
        "type": "field_mismatch",
        "severity": "high",
        "summary": "..."
      }
    ],
    "vmComparison": {
      "itopVMs": 5,
      "esxiVMs": 5
    },
    "timestamp": "2026-04-02T05:26:41.596Z"
  }
}
```

### Demo Sync (Với dữ liệu giả)
```bash
POST /api/sync-demo
```

---

## 💡 Mẹo Sử Dụng

1. **Định kỳ đồng bộ**: Chạy sync thủ công hằng ngày để phát hiện vấn đề sớm
2. **Sau khi thay đổi**: Nếu bạn thêm/xóa được VM, chạy sync ngay để cập nhật
3. **Kiểm tra Discrepancies**: 
   - Đi đến trang **Sai lệch dữ liệu** để xem lịch sử
   - Đi đến trang **Ngoại lệ** để bỏ qua những vấn đề đã biết

---

## ⚙️ Cấu Hình Hệ Thống

Để sửa đổi cấu hình kết nối:

1. Truy cập **Cấu hình kết nối** từ menu
2. Chỉnh sửa URL, username, password cho iTOP hoặc ESXi
3. Nhấn **Test Connection** để kiểm tra
4. Lưu lại và chạy sync

---

## 📊 Tích Hợp với các Tính Năng Khác

### Lịch Sử Đồng Bộ
- Mỗi lần sync được ghi lại trong **Lịch sử đồng bộ**
- Xem lại những thay đổi trước đây

### Ngoại Lệ (Exceptions)
- Nếu phát hiện một vấn đề "bình thường", bạn có thể bỏ qua nó
- Những vấn đề được bỏ qua sẽ không hiển thị lần sync tiếp theo

### Báo Cáo
- Sinh báo cáo tóm tắt về tình trạng đồng bộ
- Xuất dữ liệu cho các cuộc họp hoặc audit

---

## 🆘 Xử Lý Sự Cố

### Lỗi: "Không thể kết nối đến hệ thống"
- Kiểm tra cấu hình kơ nối
- Đảm bảo iTOP/ESXi đang hoạt động
- Kiểm tra firewall cho phép kết nối

### Lỗi: "Xác thực thất bại"
- Kiểm tra username/password
- Đảm bảo tài khoản có quyền truy cập

### Vấn đề: Kết quả bị trống
- Nếu cả iTOP và ESXi đều trống → OK, không có vấn đề
- Nếu chỉ một bên trống → Kiểm tra cấu hình kết nối

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra trang **Cấu hình kết nối**
2. Xem logs trong terminal dev server
3. Thử **Test Connection** để xác định lỗi
