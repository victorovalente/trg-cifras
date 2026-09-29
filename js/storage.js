/* TRG Cifras — storage.js | armazenamento local */
const CHAVE_STORAGE = 'trg_cifras_v1';

function carregarCifras() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_STORAGE) || '[]');
    return Array.isArray(dados) ? dados.filter(c =>
      c && typeof c.id === 'string' && typeof c.titulo === 'string' &&
      typeof c.corpo === 'string' && typeof c.tom === 'string'
    ) : [];
  } catch (err) {
    console.warn('Falha ao carregar cifras:', err);
    return [];
  }
}

function salvarCifras(cifras) {
  // O navegador pode recusar a escrita (armazenamento cheio/bloqueado).
  // Deixamos o erro chegar à interface; nunca anunciamos sucesso sem salvar.
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(cifras));
}

function gerarId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
