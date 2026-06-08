-- V1__Initial_notification_schema.sql

CREATE SCHEMA IF NOT EXISTS public;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Recipient
    recipient_user_id VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(320) NOT NULL,
    recipient_name VARCHAR(200),

    -- Classification
    type VARCHAR(50) NOT NULL CHECK (type IN (
                                     'USER_REGISTERED', 'PASSWORD_CHANGED', 'EMAIL_VERIFIED', 'ACCOUNT_LOCKED',
                                     'SYSTEM_INVITATION', 'REPOSITORY_INVITATION',
                                     'BLOG_NEW_COMMENT', 'BLOG_COMMENT_REPLY', 'BLOG_POST_PUBLISHED',
                                     'CUSTOM'
                                             )),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'RETRYING', 'SKIPPED')),

    -- Content
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,

    -- Reference context
    reference_id VARCHAR(100),
    reference_type VARCHAR(50),

    -- Reliability
    idempotency_key VARCHAR(200) NOT NULL UNIQUE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    failure_reason TEXT,
    sent_at TIMESTAMP,

    -- Metadata
    metadata TEXT,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries)
    );

-- Indexes for efficient querying
CREATE INDEX idx_notif_user_id ON notifications(recipient_user_id);
CREATE INDEX idx_notif_type ON notifications(type);
CREATE INDEX idx_notif_status ON notifications(status);
CREATE INDEX idx_notif_created ON notifications(created_at);
CREATE INDEX idx_notif_idempotency ON notifications(idempotency_key);
CREATE INDEX idx_notif_reference ON notifications(reference_id, reference_type);

-- For range queries on status + creation date (failed notifications retry job)
CREATE INDEX idx_notif_status_created ON notifications(status, created_at DESC);

-- For cleanup queries (old sent notifications)
CREATE INDEX idx_notif_sent_at ON notifications(sent_at DESC) WHERE status = 'SENT';