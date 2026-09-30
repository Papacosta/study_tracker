CREATE TABLE IF NOT EXISTS materias (
  id            SERIAL PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  descricao     TEXT,
  ativa         BOOLEAN NOT NULL DEFAULT TRUE,
  data_criacao  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessoes_estudo (
  id                SERIAL PRIMARY KEY,
  materia_id        INTEGER NOT NULL REFERENCES materias (id) ON DELETE CASCADE,
  duracao_minutos   INTEGER NOT NULL CHECK (duracao_minutos > 0),
  data_estudo       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anotacoes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_materias_ativa ON materias (ativa);
CREATE INDEX IF NOT EXISTS idx_sessoes_materia ON sessoes_estudo (materia_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_data ON sessoes_estudo (data_estudo DESC);
