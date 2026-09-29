/* Execute com: node tests/testes-app.js | testes da interface sem navegador */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Elemento {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.style = {};
    this.children = [];
    this.scrollTop = 0;
    this.scrollHeight = 1200;
    this.clientHeight = 300;
    this.disabled = false;
    this.dataset = {};
    this.eventos = {};
    this.aberto = false;
    const classes = new Set();
    this.classList = {
      add: c => classes.add(c), remove: c => classes.delete(c),
      contains: c => classes.has(c),
      toggle: (c, force) => {
        const ativo = force === undefined ? !classes.has(c) : force;
        if (ativo) classes.add(c); else classes.delete(c);
      }
    };
  }
  replaceChildren(...els) { this.children = els; }
  append(...els) { this.children.push(...els); }
  addEventListener(evento, fn) { this.eventos[evento] = fn; }
  focus() {}
  setAttribute(chave, valor) { this[chave] = valor; }
  showModal() { this.aberto = true; }
  close() { this.aberto = false; this.eventos.close?.(); }
  closest() { return null; }
}

const elementos = new Map();
const obter = id => {
  if (!elementos.has(id)) elementos.set(id, new Elemento());
  return elementos.get(id);
};
const dados = new Map();
const localStorage = {
  getItem: chave => dados.has(chave) ? dados.get(chave) : null,
  setItem: (chave, valor) => { dados.set(chave, valor); }
};
const alertas = [];
const document = {
  getElementById: obter,
  createElement: tag => new Elemento(tag),
  addEventListener() {},
  body: new Elemento('body')
};
const contexto = vm.createContext({
  document, localStorage, console, alert: s => alertas.push(s),
  confirm: () => true, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  setTimeout, clearTimeout, Date, Math
});
for (const nome of ['notas.js','storage.js','cifra.js','autoscroll.js','backup.js','app.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', nome), 'utf8'), contexto, { filename: nome });
}
const run = s => vm.runInContext(s, contexto);
const guardadas = () => JSON.parse(dados.get('trg_cifras_v1'));

assert.equal(guardadas().length, 1, 'primeira abertura cria apenas um exemplo');
assert.equal(guardadas()[0].titulo, 'Bondade de Deus');
assert.equal(obter('lista').children.length, 1);
console.log('✓ Inicialização e lista');

obter('btnNova').onclick();
obter('inTitulo').value = 'Minha música';
obter('inArtista').value = 'Meu grupo';
obter('inCifra').value = '[Coro]\n[G]letra';
obter('btnSalvar').onclick();
assert.equal(guardadas().length, 2);
console.log('✓ Cadastro e persistência');

const novaId = guardadas()[1].id;
run(`abrirVisualizador(${JSON.stringify(novaId)})`);
obter('btnMais').onclick();
assert.equal(obter('vTom').textContent, 'Ab (+1)');
assert.ok(obter('vCifra').innerHTML.includes('secao'));
obter('btnGrafia').onclick();
assert.equal(obter('vTom').textContent, 'G# (+1)');
console.log('✓ Visualizador, seções e transposição');

// Clicar em cancelar a importação não altera nem a memória nem o localStorage.
const antes = dados.get('trg_cifras_v1');
run("pendentesImportacao = [{id:'importada',titulo:'Importada',artista:'',tom:'D',corpo:'x'}]");
obter('dialogImportacao').showModal();
obter('btnCancelarImportacao').onclick();
assert.equal(dados.get('trg_cifras_v1'), antes);
assert.equal(obter('dialogImportacao').aberto, false);
console.log('✓ Cancelar importação é seguro');

// Nem abrir a seção Substituir nem digitar texto errado modifica os dados.
run("pendentesImportacao = [{id:'importada',titulo:'Importada',artista:'',tom:'D',corpo:'x'}]");
obter('btnSubstituir').onclick();
assert.equal(dados.get('trg_cifras_v1'), antes);
obter('textoConfirmacao').value = 'ERRADO';
obter('textoConfirmacao').oninput({target: obter('textoConfirmacao')});
assert.equal(obter('btnConfirmarSubstituicao').disabled, true);
obter('btnConfirmarSubstituicao').onclick();
assert.equal(dados.get('trg_cifras_v1'), antes);
console.log('✓ Substituição exige texto de confirmação');

obter('textoConfirmacao').value = 'SUBSTITUIR';
obter('textoConfirmacao').oninput({target: obter('textoConfirmacao')});
assert.equal(obter('btnConfirmarSubstituicao').disabled, false);
obter('btnConfirmarSubstituicao').onclick();
assert.equal(guardadas().length, 1);
assert.equal(guardadas()[0].titulo, 'Importada');
console.log('✓ Substituição explícita e persistência');

run('abrirVisualizador(cifras[0].id)');
obter('btnExcluir').onclick();
assert.equal(guardadas().length, 0);
// Recarrega scripts com a mesma origem/storage: exemplo não deve ressurgir.
const proximo = vm.createContext({
  document, localStorage, console, alert: s => alertas.push(s),
  confirm: () => true, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  setTimeout, clearTimeout, Date, Math
});
for (const nome of ['notas.js','storage.js','cifra.js','autoscroll.js','backup.js','app.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', nome), 'utf8'), proximo, { filename: nome });
}
assert.equal(guardadas().length, 0);
console.log('✓ Excluir tudo não recria exemplo após recarregar');
console.log('\n7 testes de interface passaram.');
