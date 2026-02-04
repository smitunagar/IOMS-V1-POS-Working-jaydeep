-- Audit Log Table Schema
-- This table tracks all changes and operations performed in the system

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- User whose data has changed (can be NULL for system operations)
    session_id UUID, -- Session that performed the change
    change_by UUID NOT NULL, -- User who performed the action
    operation VARCHAR(20) NOT NULL, -- Type of operation (CREATE, UPDATE, DELETE, etc.)
    table_name VARCHAR(100) NOT NULL, -- Table that was modified
    field_name VARCHAR(100), -- Specific field that changed (NULL for full record operations)
    old_value TEXT, -- Previous value (NULL for CREATE operations)
    new_value TEXT, -- New value (NULL for DELETE operations)
    ip_address INET, -- IP address of the client
    user_agent TEXT, -- User agent string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT audit_log_operation_check 
        CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT')),
    
    CONSTRAINT audit_log_user_id_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT audit_log_session_id_fk
        FOREIGN KEY (session_id)
        REFERENCES sessions(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT audit_log_change_by_fk
        FOREIGN KEY (change_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_session_id ON audit_log(session_id);
CREATE INDEX idx_audit_log_change_by ON audit_log(change_by);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_ip_address ON audit_log(ip_address);

-- Composite indexes for common queries
CREATE INDEX idx_audit_log_user_operation ON audit_log(user_id, operation);
CREATE INDEX idx_audit_log_table_operation ON audit_log(table_name, operation);
CREATE INDEX idx_audit_log_created_at_operation ON audit_log(created_at, operation);

-- Add comments
COMMENT ON TABLE audit_log IS 'Tracks all changes and operations performed in the system for audit and compliance purposes';
COMMENT ON COLUMN audit_log.user_id IS 'User whose data was changed (NULL for system operations)';
COMMENT ON COLUMN audit_log.session_id IS 'Session that performed the change';
COMMENT ON COLUMN audit_log.change_by IS 'User who performed the action';
COMMENT ON COLUMN audit_log.operation IS 'Type of operation performed';
COMMENT ON COLUMN audit_log.table_name IS 'Database table that was modified';
COMMENT ON COLUMN audit_log.field_name IS 'Specific field that changed (NULL for full record operations)';
COMMENT ON COLUMN audit_log.old_value IS 'Previous value before change';
COMMENT ON COLUMN audit_log.new_value IS 'New value after change';
COMMENT ON COLUMN audit_log.ip_address IS 'IP address of the client that made the change';
COMMENT ON COLUMN audit_log.user_agent IS 'User agent string of the client';







