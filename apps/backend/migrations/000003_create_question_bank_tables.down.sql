ALTER TABLE questions DROP CONSTRAINT IF EXISTS fk_questions_current_version;
DROP TABLE IF EXISTS question_versions;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS question_banks;