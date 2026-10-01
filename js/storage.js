const CHAVE_STORAGE='trg_cifras_v2';
const CHAVE_FAVORITOS='trg_cifras_favoritos_v1';
const CHAVE_RECENTES='trg_cifras_recentes_v1';
const CHAVE_PLAYLISTS='trg_cifras_playlists_v1';

function lerJSON(chave,padrao){try{const raw=localStorage.getItem(chave);return raw===null?padrao:JSON.parse(raw)}catch(e){return padrao}}
function carregarCifras(){const d=lerJSON(CHAVE_STORAGE,[]);return Array.isArray(d)?d.filter(c=>c&&typeof c.id==='string'&&typeof c.titulo==='string'&&typeof c.corpo==='string'&&typeof c.tom==='string'):[]}
function salvarCifras(cifras){localStorage.setItem(CHAVE_STORAGE,JSON.stringify(cifras))}
function carregarFavoritos(){const d=lerJSON(CHAVE_FAVORITOS,[]);return new Set(Array.isArray(d)?d:[])}
function salvarFavoritos(set){localStorage.setItem(CHAVE_FAVORITOS,JSON.stringify([...set]))}
function carregarRecentes(){const d=lerJSON(CHAVE_RECENTES,[]);return Array.isArray(d)?d:[]}
function salvarRecentes(lista){localStorage.setItem(CHAVE_RECENTES,JSON.stringify(lista.slice(0,30)))}
function carregarPlaylists(){const d=lerJSON(CHAVE_PLAYLISTS,[]);return Array.isArray(d)?d.filter(p=>p&&typeof p.id==='string'&&typeof p.nome==='string'&&Array.isArray(p.musicas)):[]}
function salvarPlaylists(lista){localStorage.setItem(CHAVE_PLAYLISTS,JSON.stringify(lista))}
function gerarId(){return(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2,10)}
