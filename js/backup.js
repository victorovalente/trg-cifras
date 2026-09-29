/* TRG Cifras — backup.js | validação, importação e deduplicação */
const Backup = (() => {
  function exportar(cifras) {
    const dados = { app: 'TRG Cifras', versao: 2, exportadoEm: new Date().toISOString(), total: cifras.length, cifras };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const data = new Date();
    const nome = `trg-cifras-backup-${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}.json`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function lerArquivo(file) {
    return new Promise((resolve, reject) => {
      if (file.size > 20 * 1024 * 1024) {
        reject(new Error('Backup grande demais (máximo de 20 MB).'));
        return;
      }
      const leitor = new FileReader();
      leitor.onload = e => {
        try {
          const conteudo = JSON.parse(e.target.result);
          let lista;
          if (Array.isArray(conteudo)) lista = conteudo;
          else if (conteudo && typeof conteudo === 'object') {
            if (Array.isArray(conteudo.cifras)) lista = conteudo.cifras;
            else {
              const chaveArr = Object.keys(conteudo).find(k => Array.isArray(conteudo[k]));
              if (chaveArr) lista = conteudo[chaveArr];
            }
          }
          if (!Array.isArray(lista)) throw new Error('Formato de backup não reconhecido.');
          const validas = lista.filter(c =>
            c && typeof c === 'object' && typeof c.titulo === 'string' &&
            c.titulo.trim() && typeof c.corpo === 'string' && c.corpo.trim()
          );
          if (validas.length === 0) throw new Error('Nenhuma cifra válida encontrada no arquivo.');
          resolve({ cifras: validas, ignoradas: lista.length - validas.length });
        } catch (err) {
          reject(new Error(err instanceof SyntaxError ? 'Arquivo JSON inválido.' : err.message));
        }
      };
      leitor.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
      leitor.readAsText(file);
    });
  }

  function normalizar(c) {
    return {
      id: typeof c.id === 'string' && c.id ? c.id : gerarId(),
      titulo: c.titulo.trim(),
      artista: typeof c.artista === 'string' ? c.artista.trim() : '',
      tom: typeof c.tom === 'string' && notaParaIndice(c.tom.replace(/m$/, '')) !== undefined ? c.tom : 'C',
      corpo: c.corpo
    };
  }

  function chave(c) {
    const limpa = valor => String(valor || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
    return JSON.stringify([limpa(c.titulo), limpa(c.artista)]);
  }

  /** Nunca sobrescreve uma cifra no modo mesclar. Remove duplicadas também dentro do arquivo. */
  function mesclar(atuais, novas, modo = 'mesclar') {
    const resultado = modo === 'substituir' ? [] : [...atuais];
    const chaves = new Set(resultado.map(chave));
    const ids = new Set(resultado.map(c => c.id));
    for (const original of novas) {
      const c = normalizar(original);
      const identificador = chave(c);
      if (chaves.has(identificador)) continue;
      if (ids.has(c.id)) c.id = gerarId();
      while (ids.has(c.id)) c.id = gerarId();
      resultado.push(c);
      chaves.add(identificador);
      ids.add(c.id);
    }
    return resultado;
  }
  return { exportar, lerArquivo, normalizar, mesclar };
})();
