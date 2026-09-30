# Study Tracker

Aplicação web simples para registar **matérias de estudo** e **sessões de estudo**, com o total de tempo estudado por matéria e no total.

Backend em Node.js + Express com PostgreSQL, frontend em HTML/CSS/JavaScript puro (sem build step).

## Funcionalidades

- Criar matérias (nome obrigatório, descrição opcional).
- Registar sessões de estudo por matéria, com duração em minutos, data e anotações.
- Resumo com o **total de minutos estudados** e barra de progresso por matéria.
- Listagem de matérias e de sessões (sessões ordenadas da mais recente para a mais antiga).
- Endpoint de health check (`/health`) que confirma a ligação à base de dados.

## Stack

| Camada    | Tecnologia                       |
| --------- | -------------------------------- |
| Servidor  | Node.js + Express 5              |
| Base de dados | PostgreSQL com `pg` (node-postgres) |
| Frontend  | HTML5, CSS3 e JavaScript (vanilla) |

## Requisitos

- [Node.js](https://nodejs.org) 18 ou superior
- [PostgreSQL](https://www.postgresql.org/download/) 12 ou superior, a correr localmente

## Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/Papacosta/study_tracker.git
cd study_tracker
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar a base de dados

```bash
createdb study_tracker
psql -d study_tracker -f sql/schema.sql
```

> Se preferires, cria a base de dados pela interface gráfica (pgAdmin, DBeaver, etc.) e executa o conteúdo de `sql/schema.sql` no editor de SQL.

### 4. Configurar as variáveis de ambiente

Copia o ficheiro de exemplo:

```bash
cp .env.example .env
```

Depois preenche o utilizador e a palavra-passe:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=study_tracker
PGUSER=o_teu_utilizador
PGPASSWORD=a_tua_palavra_passe
PORT=3000
```

> O ficheiro `.env` está no `.gitignore` e nunca deve ser versionado.

### 5. Arrancar o servidor

```bash
npm start
```

A aplicação fica disponível em **http://localhost:3000**.

Confirma que está tudo a funcionar:

```bash
curl http://localhost:3000/health
# {"status":"ok","banco":"2026-01-01T12:00:00.000Z"}
```

## Estrutura do projeto

```
study_tracker/
├── public/            # Frontend servido pelo Express
│   ├── index.html     # Estrutura da página e formulários
│   ├── styles.css     # Estilos
│   └── app.js         # Lógica da interface e chamadas à API
├── sql/
│   └── schema.sql     # Definição das tabelas
├── src/
│   ├── server.js      # Aplicação Express e rotas da API
│   └── db.js          # Pool de ligações ao PostgreSQL
├── .env.example
├── package.json
└── README.md
```

## API

Base: `http://localhost:3000`

| Método | Rota                | Descrição                                              | Corpo (JSON)                                                     |
| ------ | ------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| GET    | `/health`           | Estado do servidor e da ligação à base de dados        | —                                                                  |
| GET    | `/api/materias`     | Lista de matérias por ordem de criação                 | —                                                                  |
| POST   | `/api/materias`     | Cria uma matéria                                       | `{ "nome": "Cálculo", "descricao": "Derivadas" }`                 |
| GET    | `/api/sessoes`      | Lista de sessões com o nome da matéria                 | —                                                                  |
| POST   | `/api/sessoes`      | Regista uma sessão de estudo                            | `{ "materia_id": 1, "duracao_minutos": 45, "anotacoes": "..." }`  |
| GET    | `/api/sessoes/resumo` | Total de minutos no geral e por matéria               | —                                                                  |

### Exemplos

```bash
curl -X POST http://localhost:3000/api/materias \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Cálculo","descricao":"Derivadas"}'

curl -X POST http://localhost:3000/api/sessoes \
  -H 'Content-Type: application/json' \
  -d '{"materia_id":1,"duracao_minutos":90,"anotacoes":"Exercícios 1 a 5"}'

curl http://localhost:3000/api/sessoes/resumo
```

### Erros

As respostas de erro seguem sempre o formato `{ "erro": "mensagem" }`:

- `400` — campos em falta ou inválidos (por exemplo, `nome` vazio ou `duracao_minutos` menor que 1)
- `404` — a matéria indicada em `materia_id` não existe
- `500` — erro interno (detalhes no terminal)

## Base de dados

```sql
CREATE TABLE materias (
  id            SERIAL PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  descricao     TEXT,
  data_criacao  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessoes_estudo (
  id                SERIAL PRIMARY KEY,
  materia_id        INTEGER NOT NULL REFERENCES materias (id) ON DELETE CASCADE,
  duracao_minutos   INTEGER NOT NULL CHECK (duracao_minutos > 0),
  data_estudo       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anotacoes         TEXT
);

CREATE INDEX idx_sessoes_materia ON sessoes_estudo (materia_id);
CREATE INDEX idx_sessoes_data ON sessoes_estudo (data_estudo DESC);
```

## Scripts

| Comando       | Descrição                                  |
| ------------- | ------------------------------------------ |
| `npm start`   | Arranca o servidor                         |
| `npm install` | Instala as dependências                   |

## Notas

- O projeto **não carrega o `.env` automaticamente** — as variáveis têm de ser definidas no terminal antes de arrancar
  (por exemplo, `export $(grep -v '^#' .env | xargs)`), ou a base de dados é assumida a partir dos valores por omissão (`localhost:5432/study_tracker` com o utilizador atual do sistema).
- A API não tem autenticação: só usar em ambiente local.
