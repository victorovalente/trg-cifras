/* Execute com: node tests/testes.js */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const contexto = vm.createContext({ console, setTimeout, clearTimeout });
for (const nome of ['notas.js', 'cifra.js', 'storage.js', 'backup.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', nome), 'utf8'), contexto, { filename: nome });
}
const executar = script => vm.runInContext(script, contexto);
let testes = 0;
function teste(nome, fn) {
  fn();
  testes++;
  console.log('✓ ' + nome);
}

teste('Não confunde [Coro], [Final] e [Bridge] com acordes', () => {
  for (const secao of ['Coro', 'Final', 'Bridge', 'Verso 2', 'Coda']) {
    assert.equal(executar(`analisarAcorde(${JSON.stringify(secao)})`), null);
    assert.ok(executar(`renderizarCifra(${JSON.stringify('[' + secao + ']')},0,false)`).includes('class="linha secao"'));
  }
  assert.ok(executar("renderizarCifra('[C]',0,false)").includes('linha-acordes'));
});

teste('Transpõe raiz e baixo sem alterar extensões do acorde', () => {
  assert.equal(executar("transporAcorde('D/F#',2,false)"), 'E/G#');
  assert.equal(executar("transporAcorde('Cmaj7',2,false)"), 'Dmaj7');
  assert.equal(executar("transporAcorde('G7M',2,false)"), 'A7M');
  assert.equal(executar("transporAcorde('F#m7(b5)',1,true)"), 'Gm7(b5)');
  assert.equal(executar("transporAcorde('Cadd9/E',1,true)"), 'Dbadd9/F');
});

teste('Grafia automática acompanha tonalidade de destino', () => {
  assert.equal(executar("obterTomDestino('G',1).tom"), 'Ab');
  assert.equal(executar("obterTomDestino('G',1).usarBemol"), true);
  assert.equal(executar("obterTomDestino('G',-1).tom"), 'F#');
  assert.equal(executar("obterTomDestino('Am',1).tom"), 'Bbm');
  assert.equal(executar("obterTomDestino('Bbm',0).tom"), 'Bbm');
  assert.equal(executar("obterTomDestino('G',1,false).tom"), 'G#');
});

teste('Grafia manual afeta acordes mesmo no tom original', () => {
  assert.equal(executar("transporAcorde('Db/F',0,false,false)"), 'Db/F');
  assert.equal(executar("transporAcorde('Db/F',0,false,true)"), 'C#/F');
});

teste('Mantém acordes sobre a sílaba e evita sobreposição', () => {
  const html = executar("renderizarLinha('[D/F#]Eu [G]te amo',0,false)");
  const partes = [...html.matchAll(/<div class="linha(?: linha-acordes)?">([^<]*)<\/div>/g)].map(x => x[1]);
  assert.equal(partes.length, 2);
  assert.equal(partes[0].indexOf('D/F#'), 0);
  assert.equal(partes[0].indexOf('G'), partes[1].indexOf('te'));
  assert.ok(partes[0].indexOf('G') > 'D/F#'.length);
  const outro = executar("renderizarLinha('Eu [G]canto [D]forte',0,false)");
  const novo = [...outro.matchAll(/<div class="linha(?: linha-acordes)?">([^<]*)<\/div>/g)].map(x => x[1]);
  assert.equal(novo[0].indexOf('G'), novo[1].indexOf('canto'));
  assert.equal(novo[0].indexOf('D'), novo[1].indexOf('forte'));
});

teste('Linhas com vários acordes seguidos não se sobrepõem', () => {
  const html = executar("renderizarLinha('[G][D/F#][Em]Toca',0,false)");
  const acorde = html.match(/linha-acordes">([^<]*)<\/div>/)[1];
  const letra = html.match(/<div class="linha">([^<]*)<\/div>/)[1];
  assert.ok(acorde.indexOf('D/F#') > acorde.indexOf('G') + 1);
  assert.ok(acorde.indexOf('Em') > acorde.indexOf('D/F#') + 4);
  assert.equal(acorde.indexOf('Em'), letra.indexOf('Toca'));
});

teste('Escape de HTML protege o corpo da cifra', () => {
  const html = executar("renderizarCifra('<img src=x onerror=alert(1)>',0,false)");
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img'));
});

teste('Backup preserva existentes e ignora duplicadas também no arquivo', () => {
  const dados = executar(`Backup.mesclar(
    [{id:'a',titulo:'Canção  um', artista:'José', tom:'G',corpo:'original'}],
    [
      {id:'b',titulo:'CANCAO UM', artista:'jose',tom:'A',corpo:'nova'},
      {id:'c',titulo:'Outra',artista:'Alguém',tom:'D',corpo:'nova'},
      {id:'d',titulo:' outra ',artista:' ALGUÉM ',tom:'D',corpo:'repetida'}
    ], 'mesclar')`);
  assert.equal(dados.length, 2);
  assert.equal(dados[0].corpo, 'original');
  assert.equal(dados[1].corpo, 'nova');
});

teste('Importação atribui novo ID quando há conflito', () => {
  const resultado = executar(`Backup.mesclar(
    [{id:'igual',titulo:'Primeira',artista:'A',tom:'C',corpo:'x'}],
    [{id:'igual',titulo:'Segunda',artista:'B',tom:'C',corpo:'y'}], 'mesclar')`);
  assert.equal(resultado.length, 2);
  assert.notEqual(resultado[0].id, resultado[1].id);
});

teste('Substituição não mantém entradas anteriores e deduplica arquivo', () => {
  const resultado = executar(`Backup.mesclar(
    [{id:'a',titulo:'Antiga',artista:'',tom:'C',corpo:'x'}],
    [{id:'b',titulo:'Nova',artista:'',tom:'D',corpo:'x'},
     {id:'c',titulo:'Nova',artista:'',tom:'D',corpo:'y'}], 'substituir')`);
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].titulo, 'Nova');
});

console.log(`\n${testes} testes passaram.`);
