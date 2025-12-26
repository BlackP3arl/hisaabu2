-- Migration: Create share_links table
-- Description: Stores secure share links for quotations and invoices
-- Created: 2024-01-25

CREATE TABLE IF NOT EXISTS share_links (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    document_type VARCHAR(20) NOT NULL,
    document_id INTEGER NOT NULL,
    password_hash VARCHAR(255),
    expires_at DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMP,
    CONSTRAINT chk_document_type CHECK (document_type IN ('quotation', 'invoice')),
    CONSTRAINT chk_view_count CHECK (view_count >= 0)
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_document ON share_links(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_share_links_is_active ON share_links(is_active);

-- Add comments
COMMENT ON TABLE share_links IS 'Stores secure share links for quotations and invoices';
COMMENT ON COLUMN share_links.token IS 'Unique token for the share link (UUID v4)';
COMMENT ON COLUMN share_links.document_type IS 'Document type: quotation or invoice';
COMMENT ON COLUMN share_links.password_hash IS 'Bcrypt hashed password (nullable for passwordless links)';
COMMENT ON COLUMN share_links.is_active IS 'Whether the link is active (can be deactivated without deletion)';



