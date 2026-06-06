(function () {
  "use strict";

  /* ── Scene Data ───────────────────────────────────────────
   * 将图片放入 assets/bg/，音频放入 assets/audio/
   * 命名规则：{location}-{1-5}.{jpg|mp3}
   * 例：study-1.jpg, library-3.mp3, cafe-5.mp3
   */
  const LOCATIONS = {
    study: {
      label: "书房",
      labelEn: "Study",
      gradient: "linear-gradient(160deg, #1a1520 0%, #2d2438 40%, #0f1218 100%)",
      scenes: [
        { mood: "篝火", subtitle: "Downtempo · 深夜复盘", bg: "assets/bg/study-1.jpg", audio: "assets/audio/study-1.mp3" },
        { mood: "风息", subtitle: "数字环境 · 自我对话", bg: "assets/bg/study-2.jpg", audio: "assets/audio/study-2.mp3" },
        { mood: "溪流", subtitle: "Chillstep · 林间复习", bg: "assets/bg/study-3.jpg", audio: "assets/audio/study-3.mp3" },
        { mood: "林夜", subtitle: "自然融合 · 深度复盘", bg: "assets/bg/study-4.jpg", audio: "assets/audio/study-4.mp3" },
        { mood: "静夜", subtitle: "篝火溪流 · 夜读思考", bg: "assets/bg/study-5.jpg", audio: "assets/audio/study-5.mp3" },
      ],
    },
    library: {
      label: "图书馆",
      labelEn: "Library",
      gradient: "linear-gradient(160deg, #0e1418 0%, #1c2830 45%, #0a0e12 100%)",
      scenes: [
        { mood: "沉潜", subtitle: "Ambient Piano · 极简静思", bg: "assets/bg/library-1.jpg", audio: "assets/audio/library-1.mp3" },
        { mood: "倒影", subtitle: "微弱钢琴 · 写论文", bg: "assets/bg/library-2.jpg", audio: "assets/audio/library-2.mp3" },
        { mood: "新古典", subtitle: "Neoclassical · 深度思考", bg: "assets/bg/library-3.jpg", audio: "assets/audio/library-3.mp3" },
        { mood: "空厅", subtitle: "几乎无鼓点 · 硬核专注", bg: "assets/bg/library-4.jpg", audio: "assets/audio/library-4.mp3" },
        { mood: "余韵", subtitle: "极简钢琴 · 夜读文献", bg: "assets/bg/library-5.jpg", audio: "assets/audio/library-5.mp3" },
      ],
    },
    cafe: {
      label: "咖啡厅",
      labelEn: "Cafe",
      gradient: "linear-gradient(160deg, #1a1410 0%, #2a2018 40%, #120e0a 100%)",
      scenes: [
        { mood: "晨雾", subtitle: "暖调爵士 · 黑胶颗粒", bg: "assets/bg/cafe-1.jpg", audio: "assets/audio/cafe-1.mp3" },
        { mood: "午后", subtitle: "Lofi 即兴 · 激发灵感", bg: "assets/bg/cafe-2.jpg", audio: "assets/audio/cafe-2.mp3" },
        { mood: "雨夜", subtitle: "微弱环境 · 慢拍律动", bg: "assets/bg/cafe-3.jpg", audio: "assets/audio/cafe-3.mp3" },
        { mood: "创作", subtitle: "Hip-Hop 节拍 · 专注心流", bg: "assets/bg/cafe-4.jpg", audio: "assets/audio/cafe-4.mp3" },
        { mood: "深夜", subtitle: "怀旧爵士 · 温暖余韵", bg: "assets/bg/cafe-5.jpg", audio: "assets/audio/cafe-5.mp3" },
      ],
    },
  };

  /* ── DOM ─────────────────────────────────────────────────── */
  const bgLayer = document.getElementById("bgLayer");
  const clockTime = document.getElementById("clockTime");
  const clockPeriod = document.getElementById("clockPeriod");
  const locationLabel = document.getElementById("locationLabel");
  const sceneIndex = document.getElementById("sceneIndex");
  const sceneMood = document.getElementById("sceneMood");
  const sceneSubtitle = document.getElementById("sceneSubtitle");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const playBtn = document.getElementById("playBtn");
  const iconPlay = playBtn.querySelector(".icon-play");
  const iconPause = playBtn.querySelector(".icon-pause");
  const volumeBtn = document.getElementById("volumeBtn");
  const volumePanel = document.getElementById("volumePanel");
  const volumeSlider = document.getElementById("volumeSlider");
  const sceneBtn = document.getElementById("sceneBtn");
  const brandBtn = document.getElementById("brandBtn");
  const locationDialog = document.getElementById("locationDialog");
  const locationDialogClose = document.getElementById("locationDialogClose");
  const locationOptions = document.querySelectorAll(".location-option");
  const ambientAudio = document.getElementById("ambientAudio");

  /* ── State ───────────────────────────────────────────────── */
  let currentLocation = "study";
  let currentSceneIndex = 0;
  let isPlaying = false;
  let pendingNavigation = null; // "prev" | "next" | null
  let volumePanelOpen = false;

  /* ── Clock ───────────────────────────────────────────────── */
  function formatClock(date) {
    const h = date.getHours();
    const m = date.getMinutes();
    const period = h < 12 ? "AM" : "PM";
    const hours = String(h).padStart(2, "0");
    const minutes = String(m).padStart(2, "0");
    return { time: `${hours}:${minutes}`, period };
  }

  function tickClock() {
    const { time, period } = formatClock(new Date());
    clockTime.textContent = time;
    clockPeriod.textContent = period;
  }

  /* ── Scene helpers ───────────────────────────────────────── */
  function getLocation() {
    return LOCATIONS[currentLocation];
  }

  function getScene() {
    return getLocation().scenes[currentSceneIndex];
  }

  function padIndex(n) {
    return String(n + 1).padStart(2, "0");
  }

  function updateDisplay() {
    const loc = getLocation();
    const scene = getScene();
    locationLabel.textContent = loc.label;
    sceneIndex.textContent = padIndex(currentSceneIndex);
    sceneMood.textContent = scene.mood;
    sceneSubtitle.textContent = scene.subtitle;

    locationOptions.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.location === currentLocation);
    });
  }

  function preloadImage(src) {
    return new Promise(function (resolve) {
      const img = new Image();
      img.onload = function () { resolve(src); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function applyBackground(src, gradient) {
    bgLayer.classList.add("is-fading");

    setTimeout(function () {
      if (src) {
        bgLayer.style.backgroundImage = `url("${src}")`;
      } else {
        bgLayer.style.backgroundImage = "none";
      }
      bgLayer.style.backgroundColor = "transparent";
      bgLayer.style.background = src
        ? `url("${src}") center/cover no-repeat`
        : gradient;
      bgLayer.classList.remove("is-fading");
    }, 200);
  }

  function loadAudio(src, autoplay) {
    return new Promise(function (resolve, reject) {
      const wasPlaying = isPlaying || autoplay;

      function cleanup() {
        ambientAudio.removeEventListener("canplay", onReady);
        ambientAudio.removeEventListener("error", onFail);
      }

      function onReady() {
        cleanup();
        if (wasPlaying) {
          ambientAudio.play().then(function () {
            isPlaying = true;
            updatePlayIcon();
            resolve();
          }).catch(reject);
        } else {
          resolve();
        }
      }

      function onFail() {
        cleanup();
        reject(new Error("audio load failed"));
      }

      ambientAudio.pause();
      ambientAudio.addEventListener("canplay", onReady, { once: true });
      ambientAudio.addEventListener("error", onFail, { once: true });
      ambientAudio.src = src;
      ambientAudio.load();
    });
  }

  async function applyScene() {
    const loc = getLocation();
    const scene = getScene();
    updateDisplay();

    const imgSrc = await preloadImage(scene.bg);
    applyBackground(imgSrc, loc.gradient);

    try {
      await loadAudio(scene.audio, isPlaying);
    } catch (_) {
      if (isPlaying) {
        isPlaying = false;
        updatePlayIcon();
      }
    }
  }

  function changeScene(delta) {
    const total = getLocation().scenes.length;
    currentSceneIndex = (currentSceneIndex + delta + total) % total;
    applyScene();
  }

  /* ── Location dialog ─────────────────────────────────────── */
  function openLocationDialog(navDirection) {
    pendingNavigation = navDirection || null;
    locationDialog.showModal();
  }

  function closeLocationDialog() {
    locationDialog.close();
    pendingNavigation = null;
  }

  function selectLocation(locationKey) {
    if (!LOCATIONS[locationKey]) return;

    const loc = LOCATIONS[locationKey];
    const sameLocation = locationKey === currentLocation;

    currentLocation = locationKey;

    if (pendingNavigation === "prev") {
      currentSceneIndex = sameLocation ? loc.scenes.length - 1 : loc.scenes.length - 1;
    } else if (pendingNavigation === "next") {
      currentSceneIndex = 0;
    } else {
      currentSceneIndex = 0;
    }

    closeLocationDialog();
    applyScene();
  }

  /* ── Play / Pause ────────────────────────────────────────── */
  function updatePlayIcon() {
    iconPlay.classList.toggle("hidden", isPlaying);
    iconPause.classList.toggle("hidden", !isPlaying);
    playBtn.setAttribute("aria-label", isPlaying ? "暂停" : "播放");
  }

  function getAudioSrc() {
    const src = ambientAudio.currentSrc || ambientAudio.src;
    return src && !src.endsWith(window.location.pathname) ? src : "";
  }

  async function togglePlay() {
    if (isPlaying) {
      ambientAudio.pause();
      isPlaying = false;
      updatePlayIcon();
      return;
    }

    const scene = getScene();
    const targetSrc = new URL(scene.audio, window.location.href).href;

    try {
      if (getAudioSrc() !== targetSrc) {
        await loadAudio(scene.audio, true);
      } else {
        await ambientAudio.play();
        isPlaying = true;
      }
      updatePlayIcon();
    } catch (_) {
      isPlaying = false;
      updatePlayIcon();
    }
  }

  /* ── Volume ──────────────────────────────────────────────── */
  function setVolume(value) {
    const v = value / 100;
    ambientAudio.volume = v;
    volumeSlider.setAttribute("aria-valuenow", value);
  }

  function toggleVolumePanel() {
    volumePanelOpen = !volumePanelOpen;
    volumePanel.classList.toggle("hidden", !volumePanelOpen);
    volumeBtn.setAttribute("aria-expanded", String(volumePanelOpen));
  }

  function closeVolumePanel() {
    volumePanelOpen = false;
    volumePanel.classList.add("hidden");
    volumeBtn.setAttribute("aria-expanded", "false");
  }

  function goPrev() {
    if (currentSceneIndex > 0) {
      changeScene(-1);
    } else {
      openLocationDialog("prev");
    }
  }

  function goNext() {
    const total = getLocation().scenes.length;
    if (currentSceneIndex < total - 1) {
      changeScene(1);
    } else {
      openLocationDialog("next");
    }
  }

  /* ── Event listeners ─────────────────────────────────────── */
  prevBtn.addEventListener("click", goPrev);
  nextBtn.addEventListener("click", goNext);

  playBtn.addEventListener("click", togglePlay);

  volumeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleVolumePanel();
  });

  volumeSlider.addEventListener("input", function () {
    setVolume(Number(volumeSlider.value));
  });

  sceneBtn.addEventListener("click", function () {
    openLocationDialog(null);
  });

  brandBtn.addEventListener("click", function () {
    openLocationDialog(null);
  });

  locationDialogClose.addEventListener("click", closeLocationDialog);

  locationOptions.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectLocation(btn.dataset.location);
    });
  });

  locationDialog.addEventListener("click", function (e) {
    if (e.target === locationDialog) closeLocationDialog();
  });

  document.addEventListener("click", function (e) {
    if (volumePanelOpen && !volumePanel.contains(e.target) && e.target !== volumeBtn && !volumeBtn.contains(e.target)) {
      closeVolumePanel();
    }
  });

  ambientAudio.addEventListener("ended", function () {
    ambientAudio.currentTime = 0;
    if (isPlaying) {
      ambientAudio.play().catch(function () {
        isPlaying = false;
        updatePlayIcon();
      });
    }
  });

  /* Keyboard shortcuts */
  document.addEventListener("keydown", function (e) {
    if (locationDialog.open) return;
    if (e.code === "Space") {
      e.preventDefault();
      togglePlay();
    } else if (e.code === "ArrowLeft") {
      goPrev();
    } else if (e.code === "ArrowRight") {
      goNext();
    }
  });

  /* ── Init ────────────────────────────────────────────────── */
  setVolume(Number(volumeSlider.value));
  tickClock();
  setInterval(tickClock, 1000);
  applyScene();
})();
