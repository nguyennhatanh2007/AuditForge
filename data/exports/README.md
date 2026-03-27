# Cấu trúc thư mục export

AuditForge đọc dữ liệu nguồn từ thư mục dùng chung này, không lưu raw data vào MySQL.

Mỗi hệ thống là một thư mục con:

- `data/exports/itop/`
- `data/exports/vcenter1/`
- `data/exports/unity600/`
- `data/exports/pure1/`
- `data/exports/alletra1/`

Trong mỗi thư mục, đặt file `json` hoặc `csv` theo object type:

- `vm.json` hoặc `vm.csv`
- `host.json` hoặc `host.csv`
- `lun.json` hoặc `lun.csv`

File JSON nên là mảng object.
File CSV nên có header ở dòng đầu.
