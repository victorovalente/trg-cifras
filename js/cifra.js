/* TRG Cifras — cifra.js | parser e alinhamento de acordes */
function escaparHTML(valor) {
  return String(valor)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Devolve a linha de acordes + a linha de letra, mantendo a coluna de cada [acorde]. */
function renderizarLinha(texto, semitons, usarBemol, forcarGrafia = false) {
  const tokens = [];
  const regex = /\[([^\[\]\n]+)\]/g;
  let posicao = 0;
  let match;
  while ((match = regex.exec(texto)) !== null) {
    if (match.index > posicao) tokens.push({ texto: texto.slice(posicao, match.index) });
    const acorde = analisarAcorde(match[1]);
    if (acorde) tokens.push({ acorde: match[1] });
    else tokens.push({ texto: match[0] }); // colchete desconhecido: texto literal
    posicao = regex.lastIndex;
  }
  if (posicao < texto.length) tokens.push({ texto: texto.slice(posicao) });

  const temAcorde = tokens.some(t => Object.hasOwn(t, 'acorde'));
  if (!temAcorde) return `<div class="linha">${escaparHTML(texto)}</div>`;

  const caracteresTexto = [];
  const marcacoes = [];
  let ultimaExtremidade = -1;
  let coluna = 0;

  for (const token of tokens) {
    if (Object.hasOwn(token, 'texto')) {
      // Tabulação precisa ter largura previsível nas duas linhas.
      const trecho = token.texto.replace(/\t/g, '    ');
      const caracteres = Array.from(trecho);
      caracteresTexto.push(...caracteres);
      coluna += caracteres.length;
      continue;
    }

    const acorde = transporAcorde(token.acorde, semitons, usarBemol, forcarGrafia);
    // Abre espaço ANTES do próximo acorde se ele sobreporia o anterior.
    // A letra ganha o mesmo espaçamento: cada acorde continua na sua sílaba.
    const espacos = Math.max(0, ultimaExtremidade + 1 - coluna);
    if (espacos) {
      caracteresTexto.push(...Array(espacos).fill(' '));
      coluna += espacos;
    }
    marcacoes.push({ coluna, acorde });
    ultimaExtremidade = coluna + Array.from(acorde).length;
    // Um acorde não desloca a letra que vem logo depois do seu marcador.
  }

  const larguraAcordes = Math.max(0, ...marcacoes.map(m => m.coluna + Array.from(m.acorde).length));
  const caracteresAcordes = Array(larguraAcordes).fill(' ');
  for (const { coluna: inicio, acorde } of marcacoes) {
    Array.from(acorde).forEach((caractere, i) => { caracteresAcordes[inicio + i] = caractere; });
  }
  const linhaTexto = caracteresTexto.join('');
  const linhaAcordes = caracteresAcordes.join('');

  const linhas = [];
  if (linhaAcordes.trim()) {
    linhas.push(`<div class="linha linha-acordes">${escaparHTML(linhaAcordes.trimEnd())}</div>`);
  }
  if (linhaTexto.trim()) {
    linhas.push(`<div class="linha">${escaparHTML(linhaTexto.trimEnd())}</div>`);
  }
  return linhas.join('');
}

function renderizarCifra(texto, semitons, usarBemol, forcarGrafia = false) {
  return String(texto).replace(/\r\n?/g, '\n').split('\n').map(linha => {
    const limpa = linha.trim();
    if (!limpa) return '<div class="linha">&nbsp;</div>';
    // [Verso], [Coro], [Final] etc. Só é seção se não for um acorde válido.
    const secao = /^\[([^\[\]]+)\]$/.exec(limpa);
    if (secao && !analisarAcorde(secao[1])) {
      return `<div class="linha secao">${escaparHTML(limpa)}</div>`;
    }
    return renderizarLinha(linha, semitons, usarBemol, forcarGrafia);
  }).join('');
}
