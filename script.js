(() => {
  'use strict';

  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  // Preferences are optional: the site also works when storage is blocked.
  function setTheme(theme, save = false) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    themeButton.setAttribute('aria-pressed', String(dark));
    themeMeta.setAttribute('content', dark ? '#0e1812' : '#f6f7f2');
    if (save) {
      try { localStorage.setItem('durgesh-portfolio-theme', theme); } catch (_) { /* Private / sandboxed browser. */ }
    }
  }
  let savedTheme;
  try { savedTheme = localStorage.getItem('durgesh-portfolio-theme'); } catch (_) { /* Use the default. */ }
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');
  themeButton.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));

  // Silent video wallpaper: respect accessibility, data-saving, and user choice.
  const wallpaper = document.querySelector('#hero-wallpaper');
  const wallpaperButton = document.querySelector('#wallpaper-toggle');
  const heroPanel = document.querySelector('.hero-panel');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let savedMotion = null;
  try { savedMotion = localStorage.getItem('durgesh-wallpaper-motion'); } catch (_) { /* Sandboxed preview. */ }
  let userPaused = reducedMotion.matches || Boolean(connection && connection.saveData) || savedMotion === 'paused';
  let hasUserChoice = savedMotion === 'paused';
  let heroInView = true;
  let sourcesAttached = false;
  let videoUnavailable = false;
  let playRequest = 0;
  wallpaperButton.hidden = false;
  wallpaper.muted = true;
  wallpaper.defaultMuted = true;

  function updateWallpaperControl() {
    const playing = !wallpaper.paused && !videoUnavailable;
    wallpaperButton.dataset.state = playing ? 'playing' : 'paused';
    wallpaperButton.setAttribute('aria-label', videoUnavailable ? 'Static wallpaper is active' : (playing ? 'Pause video wallpaper' : 'Play video wallpaper'));
    wallpaperButton.querySelector('span').textContent = videoUnavailable ? 'Static wallpaper' : (playing ? 'Pause wallpaper' : 'Play wallpaper');
    wallpaperButton.disabled = videoUnavailable;
    heroPanel.classList.toggle('wallpaper-paused', !playing);
  }
  function attachVideoSources() {
    if (sourcesAttached) return;
    wallpaper.querySelectorAll('source[data-src]').forEach(source => { source.src = source.dataset.src; });
    sourcesAttached = true;
    wallpaper.load();
  }
  function updateWallpaperPlayback() {
    const request = ++playRequest;
    if (userPaused || document.hidden || !heroInView || videoUnavailable) {
      wallpaper.pause();
      updateWallpaperControl();
      return;
    }
    attachVideoSources();
    wallpaper.muted = true;
    const attempt = wallpaper.play();
    if (attempt && typeof attempt.then === 'function') {
      attempt.then(() => {
        if (request !== playRequest && (userPaused || document.hidden || !heroInView)) wallpaper.pause();
        updateWallpaperControl();
      }).catch(() => {
        // An autoplay restriction never prevents using the page or the manual play button.
        updateWallpaperControl();
      });
    }
  }
  wallpaper.addEventListener('play', updateWallpaperControl);
  wallpaper.addEventListener('pause', updateWallpaperControl);
  wallpaper.addEventListener('error', () => {
    videoUnavailable = true;
    wallpaper.hidden = true;
    updateWallpaperControl();
  });
  wallpaperButton.addEventListener('click', () => {
    userPaused = !wallpaper.paused;
    hasUserChoice = true;
    try { localStorage.setItem('durgesh-wallpaper-motion', userPaused ? 'paused' : 'playing'); } catch (_) { /* Optional preference. */ }
    updateWallpaperPlayback();
  });
  reducedMotion.addEventListener('change', () => {
    if (!hasUserChoice) userPaused = reducedMotion.matches || Boolean(connection && connection.saveData);
    updateWallpaperPlayback();
  });
  document.addEventListener('visibilitychange', updateWallpaperPlayback);
  if ('IntersectionObserver' in window) {
    const wallpaperObserver = new IntersectionObserver(entries => {
      heroInView = entries[0].isIntersecting;
      updateWallpaperPlayback();
    }, { threshold: 0.05 });
    wallpaperObserver.observe(heroPanel);
  }
  updateWallpaperControl();
  updateWallpaperPlayback();

  // Mobile navigation, including keyboard and outside-click dismissal.
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  function closeMenu(restoreFocus = false) {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
    if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    mobileNav.hidden = !opening;
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Close navigation menu' : 'Open navigation menu');
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!mobileNav.hidden && !document.querySelector('#site-header').contains(event.target)) closeMenu();
  });
  const desktopMedia = matchMedia('(min-width: 761px)');
  desktopMedia.addEventListener('change', event => { if (event.matches) closeMenu(); });

  // Keep section links inside this document, including sandboxed srcdoc previews.
  // Native fragment navigation in srcdoc can otherwise replace the whole iframe.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const fragment = link.getAttribute('href');
      const target = document.getElementById(fragment.slice(1));
      if (!target) return;
      event.preventDefault();
      closeMenu();
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      if (location.protocol !== 'about:') {
        try { history.replaceState(null, '', fragment); } catch (_) { /* Opaque iframe / local preview. */ }
      }
    });
  });

  // Reusable, accessible tabs: click, arrow keys, Home, and End.
  function setupTabs(selector, dataAttribute) {
    const buttons = [...document.querySelectorAll(selector)];
    function activate(button, focus = false) {
      buttons.forEach(tab => {
        const selected = tab === button;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(tab.dataset[dataAttribute]);
        panel.hidden = !selected;
      });
      if (focus) button.focus();
    }
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(button));
      button.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        if (next !== undefined) { event.preventDefault(); activate(buttons[next], true); }
      });
    });
  }
  setupTabs('.story-tab', 'story');
  setupTabs('.toolkit-tab', 'toolkit');

  // Clipboard is not assumed to be available in every hosting environment.
  const copyButton = document.querySelector('.copy-email');
  const toast = document.querySelector('#toast');
  const copyDialog = document.querySelector('#copy-dialog');
  let toastTimer;
  let copyTimer;
  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
  }
  function legacyCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
    document.body.appendChild(textArea);
    textArea.select();
    let success = false;
    try { success = document.execCommand('copy'); } catch (_) { /* Show manual copy instead. */ }
    textArea.remove();
    return success;
  }
  copyButton.addEventListener('click', async () => {
    const email = copyButton.dataset.email;
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(email);
        copied = true;
      }
    } catch (_) { /* Fall back below. */ }
    if (!copied) copied = legacyCopy(email);
    if (copied) {
      clearTimeout(copyTimer);
      copyButton.classList.add('is-copied');
      copyButton.querySelector('span').textContent = 'Copied!';
      notify('Email address copied. Say hello anytime.');
      copyButton.focus({ preventScroll: true });
      copyTimer = setTimeout(() => {
        copyButton.classList.remove('is-copied');
        copyButton.querySelector('span').textContent = 'Copy email';
      }, 3000);
    } else {
      if (typeof copyDialog.showModal === 'function') {
        copyDialog.showModal();
        document.querySelector('#manual-email').select();
      } else {
        notify(email);
      }
    }
  });
  function closeDialog() { copyDialog.close(); copyButton.focus({ preventScroll: true }); }
  copyDialog.querySelector('.dialog-close').addEventListener('click', closeDialog);
  copyDialog.querySelector('.dialog-done').addEventListener('click', closeDialog);
  copyDialog.addEventListener('click', event => {
    const box = copyDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog();
  });
  document.querySelector('#manual-email').addEventListener('click', event => event.target.select());

  // Reading progress and an active section indicator, without scroll polling.
  const header = document.querySelector('#site-header');
  const progress = document.querySelector('.reading-progress');
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const watchedSections = [...document.querySelectorAll('main > section[id]')];
  let framePending = false;
  function updateScroll() {
    framePending = false;
    const max = root.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
    header.classList.toggle('is-scrolled', window.scrollY > 15);
    let current = 'home';
    watchedSections.forEach(section => {
      if (section.getBoundingClientRect().top <= 180) current = section.id;
    });
    navLinks.forEach(link => {
      const active = link.dataset.nav === current;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function requestScrollUpdate() {
    if (!framePending) { framePending = true; requestAnimationFrame(updateScroll); }
  }
  addEventListener('scroll', requestScrollUpdate, { passive: true });
  addEventListener('resize', requestScrollUpdate, { passive: true });
  updateScroll();

  // Motion is an enhancement. Content stays visible if JS or observers fail.
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('js-motion');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -15px 0px' });
    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
  }

  // Education "level up" mini-game: purely playful, no stored data.
  const levelCard = document.querySelector('#level-card');
  const levelPlay = document.querySelector('#level-play');
  if (levelCard && levelPlay) {
    const xpOut = document.querySelector('#level-xp');
    const questOut = document.querySelector('#level-quest');
    const playText = levelPlay.querySelector('.level-play-text');
    const particles = levelCard.querySelector('.level-particles');
    const quests = [
      'Main quest: DSA in Java ▸ in progress',
      'Side quest: Web Development unlocked',
      'Training: Problem Solving +1',
      'Boss level: Engineering Mathematics',
      'Power-up: Git & GitHub equipped',
      'Bonus: Curiosity never runs out ✦'
    ];
    const confettiColors = ['#d3ef8a', '#86ab59', '#294626', '#ffa116', '#f3f5e9'];
    let xp = 0;
    let questIndex = 0;
    const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

    function popXp(x, y) {
      const pop = document.createElement('span');
      pop.className = 'xp-pop';
      pop.textContent = '+10 XP';
      pop.style.left = `${x}px`;
      pop.style.top = `${y}px`;
      pop.style.setProperty('--dx', `${Math.round(Math.random() * 40 - 20)}px`);
      particles.appendChild(pop);
      pop.addEventListener('animationend', () => pop.remove());
    }
    function burstConfetti() {
      const width = levelCard.clientWidth;
      for (let i = 0; i < 26; i += 1) {
        const piece = document.createElement('span');
        piece.className = 'confetti';
        piece.style.left = `${Math.random() * width}px`;
        piece.style.background = confettiColors[i % confettiColors.length];
        piece.style.animationDelay = `${Math.random() * 0.25}s`;
        piece.style.setProperty('--dx', `${Math.round(Math.random() * 80 - 40)}px`);
        piece.style.setProperty('--rot', `${Math.round(Math.random() * 720 - 360)}deg`);
        particles.appendChild(piece);
        piece.addEventListener('animationend', () => piece.remove());
      }
    }
    levelPlay.addEventListener('click', event => {
      levelCard.classList.add('is-started');
      xp += 10;
      xpOut.textContent = xp;
      playText.textContent = 'Keep going';
      const box = levelCard.getBoundingClientRect();
      const btn = levelPlay.getBoundingClientRect();
      const x = event.clientX ? event.clientX - box.left : btn.left - box.left + btn.width / 2;
      const y = (event.clientY ? event.clientY : btn.top + btn.height / 2) - box.top - 18;
      if (xp % 50 === 0) {
        questOut.textContent = `LEVEL UP! ${xp} XP · Curiosity maxed ✦`;
        levelCard.classList.remove('is-levelup');
        void levelCard.offsetWidth;
        levelCard.classList.add('is-levelup');
        if (!calm()) burstConfetti();
      } else {
        questOut.textContent = quests[questIndex % quests.length];
        questIndex += 1;
      }
      if (!calm()) popXp(x, y);
    });
    levelCard.addEventListener('animationend', event => {
      if (event.animationName === 'levelPop') levelCard.classList.remove('is-levelup');
    });
  }

  // Photography lightbox: tiles stay normal Instagram links without JS.
  const lightbox = document.querySelector('#photo-lightbox');
  const photoTiles = [...document.querySelectorAll('.photo-tile[data-photo]')];
  if (lightbox && typeof lightbox.showModal === 'function' && photoTiles.length) {
    const lightboxImg = lightbox.querySelector('#lightbox-img');
    const lightboxCaption = lightbox.querySelector('#lightbox-caption');
    const lightboxCount = lightbox.querySelector('#lightbox-count');
    let current = 0;
    let opener = null;
    function showPhoto(index) {
      current = (index + photoTiles.length) % photoTiles.length;
      const tile = photoTiles[current];
      const img = tile.querySelector('img');
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      lightboxCaption.textContent = tile.dataset.caption || '';
      lightboxCount.textContent = `${current + 1} / ${photoTiles.length}`;
    }
    photoTiles.forEach((tile, index) => {
      tile.addEventListener('click', event => {
        event.preventDefault();
        opener = tile;
        showPhoto(index);
        lightbox.showModal();
      });
    });
    lightbox.querySelectorAll('.lightbox-nav').forEach(button => {
      button.addEventListener('click', () => showPhoto(current + Number(button.dataset.step)));
    });
    lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
    lightbox.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(current + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(current - 1); }
    });
    lightbox.addEventListener('close', () => { if (opener) opener.focus(); });
  }
  document.querySelector('#year').textContent = new Date().getFullYear();
})();
