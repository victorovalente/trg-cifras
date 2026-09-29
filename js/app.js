/* TRG Cifras — app.js | interface, CRUD e importação protegida */
let cifras = [];
let editandoId = null;
let visualizandoId = null;
let semitons = 0;
let grafiaForcada = null; // null: automática; true: bemol; false: sustenido
let pendentesImportacao = null;
let importando = false;
const $ = id => document.getElementById(id);

function mostrarTela(id) {
  ['telaLista', 'telaEditor', 'telaVer'].forEach(t => $(t).classList.toggle('oculto', t !== id));
  $('btnVoltar').classList.toggle('oculto', id === 'telaLista');
  $('btnNova').classList.toggle('oculto', id !== 'telaLista');
}

function voltarParaLista() {
  AutoScroll.parar();
  visualizandoId = null;
  $('tituloHeader').textContent = 'TRG Cifras';
  renderLista($('busca').value);
  mostrarTela('telaLista');
}

function renderLista(filtro = '') {
  const lista = $('lista');
  lista.replaceChildren();
  const pesquisa = filtro.trim().toLocaleLowerCase('pt-BR');
  const filtradas = cifras.filter(c =>
    c.titulo.toLocaleLowerCase('pt-BR').includes(pesquisa) ||
    (c.artista || '').toLocaleLowerCase('pt-BR').includes(pesquisa)
  );
  $('vazio').style.display = filtradas.length ? 'none' : 'block';
  for (const c of filtradas) {
    const item = document.createElement('button');
    item.className = 'item';
    item.type = 'button';
    const info = document.createElement('div');
    const titulo = document.createElement('h3');
    const artista = document.createElement('p');
    const tom = document.createElement('span');
    titulo.textContent = c.titulo;
    artista.textContent = c.artista || 'Sem artista';
    tom.className = 'tom-badge';
    tom.textContent = c.tom;
    info.append(titulo, artista);
    item.append(info, tom);
    item.onclick = () => abrirVisualizador(c.id);
    lista.append(item);
  }
}

function abrirEditor(id = null) {
  AutoScroll.parar();
  editandoId = id;
  const c = id ? cifras.find(x => x.id === id) : null;
  if (id && !c) { voltarParaLista(); return; }
  $('inTitulo').value = c ? c.titulo : '';
  $('inArtista').value = c ? c.artista || '' : '';
  $('inTom').value = c && TONS_DISPONIVEIS.includes(c.tom) ? c.tom : 'G';
  $('inCifra').value = c ? c.corpo : '';
  $('tituloHeader').textContent = c ? 'Editar cifra' : 'Nova cifra';
  mostrarTela('telaEditor');
  $('inTitulo').focus();
}

function tentarSalvar(novas) {
  try {
    salvarCifras(novas);
    cifras = novas;
    return true;
  } catch (err) {
    console.error('Erro ao salvar cifras:', err);
    alert('Não foi possível salvar no navegador. Verifique o espaço disponível e exporte um backup, se necessário.');
    return false;
  }
}

// ===== SALVAR CIFRA NA NUVEM =====

async function salvarCifra() {
  const titulo = $('inTitulo').value.trim();
  const artista = $('inArtista').value.trim();
  const tom = $('inTom').value;
  const corpo = $('inCifra').value;

  if (!titulo || !corpo.trim()) {
    alert('Preencha o título e a cifra.');
    return;
  }

  const existente = editandoId
    ? cifras.find(c => c.id === editandoId)
    : null;

  if (editandoId && !existente) {
    alert('Cifra não encontrada.');
    return;
  }

  const cifra = {
    id: existente ? existente.id : gerarId(),
    titulo,
    artista,
    tom,
    corpo
  };

  try {
    if (!window.salvarCifraNaNuvem) {
      throw new Error('Firebase não está conectado.');
    }

    await window.salvarCifraNaNuvem(cifra);

    const novas = existente
      ? cifras.map(c => c.id === cifra.id ? cifra : c)
      : [...cifras, cifra];

    if (tentarSalvar(novas)) {
      voltarParaLista();
      alert('Música salva na nuvem!');
    }

  } catch (erro) {
    console.error(erro);
    alert('Não foi possível salvar na nuvem. Verifique seu login e a conexão.');
  }
}

function abrirVisualizador(id) {
  const c = cifras.find(x => x.id === id);
  if (!c) { voltarParaLista(); return; }
  AutoScroll.parar();
  visualizandoId = id;
  semitons = 0;
  grafiaForcada = null;
  $('vTitulo').textContent = c.titulo;
  $('vArtista').textContent = c.artista || '';
  atualizarVisualizador();
  const container = $('vCifra');
  container.scrollTop = 0;
  AutoScroll.setContainer(container);
  mostrarTela('telaVer');
}

function atualizarVisualizador() {
  const c = cifras.find(x => x.id === visualizandoId);
  if (!c) return;
  const destino = obterTomDestino(c.tom, semitons, grafiaForcada);
  const sinal = semitons > 0 ? `+${semitons}` : semitons;
  $('vTom').textContent = semitons === 0 ? destino.tom : `${destino.tom} (${sinal})`;
  const container = $('vCifra');
  const scrollAnterior = container.scrollTop;
  container.innerHTML = renderizarCifra(c.corpo, semitons, destino.usarBemol, grafiaForcada !== null);
  container.scrollTop = scrollAnterior;
  $('grafiaLabel').textContent = destino.usarBemol ? '♭' : '♯';
  $('btnGrafia').classList.toggle('ativo', grafiaForcada !== null);
  $('btnGrafia').title = grafiaForcada === null
    ? `Grafia automática do tom ${destino.tom}; clique para trocar`
    : `Grafia manual em ${grafiaForcada ? 'bemóis' : 'sustenidos'}; clique para voltar ao automático`;
  $('btnGrafia').setAttribute('aria-label', $('btnGrafia').title);
}

function exportarBackup() {
  if (cifras.length === 0) { alert('Não tem nenhuma cifra pra exportar ainda.'); return; }
  Backup.exportar(cifras);
}

async function tratarImportacao(evento) {
  const file = evento.target.files[0];
  if (!file) return;
  evento.target.value = '';

  try {
    if (typeof window.buscarCifrasNaNuvem !== 'function') {
      throw new Error('Firebase ainda não está conectado.');
    }

    const resultado = await Backup.lerArquivo(file);
    // Não confiar em uma lista que pode estar desatualizada no navegador.
    const atuais = await window.buscarCifrasNaNuvem();
    pendentesImportacao = resultado.cifras;
    const simulacao = Backup.mesclar(atuais, pendentesImportacao, 'mesclar');
    const novas = simulacao.length - atuais.length;

    $('resumoImportacao').textContent =
      `${pendentesImportacao.length} cifra(s) válida(s) no arquivo; ` +
      `${novas} nova(s) para adicionar; ` +
      `${pendentesImportacao.length - novas} duplicada(s)` +
      (resultado.ignoradas ? `; ${resultado.ignoradas} inválida(s) ignorada(s).` : '.') +
      ' As músicas já cadastradas não serão alteradas.';

    $('confirmarSubstituicao').classList.add('oculto');
    $('escolhasImportacao').classList.remove('oculto');
    $('dialogImportacao').showModal();
  } catch (erro) {
    pendentesImportacao = null;
    console.error(erro);
    alert('Não foi possível preparar a importação: ' + erro.message);
  }
}

function fecharImportacao() {
  $('dialogImportacao').close();
  pendentesImportacao = null;
}

async function aplicarImportacao() {
  if (!pendentesImportacao || importando) return;

  const botao = $('btnMesclar');
  importando = true;
  botao.disabled = true;
  $('btnCancelarImportacao').disabled = true;
  botao.textContent = 'Importando...';

  try {
    if (
      typeof window.buscarCifrasNaNuvem !== 'function' ||
      typeof window.importarCifrasNaNuvem !== 'function'
    ) {
      throw new Error('Firebase ainda não está conectado.');
    }

    // Reconsultar antes de salvar para respeitar cadastros de outras janelas.
    const atuais = await window.buscarCifrasNaNuvem();
    const mescladas = Backup.mesclar(atuais, pendentesImportacao, 'mesclar');
    const idsAtuais = new Set(atuais.map(c => c.id));
    const adicionar = mescladas.filter(c => !idsAtuais.has(c.id));

    if (adicionar.length > 0) {
      await window.importarCifrasNaNuvem(adicionar);
    }

    importando = false;
    fecharImportacao();
    voltarParaLista();
    alert(adicionar.length > 0
      ? `${adicionar.length} música(s) adicionada(s) à nuvem! As existentes foram preservadas.`
      : 'Nenhuma música adicionada: todas já existiam na nuvem.');
  } catch (erro) {
    console.error(erro);
    alert('Não foi possível importar: ' + erro.message);
  } finally {
    importando = false;
    botao.disabled = false;
    $('btnCancelarImportacao').disabled = false;
    botao.textContent = 'Importar na nuvem';
  }
}

function ligarEventos() {
  $('btnNova').onclick = () => abrirEditor();
  $('btnVoltar').onclick = voltarParaLista;
  $('btnCancelar').onclick = voltarParaLista;
  $('btnSalvar').onclick = salvarCifra;
  $('btnMais').onclick = () => { semitons = Math.min(semitons + 1, 11); atualizarVisualizador(); };
  $('btnMenos').onclick = () => { semitons = Math.max(semitons - 1, -11); atualizarVisualizador(); };
  $('btnResetar').onclick = () => { semitons = 0; grafiaForcada = null; atualizarVisualizador(); };
  $('btnGrafia').onclick = () => {
    const atual = obterTomDestino(cifras.find(x => x.id === visualizandoId).tom, semitons, grafiaForcada);
    grafiaForcada = grafiaForcada === null ? !atual.usarBemol : null;
    atualizarVisualizador();
  };
  $('btnEditar').onclick = () => abrirEditor(visualizandoId);
  // ===== EXCLUIR CIFRA DA NUVEM =====

$('btnExcluir').onclick = async () => {

  const id = visualizandoId;

  if (!id || !confirm(
    'Excluir esta música do repertório de TODOS os usuários?'
  )) return;

  if (typeof window.excluirCifraDaNuvem !== 'function') {
    alert('Firebase ainda não está conectado.');
    return;
  }

  const botao = $('btnExcluir');
  botao.disabled = true;

  try {
    await window.excluirCifraDaNuvem(id);

    if (visualizandoId === id) {
      voltarParaLista();
    }

  } catch (erro) {
    console.error(erro);
    alert('Não foi possível excluir. Verifique sua conexão e seu login.');

  } finally {
    botao.disabled = false;
  }

};
  $('btnAutoScroll').onclick = () => AutoScroll.alternar($('vCifra'));
  $('rangeVelocidade').oninput = e => {
    const v = Number(e.target.value);
    AutoScroll.setVelocidade(v);
    $('velocidadeValor').textContent = v;
  };
  $('btnTopo').onclick = () => AutoScroll.resetar();
  $('btnExportar').onclick = exportarBackup;
  $('btnImportar').onclick = () => $('inputImportar').click();
  $('inputImportar').onchange = tratarImportacao;
  $('busca').oninput = e => renderLista(e.target.value);

   $('btnMesclar').textContent = 'Importar na nuvem';
   $('btnMesclar').onclick = aplicarImportacao;
   // Substituição desativada: o importador não apaga músicas existentes.
   $('btnSubstituir').style.display = 'none';
   $('btnCancelarImportacao').onclick = () => {
     if (!importando) fecharImportacao();
   };
   $('dialogImportacao').addEventListener('cancel', e => {
     if (importando) e.preventDefault();
   });

  $('dialogImportacao').addEventListener('close', () => { pendentesImportacao = null; });

  document.addEventListener('keydown', e => {
    if ($('telaVer').classList.contains('oculto') || e.code !== 'Space' || e.repeat) return;
    const alvo = e.target;
    if (alvo.closest('button, input, textarea, select, dialog, [contenteditable="true"]')) return;
    e.preventDefault();
    AutoScroll.alternar($('vCifra'));
  });
}

(function init() {
  $('inTom').replaceChildren(...TONS_DISPONIVEIS.map(n => {
    const option = document.createElement('option');
    option.value = n;
    option.textContent = n;
    return option;
  }));
  $('inTom').value = 'G';
  try {
    // Semeia exemplo só no primeiro acesso. Não recria a música se o usuário excluir tudo.
    if (localStorage.getItem(CHAVE_STORAGE) === null) {
      salvarCifras([{
        id: gerarId(), titulo: 'Bondade de Deus', artista: 'Isaías Saad', tom: 'G',
        corpo: `[Intro]
[G] [D/F#] [Em] [C]

[Verso]
[G]Eu amo a Tua voz
[D/F#]Que me chama
[Em]E me faz ouvir
[C]Tua bondade

[Refrão]
[G]Bondade de Deus me seguirá
[D/F#]Todos os dias da minha vida
[Em]E eu vou morar na casa do Senhor
[C]Para sempre`
      }]);
    }
  } catch (err) {
    console.warn('Armazenamento indisponível:', err);
  }
  cifras = carregarCifras();
  ligarEventos();
  renderLista();
})();
// ===== SINCRONIZAÇÃO COM A NUVEM =====

window.receberCifrasDaNuvem = function(lista) {

  if (!Array.isArray(lista)) return;

  // Atualizar o repertório
  cifras = lista;

  // Atualizar a lista na tela
  renderLista($('busca').value);

  // Atualizar a música aberta, se necessário
  if (visualizandoId) {

    const musica = cifras.find(
      c => c.id === visualizandoId
    );

    if (musica) {
      $('vTitulo').textContent = musica.titulo;
      $('vArtista').textContent = musica.artista || '';
      atualizarVisualizador();
    } else {
      voltarParaLista();
    }
  }
};