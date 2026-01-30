-- 002_branch_services.sql

ALTER TABLE services
ADD COLUMN promo_set VARCHAR(50) NULL AFTER category;

CREATE TABLE IF NOT EXISTS branch_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  service_id INT NOT NULL,
  price_override DECIMAL(10,2) NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_branch_services_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_branch_services_service FOREIGN KEY (service_id) REFERENCES services(id),
  UNIQUE KEY uniq_branch_service (branch_id, service_id)
);
