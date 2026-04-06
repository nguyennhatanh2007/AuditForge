# AuditForge PHP Version

Phiên bản này chuyển kiến trúc dự án sang PHP để chạy trực tiếp với Apache (`/var/www/html`).

## 1. Cấu trúc

- `public/index.php`: front controller
- `public/.htaccess`: rewrite toàn bộ route về `index.php`
- `src/Core`: router, request/response, env, db, logger, crypto
- `src/Controllers`: API endpoints
- `src/Repositories`: truy vấn MySQL
- `src/Services`: gọi API ngoài và business logic chính

## 2. Cấu hình Apache

Ví dụ VirtualHost:

```apache
<VirtualHost *:80>
    ServerName auditforge.local
    DocumentRoot /var/www/html/AuditForge/php/public

    <Directory /var/www/html/AuditForge/php/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Đảm bảo bật module rewrite:

```bash
a2enmod rewrite
systemctl restart apache2
```

## 3. Biến môi trường

Dùng file `.env.local` ở root project hiện tại, hoặc export trực tiếp:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `SYNC_ENCRYPTION_KEY`

## 4. Tạo schema DB

Chạy script SQL:

```bash
mysql -u root -p < php/database/schema.sql
```

## 5. Endpoint chính

- `GET /api/health`
- `GET|POST /api/configurations`
- `PUT|DELETE /api/configurations/{id}`
- `POST /api/configurations/{id}/test`
- `GET /api/storage`
- `GET /api/inventory`
- `POST /api/sync-live`
- `GET /api/discrepancies`
- `POST /api/discrepancies/{id}/exception`
- `GET|POST /api/exceptions`
- `PUT|DELETE /api/exceptions/{id}`
