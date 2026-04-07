CREATE TABLE IF NOT EXISTS system_configs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  system_type ENUM('itop', 'vcenter', 'unity', 'pure', 'alletra') NOT NULL,
  name VARCHAR(191) NOT NULL,
  url VARCHAR(500) NOT NULL,
  username VARCHAR(191) NULL,
  encrypted_password TEXT NULL,
  port INT NULL,
  api_path VARCHAR(500) NULL,
  last_checked_at DATETIME NULL,
  last_test_status VARCHAR(32) NULL,
  last_test_code VARCHAR(64) NULL,
  last_test_message TEXT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  started_at DATETIME NOT NULL,
  finished_at DATETIME NULL,
  status ENUM('running', 'success', 'failed', 'partial') NOT NULL,
  total_sources INT NOT NULL DEFAULT 0,
  succeeded_sources INT NOT NULL DEFAULT 0,
  discrepancies INT NOT NULL DEFAULT 0,
  note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discrepancies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sync_job_id INT UNSIGNED NULL,
  object_type VARCHAR(32) NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  source_system VARCHAR(191) NOT NULL,
  discrepancy_type ENUM('missing_in_itop', 'extra_in_itop', 'field_mismatch') NOT NULL,
  field_name VARCHAR(191) NULL,
  itop_value TEXT NULL,
  source_value TEXT NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  summary TEXT NOT NULL,
  is_exception TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_discrepancies_object_identifier (object_type, identifier),
  INDEX idx_discrepancies_source_identifier (source_system, identifier),
  CONSTRAINT fk_discrepancies_sync_job FOREIGN KEY (sync_job_id) REFERENCES sync_jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exceptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  object_type ENUM('vm', 'host', 'lun') NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  source_system VARCHAR(191) NOT NULL,
  reason TEXT NOT NULL,
  created_by VARCHAR(191) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX exceptions_lookup_idx (object_type, identifier, source_system)
);
