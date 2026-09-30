-- Migração para bases de dados criadas antes do suporte a semestres.
-- Arquivar uma matéria (ao fim do semestre) define ativa = false e mantém
-- o histórico de sessoes_estudo intacto.

ALTER TABLE materias ADD COLUMN IF NOT EXISTS ativa BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE materias SET ativa = TRUE WHERE ativa IS NULL;

CREATE INDEX IF NOT EXISTS idx_materias_ativa ON materias (ativa);
