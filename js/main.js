/* ============================================================
   Hard Flow — landing page
   js/main.js — carregador de assets + toda a interatividade do site
   ============================================================ */

/* ---------- carregador de assets (vídeos como arquivos reais em /assets) ---------- */
(function(){
  var probe = document.createElement('video');
  var canWebm = probe.canPlayType('video/webm; codecs="vp9"') !== '';
  var videoExt = canWebm ? 'webm' : 'mp4';

  /* vídeos que não são o de fundo da Hero: carregam sempre, normalmente */
  document.querySelectorAll('video[data-asset]').forEach(function(el){
    if (el.id === 'hf-hero-video') return;
    el.src = 'assets/' + el.getAttribute('data-asset') + '.' + videoExt;
    el.load();
  });

  /* vídeo de fundo da Hero: só carrega em telas >600px (poupa dados/CPU no mobile).
     Reavalia em resize — se a janela crescer pra desktop durante a sessão
     (ex: usuário redimensionando a janela ou girando o celular), carrega na hora. */
  (function gerenciarHeroVideo(){
    var heroVideoEl = document.getElementById('hf-hero-video');
    if (!heroVideoEl) return;
    var jaCarregado = false;
    function talvezCarregar(){
      if (jaCarregado) return;
      if (window.matchMedia('(max-width:600px)').matches) return;
      heroVideoEl.src = 'assets/hero.' + videoExt;
      heroVideoEl.load();
      jaCarregado = true;
    }
    talvezCarregar();
    var resizeTimer = null;
    window.addEventListener('resize', function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(talvezCarregar, 200);
    }, { passive: true });
  })();
})();

(function(){
  var WHATSAPP_NUMBER = '558688770483';

  /* ---------- scroll suavizado (roda do mouse com easing) ---------- */
  (function initSmoothScroll(){
    var targetY = window.scrollY;
    var currentY = window.scrollY;
    var raf = null;
    function maxScrollY(){ return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
    function tick(){
      currentY += (targetY - currentY) * 0.16;
      if (Math.abs(targetY - currentY) < 0.4) {
        currentY = targetY;
        window.scrollTo({ top: currentY, left: 0, behavior: 'instant' });
        raf = null;
        return;
      }
      window.scrollTo({ top: currentY, left: 0, behavior: 'instant' });
      raf = requestAnimationFrame(tick);
    }
    window.addEventListener('wheel', function(e){
      if (e.ctrlKey) return;
      var delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 18;
      else if (e.deltaMode === 2) delta *= window.innerHeight;
      targetY = Math.max(0, Math.min(maxScrollY(), targetY + delta));
      e.preventDefault();
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: false });
    window.addEventListener('scroll', function(){
      if (!raf) { targetY = window.scrollY; currentY = window.scrollY; }
    }, { passive: true });
  })();

  /* ---------- âncoras internas (scroll suave até a seção) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var alvo = document.querySelector(a.getAttribute('href'));
      if (!alvo) return;
      e.preventDefault();
      window.scrollTo({ top: window.scrollY + alvo.getBoundingClientRect().top, behavior: 'smooth' });
    });
  });

  /* ---------- menu mobile (hambúrguer) ---------- */
  (function initBurger(){
    var burger = document.getElementById('hf-burger');
    var menu = document.getElementById('hf-mobile-menu');
    if (!burger || !menu) return;
    function setMenu(open){
      document.body.classList.toggle('hf-menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    burger.addEventListener('click', function(){
      setMenu(!document.body.classList.contains('hf-menu-open'));
    });
    /* fecha ao tocar em qualquer link do menu (o scroll suave é tratado à parte) */
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ setMenu(false); });
    });
    window.addEventListener('keydown', function(e){ if (e.key === 'Escape') setMenu(false); });
  })();

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-reveal]').forEach(function(el){ io.observe(el); });

  /* ---------- esmaecer seção que já passou: só a dobra atual fica em foco ---------- */
  var fadeSections = document.querySelectorAll('.hf-fade-section');
  if (fadeSections.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var fadeIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var jaPassou = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        entry.target.classList.toggle('is-dimmed', jaPassou);
      });
    }, { threshold: 0, rootMargin: '0px 0px -55% 0px' });
    fadeSections.forEach(function(el){ fadeIO.observe(el); });
  }

  /* ---------- CTA sticky no mobile: aparece a partir da seção 02 ---------- */
  var stickyCta = document.getElementById('hf-sticky-cta');
  var heroWrapEl = document.getElementById('hf-hero-pin-wrap');
  var contatoEl = document.getElementById('contato');
  window.addEventListener('scroll', function(){
    var passouHero = heroWrapEl.getBoundingClientRect().bottom < 0;
    var chegouNoForm = contatoEl.getBoundingClientRect().top < window.innerHeight * 0.9;
    stickyCta.classList.toggle('is-visible', passouHero && !chegouNoForm);
  }, { passive: true });

  /* ---------- hero video scroll-scrub (pinned) ---------- */
  var heroVideo = document.getElementById('hf-hero-video');
  var heroRaf = null;
  (function startHeroScrub(){
    if (!heroVideo || !heroWrapEl) return;
    /* o loop só faz algo quando heroVideo tem duração válida (dur && isFinite abaixo);
       sem src (mobile) ele só fica de prontidão e não custa quase nada — assim, se o vídeo
       for carregado depois (usuário redimensionando a janela pra desktop), o scrub já funciona. */
    var lastSet = -1;
    function seek(t){
      if (heroVideo.fastSeek) { try { heroVideo.fastSeek(t); return; } catch(e){} }
      try { heroVideo.currentTime = t; } catch(e){}
    }
    function tick(){
      var dur = heroVideo.duration;
      if (dur && isFinite(dur) && heroVideo.readyState >= 2) {
        var rect = heroWrapEl.getBoundingClientRect();
        var scrollable = Math.max(1, heroWrapEl.offsetHeight - window.innerHeight);
        var progress = Math.max(0, Math.min(1, -rect.top / scrollable));
        var target = progress * dur;
        if (Math.abs(target - lastSet) > 0.02) { lastSet = target; seek(target); }
      }
      heroRaf = requestAnimationFrame(tick);
    }
    heroRaf = requestAnimationFrame(tick);
  })();

  /* ---------- método: onda de cor vermelho -> preto, com contraste dinâmico ---------- */
  var stackCards = Array.prototype.slice.call(document.querySelectorAll('.hf-stack-card'));
  var RED_RGB = [225, 6, 0];
  var BLACK_RGB = [0, 0, 0];
  var CARD_RGB = [20, 20, 20];
  var WHITE_RGB = [237, 235, 228];
  var MUTE_RGB = [143, 143, 143];
  var FAINT_RGB = [106, 106, 106];
  function lerp3(a, b, t){ return [0,1,2].map(function(k){ return a[k] + (b[k]-a[k]) * t; }); }
  function rgbStr(c){ return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function smoothstep(t){ t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  var stackParts = stackCards.map(function(c){
    return {
      num: c.querySelector('.hf-stack-num'),
      icon: c.querySelector('svg'),
      h3: c.querySelector('h3'),
      p: c.querySelector('p'),
      tag: c.querySelector('.hf-participacao')
    };
  });
  var stackCurrent = stackCards.map(function(_, i){ return i === 0 ? RED_RGB.slice() : CARD_RGB.slice(); });
  var stackRaf = null;
  (function updateStack(){
    var frac = [];
    for (var i = 0; i < stackCards.length - 1; i++){
      var a = stackCards[i].getBoundingClientRect();
      var b = stackCards[i+1].getBoundingClientRect();
      frac.push(a.height > 0 ? Math.max(0, Math.min(1, (a.bottom - b.top) / a.height)) : 0);
    }
    for (var i = 0; i < stackCards.length; i++){
      var redProg = i === 0 ? 1 : smoothstep(frac[i-1]);
      var blackProg = i < stackCards.length - 1 ? smoothstep(frac[i]) : 0;
      var base = lerp3(CARD_RGB, RED_RGB, redProg);
      var target = lerp3(base, BLACK_RGB, blackProg);
      stackCurrent[i] = lerp3(stackCurrent[i], target, 0.14);
      var rgb = stackCurrent[i];
      stackCards[i].style.backgroundColor = rgbStr(rgb);

      var redness = Math.max(0, Math.min(1, rgb[0] / RED_RGB[0]));
      var textT = smoothstep((redness - 0.55) / 0.4);
      var p = stackParts[i];
      if (p.num)  p.num.style.color = rgbStr(lerp3(FAINT_RGB, BLACK_RGB, textT));
      if (p.icon) p.icon.style.stroke = rgbStr(lerp3(FAINT_RGB, BLACK_RGB, textT));
      if (p.h3)   p.h3.style.color = rgbStr(lerp3(WHITE_RGB, BLACK_RGB, textT));
      if (p.p)    p.p.style.color = rgbStr(lerp3(MUTE_RGB, BLACK_RGB, textT));
      if (p.tag){ p.tag.style.color = rgbStr(lerp3(WHITE_RGB, BLACK_RGB, textT)); p.tag.style.borderColor = rgbStr(lerp3([35,35,35], BLACK_RGB, textT)); }
    }
    stackRaf = requestAnimationFrame(updateStack);
  })();

  /* ---------- lightbox ---------- */
  var lightbox = document.getElementById('hf-lightbox');
  var lightboxImg = document.getElementById('hf-lightbox-img');
  function closeLightbox(){ lightbox.classList.remove('is-open'); lightbox.setAttribute('aria-hidden','true'); lightboxImg.src = ''; }
  document.getElementById('hf-lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function(e){ if (e.target === lightbox) closeLightbox(); });
  window.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeLightbox(); });

  /* ---------- carrossel 3D genérico (usado por cases e reels) ---------- */
  function criarCarrossel(opts){
    var wrap = document.getElementById(opts.wrapId);
    var cards = Array.prototype.slice.call(document.querySelectorAll(opts.cardSelector));
    var dotsWrap = document.getElementById(opts.dotsId);
    if (!wrap || !cards.length) return;
    var index = 0;

    cards.forEach(function(_, i){
      var dot = document.createElement('button');
      dot.className = 'hf-dot' + (i === 0 ? ' is-active' : '');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Ir para item ' + (i + 1) + ' de ' + cards.length);
      if (i === 0) dot.setAttribute('aria-current', 'true');
      dot.addEventListener('click', function(){ pularPara(i); });
      dotsWrap.appendChild(dot);
    });

    function layout(){
      cards.forEach(function(card, i){
        var offset = i - index;
        var abs = Math.abs(offset);
        if (abs > 2) { card.style.opacity = 0; card.style.pointerEvents = 'none'; return; }
        card.style.opacity = abs === 0 ? 1 : (abs === 1 ? 0.5 : 0.22);
        card.style.pointerEvents = 'auto';
        card.style.zIndex = String(10 - abs);
        card.style.transform = 'translateX(-50%) translateX(' + (offset * 62) + '%) rotateY(' + (offset * -12) + 'deg) scale(' + (abs === 0 ? 1 : 0.86) + ')';
        if (opts.onCard) opts.onCard(card, i, index, abs);
      });
      Array.prototype.forEach.call(dotsWrap.children, function(d, i){
        d.classList.toggle('is-active', i === index);
        if (i === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }
    function irPara(i){ index = Math.max(0, Math.min(cards.length - 1, i)); layout(); }
    function pularPara(i){
      var alvo = Math.max(0, Math.min(cards.length - 1, i));
      var rect = wrap.getBoundingClientRect();
      var scrollable = Math.max(1, wrap.offsetHeight - window.innerHeight);
      var topo = window.scrollY + rect.top;
      window.scrollTo({ top: topo + (alvo / (cards.length - 1)) * scrollable, behavior: 'smooth' });
      irPara(alvo);
    }
    cards.forEach(function(card, i){
      card.addEventListener('click', function(){
        if (i !== index) { pularPara(i); return; }
        if (opts.onClickCentro) opts.onClickCentro(card, i, layout);
      });
    });
    var lastIdx = -1;
    (function tick(){
      var rect = wrap.getBoundingClientRect();
      var scrollable = Math.max(1, wrap.offsetHeight - window.innerHeight);
      var progress = Math.max(0, Math.min(1, -rect.top / scrollable));
      var idx = Math.round(progress * (cards.length - 1));
      if (idx !== lastIdx) { lastIdx = idx; irPara(idx); }
      requestAnimationFrame(tick);
    })();
    layout();
  }

  /* cases: clique no centro abre lightbox */
  criarCarrossel({
    wrapId: 'hf-cases-pin-wrap',
    cardSelector: '.hf-case-card',
    dotsId: 'hf-cases-dots',
    onCard: function(card, i, index, abs){ card.style.cursor = abs === 0 ? 'zoom-in' : 'pointer'; },
    onClickCentro: function(card){
      lightboxImg.src = card.dataset.src;
      lightboxImg.alt = card.dataset.alt;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden','false');
    }
  });

  /* reels: card central toca; clique alterna o som */
  var reelMuted = true;
  function iconeSom(mudo){
    return mudo
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4,9 8,9 13,5 13,19 8,15 4,15"></polygon><line x1="17" y1="9" x2="22" y2="14"></line><line x1="22" y1="9" x2="17" y2="14"></line></svg>'
      : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4,9 8,9 13,5 13,19 8,15 4,15"></polygon><path d="M17 8a5 5 0 0 1 0 8"></path><path d="M19.5 5.5a9 9 0 0 1 0 13"></path></svg>';
  }
  criarCarrossel({
    wrapId: 'hf-reels-pin-wrap',
    cardSelector: '.hf-reel-card',
    dotsId: 'hf-reels-dots',
    onCard: function(card, i, index, abs){
      var video = card.querySelector('video');
      var som = card.querySelector('.hf-reel-sound');
      if (abs === 0) {
        if (!som) { som = document.createElement('div'); som.className = 'hf-reel-sound'; card.appendChild(som); }
        som.innerHTML = iconeSom(reelMuted);
        video.muted = reelMuted;
        if (video.paused) { var pr = video.play(); if (pr && pr.catch) pr.catch(function(){}); }
      } else {
        if (som) som.remove();
        if (!video.paused) video.pause();
      }
    },
    onClickCentro: function(card, i, layout){
      reelMuted = !reelMuted;
      layout();
    }
  });

  /* ---------- formulário de diagnóstico (multi-etapas, envio por WhatsApp, anti-bot) ---------- */
  var formLoadedAt = Date.now();
  var stepEls = Array.prototype.slice.call(document.querySelectorAll('.hf-form-step'));
  var TOTAL_STEPS = stepEls.length;
  var formStep = 1;
  var formData = {};
  stepEls.forEach(function(el){ formData[el.dataset.field] = ''; });

  var stepDisplay = document.getElementById('hf-step-display');
  var stepTotalEl = document.getElementById('hf-step-total');
  var progressPct = document.getElementById('hf-progress-pct');
  var progressFill = document.getElementById('hf-progress-fill');
  var btnBack = document.getElementById('hf-btn-back');
  var btnNext = document.getElementById('hf-btn-next');
  var formSuccess = document.getElementById('hf-form-success');
  var websiteHoneypot = document.getElementById('hf-website');
  if (stepTotalEl) stepTotalEl.textContent = String(TOTAL_STEPS);

  function stepEl(n){ return stepEls[n - 1]; }
  function errEl(n){ return stepEl(n).querySelector('.hf-form-error'); }
  function inputEl(n){ return stepEl(n).querySelector('input'); }

  /* validação de FORMATO (sem backend; só pega erro de digitação) */
  function validarNome(v){
    v = (v || '').trim();
    if (v.length < 2) return 'Digite seu nome.';
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(v)) return 'Use apenas letras.';
    return null;
  }
  function validarEmail(v){
    v = (v || '').trim();
    if (!v) return 'Digite seu e-mail.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'E-mail inválido.';
    return null;
  }
  function validarInstagram(v){
    v = (v || '').trim().replace(/^@/, '');
    if (!v) return null; /* opcional */
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9._]{0,28}[A-Za-z0-9])?$/.test(v) || v.indexOf('..') > -1) return 'Esse @ não é válido.';
    return null;
  }
  function formatarTelefone(v){
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length > 10) return '(' + d.slice(0,2) + ') ' + d.slice(2,7) + '-' + d.slice(7);
    if (d.length > 6) return '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6);
    if (d.length > 2) return '(' + d.slice(0,2) + ') ' + d.slice(2);
    if (d.length > 0) return '(' + d;
    return '';
  }
  function validarTelefone(v){
    var d = (v || '').replace(/\D/g, '');
    if (d.length < 10 || d.length > 11) return 'Número incompleto. Inclua o DDD.';
    var ddd = parseInt(d.slice(0,2), 10);
    if (ddd < 11 || ddd > 99) return 'DDD inválido.';
    if (d.length === 11 && d.charAt(2) !== '9') return 'Celular deve ter 9 dígitos após o DDD.';
    if (/^(\d)\1+$/.test(d)) return 'Digite um número válido.';
    return null;
  }
  function validarTexto(v){
    v = (v || '').trim();
    if (v.length < 3) return 'Conta um pouco mais pra gente.';
    return null;
  }
  function validarPasso(n){
    var el = stepEl(n);
    var field = el.dataset.field;
    var v = formData[field];
    if (field === 'nome') return validarNome(v);
    if (field === 'email') return validarEmail(v);
    if (field === 'instagram') return validarInstagram(v);
    if (field === 'telefone') return validarTelefone(v);
    if (field === 'problema') return validarTexto(v);
    if (el.dataset.type === 'options') return v ? null : 'Selecione uma opção.';
    return null;
  }

  function mostrarErro(n, msg){
    var el = errEl(n);
    if (el){ el.textContent = msg || ''; el.classList.toggle('is-visible', !!msg); }
    var inp = inputEl(n);
    if (inp) inp.classList.toggle('is-invalid', !!msg);
  }

  function renderForm(){
    stepEls.forEach(function(el){ el.classList.toggle('is-active', Number(el.dataset.step) === formStep); });
    if (stepDisplay) stepDisplay.textContent = String(formStep);
    var pct = Math.round((formStep / TOTAL_STEPS) * 100);
    if (progressPct) progressPct.textContent = pct + '%';
    if (progressFill) progressFill.style.width = pct + '%';
    btnBack.style.display = formStep > 1 ? 'inline-flex' : 'none';
    btnNext.disabled = false;
    btnNext.style.display = stepEl(formStep).dataset.type === 'options' ? 'none' : 'inline-flex';
    btnNext.textContent = 'Continuar →';
    var inp = inputEl(formStep);
    if (inp) inp.focus({ preventScroll: true });
  }

  /* inputs de texto/e-mail/telefone */
  stepEls.forEach(function(el){
    var inp = el.querySelector('input');
    if (!inp) return;
    var n = Number(el.dataset.step);
    var field = el.dataset.field;
    inp.addEventListener('input', function(){
      if (el.dataset.type === 'tel'){
        var pos = inp.selectionStart, before = inp.value.length;
        inp.value = formatarTelefone(inp.value);
        var depois = inp.value.length;
        inp.selectionEnd = inp.selectionStart = Math.max(0, pos + (depois - before));
      }
      formData[field] = inp.value;
      mostrarErro(n, null);
    });
    inp.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); avancar(); } });
  });

  /* botões de opção (auto-avança; no último passo, envia) */
  stepEls.forEach(function(el){
    if (el.dataset.type !== 'options') return;
    var n = Number(el.dataset.step);
    var field = el.dataset.field;
    var btns = el.querySelectorAll('.hf-desafio-btn');
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        btns.forEach(function(b){ b.classList.remove('is-selected'); });
        btn.classList.add('is-selected');
        formData[field] = btn.dataset.value;
        mostrarErro(n, null);
        if (n === TOTAL_STEPS) setTimeout(enviar, 380); else setTimeout(avancar, 180);
      });
    });
  });

  function avancar(){
    var erro = validarPasso(formStep);
    if (erro){ mostrarErro(formStep, erro); return; }
    if (formStep === TOTAL_STEPS){ enviar(); return; }
    formStep = Math.min(TOTAL_STEPS, formStep + 1);
    renderForm();
  }
  function voltar(){ formStep = Math.max(1, formStep - 1); renderForm(); }
  btnNext.addEventListener('click', avancar);
  btnBack.addEventListener('click', voltar);

  function enviar(){
    var erro = validarPasso(TOTAL_STEPS);
    if (erro){ mostrarErro(TOTAL_STEPS, erro); return; }

    /* anti-bot: campo-armadilha invisível + tempo mínimo plausível */
    var tempoDecorrido = Date.now() - formLoadedAt;
    var pareceBot = (websiteHoneypot && websiteHoneypot.value.trim().length > 0) || tempoDecorrido < 3000;
    if (pareceBot){ mostrarErro(TOTAL_STEPS, 'Não foi possível validar o envio. Recarregue a página e tente de novo.'); return; }

    var insta = (formData.instagram || '').trim().replace(/^@/, '');
    var msg = 'Olá! Vim pelo site da Hard Flow e quero meu diagnóstico gratuito.\n'
      + 'Nome: ' + formData.nome + '\n'
      + 'E-mail: ' + formData.email + '\n'
      + 'Instagram: ' + (insta ? '@' + insta : '(não informado)') + '\n'
      + 'WhatsApp: ' + formData.telefone + '\n'
      + 'Maior problema: ' + formData.problema + '\n'
      + 'Avaliação do conteúdo hoje: ' + formData.avaliacao + '\n'
      + 'Comunicação está clara: ' + formData.comunicacao + '\n'
      + 'Resultados que busca: ' + formData.resultados + '\n'
      + 'Está alcançando resultados: ' + formData.alcancando + '\n'
      + 'O que mais trava: ' + formData.trava + '\n'
      + 'Urgência: ' + formData.urgencia;

    btnNext.style.display = 'none';
    btnBack.style.display = 'none';
    formSuccess.style.display = 'flex';
    if (progressFill) progressFill.style.width = '100%';
    if (progressPct) progressPct.textContent = '100%';
    if (stepDisplay) stepDisplay.textContent = String(TOTAL_STEPS);
    window.open('https://wa.me/' + WHATSAPP_NUMBER.replace(/\D/g, '') + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
  }
  renderForm();
})();

/* ---------- tabuleiro: scroll horizontal imersivo (pin + translateX) ---------- */
(function(){
  var wrap = document.getElementById('hf-xadrez-pin-wrap');
  if (!wrap) return;
  var sticky = wrap.querySelector('.hf-xadrez-sticky');
  var track = document.getElementById('hf-xtrack');
  var parallax = wrap.querySelector('.hf-xadrez-parallax');
  var bar = document.getElementById('hf-xprogress');
  var panels = Array.prototype.slice.call(track.querySelectorAll('.hf-xpanel'));
  var mqNative = window.matchMedia('(max-width:600px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  var limpo = false;

  function tick(){
    /* mobile / reduced-motion: swipe nativo (CSS cuida), zera estilos inline uma vez */
    if (mqNative.matches || mqReduce.matches){
      if (!limpo){
        track.style.transform = '';
        if (parallax) parallax.style.transform = '';
        panels.forEach(function(p){ p.style.opacity = ''; p.style.transform = ''; });
        limpo = true;
      }
      requestAnimationFrame(tick);
      return;
    }
    limpo = false;

    var rect = wrap.getBoundingClientRect();
    var vh = window.innerHeight;
    var scrollable = Math.max(1, wrap.offsetHeight - vh);
    var progress = clamp(-rect.top / scrollable, 0, 1);
    var vw = sticky.clientWidth;
    var maxX = Math.max(0, track.scrollWidth - vw);
    var tx = -progress * maxX;

    track.style.transform = 'translate3d(' + tx + 'px,0,0)';
    if (parallax) parallax.style.transform = 'translate3d(' + (tx * 0.35) + 'px,0,0)';
    if (bar) bar.style.width = (progress * 100) + '%';

    var cx = vw / 2;
    for (var i = 0; i < panels.length; i++){
      var p = panels[i];
      var pc = p.offsetLeft + p.offsetWidth / 2 + tx;
      var d = Math.abs(pc - cx) / vw;
      var t = clamp(1 - d * 1.25, 0, 1);
      p.style.opacity = (0.4 + 0.6 * t).toFixed(3);
      p.style.transform = 'scale(' + (0.9 + 0.1 * t).toFixed(3) + ')';
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
