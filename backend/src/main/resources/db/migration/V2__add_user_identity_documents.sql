ALTER TABLE users ADD COLUMN document_type VARCHAR(30);
ALTER TABLE users ADD COLUMN document_number VARCHAR(30);
ALTER TABLE users ADD CONSTRAINT users_document_unique UNIQUE (document_type, document_number);
ALTER TABLE users ADD CONSTRAINT users_document_valid CHECK (
    (document_type IS NULL AND document_number IS NULL)
    OR (
        document_type IS NOT NULL AND document_number IS NOT NULL
        AND document_type IN ('DNI', 'FOREIGN_RESIDENT_CARD', 'PASSPORT')
        AND document_number ~ '^[A-Z0-9]{1,30}$'
        AND (document_type <> 'DNI' OR document_number ~ '^[0-9]{8}$')
    )
);
