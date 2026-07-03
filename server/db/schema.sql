-- Oracle PBCS Inspired Enterprise Relational Database Schema
-- SQL Engine Target: MySQL 8.0+ / MariaDB

CREATE TABLE IF NOT EXISTS departments (
  department_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  manager_id VARCHAR(50) NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  budget_id VARCHAR(50) PRIMARY KEY,
  department_id VARCHAR(50) NOT NULL,
  financial_year INT NOT NULL,
  january_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  february_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  march_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  april_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  may_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  june_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  july_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  august_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  september_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  october_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  november_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  december_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_budget_dept FOREIGN KEY (department_id) REFERENCES departments (department_id),
  CONSTRAINT uq_dept_year UNIQUE (department_id, financial_year)
);

CREATE TABLE IF NOT EXISTS workflow_logs (
  workflow_id VARCHAR(50) PRIMARY KEY,
  budget_id VARCHAR(50) NOT NULL,
  from_status VARCHAR(20) NOT NULL,
  to_status VARCHAR(20) NOT NULL,
  changed_by VARCHAR(100) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  comment VARCHAR(255) NULL,
  CONSTRAINT fk_workflow_budget FOREIGN KEY (budget_id) REFERENCES budgets (budget_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
  expense_id VARCHAR(50) PRIMARY KEY,
  department_id VARCHAR(50) NOT NULL,
  budget_id VARCHAR(50) NULL,
  amount DECIMAL(15, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  expense_date DATE NOT NULL,
  vendor_name VARCHAR(255) NULL,
  invoice_number VARCHAR(100) NULL,
  description TEXT NULL,
  invoice_url VARCHAR(255) NULL,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_expense_dept FOREIGN KEY (department_id) REFERENCES departments (department_id) ON DELETE CASCADE,
  CONSTRAINT fk_expense_budget FOREIGN KEY (budget_id) REFERENCES budgets (budget_id) ON DELETE SET NULL
);

