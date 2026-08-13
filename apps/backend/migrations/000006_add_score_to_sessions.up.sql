ALTER TABLE assessment_sessions
    ADD COLUMN score NUMERIC(5,2),
    ADD COLUMN passed BOOLEAN;