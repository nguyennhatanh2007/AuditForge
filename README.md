# AuditForge (PHP Version)

Repository branch `php-version` da duoc don de phuc vu runtime PHP/Apache.

## Muc tieu

- Chay du an bang PHP tren Apache (`/var/www/html`).
- Su dung MySQL lam datastore chinh.
- Loai bo phan Node.js/Next.js khong can thiet.

## Thu muc chinh

- `php/public`: Document root (front controller + .htaccess)
- `php/src`: Core, Controllers, Services, Repositories
- `php/database/schema.sql`: SQL schema khoi tao
- `php/README.md`: Huong dan trien khai chi tiet

## Cai dat nhanh

1. Tro document root Apache ve `php/public`.
2. Bat module rewrite (`mod_rewrite`).
3. Cau hinh bien moi truong DB (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) va `SYNC_ENCRYPTION_KEY`.
4. Chay SQL trong `php/database/schema.sql`.

## API chinh

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
