-- 001_init.sql

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(50) NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500) NULL,
  requires_consultation TINYINT NOT NULL DEFAULT 0,
  deposit_required TINYINT NOT NULL DEFAULT 0,
  deposit_amount DECIMAL(10,2) NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  branch_id INT NOT NULL,
  service_id INT NOT NULL,

  -- customer's preferred slot (request)
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,

  -- final scheduled slot (set when confirmed)
  confirmed_start DATETIME NULL,
  confirmed_end DATETIME NULL,

  status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',

  -- snapshot (so later edits to service don't rewrite history)
  service_name_snapshot VARCHAR(255) NOT NULL,
  service_price_snapshot DECIMAL(10,2) NOT NULL,
  service_duration_snapshot INT NOT NULL,

  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_bookings_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE IF NOT EXISTS booking_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  admin_id INT NOT NULL,
  channel VARCHAR(30) NOT NULL, -- consultation | phone | email | etc
  notes TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_interactions_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_interactions_admin FOREIGN KEY (admin_id) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  old_status VARCHAR(30) NOT NULL,
  new_status VARCHAR(30) NOT NULL,
  changed_by_admin_id INT NULL,
  reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_status_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_status_admin FOREIGN KEY (changed_by_admin_id) REFERENCES admins(id)
);
