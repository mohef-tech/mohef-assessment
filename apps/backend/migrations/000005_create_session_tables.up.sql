CREATE TABLE assessment_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status        VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ NOT NULL,
    submitted_at  TIMESTAMPTZ,
    UNIQUE (assessment_id, user_id)
);

CREATE TABLE session_questions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id           UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    question_id          UUID NOT NULL REFERENCES questions(id),
    question_version_id  UUID NOT NULL REFERENCES question_versions(id),
    display_order        INT NOT NULL,
    option_order         JSONB NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_id, question_id)
);

CREATE TABLE session_answers (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id               UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    question_id               UUID NOT NULL REFERENCES questions(id),
    selected_display_index   INT,
    answered_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_id, question_id)
);

CREATE INDEX idx_session_questions_session_id ON session_questions(session_id);
CREATE INDEX idx_session_answers_session_id ON session_answers(session_id);