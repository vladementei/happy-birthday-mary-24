(function () {
  'use strict';

  var CONFETTI_COLORS = ['#ffd166', '#ff6b8a', '#ffffff', '#c9a0ff', '#ffb88c', '#ff9ecd'];
  var TRANSITION_LOCK_MS = 300;
  var YOUTUBE_URL =
    'https://www.youtube.com/watch?v=lxQ3bnJtI20&list=RDlxQ3bnJtI20&start_radio=1';
  var REQUIRED_CATEGORIES = ['beauty', 'health', 'memory'];

  var openedCategories = {};
  var youtubeRedirected = false;

  var screens = {
    hero: document.getElementById('screen-hero'),
    bridge: document.getElementById('screen-bridge'),
    categories: document.getElementById('screen-categories'),
    reveal: document.getElementById('screen-reveal')
  };

  var revealEmoji = document.getElementById('reveal-emoji');
  var revealTitle = document.getElementById('reveal-title');
  var revealText = document.getElementById('reveal-text');
  var revealCalloutEmoji = document.getElementById('reveal-callout-emoji');
  var confettiContainer = document.getElementById('confetti');
  var bgMusic = document.getElementById('bg-music');
  var musicToggle = document.getElementById('music-toggle');

  var transitioning = false;
  var musicUnlocked = false;
  var MUSIC_VOLUME = 0.55;
  var categoriesConfettiInterval = null;

  function updateMusicToggle(playing) {
    if (!musicToggle) return;
    musicToggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    musicToggle.classList.toggle('is-playing', playing);
  }

  function playBgMusic() {
    if (!bgMusic) return Promise.reject();

    bgMusic.volume = MUSIC_VOLUME;
    return bgMusic.play().then(function () {
      musicUnlocked = true;
      updateMusicToggle(true);
    });
  }

  function unlockMusic() {
    if (musicUnlocked || !bgMusic) return;
    playBgMusic().catch(function () {
      /* file missing or autoplay blocked */
    });
  }

  if (musicToggle && bgMusic) {
    musicToggle.addEventListener('click', function (e) {
      e.stopPropagation();

      if (bgMusic.paused) {
        playBgMusic().catch(function () {
          updateMusicToggle(false);
        });
      } else {
        bgMusic.pause();
        updateMusicToggle(false);
      }
    });

    bgMusic.addEventListener('pause', function () {
      if (!bgMusic.paused) return;
      updateMusicToggle(false);
    });

    bgMusic.addEventListener('play', function () {
      updateMusicToggle(true);
    });

    document.body.addEventListener(
      'click',
      function (e) {
        if (e.target.closest('#music-toggle')) return;
        unlockMusic();
      },
      { once: true }
    );

    document.body.addEventListener(
      'touchstart',
      function (e) {
        if (e.target.closest('#music-toggle')) return;
        unlockMusic();
      },
      { once: true, passive: true }
    );
  }

  function showScreen(id) {
    if (transitioning) return;
    var target = screens[id];
    if (!target) return;

    transitioning = true;
    document.body.classList.add('is-transitioning');

    Object.keys(screens).forEach(function (key) {
      var el = screens[key];
      if (key === id) {
        el.classList.add('screen--active');
      } else {
        el.classList.remove('screen--active');
      }
    });

    if (id === 'categories') {
      restartCardAnimations();
      startCategoriesConfetti();
    } else {
      stopCategoriesConfetti();
    }

    if (id === 'reveal') {
      restartRevealAnimation();
    }

    setTimeout(function () {
      transitioning = false;
      document.body.classList.remove('is-transitioning');
    }, TRANSITION_LOCK_MS);
  }

  function restartCardAnimations() {
    var cards = document.querySelectorAll('.card');
    cards.forEach(function (card) {
      card.style.animation = 'none';
      void card.offsetHeight;
      card.style.animation = '';
    });
  }

  function restartRevealAnimation() {
    var badge = document.querySelector('.reveal-badge');
    if (!badge) return;
    badge.style.animation = 'none';
    void badge.offsetHeight;
    badge.style.animation = '';
  }

  function markCategoryOpened(categoryId) {
    if (categoryId) {
      openedCategories[categoryId] = true;
    }
  }

  function allCategoriesOpened() {
    return REQUIRED_CATEGORIES.every(function (id) {
      return openedCategories[id];
    });
  }

  function tryYoutubeRedirect() {
    if (youtubeRedirected || !allCategoriesOpened()) return;
    youtubeRedirected = true;

    var link = document.createElement('a');
    link.href = YOUTUBE_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function selectCategory(categoryId) {
    var source = document.getElementById('reveal-' + categoryId);
    if (!source || !revealText) return;

    markCategoryOpened(categoryId);

    var emoji = source.getAttribute('data-emoji') || '';

    if (revealEmoji) {
      revealEmoji.textContent = emoji;
    }
    if (revealCalloutEmoji) {
      revealCalloutEmoji.textContent = emoji;
    }
    if (revealTitle) {
      revealTitle.textContent = source.getAttribute('data-title') || '';
    }
    revealText.innerHTML = source.innerHTML;

    showScreen('reveal');
  }

  function clearConfetti() {
    if (confettiContainer) {
      confettiContainer.innerHTML = '';
    }
  }

  function spawnConfettiPiece(delay) {
    if (!confettiContainer) return null;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

    var piece = document.createElement('div');
    var animDelay = delay !== undefined ? delay : Math.random() * 2;
    var duration = 3 + Math.random() * 4;

    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.animationDuration = duration + 's';
    piece.style.animationDelay = animDelay + 's';
    piece.style.width = 6 + Math.random() * 8 + 'px';
    piece.style.height = 6 + Math.random() * 8 + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    confettiContainer.appendChild(piece);

    setTimeout(function (el) {
      return function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      };
    }(piece), (animDelay + duration) * 1000 + 150);

    return piece;
  }

  function createConfetti() {
    if (!confettiContainer) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    clearConfetti();

    for (var i = 0; i < 22; i++) {
      spawnConfettiPiece(Math.random() * 2);
    }
  }

  function startCategoriesConfetti() {
    stopCategoriesConfetti();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    clearConfetti();

    for (var i = 0; i < 16; i++) {
      spawnConfettiPiece(Math.random() * 1.5);
    }

    categoriesConfettiInterval = setInterval(function () {
      if (!screens.categories || !screens.categories.classList.contains('screen--active')) {
        stopCategoriesConfetti();
        return;
      }
      spawnConfettiPiece(0);
      spawnConfettiPiece(0);
    }, 400);
  }

  function stopCategoriesConfetti() {
    if (categoriesConfettiInterval) {
      clearInterval(categoriesConfettiInterval);
      categoriesConfettiInterval = null;
    }
  }

  function bindConfettiTap(screenEl) {
    if (!screenEl) return;

    screenEl.addEventListener('click', function (e) {
      if (!screenEl.classList.contains('screen--active')) return;
      if (e.target.closest('#music-toggle')) return;
      createConfetti();
    });
  }

  bindConfettiTap(screens.hero);
  bindConfettiTap(screens.reveal);

  var btnHeroNext = document.getElementById('btn-hero-next');
  if (btnHeroNext) {
    btnHeroNext.addEventListener('click', function () {
      showScreen('bridge');
    });
  }

  var btnOpenGifts = document.getElementById('btn-open-gifts');
  if (btnOpenGifts) {
    btnOpenGifts.addEventListener('click', function () {
      showScreen('categories');
    });
  }

  var btnBack = document.getElementById('btn-back-categories');
  if (btnBack) {
    btnBack.addEventListener('click', function () {
      showScreen('categories');
      tryYoutubeRedirect();
    });
  }

  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('click', function () {
      selectCategory(card.getAttribute('data-category'));
    });
  });

  createConfetti();
})();
