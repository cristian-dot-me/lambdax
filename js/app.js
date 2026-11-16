/**
 * Main Application Entry Point for the LambdaX Landing Page & Citizen HUD.
 * Coordinates bilingual i18n, hero radar animation, demo video fallback,
 * interactive NISAR Citizen HUD maps, and  applications gallery.
 */
(function (globalScope) {
  'use strict';

  /**
   * Demo video placeholder URL. Set to a YouTube/Vimeo embed or MP4 URL when ready.
   */
  const PROJECT_DEMO_VIDEO_URL = 'video.mp4';
  globalScope.PROJECT_DEMO_VIDEO_URL = PROJECT_DEMO_VIDEO_URL;

  function translate(key, fallback) {
    if (globalScope.LambdaXI18N && typeof globalScope.LambdaXI18N.getTranslation === 'function') {
      const lang = globalScope.LambdaXI18N.getCurrentLang();
      return globalScope.LambdaXI18N.getTranslation(lang, key);
    }
    return fallback !== undefined ? fallback : key;
  }

  function createEl(tag, className, attrs) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (attrs) {
      Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
    }
    return el;
  }

  const LambdaXApp = {
    init: function () {
      if (typeof document === 'undefined') return;

      if (globalScope.LambdaXI18N && typeof globalScope.LambdaXI18N.init === 'function') {
        globalScope.LambdaXI18N.init();
      }

      this.initNavigation();
      this.initHeroRadarCanvas();
      this.initDemoPlayer();

      if (typeof globalScope.initLambdaXMaps === 'function') {
        globalScope.initLambdaXMaps();
      }

      this.initGallery();
      this.initScrollReveal();

      document.addEventListener('lambdax:langchange', () => {
        this.initGallery();
        this.refreshDemoFallbackText();
      });
    },

    initNavigation: function () {
      const navToggle = document.getElementById('nav-toggle');
      const navLinks = document.getElementById('primary-nav');
      if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
          const isOpen = navLinks.classList.toggle('nav-open');
          navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        navLinks.querySelectorAll('a').forEach((link) => {
          link.addEventListener('click', () => {
            navLinks.classList.remove('nav-open');
            navToggle.setAttribute('aria-expanded', 'false');
          });
        });
      }

      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (ev) => {
          const targetId = anchor.getAttribute('href');
          if (!targetId || targetId === '#') return;
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            ev.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    },

    initHeroRadarCanvas: function () {
      if (typeof globalScope.initHeroRadar === 'function') {
        globalScope.initHeroRadar('hero-radar-canvas');
      }
    },

    initDemoPlayer: function () {
      const container = document.getElementById('demo-video-container');
      if (!container) return;

      const url = String(globalScope.PROJECT_DEMO_VIDEO_URL || '').trim();
      if (!url) {
        this.renderFallbackPoster(container);
        return;
      }

      container.innerHTML = '';
      if (url.endsWith('.mp4') || url.endsWith('.webm')) {
        const video = createEl('video', 'demo-video-frame', {
          autoplay: 'true',
          muted: 'true',
          loop: 'true',
          controls: 'true',
          playsinline: 'true',
          preload: 'auto'
        });
        video.autoplay = true;
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.controls = true;
        video.playsInline = true;
        const source = createEl('source', '', { src: url, type: 'video/mp4' });
        video.appendChild(source);
        video.addEventListener('ended', () => {
          if (!video.paused) {
            video.currentTime = 0;
            video.play().catch(() => {});
          }
        });
        container.appendChild(video);
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      } else {
        const iframe = createEl('iframe', 'demo-video-frame', {
          src: url,
          title: 'LambdaX Project Demo Video',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
          loading: 'lazy'
        });
        container.appendChild(iframe);
      }
    },

    renderFallbackPoster: function (container) {
      container.innerHTML = '';
      const poster = createEl('div', 'demo-fallback-poster');

      const badge = createEl('span', 'demo-fallback-badge', { 'data-i18n': 'demo.fallbackBadge' });
      badge.textContent = translate('demo.fallbackBadge', 'Interactive Preview Available Below');

      const title = createEl('h3', 'demo-fallback-title', { 'data-i18n': 'demo.fallbackTitle' });
      title.textContent = translate('demo.fallbackTitle', 'Explore the live Citizen HUD directly below');

      const desc = createEl('p', 'demo-fallback-desc', { 'data-i18n': 'demo.fallbackDesc' });
      desc.textContent = translate(
        'demo.fallbackDesc',
        'Jump straight into the real Santiago del Estero, Mozambique, and Nepal–China NISAR visualizations right below.'
      );

      const cta = createEl('a', 'btn btn-primary', {
        href: '#features',
        'data-i18n': 'demo.fallbackCta'
      });
      cta.textContent = translate('demo.fallbackCta', 'Open Live Citizen HUD');
      cta.addEventListener('click', (ev) => {
        const featuresEl = document.getElementById('features');
        if (featuresEl) {
          ev.preventDefault();
          featuresEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      poster.appendChild(badge);
      poster.appendChild(title);
      poster.appendChild(desc);
      poster.appendChild(cta);
      container.appendChild(poster);
    },

    refreshDemoFallbackText: function () {
      const poster = document.querySelector('.demo-fallback-poster');
      if (!poster) return;
      const badge = poster.querySelector('.demo-fallback-badge');
      const title = poster.querySelector('.demo-fallback-title');
      const desc = poster.querySelector('.demo-fallback-desc');
      const cta = poster.querySelector('.btn');
      if (badge) badge.textContent = translate('demo.fallbackBadge');
      if (title) title.textContent = translate('demo.fallbackTitle');
      if (desc) desc.textContent = translate('demo.fallbackDesc');
      if (cta) cta.textContent = translate('demo.fallbackCta');
    },

    initGallery: function () {
      const grid = document.getElementById('applications-gallery-grid');
      if (!grid) return;

      const items = (globalScope.LambdaXScenes && typeof globalScope.LambdaXScenes.getGalleryItems === 'function')
        ? globalScope.LambdaXScenes.getGalleryItems()
        : [];

      grid.innerHTML = '';
      items.forEach((item) => {
        const figure = createEl('figure', 'gallery-card-figure');

        const link = createEl('a', 'gallery-card-media', {
          href: item.src,
          target: '_blank',
          rel: 'noopener noreferrer',
          title: translate('gallery.openFull', 'Open full-size image')
        });

        const img = createEl('img', 'gallery-card-img', {
          src: item.src,
          alt: translate(item.altKey, item.titleKey),
          loading: 'lazy'
        });
        link.appendChild(img);

        const caption = createEl('figcaption', 'gallery-card-caption');
        const tag = createEl('span', 'gallery-card-tag');
        tag.textContent = translate(item.tagKey, '');
        const heading = createEl('h4', 'gallery-card-title');
        heading.textContent = translate(item.titleKey, '');
        const body = createEl('p', 'gallery-card-desc');
        body.textContent = translate(item.descKey, '');

        caption.appendChild(tag);
        caption.appendChild(heading);
        caption.appendChild(body);

        figure.appendChild(link);
        figure.appendChild(caption);
        grid.appendChild(figure);
      });
    },

    initScrollReveal: function () {
      if (typeof IntersectionObserver === 'undefined') {
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08 }
      );
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }
  };

  globalScope.LambdaXApp = LambdaXApp;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => LambdaXApp.init());
    } else {
      LambdaXApp.init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
