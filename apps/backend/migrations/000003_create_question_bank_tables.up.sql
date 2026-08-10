CREATE TABLE question_banks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_bank_id    UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
    current_version_id  UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_versions (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id            UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    version_number         INT NOT NULL,
    question_text          TEXT NOT NULL,
    options                JSONB NOT NULL,
    correct_option_index   INT NOT NULL,
    weight                 NUMERIC(5,2) NOT NULL DEFAULT 1,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (question_id, version_number)
);

ALTER TABLE questions
    ADD CONSTRAINT fk_questions_current_version
    FOREIGN KEY (current_version_id) REFERENCES question_versions(id);

CREATE INDEX idx_questions_bank_id ON questions(question_bank_id);
CREATE INDEX idx_question_versions_question_id ON question_versions(question_id);