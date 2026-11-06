(() => {
  'use strict';

  const ready = () => {
    const body = document.body;
    const header = document.querySelector('.site-header');
    const progress = document.querySelector('.scroll-progress span');
    const preloader = document.querySelector('.preloader');
    const menu = document.querySelector('.mobile-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    const menuClose = document.querySelector('.menu-close');
    const menuLinks = menu ? menu.querySelectorAll('a[href^="#"]') : [];
    const cursor = document.querySelector('.custom-cursor');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastFocusedElement = null;

    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    // Abertura: mantém a marca em cena por tempo suficiente, sem prender quem prefere movimento reduzido.
    const finishIntro = () => {
      if (!preloader) return;
      preloader.classList.add('is-hidden');
      body.classList.remove('is-loading');
      window.setTimeout(() => preloader.remove(), 1000);
    };
    window.setTimeout(finishIntro, reducedMotion ? 250 : 2600);

    // Cabeçalho e indicador de progresso.
    let scrollTicking = false;
    const updateScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 30);
      if (progress) progress.style.transform = `scaleX(${Math.min(100, Math.max(0, percentage)) / 100})`;
      scrollTicking = false;
    };
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateScroll);
        scrollTicking = true;
      }
    }, { passive: true });
    updateScroll();

    // Menu mobile com bloqueio de rolagem, fechamento por ESC e retorno de foco.
    const openMenu = () => {
      if (!menu || !menuToggle) return;
      lastFocusedElement = document.activeElement;
      menu.classList.add('is-open');
      menu.removeAttribute('inert');
      menu.setAttribute('aria-hidden', 'false');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Fechar menu');
      body.classList.add('menu-is-open');
      if (menuClose) menuClose.focus();
    };
    const closeMenu = () => {
      if (!menu || !menuToggle) return;
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      menu.setAttribute('inert', '');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menu');
      body.classList.remove('menu-is-open');
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
    };
    if (menuToggle) menuToggle.addEventListener('click', () => menu.classList.contains('is-open') ? closeMenu() : openMenu());
    if (menuClose) menuClose.addEventListener('click', closeMenu);
    menuLinks.forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu && menu.classList.contains('is-open')) closeMenu();
      if (event.key === 'Tab' && menu && menu.classList.contains('is-open')) {
        const focusable = [...menu.querySelectorAll('a, button')].filter(el => !el.hasAttribute('disabled'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 760 && menu && menu.classList.contains('is-open')) closeMenu(); });

    // Cursor especial somente em dispositivos com mouse.
    if (cursor && window.matchMedia('(pointer: fine)').matches && window.innerWidth > 760 && !reducedMotion) {
      document.addEventListener('mousemove', event => {
        cursor.style.opacity = '1';
        cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      }, { passive: true });
      document.querySelectorAll('a, button, .specialty-card, .gallery-item').forEach(element => {
        element.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
        element.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
      });
      document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
    }

    // Fallback para dispositivos móveis: evita pin/scrub e animações ligadas
    // ao ScrollTrigger, que podem deixar a viewport preta em alguns navegadores.
    // Todo o conteúdo permanece visível e a rolagem fica nativa e estável.
    const isMobileLayout = window.matchMedia('(max-width: 999px)').matches;
    if (reducedMotion || isMobileLayout || !window.gsap || !window.ScrollTrigger) {
      document.querySelectorAll('.reveal, .clip-reveal').forEach(element => {
        element.classList.add('is-visible');
        element.style.opacity = '1';
        element.style.visibility = 'visible';
        element.style.clipPath = 'none';
        element.style.transform = 'none';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Entradas editoriais, com deslocamento curto e tempos diferentes por seção.
    gsap.utils.toArray('.reveal').forEach((element, index) => {
      gsap.fromTo(element,
        { autoAlpha: 0, y: 34 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.95,
          ease: 'power3.out',
          delay: element.closest('.review-grid') ? (index % 3) * 0.12 : 0,
          scrollTrigger: { trigger: element, start: 'top 88%', once: true }
        }
      );
    });

    // Revelação por recorte para fotografias.
    gsap.utils.toArray('.clip-reveal').forEach(element => {
      gsap.fromTo(element,
        { clipPath: 'inset(12% 0 12% 0)' },
        { clipPath: 'inset(0% 0 0% 0)', duration: 1.25, ease: 'power3.inOut', scrollTrigger: { trigger: element, start: 'top 84%', once: true } }
      );
    });

    // Parallax discreto em telas maiores; removido em dispositivos móveis para preservar fluidez.
    if (window.matchMedia('(min-width: 900px)').matches) {
      gsap.utils.toArray('.parallax-media img').forEach(image => {
        gsap.fromTo(image, { yPercent: -4, scale: 1.06 }, {
          yPercent: 4,
          scale: 1.12,
          ease: 'none',
          scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
        });
      });
    }

    // Especialidades: um único card fica visível por vez durante a seção pinada.
    // Isso evita sobreposição e o efeito de cards embaralhados durante o scrub.
    if (window.matchMedia('(min-width: 1000px)').matches) {
      const cards = gsap.utils.toArray('.specialty-card');
      const stage = document.querySelector('.specialty-stage');
      if (stage && cards.length) {
        gsap.set(cards, { autoAlpha: 0, y: 34, scale: 0.985, zIndex: 0 });
        gsap.set(cards[0], { autoAlpha: 1, y: 0, scale: 1, zIndex: 1 });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: 'top top+=115',
            end: `+=${cards.length * 560}`,
            scrub: 0.65,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        cards.forEach((card, index) => {
          if (index === 0) {
            timeline.to(card, { autoAlpha: 0, y: -24, scale: 0.985, duration: 0.65, ease: 'power2.in' }, 0.85);
            return;
          }
          const position = index * 1.25;
          timeline.set(card, { zIndex: index + 1 }, position);
          timeline.fromTo(card,
            { autoAlpha: 0, y: 34, scale: 0.985 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.65, ease: 'power2.out' },
            position
          );
          if (index < cards.length - 1) {
            timeline.to(card, { autoAlpha: 0, y: -24, scale: 0.985, duration: 0.55, ease: 'power2.in' }, position + 0.85);
          }
        });
      }
    } else {
      gsap.utils.toArray('.specialty-card').forEach((card, index) => {
        gsap.fromTo(card, { autoAlpha: 0, y: 45 }, {
          autoAlpha: 1, y: 0, duration: 0.9, delay: index * 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%', once: true }
        });
      });
    }

    // Monograma como elemento gráfico de profundidade na chamada final.
    const bookingMark = document.querySelector('.booking__monogram');
    if (bookingMark && window.matchMedia('(min-width: 900px)').matches) {
      gsap.to(bookingMark, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: '.booking', start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    }

    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
