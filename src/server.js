const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();

// Incrementar quando a API ganha recursos, para o front-end poder detetar
// um processo do servidor a correr com uma versão antiga do código.
const VERSAO_API = 2;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS agora');
    res.json({ status: 'ok', banco: rows[0].agora, api: VERSAO_API });
  } catch (err) {
    next(err);
  }
});

const STATUS_VALIDOS = ['ativas', 'arquivadas', 'todas'];

app.get('/api/materias', async (req, res, next) => {
  const status = req.query.status ?? 'ativas';

  if (!STATUS_VALIDOS.includes(status)) {
    return res.status(400).json({
      erro: `Parâmetro "status" inválido. Valores aceites: ${STATUS_VALIDOS.join(', ')}.`,
    });
  }

  const filtro = {
    ativas: 'WHERE ativa IS TRUE',
    arquivadas: 'WHERE ativa IS FALSE',
    todas: '',
  }[status];

  try {
    const { rows } = await pool.query(
      `SELECT id, nome, descricao, ativa, data_criacao
         FROM materias ${filtro}
        ORDER BY id`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.post('/api/materias', async (req, res, next) => {
  const { nome, descricao } = req.body || {};

  if (!nome) {
    return res.status(400).json({ erro: 'O campo "nome" é obrigatório.' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO materias (nome, descricao) VALUES ($1, $2) RETURNING id, nome, descricao, ativa, data_criacao',
      [nome, descricao ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

async function definirEstadoMateria(req, res, next) {
  const id = Number(req.params.id);
  const { ativa } = req.body || {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'O campo "id" deve ser um número inteiro maior que zero.' });
  }
  if (typeof ativa !== 'boolean') {
    return res.status(400).json({ erro: 'O campo "ativa" deve ser true ou false.' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE materias SET ativa = $1 WHERE id = $2 RETURNING id, nome, descricao, ativa, data_criacao',
      [ativa, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Matéria não encontrada.' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

app.patch('/api/materias/:id', definirEstadoMateria);
// Alias para hosts/proxies que não suportam o método PATCH.
app.post('/api/materias/:id/estado', definirEstadoMateria);

app.post('/api/sessoes', async (req, res, next) => {
  const { materia_id, duracao_minutos, data_estudo, anotacoes } = req.body || {};
  const minutos = Number(duracao_minutos);

  if (!materia_id) {
    return res.status(400).json({ erro: 'O campo "materia_id" é obrigatório.' });
  }
  if (!Number.isInteger(minutos) || minutos <= 0) {
    return res
      .status(400)
      .json({ erro: 'O campo "duracao_minutos" deve ser um número inteiro maior que zero.' });
  }
  if (data_estudo && Number.isNaN(Date.parse(data_estudo))) {
    return res.status(400).json({ erro: 'O campo "data_estudo" não é uma data válida.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO sessoes_estudo (materia_id, duracao_minutos, data_estudo, anotacoes)
       VALUES ($1, $2, COALESCE($3, current_timestamp), $4)
       RETURNING id, materia_id, duracao_minutos, data_estudo, anotacoes`,
      [materia_id, minutos, data_estudo || null, anotacoes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(404).json({ erro: 'Matéria não encontrada.' });
    }
    next(err);
  }
});

app.get('/api/sessoes', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.materia_id, m.nome AS materia, s.duracao_minutos,
              s.data_estudo, s.anotacoes
         FROM sessoes_estudo s
         JOIN materias m ON m.id = s.materia_id
        ORDER BY s.data_estudo DESC, s.id DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.get('/api/sessoes/resumo', async (req, res, next) => {
  try {
    const { rows: porMateria } = await pool.query(
      `SELECT m.id AS materia_id, m.nome AS materia, m.ativa,
              COUNT(s.id)::int AS total_sessoes,
              COALESCE(SUM(s.duracao_minutos), 0)::int AS total_minutos
         FROM materias m
         LEFT JOIN sessoes_estudo s ON s.materia_id = m.id
        GROUP BY m.id, m.nome, m.ativa
        ORDER BY total_minutos DESC, m.nome`
    );
    const total = porMateria.reduce((soma, m) => soma + m.total_minutos, 0);
    res.json({ total_minutos: total, por_materia: porMateria });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const PORT = Number(process.env.PORT) || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
  });
}

module.exports = app;
