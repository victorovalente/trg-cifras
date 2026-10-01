const NOTAS_SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTAS_FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const NOTA_PARA_IDX=Object.create(null);
NOTAS_SHARP.forEach((n,i)=>NOTA_PARA_IDX[n]=i);NOTAS_FLAT.forEach((n,i)=>NOTA_PARA_IDX[n]=i);
Object.assign(NOTA_PARA_IDX,{Cb:11,Fb:4,'E#':5,'B#':0});
const TONS_COM_BEMOL=new Set(['F','Bb','Eb','Ab','Db','Gb','Cb','Dm','Gm','Cm','Fm','Bbm','Ebm','Abm','Dbm','Gbm']);
const TONS_COM_SUSTENIDO=new Set(['G','D','A','E','B','F#','C#','Em','Bm','F#m','C#m','G#m','D#m','A#m']);
const TONS_MAIORES_PREFERIDOS=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const TONS_MENORES_PREFERIDOS=['Cm','C#m','Dm','Ebm','Em','Fm','F#m','Gm','G#m','Am','Bbm','Bm'];
function tomUsaBemol(tom){const t=String(tom).trim();if(TONS_COM_BEMOL.has(t))return true;if(TONS_COM_SUSTENIDO.has(t))return false;return t.includes('b')}
function notaParaIndice(nota){return NOTA_PARA_IDX[nota]}
function indiceParaNota(idx,usarBemol){const i=((idx%12)+12)%12;return(usarBemol?NOTAS_FLAT:NOTAS_SHARP)[i]}
function analisarAcorde(texto){const acorde=String(texto).trim();if(acorde==='N.C.'||acorde==='NC')return{especial:acorde};const m=/^([A-G][#b]?)([^/]*?)(?:\/([A-G][#b]?))?$/.exec(acorde);if(!m||notaParaIndice(m[1])===undefined)return null;if(!/^(?:maj|min|dim|aug|sus|add|omit|alt|no|m|M|Δ|º|°|ø|[0-9]|[#b()+\-])*$/u.test(m[2]))return null;if(m[3]&&notaParaIndice(m[3])===undefined)return null;return{raiz:m[1],sufixo:m[2],baixo:m[3]||null}}
function transporAcorde(acorde,semitons,usarBemol,forcarGrafia=false){const p=analisarAcorde(acorde);if(!p||p.especial||(semitons===0&&!forcarGrafia))return acorde;const mudar=n=>indiceParaNota(notaParaIndice(n)+semitons,usarBemol);return mudar(p.raiz)+p.sufixo+(p.baixo?'/'+mudar(p.baixo):'')}
function obterTomDestino(tomOriginal,semitons,grafiaForcada=null){const menor=tomOriginal.endsWith('m');const nota=menor?tomOriginal.slice(0,-1):tomOriginal;const indice=notaParaIndice(nota);if(indice===undefined)return{tom:tomOriginal,usarBemol:grafiaForcada??tomUsaBemol(tomOriginal)};const destino=indice+semitons;const preferido=semitons===0?tomOriginal:(menor?TONS_MENORES_PREFERIDOS:TONS_MAIORES_PREFERIDOS)[((destino%12)+12)%12];const usarBemol=grafiaForcada??tomUsaBemol(preferido);const tom=grafiaForcada===null?preferido:indiceParaNota(destino,grafiaForcada)+(menor?'m':'');return{tom,usarBemol}}
const TONS_DISPONIVEIS=['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B','Cb','Am','A#m','Bbm','Bm','Cm','C#m','Dbm','Dm','D#m','Ebm','Em','Fm','F#m','Gbm','Gm','G#m','Abm'];
