const formMateria = document.getElementById('form-materia');
const listaMaterias = document.getElementById('lista-materias');
const materiasVazio = document.getElementById('vazio');
const mensagem = document.getElementById('mensagem');
const botaoSubmeter = document.getElementById('btn-submeter');
const botaoAtualizar = document.getElementById('btn-atualizar');

const formSessao = document.getElementById('form-sessao');
const seletorMateria = document.getElementById('sessao-materia');
const listaSessoes = document.getElementById('lista-sessoes');
const sessoesVazio = document.getElementById('sessoes-vazio');
const mensagemSessao = document.getElementById('mensagem-sessao');
const botaoSessao = document.getElementById('btn-sessao');
const botaoAtualizarSessoes = document.getElementById('btn-atualizar-sessoes');

const totalGeral = document.getElementById('total-geral');
const totalPorMateria = document.getElementById('total-por-materia');

function mostrarMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = 'mensagem' + (tipo ? ' ' + tipo : '');
}

function formatarData(valor) {
  return new Date(valor).toLocaleString('pt-PT');
}

function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return resto + ' min';
  if (resto === 0) return horas + ' h';
  return horas + ' h ' + resto + ' min';
}

async function api(caminho, opcoes) {
  const resposta = await fetch(caminho, opcoes);
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(corpo.erro || 'Erro ' + resposta.status);
  }
  return corpo;
}

function desenharMaterias(materias) {
  listaMaterias.replaceChildren();

  for (const materia of materias) {
    const item = document.createElement('li');

    const nome = document.createElement('div');
    nome.className = 'nome';
    nome.textContent = materia.nome;
    item.appendChild(nome);

    if (materia.descricao) {
      const descricao = document.createElement('div');
      descricao.className = 'descricao';
      descricao.textContent = materia.descricao;
      item.appendChild(descricao);
    }

    const data = document.createElement('div');
    data.className = 'data';
    data.textContent = 'Criada em ' + formatarData(materia.data_criacao);
    item.appendChild(data);

    listaMaterias.appendChild(item);
  }

  materiasVazio.hidden = materias.length > 0;
}

function desenharSeletorMaterias(materias) {
  const selecionada = seletorMateria.value;
  seletorMateria.replaceChildren();

  if (materias.length === 0) {
    const opcao = document.createElement('option');
    opcao.textContent = 'Crie primeiro uma matéria';
    opcao.value = '';
    seletorMateria.appendChild(opcao);
    seletorMateria.disabled = true;
    return;
  }

  seletorMateria.disabled = false;
  seletorMateria.appendChild(new Option('Seleciona uma matéria...', ''));

  for (const materia of materias) {
    seletorMateria.appendChild(new Option(materia.nome, String(materia.id)));
  }

  if (materias.some((m) => String(m.id) === selecionada)) {
    seletorMateria.value = selecionada;
  }
}

function desenharSessoes(sessoes) {
  listaSessoes.replaceChildren();

  for (const sessao of sessoes) {
    const item = document.createElement('li');

    const topo = document.createElement('div');
    topo.className = 'card-topo';

    const nome = document.createElement('span');
    nome.className = 'nome';
    nome.textContent = sessao.materia;
    topo.appendChild(nome);

    const duracao = document.createElement('span');
    duracao.className = 'sessao-duracao';
    duracao.textContent = formatarDuracao(sessao.duracao_minutos);
    topo.appendChild(duracao);

    item.appendChild(topo);

    const data = document.createElement('div');
    data.className = 'data';
    data.textContent = formatarData(sessao.data_estudo);
    item.appendChild(data);

    if (sessao.anotacoes) {
      const anotacoes = document.createElement('div');
      anotacoes.className = 'descricao';
      anotacoes.textContent = sessao.anotacoes;
      item.appendChild(anotacoes);
    }

    listaSessoes.appendChild(item);
  }

  sessoesVazio.hidden = sessoes.length > 0;
}

function desenharResumo(resumo) {
  totalGeral.replaceChildren();

  const valor = document.createElement('span');
  valor.textContent = formatarDuracao(resumo.total_minutos);
  totalGeral.appendChild(valor);

  const unidade = document.createElement('small');
  unidade.textContent = resumo.total_minutos === 1 ? '1 minuto' : 'em total';
  totalGeral.appendChild(' ');
  totalGeral.appendChild(unidade);

  totalPorMateria.replaceChildren();

  const comEstudo = resumo.por_materia.filter((m) => m.total_minutos > 0);
  const maximo = comEstudo.reduce((maior, m) => Math.max(maior, m.total_minutos), 0);

  for (const materia of resumo.por_materia) {
    const item = document.createElement('li');

    const topo = document.createElement('div');
    topo.className = 'barra-topo';

    const nome = document.createElement('span');
    nome.textContent = materia.nome;
    topo.appendChild(nome);

    const valor = document.createElement('span');
    valor.textContent = materia.total_minutos + ' min';
    topo.appendChild(valor);

    item.appendChild(topo);

    const barra = document.createElement('div');
    barra.className = 'barra';

    const preenchimento = document.createElement('span');
    preenchimento.style.width = (maximo ? (materia.total_minutos / maximo) * 100 : 0) + '%';
    barra.appendChild(preenchimento);

    item.appendChild(barra);
    totalPorMateria.appendChild(item);
  }
}

async function carregarMaterias() {
  botaoAtualizar.disabled = true;
  try {
    const materias = await api('/api/materias');
    desenharMaterias(materias);
    desenharSeletorMaterias(materias);
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  } finally {
    botaoAtualizar.disabled = false;
  }
}

async function carregarSessoes() {
  botaoAtualizarSessoes.disabled = true;
  try {
    const [sessoes, resumo] = await Promise.all([
      api('/api/sessoes'),
      api('/api/sessoes/resumo'),
    ]);
    desenharSessoes(sessoes);
    desenharResumo(resumo);
  } catch (erro) {
    mostrarMensagem(mensagemSessao, erro.message, 'erro');
  } finally {
    botaoAtualizarSessoes.disabled = false;
  }
}

formMateria.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mostrarMensagem(mensagem, '');

  const dados = {
    nome: formMateria.nome.value.trim(),
    descricao: formMateria.descricao.value.trim() || null,
  };

  botaoSubmeter.disabled = true;
  try {
    const criada = await api('/api/materias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    formMateria.reset();
    formMateria.nome.focus();
    mostrarMensagem(mensagem, 'Matéria "' + criada.nome + '" adicionada.', 'sucesso');
    await carregarMaterias();
    await carregarSessoes();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  } finally {
    botaoSubmeter.disabled = false;
  }
});

formSessao.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mostrarMensagem(mensagemSessao, '');

  const dados = {
    materia_id: Number(seletorMateria.value),
    duracao_minutos: Number(formSessao.duracao.value),
    anotacoes: formSessao.anotacoes.value.trim() || null,
  };

  botaoSessao.disabled = true;
  try {
    await api('/api/sessoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    formSessao.reset();
    mostrarMensagem(
      mensagemSessao,
      'Sessão de ' + formatarDuracao(dados.duracao_minutos) + ' registada.',
      'sucesso'
    );
    await carregarSessoes();
  } catch (erro) {
    mostrarMensagem(mensagemSessao, erro.message, 'erro');
  } finally {
    botaoSessao.disabled = false;
  }
});

botaoAtualizar.addEventListener('click', carregarMaterias);
botaoAtualizarSessoes.addEventListener('click', carregarSessoes);

carregarMaterias();
carregarSessoes();
