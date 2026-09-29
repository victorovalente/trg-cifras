/* TRG Cifras — autoscroll.js | rolagem suave em pixels/segundo */
const AutoScroll = (() => {
  let rodando = false;
  let rafId = null;
  let ultimoTempo = 0;
  let acumulado = 0;
  let velocidade = 4;
  let container = null;

  function pxPorSegundo() { return 5 + (velocidade - 1) * (75 / 9); }

  function tick(tempo) {
    if (!rodando || !container) return;
    if (!ultimoTempo) ultimoTempo = tempo;
    const delta = Math.min((tempo - ultimoTempo) / 1000, 0.1);
    ultimoTempo = tempo;
    acumulado += pxPorSegundo() * delta;
    if (acumulado >= 1) {
      const passo = Math.floor(acumulado);
      container.scrollTop += passo;
      acumulado -= passo;
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
        parar();
        return;
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  function iniciar(el) {
    container = el || container;
    if (rodando || !container) return;
    if (container.scrollHeight <= container.clientHeight) return;
    rodando = true;
    ultimoTempo = 0;
    acumulado = 0;
    rafId = requestAnimationFrame(tick);
    atualizarBotao();
  }

  function parar() {
    rodando = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    ultimoTempo = 0;
    acumulado = 0;
    atualizarBotao();
  }

  function alternar(el) {
    if (rodando) parar(); else iniciar(el);
  }

  function setVelocidade(valor) { velocidade = Math.max(1, Math.min(10, Number(valor) || 1)); }
  function estaRodando() { return rodando; }
  function atualizarBotao() {
    const btn = document.getElementById('btnAutoScroll');
    if (!btn) return;
    btn.classList.toggle('rodando', rodando);
    btn.textContent = rodando ? '⏸ Parar' : '▶ Auto-scroll';
    btn.setAttribute('aria-pressed', String(rodando));
  }
  function resetar() { parar(); if (container) container.scrollTop = 0; }
  return { iniciar, parar, alternar, setVelocidade, estaRodando, atualizarBotao, resetar, setContainer: el => { container = el; } };
})();
