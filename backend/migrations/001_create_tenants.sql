CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  subscription_plan VARCHAR(20) DEFAULT 'free',
  max_users INT DEFAULT 5,
  max_projects INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
