/* ═══════════════════════════════════════════════════════════
   app.js – Chetan Babu Bhat Portfolio
   Three.js neural network · GSAP animations · Typed.js clone
════════════════════════════════════════════════════════════ */

"use strict";

/* ─── Wait for DOM ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════════════════
     1. LOADER
  ══════════════════════════════════════════════════════ */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      initReveal();
      animateStats();
    }, 2200);
  });

  /* ══════════════════════════════════════════════════════
     2. THREE.JS NEURAL NETWORK BACKGROUND
  ══════════════════════════════════════════════════════ */
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 500;

  /* Particles */
  const PARTICLE_COUNT = 160;
  const positions   = new Float32Array(PARTICLE_COUNT * 3);
  const velocities  = [];
  const particleData = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() - 0.5) * 1200;
    const y = (Math.random() - 0.5) * 800;
    const z = (Math.random() - 0.5) * 600;
    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    velocities.push({
      x: (Math.random() - 0.5) * 0.4,
      y: (Math.random() - 0.5) * 0.4,
      z: (Math.random() - 0.5) * 0.2,
    });
    particleData.push({ x, y, z });
  }

  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const ptMat = new THREE.PointsMaterial({
    color: 0x00d4ff,
    size: 2.5,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(ptGeo, ptMat);
  scene.add(points);

  /* Lines geometry (dynamic) */
  const LINE_DIST = 200;
  const MAX_LINES = PARTICLE_COUNT * (PARTICLE_COUNT - 1) / 2;
  const linePositions = new Float32Array(MAX_LINES * 6);
  const lineColors    = new Float32Array(MAX_LINES * 6);

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color',    new THREE.BufferAttribute(lineColors,    3));

  const lineMat = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.25 })
  );
  scene.add(lineMat);

  /* Mouse influence */
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 60;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 40;
  });

  /* Resize */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* Colour helpers */
  const cCyan   = new THREE.Color(0x00d4ff);
  const cPurple = new THREE.Color(0x7b2fff);

  /* Animation loop */
  function renderThree() {
    requestAnimationFrame(renderThree);

    const pos = ptGeo.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3]     += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;

      if (pos[i * 3]     >  600 || pos[i * 3]     < -600) velocities[i].x *= -1;
      if (pos[i * 3 + 1] >  400 || pos[i * 3 + 1] < -400) velocities[i].y *= -1;
      if (pos[i * 3 + 2] >  300 || pos[i * 3 + 2] < -300) velocities[i].z *= -1;
    }
    ptGeo.attributes.position.needsUpdate = true;

    /* Update lines */
    let lIdx = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const dx = pos[i*3]   - pos[j*3];
        const dy = pos[i*3+1] - pos[j*3+1];
        const dz = pos[i*3+2] - pos[j*3+2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (dist < LINE_DIST) {
          const alpha = 1 - dist / LINE_DIST;
          const col = new THREE.Color().lerpColors(cCyan, cPurple, dist / LINE_DIST);

          linePositions[lIdx*6]   = pos[i*3];
          linePositions[lIdx*6+1] = pos[i*3+1];
          linePositions[lIdx*6+2] = pos[i*3+2];
          linePositions[lIdx*6+3] = pos[j*3];
          linePositions[lIdx*6+4] = pos[j*3+1];
          linePositions[lIdx*6+5] = pos[j*3+2];

          lineColors[lIdx*6]   = col.r * alpha;
          lineColors[lIdx*6+1] = col.g * alpha;
          lineColors[lIdx*6+2] = col.b * alpha;
          lineColors[lIdx*6+3] = col.r * alpha;
          lineColors[lIdx*6+4] = col.g * alpha;
          lineColors[lIdx*6+5] = col.b * alpha;

          lIdx++;
        }
      }
    }
    lineGeo.setDrawRange(0, lIdx * 2);
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate    = true;

    /* Gentle camera drift */
    camera.position.x += (mouseX - camera.position.x) * 0.01;
    camera.position.y += (-mouseY - camera.position.y) * 0.01;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  renderThree();

  /* ══════════════════════════════════════════════════════
     3. CUSTOM CURSOR
  ══════════════════════════════════════════════════════ */
  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let rX = 0, rY = 0;

  document.addEventListener('mousemove', e => {
    dot.style.left  = e.clientX + 'px';
    dot.style.top   = e.clientY + 'px';

    gsap.to(ring, { left: e.clientX, top: e.clientY, duration: 0.15, ease: 'power2.out' });
  });

  document.querySelectorAll('a, button, .skill-card, .project-card, .btn, .timeline-card, input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  /* ══════════════════════════════════════════════════════
     4. NAVBAR
  ══════════════════════════════════════════════════════ */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  /* Mobile menu */
  const navToggle  = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  navToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const spans = navToggle.querySelectorAll('span');
    mobileMenu.classList.contains('open')
      ? (spans[0].style.transform = 'rotate(45deg) translate(5px,5px)',
         spans[1].style.opacity   = '0',
         spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)')
      : (spans[0].style.transform = '',
         spans[1].style.opacity   = '',
         spans[2].style.transform = '');
  });

  document.querySelectorAll('.mob-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      navToggle.querySelectorAll('span').forEach(s => {
        s.style.transform = ''; s.style.opacity = '';
      });
    });
  });

  /* Profile photo fallback */
  const profilePhoto = document.getElementById('profilePhoto');
  const avatarRing = profilePhoto ? profilePhoto.closest('.avatar-ring') : null;

  if (profilePhoto && avatarRing) {
    profilePhoto.addEventListener('error', () => {
      avatarRing.classList.add('show-fallback');
    });

    profilePhoto.addEventListener('load', () => {
      avatarRing.classList.remove('show-fallback');
    });
  }

  /* ══════════════════════════════════════════════════════
     5. TYPED.JS — inline typewriter
  ══════════════════════════════════════════════════════ */
  const typedEl = document.getElementById('typed-output');
  const words   = [
    'Computer Engineer',
    'Web Developer',
    'Cloud / DevOps Enthusiast',
    'Networking Enthusiast',
    'Problem Solver',
  ];
  let wIdx = 0, cIdx = 0, deleting = false;

  function typeLoop() {
    const word    = words[wIdx];
    const current = deleting
      ? word.substring(0, --cIdx)
      : word.substring(0, ++cIdx);

    typedEl.textContent = current;

    let delay = deleting ? 50 : 100;
    if (!deleting && cIdx === word.length)   { delay = 1800; deleting = true; }
    if (deleting  && cIdx === 0)             { delay = 400;  deleting = false; wIdx = (wIdx + 1) % words.length; }

    setTimeout(typeLoop, delay);
  }
  setTimeout(typeLoop, 2500);

  /* ══════════════════════════════════════════════════════
     6. GSAP SCROLL ANIMATIONS
  ══════════════════════════════════════════════════════ */
  gsap.registerPlugin(ScrollTrigger);

  function initReveal() {
    document.querySelectorAll('.reveal-up').forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
            delay: (i % 5) * 0.08,
          });
          el.classList.add('revealed');
        },
        once: true,
      });
    });

    document.querySelectorAll('.reveal-left').forEach(el => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => gsap.to(el, { opacity: 1, x: 0, duration: 0.85, ease: 'power3.out' }),
        once: true,
      });
    });

    document.querySelectorAll('.reveal-right').forEach(el => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => gsap.to(el, { opacity: 1, x: 0, duration: 0.85, ease: 'power3.out' }),
        once: true,
      });
    });

    /* Hero specific — immediate */
    gsap.to('.hero-content .reveal-up', {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.15,
      ease: 'power3.out',
      delay: 0.3,
    });
    gsap.to('.hero-3d-wrap.reveal-right', {
      opacity: 1,
      x: 0,
      duration: 1,
      ease: 'power3.out',
      delay: 0.6,
    });
  }

  /* ══════════════════════════════════════════════════════
     7. HERO 3D CARD MOUSE TILT
  ══════════════════════════════════════════════════════ */
  const heroCard = document.getElementById('heroCard');
  if (heroCard) {
    document.addEventListener('mousemove', e => {
      const rect = heroCard.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const rotX = -((e.clientY - cy) / 20);
      const rotY =  ((e.clientX - cx) / 20);
      gsap.to(heroCard, {
        rotateX: rotX,
        rotateY: rotY,
        duration: 0.5,
        ease: 'power2.out',
        transformPerspective: 800,
      });
    });
    document.addEventListener('mouseleave', () => {
      gsap.to(heroCard, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1,0.5)' });
    });
  }

  /* ══════════════════════════════════════════════════════
     8. VANILLA TILT on cards
  ══════════════════════════════════════════════════════ */
  if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll('[data-tilt]'), {
      max:           8,
      speed:         400,
      glare:         true,
      'max-glare':   0.08,
      perspective:   1000,
      scale:         1.02,
    });
  }

  /* ══════════════════════════════════════════════════════
     9. SKILL BARS animation
  ══════════════════════════════════════════════════════ */
  document.querySelectorAll('.skill-fill').forEach(bar => {
    ScrollTrigger.create({
      trigger: bar,
      start: 'top 90%',
      onEnter: () => {
        bar.style.width = bar.dataset.width + '%';
      },
      once: true,
    });
  });

  /* ── Skill category filter ─── */
  const catBtns = document.querySelectorAll('.skill-cat');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      document.querySelectorAll('.skill-card').forEach(card => {
        if (cat === 'all' || card.dataset.cat === cat) {
          card.classList.remove('hidden');
          gsap.fromTo(card, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* ══════════════════════════════════════════════════════
     10. STATS COUNTER
  ══════════════════════════════════════════════════════ */
  function animateStats() {
    document.querySelectorAll('.stat-num').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      gsap.fromTo(el, { innerText: 0 }, {
        innerText: target,
        duration: 2,
        snap: { innerText: 1 },
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate() { el.textContent = Math.round(parseFloat(el.innerText)); },
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     11. ACTIVE NAV LINK on scroll
  ══════════════════════════════════════════════════════ */
  const sections   = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 120;
    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
        navAnchors.forEach(a => {
          a.style.color = '';
          if (a.getAttribute('href') === '#' + sec.id) a.style.color = 'var(--cyan)';
        });
      }
    });
  });

  /* ══════════════════════════════════════════════════════
     12. CONTACT FORM
  ══════════════════════════════════════════════════════ */
  const form     = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"] span');
    btn.textContent = 'Sending…';
    setTimeout(() => {
      formNote.textContent = '✓ Message sent! I\'ll get back to you shortly.';
      btn.textContent = 'Send Message';
      form.reset();
      gsap.fromTo(formNote, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 });
    }, 1500);
  });

  /* ══════════════════════════════════════════════════════
     13. PARALLAX on scroll
  ══════════════════════════════════════════════════════ */
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (canvas) canvas.style.transform = `translateY(${y * 0.15}px)`;
  });

  /* ══════════════════════════════════════════════════════
     14. SMOOTH scroll for anchor links
  ══════════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
