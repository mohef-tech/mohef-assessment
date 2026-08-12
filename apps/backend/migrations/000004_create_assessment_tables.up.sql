CREATE TABLE assessments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title             VARCHAR(255) NOT NULL,
    question_bank_id  UUID NOT NULL REFERENCES question_banks(id),
    question_count    INT NOT NULL,
    duration_minutes  INT NOT NULL,
    passing_grade     NUMERIC(5,2) NOT NULL,
    start_time        TIMESTAMPTZ NOT NULL,
    end_time          TIMESTAMPTZ NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assessment_participants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (assessment_id, user_id)
);

CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessment_participants_assessment_id ON assessment_participants(assessment_id);