-- Migration: Create clients table
-- Description: Stores client/customer information
-- Created: 2024-01-25

CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    company_name VARCHAR(255),
    tax_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    notes TEXT,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'new', 'overdue')),
    CONSTRAINT chk_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Create full-text search index on name and email (for search functionality)
CREATE INDEX IF NOT EXISTS idx_clients_search ON clients USING gin(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(email, '')));

-- Add foreign key constraint (will be added after users table exists)
-- ALTER TABLE clients ADD CONSTRAINT fk_clients_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON TABLE clients IS 'Stores client/customer information';
COMMENT ON COLUMN clients.status IS 'Client status: active, inactive, new, or overdue';
COMMENT ON COLUMN clients.user_id IS 'Owner/creator of this client record';


