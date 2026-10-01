let cifras=carregarCifras();
let favoritos=carregarFavoritos();
let recentes=carregarRecentes();
let playlists=carregarPlaylists();

let editandoId=null;
let visualizandoId=null;
let semitons=0;
let grafiaForcada=null;
let pendentesImportacao=null;
let importando=false;
let adminAtivo=false;
let filtroAtual='todas';
let playlistAbertaId=null;
let playlistEditandoId=null;
let contextoVoltar='dashboard';
let tocandoPlaylistId=null;
let tocandoPlaylistIndice=-1;
let installPrompt=null;

const $=id=>document.getElementById(id);
const TELAS=['telaDashboard','telaRepertorio','telaPlaylists','telaPlaylist','telaEditor','telaVer'];

function toast(msg){
  const t=$('toast');
  t.textContent=msg;
  t.classList.add('mostrar');
  clearTimeout(toast._t);
  toast._t=setTimeout(()=>t.classList.remove('mostrar'),2600);
}
function setNav(nome){
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('ativo',b.dataset.nav===nome));
}
function mostrarTela(id,nav=null){
  TELAS.forEach(x=>$(x).classList.toggle('oculto',x!==id));
  $('btnVoltar').classList.toggle('oculto',id==='telaDashboard');
  if(nav)setNav(nav);
  window.scrollTo({top:0,behavior:'instant'});
}
function ordenar(lista){
  return [...lista].sort((a,b)=>a.titulo.localeCompare(b.titulo,'pt-BR',{sensitivity:'base'}));
}
function musicaPorId(id){return cifras.find(c=>c.id===id)}
function limparIdsInvalidos(){
  const validos=new Set(cifras.map(c=>c.id));
  favoritos=new Set([...favoritos].filter(id=>validos.has(id)));
  recentes=recentes.filter(id=>validos.has(id));
  playlists=playlists.map(p=>({...p,musicas:p.musicas.filter(id=>validos.has(id))}));
  salvarFavoritos(favoritos);salvarRecentes(recentes);salvarPlaylists(playlists);
}
function criarCardMusica(c,{compacto=false}={}){
  const card=document.createElement('article');
  card.className='song-card'+(compacto?' compacto':'');
  const icon=document.createElement('div');
  icon.className='song-icon';
  icon.textContent='♫';

  const info=document.createElement('button');
  info.className='song-info';
  info.type='button';
  const titulo=document.createElement('strong');
  titulo.textContent=c.titulo;
  const artista=document.createElement('span');
  artista.textContent=c.artista||'Sem artista';
  info.append(titulo,artista);
  info.onclick=()=>abrirVisualizador(c.id,'repertorio');

  const side=document.createElement('div');
  side.className='song-side';
  const tone=document.createElement('span');
  tone.className='song-tone';
  tone.textContent=c.tom;
  const star=document.createElement('button');
  star.className='star-small'+(favoritos.has(c.id)?' ativo':'');
  star.type='button';
  star.textContent=favoritos.has(c.id)?'★':'☆';
  star.title='Favoritar';
  star.onclick=()=>alternarFavorito(c.id);
  side.append(tone,star);
  card.append(icon,info,side);
  return card;
}
function atualizarDashboard(){
  $('totalMusicas').textContent=cifras.length;
  $('resumoFavoritas').textContent=`${favoritos.size} música${favoritos.size===1?'':'s'}`;
  $('resumoRecentes').textContent=`${recentes.length} música${recentes.length===1?'':'s'}`;
  const totalItens=playlists.reduce((n,p)=>n+p.musicas.length,0);
  $('resumoPlaylists').textContent=playlists.length?`${playlists.length} playlist${playlists.length===1?'':'s'} • ${totalItens} músicas`:'Monte sua sequência';

  const box=$('dashboardRecentes');
  box.replaceChildren();
  const dados=recentes.map(musicaPorId).filter(Boolean).slice(0,4);
  $('dashboardSemRecentes').classList.toggle('oculto',dados.length>0);
  dados.forEach(c=>box.append(criarCardMusica(c,{compacto:true})));
}
function buscarDashboard(){
  const q=$('buscaDashboard').value.trim().toLocaleLowerCase('pt-BR');
  const box=$('resultadoDashboard');
  box.replaceChildren();
  if(!q){box.classList.add('oculto');return}
  const dados=ordenar(cifras).filter(c=>
    c.titulo.toLocaleLowerCase('pt-BR').includes(q)||
    (c.artista||'').toLocaleLowerCase('pt-BR').includes(q)
  ).slice(0,8);

  if(!dados.length){
    const p=document.createElement('div');
    p.className='mini-empty';
    p.textContent='Nenhuma música encontrada.';
    box.append(p);
  }else{
    for(const c of dados){
      const b=document.createElement('button');
      b.className='search-result';
      b.type='button';
      const ic=document.createElement('span');ic.className='mini-icon';ic.textContent='♫';
      const text=document.createElement('span');
      const st=document.createElement('strong');st.textContent=c.titulo;
      const sm=document.createElement('small');sm.textContent=c.artista||'Sem artista';
      text.append(st,sm);
      const tom=document.createElement('span');tom.className='song-tone';tom.textContent=c.tom;
      b.append(ic,text,tom);
      b.onclick=()=>{box.classList.add('oculto');$('buscaDashboard').value='';abrirVisualizador(c.id,'dashboard')};
      box.append(b);
    }
  }
  box.classList.remove('oculto');
}
function listaFiltrada(){
  const q=$('busca').value.trim().toLocaleLowerCase('pt-BR');
  let lista=[...cifras];
  if(filtroAtual==='favoritas')lista=lista.filter(c=>favoritos.has(c.id));
  if(filtroAtual==='recentes'){
    const ordem=new Map(recentes.map((id,i)=>[id,i]));
    lista=lista.filter(c=>ordem.has(c.id)).sort((a,b)=>ordem.get(a.id)-ordem.get(b.id));
  }else lista=ordenar(lista);
  if(q)lista=lista.filter(c=>c.titulo.toLocaleLowerCase('pt-BR').includes(q)||(c.artista||'').toLocaleLowerCase('pt-BR').includes(q));
  return lista;
}
function renderLista(){
  const lista=$('lista');
  lista.replaceChildren();
  const dados=listaFiltrada();
  $('vazio').classList.toggle('oculto',dados.length>0);
  dados.forEach(c=>lista.append(criarCardMusica(c)));
}
function abrirRepertorio(filtro='todas'){
  filtroAtual=filtro;
  $('tituloLista').textContent=filtro==='favoritas'?'Favoritas':filtro==='recentes'?'Recentes':'Repertório';
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('ativo',b.dataset.filtro===filtro));
  $('busca').value='';
  renderLista();
  mostrarTela('telaRepertorio',filtro==='favoritas'?'favoritas':'repertorio');
}
function alternarFavorito(id){
  favoritos.has(id)?favoritos.delete(id):favoritos.add(id);
  salvarFavoritos(favoritos);
  atualizarFavoritoViewer();
  atualizarDashboard();
  if(!$('telaRepertorio').classList.contains('oculto'))renderLista();
}
function atualizarFavoritoViewer(){
  if(!visualizandoId)return;
  const ativo=favoritos.has(visualizandoId);
  $('btnFavorito').textContent=ativo?'★':'☆';
  $('btnFavorito').classList.toggle('ativo',ativo);
}
function registrarRecente(id){
  recentes=[id,...recentes.filter(x=>x!==id)].slice(0,30);
  salvarRecentes(recentes);
  atualizarDashboard();
}
function abrirEditor(id=null){
  if(!adminAtivo){toast('Entre como administrador.');return}
  AutoScroll.parar();
  editandoId=id;
  const c=id?musicaPorId(id):null;
  if(id&&!c)return;
  $('inTitulo').value=c?.titulo||'';
  $('inArtista').value=c?.artista||'';
  $('inTom').value=c&&TONS_DISPONIVEIS.includes(c.tom)?c.tom:'G';
  $('inCifra').value=c?.corpo||'';
  $('tituloEditor').textContent=c?'Editar cifra':'Nova cifra';
  contextoVoltar=id?'visualizador':'dashboard';
  mostrarTela('telaEditor');
  $('inTitulo').focus();
}
async function salvarCifra(){
  const titulo=$('inTitulo').value.trim(),artista=$('inArtista').value.trim(),tom=$('inTom').value,corpo=$('inCifra').value;
  if(!titulo||!corpo.trim())return toast('Preencha o título e a cifra.');
  const existente=editandoId?musicaPorId(editandoId):null;
  const cifra={id:existente?.id||gerarId(),titulo,artista,tom,corpo};
  try{
    if(typeof window.salvarCifraNaNuvem!=='function')throw new Error('Firebase indisponível');
    await window.salvarCifraNaNuvem(cifra);
    toast('Música salva na nuvem.');
    if(existente)abrirVisualizador(cifra.id,'repertorio');else mostrarDashboard();
  }catch(e){console.error(e);toast('Não foi possível salvar. Verifique a conexão.')}
}
function abrirVisualizador(id,origem='repertorio'){
  const c=musicaPorId(id);if(!c)return;
  registrarRecente(id);
  AutoScroll.parar();
  visualizandoId=id;
  semitons=0;
  grafiaForcada=null;
  contextoVoltar=origem;
  $('vTitulo').textContent=c.titulo;
  $('vArtista').textContent=c.artista||'';
  atualizarFavoritoViewer();
  atualizarVisualizador();
  const box=$('vCifra');
  box.scrollTop=0;
  AutoScroll.setContainer(box);
  atualizarPlayerPlaylist();
  mostrarTela('telaVer');
}
function atualizarVisualizador(){
  const c=musicaPorId(visualizandoId);if(!c)return;
  const destino=obterTomDestino(c.tom,semitons,grafiaForcada);
  $('vTom').textContent=destino.tom;
  $('grafiaLabel').textContent=destino.usarBemol?'♭':'♯';
  $('vCifra').innerHTML=renderizarCifra(c.corpo,semitons,destino.usarBemol,grafiaForcada!==null);
}
function voltar(){
  AutoScroll.parar();
  if(!$('telaVer').classList.contains('oculto')){
    if(contextoVoltar==='playlist'&&playlistAbertaId){abrirPlaylist(playlistAbertaId);return}
    if(contextoVoltar==='dashboard'){mostrarDashboard();return}
    abrirRepertorio(filtroAtual);return;
  }
  if(!$('telaPlaylist').classList.contains('oculto')){abrirPlaylists();return}
  if(!$('telaEditor').classList.contains('oculto')){
    if(editandoId)abrirVisualizador(editandoId,'repertorio');else mostrarDashboard();
    return;
  }
  if(!$('telaRepertorio').classList.contains('oculto')||!$('telaPlaylists').classList.contains('oculto')){mostrarDashboard();return}
  mostrarDashboard();
}
async function excluirAtual(){
  if(!visualizandoId||!confirm('Excluir esta música do repertório de todos?'))return;
  try{await window.excluirCifraDaNuvem(visualizandoId);toast('Música excluída.');mostrarDashboard()}
  catch(e){toast('Não foi possível excluir.')}
}
function mostrarDashboard(){
  tocandoPlaylistId=null;tocandoPlaylistIndice=-1;
  $('playlistPlayer').classList.add('oculto');
  atualizarDashboard();
  mostrarTela('telaDashboard','dashboard');
}
function abrirPlaylists(){
  renderPlaylists();
  mostrarTela('telaPlaylists','playlists');
}
function renderPlaylists(){
  const box=$('listaPlaylists');box.replaceChildren();
  $('playlistsVazio').classList.toggle('oculto',playlists.length>0);
  for(const p of playlists){
    const b=document.createElement('button');b.className='playlist-tile';b.type='button';
    const cover=document.createElement('div');cover.className='playlist-cover';cover.textContent='▶';
    const nome=document.createElement('strong');nome.textContent=p.nome;
    const count=document.createElement('small');count.textContent=`${p.musicas.length} música${p.musicas.length===1?'':'s'}`;
    b.append(cover,nome,count);b.onclick=()=>abrirPlaylist(p.id);box.append(b);
  }
}
function criarOuRenomearPlaylist(){
  const nome=$('nomePlaylist').value.trim();if(!nome)return;
  if(playlistEditandoId){
    const p=playlists.find(x=>x.id===playlistEditandoId);if(p)p.nome=nome;
  }else playlists.push({id:gerarId(),nome,musicas:[]});
  salvarPlaylists(playlists);$('dialogPlaylist').close();playlistEditandoId=null;$('nomePlaylist').value='';
  atualizarDashboard();renderPlaylists();
}
function abrirDialogPlaylist(id=null){
  playlistEditandoId=id;
  const p=id?playlists.find(x=>x.id===id):null;
  $('dialogPlaylistTitulo').textContent=p?'Renomear playlist':'Nova playlist';
  $('nomePlaylist').value=p?.nome||'';
  $('dialogPlaylist').showModal();
  setTimeout(()=>$('nomePlaylist').focus(),30);
}
function abrirPlaylist(id){
  const p=playlists.find(x=>x.id===id);if(!p)return abrirPlaylists();
  playlistAbertaId=id;
  $('playlistTitulo').textContent=p.nome;
  $('playlistResumo').textContent=`${p.musicas.length} música${p.musicas.length===1?'':'s'} • ordem salva neste aparelho`;
  renderMusicasPlaylist();
  mostrarTela('telaPlaylist','playlists');
}
function renderMusicasPlaylist(){
  const p=playlists.find(x=>x.id===playlistAbertaId);if(!p)return;
  const box=$('musicasPlaylist');box.replaceChildren();
  $('playlistSemMusicas').classList.toggle('oculto',p.musicas.length>0);
  p.musicas.forEach((id,idx)=>{
    const c=musicaPorId(id);if(!c)return;
    const row=document.createElement('div');row.className='playlist-song';
    const order=document.createElement('div');order.className='playlist-order';order.textContent=idx+1;
    const main=document.createElement('button');main.className='playlist-song-main';main.type='button';
    const st=document.createElement('strong');st.textContent=c.titulo;
    const sm=document.createElement('small');sm.textContent=`${c.artista||'Sem artista'} • Tom ${c.tom}`;
    main.append(st,sm);main.onclick=()=>{tocandoPlaylistId=p.id;tocandoPlaylistIndice=idx;abrirVisualizador(id,'playlist')};
    const acts=document.createElement('div');acts.className='playlist-song-actions';
    const up=document.createElement('button');up.type='button';up.textContent='↑';up.title='Subir';
    up.disabled=idx===0;up.onclick=()=>moverMusicaPlaylist(idx,-1);
    const down=document.createElement('button');down.type='button';down.textContent='↓';down.title='Descer';
    down.disabled=idx===p.musicas.length-1;down.onclick=()=>moverMusicaPlaylist(idx,1);
    const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Remover';
    del.onclick=()=>removerDaPlaylist(id);
    acts.append(up,down,del);row.append(order,main,acts);box.append(row);
  });
}
function moverMusicaPlaylist(indice,direcao){
  const p=playlists.find(x=>x.id===playlistAbertaId);if(!p)return;
  const destino=indice+direcao;if(destino<0||destino>=p.musicas.length)return;
  [p.musicas[indice],p.musicas[destino]]=[p.musicas[destino],p.musicas[indice]];
  salvarPlaylists(playlists);renderMusicasPlaylist();
}
function removerDaPlaylist(id){
  const p=playlists.find(x=>x.id===playlistAbertaId);if(!p)return;
  p.musicas=p.musicas.filter(x=>x!==id);salvarPlaylists(playlists);renderMusicasPlaylist();atualizarDashboard();
}
function excluirPlaylist(){
  const p=playlists.find(x=>x.id===playlistAbertaId);if(!p)return;
  if(!confirm(`Excluir a playlist "${p.nome}"? As cifras não serão apagadas.`))return;
  playlists=playlists.filter(x=>x.id!==p.id);salvarPlaylists(playlists);playlistAbertaId=null;atualizarDashboard();abrirPlaylists();
}
function abrirAdicionarMusica(){
  $('buscaAdicionarMusica').value='';renderAdicionarMusica();$('dialogAdicionarMusica').showModal();
}
function renderAdicionarMusica(){
  const p=playlists.find(x=>x.id===playlistAbertaId);if(!p)return;
  const q=$('buscaAdicionarMusica').value.trim().toLocaleLowerCase('pt-BR');
  const box=$('listaAdicionarMusica');box.replaceChildren();
  const dados=ordenar(cifras).filter(c=>!p.musicas.includes(c.id)).filter(c=>!q||c.titulo.toLocaleLowerCase('pt-BR').includes(q)||(c.artista||'').toLocaleLowerCase('pt-BR').includes(q));
  if(!dados.length){const v=document.createElement('div');v.className='mini-empty';v.textContent='Nenhuma música disponível.';box.append(v);return}
  dados.forEach(c=>{
    const row=document.createElement('article');row.className='song-card';
    const icon=document.createElement('div');icon.className='song-icon';icon.textContent='♫';
    const info=document.createElement('div');info.className='song-info';
    const st=document.createElement('strong');st.textContent=c.titulo;const sm=document.createElement('span');sm.textContent=c.artista||'Sem artista';info.append(st,sm);
    const add=document.createElement('button');add.className='btn primary';add.type='button';add.textContent='Adicionar';
    add.onclick=()=>{p.musicas.push(c.id);salvarPlaylists(playlists);renderAdicionarMusica();renderMusicasPlaylist();atualizarDashboard();toast('Música adicionada.')};
    row.append(icon,info,add);box.append(row);
  });
}
function tocarPlaylist(){
  const p=playlists.find(x=>x.id===playlistAbertaId);if(!p||!p.musicas.length)return toast('Adicione músicas à playlist primeiro.');
  tocandoPlaylistId=p.id;tocandoPlaylistIndice=0;abrirVisualizador(p.musicas[0],'playlist');
}
function atualizarPlayerPlaylist(){
  const p=playlists.find(x=>x.id===tocandoPlaylistId);
  const bar=$('playlistPlayer');
  if(!p||tocandoPlaylistIndice<0||tocandoPlaylistIndice>=p.musicas.length){bar.classList.add('oculto');return}
  bar.classList.remove('oculto');
  $('playlistPosicao').textContent=`${tocandoPlaylistIndice+1} / ${p.musicas.length}`;
  $('btnPlaylistAnterior').disabled=tocandoPlaylistIndice===0;
  $('btnPlaylistProxima').disabled=tocandoPlaylistIndice===p.musicas.length-1;
}
function mudarMusicaPlaylist(delta){
  const p=playlists.find(x=>x.id===tocandoPlaylistId);if(!p)return;
  const novo=tocandoPlaylistIndice+delta;if(novo<0||novo>=p.musicas.length)return;
  tocandoPlaylistIndice=novo;abrirVisualizador(p.musicas[novo],'playlist');
}
async function tratarImportacao(ev){
  const file=ev.target.files[0];ev.target.value='';if(!file)return;
  try{
    const r=await Backup.lerArquivo(file),atuais=await window.buscarCifrasNaNuvem();
    pendentesImportacao=r.cifras;
    const mescladas=Backup.mesclar(atuais,pendentesImportacao),novas=mescladas.length-atuais.length;
    $('resumoImportacao').textContent=`${pendentesImportacao.length} válida(s), ${novas} nova(s) e ${pendentesImportacao.length-novas} duplicada(s).`;
    $('dialogImportacao').showModal();
  }catch(e){toast('Falha ao preparar importação: '+e.message)}
}
async function importar(){
  if(!pendentesImportacao||importando)return;
  importando=true;$('btnMesclar').disabled=true;
  try{
    const atuais=await window.buscarCifrasNaNuvem(),mescladas=Backup.mesclar(atuais,pendentesImportacao),ids=new Set(atuais.map(c=>c.id)),novas=mescladas.filter(c=>!ids.has(c.id));
    if(novas.length)await window.importarCifrasNaNuvem(novas);
    $('dialogImportacao').close();toast(novas.length?`${novas.length} música(s) importada(s).`:'Nenhuma música nova.');
  }catch(e){console.error(e);toast('Importação não concluída.')}
  finally{importando=false;$('btnMesclar').disabled=false;pendentesImportacao=null}
}
function setAdmin(ativo){
  adminAtivo=!!ativo;
  $('adminBar').classList.toggle('oculto',!adminAtivo);
  $('viewerAdminActions').classList.toggle('oculto',!adminAtivo);
}
window.TRGCifras={
  setAdmin,
  setStatus:(texto,classe='')=>{const e=$('statusNuvem');e.textContent=texto;e.dataset.estado=classe}
};
window.receberCifrasDaNuvem=function(lista){
  if(!Array.isArray(lista))return;
  cifras=lista;
  try{salvarCifras(lista)}catch(e){}
  limparIdsInvalidos();
  atualizarDashboard();
  renderLista();
  renderPlaylists();
  if(playlistAbertaId)renderMusicasPlaylist();
  if(visualizandoId){
    const m=musicaPorId(visualizandoId);
    if(m){$('vTitulo').textContent=m.titulo;$('vArtista').textContent=m.artista||'';atualizarVisualizador()}else mostrarDashboard();
  }
};
function prepararInstalacao(){
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('btnInstalar').classList.remove('oculto')});
  const instalar=async()=>{
    if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('btnInstalar').classList.add('oculto')}
    else toast('No iPhone: Compartilhar → Adicionar à Tela de Início.');
  };
  $('btnInstalar').onclick=instalar;$('btnMaisInstalar').onclick=instalar;
}
function ligarEventos(){
  $('btnVoltar').onclick=voltar;
  $('buscaDashboard').oninput=buscarDashboard;
  document.querySelectorAll('[data-acao]').forEach(b=>b.onclick=()=>{
    const a=b.dataset.acao;
    if(a==='playlists')abrirPlaylists();else if(a==='favoritas')abrirRepertorio('favoritas');else if(a==='recentes')abrirRepertorio('recentes');else abrirRepertorio('todas');
  });
  $('btnVerRecentes').onclick=()=>abrirRepertorio('recentes');

  document.querySelectorAll('.nav-item[data-nav]').forEach(b=>b.onclick=()=>{
    const n=b.dataset.nav;
    if(n==='dashboard')mostrarDashboard();
    if(n==='repertorio')abrirRepertorio('todas');
    if(n==='playlists')abrirPlaylists();
    if(n==='favoritas')abrirRepertorio('favoritas');
  });
  $('navMais').onclick=()=>$('dialogMais').showModal();
  $('btnMaisRecentes').onclick=()=>{$('dialogMais').close();abrirRepertorio('recentes')};
  $('btnMaisStatus').onclick=()=>toast($('statusNuvem').textContent);
  $('btnMaisFechar').onclick=()=>$('dialogMais').close();

  $('btnNova').onclick=()=>abrirEditor();
  $('btnCancelar').onclick=voltar;
  $('btnSalvar').onclick=salvarCifra;
  $('btnEditar').onclick=()=>abrirEditor(visualizandoId);
  $('btnExcluir').onclick=excluirAtual;
  $('btnFavorito').onclick=()=>alternarFavorito(visualizandoId);
  $('btnMenos').onclick=()=>{semitons=Math.max(-11,semitons-1);atualizarVisualizador()};
  $('btnMais').onclick=()=>{semitons=Math.min(11,semitons+1);atualizarVisualizador()};
  $('btnResetar').onclick=()=>{semitons=0;grafiaForcada=null;atualizarVisualizador()};
  $('btnGrafia').onclick=()=>{
    const c=musicaPorId(visualizandoId);if(!c)return;
    const atual=obterTomDestino(c.tom,semitons,grafiaForcada);
    grafiaForcada=grafiaForcada===null?!atual.usarBemol:null;atualizarVisualizador()
  };
  $('btnAutoScroll').onclick=()=>AutoScroll.alternar($('vCifra'));
  $('rangeVelocidade').oninput=e=>{AutoScroll.setVelocidade(e.target.value);$('velocidadeValor').textContent=e.target.value};
  $('btnTopo').onclick=()=>AutoScroll.resetar();

  $('busca').oninput=renderLista;
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>abrirRepertorio(b.dataset.filtro));

  $('btnCriarPlaylist').onclick=()=>abrirDialogPlaylist();
  $('formPlaylist').onsubmit=e=>{e.preventDefault();criarOuRenomearPlaylist()};
  $('btnCancelarPlaylist').onclick=()=>$('dialogPlaylist').close();
  $('btnRenomearPlaylist').onclick=()=>abrirDialogPlaylist(playlistAbertaId);
  $('btnExcluirPlaylist').onclick=excluirPlaylist;
  $('btnAdicionarMusicaPlaylist').onclick=abrirAdicionarMusica;
  $('buscaAdicionarMusica').oninput=renderAdicionarMusica;
  $('btnFecharAdicionarMusica').onclick=()=>$('dialogAdicionarMusica').close();
  $('btnTocarPlaylist').onclick=tocarPlaylist;
  $('btnPlaylistAnterior').onclick=()=>mudarMusicaPlaylist(-1);
  $('btnPlaylistProxima').onclick=()=>mudarMusicaPlaylist(1);

  $('btnExportar').onclick=()=>Backup.exportar(cifras);
  $('btnImportar').onclick=()=>$('inputImportar').click();
  $('inputImportar').onchange=tratarImportacao;
  $('btnMesclar').onclick=importar;
  $('btnCancelarImportacao').onclick=()=>$('dialogImportacao').close();

  document.addEventListener('keydown',e=>{
    if(!$('telaVer').classList.contains('oculto')&&e.code==='Space'&&!e.repeat&&!e.target.closest('button,input,textarea,select,dialog')){
      e.preventDefault();AutoScroll.alternar($('vCifra'))
    }
  });
}
(function init(){
  $('inTom').replaceChildren(...TONS_DISPONIVEIS.map(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;return o}));
  ligarEventos();prepararInstalacao();limparIdsInvalidos();atualizarDashboard();renderLista();renderPlaylists();
  if(cifras.length)window.TRGCifras.setStatus(navigator.onLine?'Abrindo dados salvos…':'Offline • repertório salvo','offline');
  else window.TRGCifras.setStatus(navigator.onLine?'Conectando à nuvem…':'Offline • sem repertório salvo','offline');
  window.addEventListener('online',()=>window.TRGCifras.setStatus('Conectando à nuvem…','online'));
  window.addEventListener('offline',()=>window.TRGCifras.setStatus('Offline • repertório salvo','offline'));
  mostrarDashboard();
})();
