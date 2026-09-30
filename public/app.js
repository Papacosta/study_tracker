const formMateria = document.getElementById('form-materia');
const avisoApi = document.getElementById('aviso-api');
const listaMaterias = document.getElementById('lista-materias');
const materiasVazio = document.getElementById('vazio');
const mensagem = document.getElementById('mensagem');
const botaoSubmeter = document.getElementById('btn-submeter');
const botaoAtualizar = document.getElementById('btn-atualizar');
const filtroStatus = document.getElementById('filtro-status');

const formSessao = document.getElementById('form-sessao');
const seletorMateria = document.getElementById('sessao-materia');
const listaSessoes = document.getElementById('lista-sessoes');
const sessoesVazio = document.getElementById('sessoes-vazio');
const mensagemSessao = document.getElementById('mensagem-sessao');
const botaoSessao = document.getElementById('btn-sessao');
const botaoAtualizarSessoes = document.getElementById('btn-atualizar-sessoes');

const totalGeral = document.getElementById('total-geral');
const totalPorMateria = document.getElementById('total-por-materia');

let filtroMaterias = filtroStatus.value;

// Deve coincidir com VERSAO_API em src/server.js.
const VERSAO_API_ESPERADA = 2;

const AVISO_API_DESATUALIZADA =
  'A API que está a responder está desatualizada, por isso os filtros e o arquivamento ' +
  'não funcionam. Reinicia o servidor com Ctrl+C e <code>npm start</code>.';

const MENSAGENS_VAZIO = {
  ativas: 'Nenhuma matéria ativa neste momento.',
  arquivadas: 'Nenhuma matéria arquivada.',
  todas: 'Nenhuma matéria cadastrada ainda.',
};

function mostrarMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = 'mensagem' + (tipo ? ' ' + tipo : '');
}

function limparMensagem(elemento) {
  mostrarMensagem(elemento, '');
}

function mostrarAvisoApi(texto) {
  avisoApi.replaceChildren();

  const partes = texto.split('<code>');
  avisoApi.appendChild(document.createTextNode(partes[0]));

  if (partes.length > 1) {
    const [codigo, resto] = partes[1].split('</code>');
    const elemento = document.createElement('code');
    elemento.textContent = codigo;
    avisoApi.appendChild(elemento);
    avisoApi.appendChild(document.createTextNode(resto));
  }

  avisoApi.hidden = false;
}

function esconderAvisoApi() {
  avisoApi.hidden = true;
  avisoApi.textContent = '';
}

async function verificarVersaoApi() {
  try {
    const saude = await api('/health');
    if (typeof saude.api !== 'number' || saude.api < VERSAO_API_ESPERADA) {
      mostrarAvisoApi(AVISO_API_DESATUALIZADA);
    } else {
      esconderAvisoApi();
    }
  } catch (erro) {
    mostrarAvisoApi('Não foi possível contactar o servidor: ' + erro.message);
  }
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
    const erro = new Error(corpo.erro || 'Erro ' + resposta.status);
    erro.status = resposta.status;
    erro.estruturado = Boolean(corpo.erro);
    throw erro;
  }
  return corpo;
}

function desenharMaterias(materias) {
  listaMaterias.replaceChildren();

  for (const materia of materias) {
    const item = document.createElement('li');
    if (!materia.ativa) {
      item.className = 'arquivada';
    }

    const topo = document.createElement('div');
    topo.className = 'materia-topo';

    const nome = document.createElement('div');
    nome.className = 'nome';
    nome.appendChild(document.createTextNode(materia.nome));

    const etiqueta = document.createElement('span');
    etiqueta.className = 'etiqueta' + (materia.ativa ? ' ativa' : '');
    etiqueta.textContent = materia.ativa ? 'Ativa' : 'Arquivada';
    nome.appendChild(etiqueta);

    const accoes = document.createElement('div');
    accoes.className = 'materia-acoes';

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'secundario';
    botao.dataset.id = String(materia.id);
    botao.dataset.ativa = String(materia.ativa);
    botao.textContent = materia.ativa ? 'Arquivar' : 'Reativar';
    accoes.appendChild(botao);

    topo.appendChild(nome);
    topo.appendChild(accoes);
    item.appendChild(topo);

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

  materiasVazio.textContent = MENSAGENS_VAZIO[filtroMaterias] ?? MENSAGENS_VAZIO.todas;
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
    nome.textContent = sessao.nome;
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
  totalGeral.appendChild(document.createTextNode(' '));
  totalGeral.appendChild(unidade);

  totalPorMateria.replaceChildren();

  const comEstudo = resumo.por_materia.filter((m) => m.total_minutos > 0);
  const maximo = comEstudo.reduce((maior, m) => Math.max(maior, m.total_minutos), 0);

  for (const materia of resumo.por_materia) {
    const item = document.createElement('li');

    const topo = document.createElement('div');
    topo.className = 'barra-topo';

    const nome = document.createElement('span');
    nome.appendChild(document.createTextNode(materia.nome));

    if (materia.ativa === false) {
      const etiqueta = document.createElement('span');
      etiqueta.className = 'etiqueta';
      etiqueta.textContent = 'arquivada';
      nome.appendChild(etiqueta);
    }

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

async function carregarMaterias(alvo = mensagem) {
  botaoAtualizar.disabled = true;
  try {
    const [materias, ativas] = await Promise.all([
      api('/api/materias?status=' + encodeURIComponent(filtroMaterias)),
      api('/api/materias?status=ativas'),
    ]);
    desenharMaterias(materias);
    desenharSeletorMaterias(ativas);

    // Resposta sem a coluna "ativa" significa que a API em execução é antiga.
    if (materias.some((m) => !('ativa' in m)) || ativas.some((m) => !('ativa' in m))) {
      mostrarAvisoApi(AVISO_API_DESATUALIZADA);
    }
  } catch (erro) {
    mostrarMensagem(alvo, erro.message, 'erro');
  } finally {
    botaoAtualizar.disabled = false;
  }
}

async function definirEstadoMateria(id, ativa) {
  const opcoes = {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ativa }),
  };

  try {
    return await api('/api/materias/' + id, { ...opcoes, method: 'PATCH' });
  } catch (erro) {
    // 404/405 sem corpo JSON significa que a rota PATCH não existe neste
    // servidor (processo antigo) ou o método é bloqueado pelo proxy.
    const rotaDesconhecida = erro.status === 405 || (erro.status === 404 && !erro.estruturado);
    if (!rotaDesconhecida) {
      throw erro;
    }
    return api('/api/materias/' + id + '/estado', { ...opcoes, method: 'POST' });
  }
}

async function alternarEstadoMateria(id, ativa) {
  try {
    const materia = await definirEstadoMateria(id, ativa);

    mostrarMensagem(
      mensagem,
      ativa
        ? 'Matéria "' + materia.nome + '" reativada.'
        : 'Matéria "' + materia.nome + '" arquivada. O histórico de sessões foi mantido.',
      'sucesso'
    );
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
    return;
  }

  await carregarMaterias(mensagemSessao);
  await carregarSessoes();
}

async function carregarSessoes(alvo = mensagemSessao) {
  botaoAtualizarSessoes.disabled = true;
  try {
    const [sessoes, resumo] = await Promise.all([
      api('/api/sessoes'),
      api('/api/sessoes/resumo'),
    ]);
    desenharSessoes(sessoes);
    desenharResumo(resumo);
  } catch (erro) {
    mostrarMensagem(alvo, erro.message, 'erro');
  } finally {
    botaoAtualizarSessoes.disabled = false;
  }
}

formMateria.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparMensagem(mensagem);
  limparMensagem(mensagemSessao);

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
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
    return;
  } finally {
    botaoSubmeter.disabled = false;
  }

  await carregarMaterias(mensagemSessao);
  await carregarSessoes();
});

formSessao.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparMensagem(mensagemSessao);
  limparMensagem(mensagem);

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
  } catch (erro) {
    mostrarMensagem(mensagemSessao, erro.message, 'erro');
    return;
  } finally {
    botaoSessao.disabled = false;
  }

  await carregarSessoes(mensagem);
});

listaMaterias.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('button[data-id]');
  if (!botao) {
    return;
  }

  botao.disabled = true;
  await alternarEstadoMateria(botao.dataset.id, botao.dataset.ativa !== 'true');
});

filtroStatus.addEventListener('change', () => {
  filtroMaterias = filtroStatus.value;
  carregarMaterias();
});

botaoAtualizar.addEventListener('click', () => carregarMaterias());
botaoAtualizarSessoes.addEventListener('click', () => carregarSessoes());

verificarVersaoApi();
carregarMaterias();
carregarSessoes();
