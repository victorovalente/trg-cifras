const AutoScroll=(()=>{
  let rodando=false;
  let velocidade=4;
  let raf=null;
  let ultimo=0;

  function setContainer(){
    // Mantido por compatibilidade com o restante do app.
    // O auto-scroll agora rola a página inteira.
    parar();
  }

  function setVelocidade(v){
    velocidade=Math.max(1,Math.min(10,Number(v)||4));
  }

  function atualizarBotao(){
    const b=document.getElementById('btnAutoScroll');
    if(!b)return;
    b.classList.toggle('rodando',rodando);
    b.textContent=rodando?'❚❚ Pausar':'▶ Auto-scroll';
  }

  function chegouAoFim(){
    const doc=document.documentElement;
    return window.scrollY + window.innerHeight >= doc.scrollHeight - 3;
  }

  function tick(ts){
    if(!rodando)return;

    if(!ultimo)ultimo=ts;
    const delta=ts-ultimo;

    if(delta>=16){
      // Velocidade gradual e estável em celular e computador.
      const pixels=(velocidade*0.22)*(delta/16);
      window.scrollBy(0,pixels);
      ultimo=ts;

      if(chegouAoFim()){
        parar();
        return;
      }
    }

    raf=requestAnimationFrame(tick);
  }

  function iniciar(){
    if(rodando)return;
    rodando=true;
    ultimo=0;
    atualizarBotao();
    raf=requestAnimationFrame(tick);
  }

  function parar(){
    rodando=false;
    ultimo=0;
    if(raf)cancelAnimationFrame(raf);
    raf=null;
    atualizarBotao();
  }

  function alternar(){
    rodando?parar():iniciar();
  }

  function resetar(){
    parar();
    window.scrollTo({top:0,left:0,behavior:'smooth'});
  }

  return{setContainer,setVelocidade,alternar,parar,resetar};
})();
