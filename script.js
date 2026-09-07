(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-header]');
  const progress = document.querySelector('.scroll-progress span');
  const glow = document.querySelector('.pointer-glow');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  const setScrollState = () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 24);
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    if (progress) progress.style.transform = `scaleX(${Math.min(y / max, 1)})`;
  };

  setScrollState();
  window.addEventListener('scroll', setScrollState, { passive: true });

  toggle?.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      document.body.classList.remove('nav-open');
      toggle?.setAttribute('aria-expanded', 'false');
      toggle?.setAttribute('aria-label', 'Open navigation');
    });
  });

  const reveals = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.11, rootMargin: '0px 0px -4% 0px' });
    reveals.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      observer.observe(el);
    });
  }

  if (!reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    }, { passive: true });

    const animateGlow = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      if (glow) glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      requestAnimationFrame(animateGlow);
    };
    animateGlow();

    document.querySelectorAll('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        element.style.transform = `translate3d(${dx * 0.12}px, ${dy * 0.12}px, 0)`;
      });
      element.addEventListener('pointerleave', () => {
        element.style.transform = 'translate3d(0,0,0)';
      });
    });
  }

  const canvas = document.getElementById('field');
  if (!canvas || reducedMotion) return;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let points = [];
  let pointer = { x: -9999, y: -9999 };

  const buildPoints = () => {
    const spacing = Math.max(74, Math.min(110, width / 14));
    points = [];
    for (let y = spacing / 2; y < height; y += spacing) {
      for (let x = spacing / 2; x < width; x += spacing) {
        points.push({ x, y, ox: x, oy: y, phase: Math.random() * Math.PI * 2 });
      }
    }
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPoints();
  };

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { passive: true });
  window.addEventListener('pointerleave', () => {
    pointer.x = -9999;
    pointer.y = -9999;
  });
  resize();

  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    const t = time * 0.00045;

    for (const point of points) {
      const dx = pointer.x - point.ox;
      const dy = pointer.y - point.oy;
      const distance = Math.hypot(dx, dy);
      const influence = Math.max(0, 1 - distance / 220);
      const driftX = Math.sin(t + point.phase) * 4;
      const driftY = Math.cos(t * 1.18 + point.phase) * 4;
      point.x = point.ox + driftX - dx * influence * 0.045;
      point.y = point.oy + driftY - dy * influence * 0.045;
    }

    context.lineWidth = 0.65;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      for (let j = i + 1; j < Math.min(points.length, i + 7); j += 1) {
        const b = points[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > 122) continue;
        const alpha = (1 - distance / 122) * 0.13;
        context.strokeStyle = `rgba(180, 208, 220, ${alpha})`;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
      context.fillStyle = 'rgba(196, 255, 90, 0.22)';
      context.beginPath();
      context.arc(a.x, a.y, 1.1, 0, Math.PI * 2);
      context.fill();
    }

    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
})();
