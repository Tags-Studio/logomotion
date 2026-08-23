/* ═══════════════════════════════════════════════════════════════
   LOGOMOTION STUDIO — MATCH CUT EDITOR JAVASCRIPT
   ═══════════════════════════════════════════════════════════════ */

// ── State Management ──
const state = {
  logoFile: null,
  logoUrl: null,
  logoSize: 200,
  logoX: 0,
  logoY: 0,
  brandColors: ['#0047ff', '#0f0a0e', '#eab4b0', '#ffffff', '#000000', '#1a43f4'],
  activeColorIndex: 0,
  audioPreset: '1',
  customAudioFile: null,
  animatedStyle: 'standard', // 'standard' | 'softer' | 'fewer-cuts'
  framesMultiplier: 1,
  duration: 4.0, // seconds
  currentTime: 0,
  isPlaying: false,
  isLooping: true,
};

// ── DOM References ──
const dom = {
  // Upload
  logoBanner: document.getElementById('logoUploadBanner'),
  logoInput: document.getElementById('logoFileInput'),
  logoFilename: document.getElementById('logoFilenameLabel'),

  // Layout Controls
  logoSizeSlider: document.getElementById('logoSizeSlider'),
  logoSizeVal: document.getElementById('logoSizeVal'),
  logoSizeMinus: document.getElementById('logoSizeMinus'),
  logoSizePlus: document.getElementById('logoSizePlus'),
  logoXSlider: document.getElementById('logoXSlider'),
  logoXVal: document.getElementById('logoXVal'),
  logoYSlider: document.getElementById('logoYSlider'),
  logoYVal: document.getElementById('logoYVal'),
  resetLayoutBtn: document.getElementById('resetLayoutBtn'),

  // Colors
  swatchesList: document.getElementById('colorSwatchesList'),
  randomPaletteBtn: document.getElementById('randomPaletteBtn'),

  // Audio
  currentAudioLabel: document.getElementById('currentAudioLabel'),
  presetBtns: document.querySelectorAll('.preset-btn'),
  customAudioToggle: document.getElementById('customAudioToggle'),
  customAudioContent: document.getElementById('customAudioContent'),
  customAudioInput: document.getElementById('customAudioInput'),
  customAudioBtn: document.getElementById('customAudioBtn'),
  customAudioName: document.getElementById('customAudioName'),

  // Advanced & Fonts
  styleChoiceBtns: document.querySelectorAll('.style-choice-btn'),
  uploadFontBtn: document.getElementById('uploadFontBtn'),
  fontFileInput: document.getElementById('fontFileInput'),
  currentFontName: document.getElementById('currentFontName'),

  // Stage Preview Elements
  stageLogoImg: document.getElementById('stageLogoImg'),
  brandCard: document.getElementById('brandCard'),
  topPanel: document.getElementById('topPanel'),
  bottomPanel: document.getElementById('bottomPanel'),
  creaseShadow: document.getElementById('creaseShadow'),

  // Timeline
  playPauseBtn: document.getElementById('playPauseBtn'),
  playIcon: document.getElementById('playIcon'),
  pauseIcon: document.getElementById('pauseIcon'),
  currentTimeLabel: document.getElementById('currentTimeLabel'),
  timelineScrubber: document.getElementById('timelineScrubber'),
  scrubberProgress: document.getElementById('scrubberProgress'),
  scrubberHandle: document.getElementById('scrubberHandle'),
  loopToggleBtn: document.getElementById('loopToggleBtn'),

  // Export
  downloadVideoBtn: document.getElementById('downloadVideoBtn'),
  framesSelect: document.getElementById('framesSelect'),
  exportModal: document.getElementById('exportModal'),
  exportProgressFill: document.getElementById('exportProgressFill'),
  exportStatusTitle: document.getElementById('exportStatusTitle'),
  exportStatusSubtitle: document.getElementById('exportStatusSubtitle'),
  exportActionArea: document.getElementById('exportActionArea'),
  exportDownloadLink: document.getElementById('exportDownloadLink'),
};

// ── 1. Accordion Setup ──
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const parent = header.parentElement;
    parent.classList.toggle('open');
  });
});

// ── 2. Logo Upload & Color Extraction ──
dom.logoBanner.addEventListener('click', () => dom.logoInput.click());

dom.logoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  state.logoFile = file;
  dom.logoFilename.textContent = file.name;

  const url = URL.createObjectURL(file);
  state.logoUrl = url;
  dom.stageLogoImg.src = url;

  // Extract dominant brand colors on server
  try {
    const formData = new FormData();
    formData.append('logo', file);

    const res = await fetch('/extract-colors', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (data.success && data.colors && data.colors.length) {
      state.brandColors = data.colors;
      renderColorSwatches();
      updateStageBrandColor();
    }
  } catch (err) {
    console.warn('Could not extract colors automatically:', err);
  }
});

// ── 3. Logo Layout Controls ──
function updateLayoutUI() {
  dom.logoSizeSlider.value = state.logoSize;
  dom.logoSizeVal.textContent = `${state.logoSize}px`;
  dom.logoXSlider.value = state.logoX;
  dom.logoXVal.textContent = `${state.logoX}%`;
  dom.logoYSlider.value = state.logoY;
  dom.logoYVal.textContent = `${state.logoY}%`;

  // Update Preview Stage
  const pxSize = (state.logoSize / 200) * 100; // Base size is 100px in preview
  dom.stageLogoImg.style.width = `${pxSize}px`;
  dom.stageLogoImg.style.height = `${pxSize}px`;

  const offsetX = (state.logoX / 100) * 120;
  const offsetY = (state.logoY / 100) * 70;
  dom.brandCard.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
}

dom.logoSizeSlider.addEventListener('input', (e) => {
  state.logoSize = parseInt(e.target.value);
  updateLayoutUI();
});

dom.logoSizeMinus.addEventListener('click', () => {
  state.logoSize = Math.max(60, state.logoSize - 10);
  updateLayoutUI();
});

dom.logoSizePlus.addEventListener('click', () => {
  state.logoSize = Math.min(400, state.logoSize + 10);
  updateLayoutUI();
});

dom.logoXSlider.addEventListener('input', (e) => {
  state.logoX = parseInt(e.target.value);
  updateLayoutUI();
});

dom.logoYSlider.addEventListener('input', (e) => {
  state.logoY = parseInt(e.target.value);
  updateLayoutUI();
});

dom.resetLayoutBtn.addEventListener('click', () => {
  state.logoSize = 200;
  state.logoX = 0;
  state.logoY = 0;
  updateLayoutUI();
});

// ── 4. Brand Colours Management ──
function renderColorSwatches() {
  dom.swatchesList.innerHTML = '';
  state.brandColors.forEach((hex, index) => {
    const row = document.createElement('div');
    row.className = 'color-swatch-row';

    row.innerHTML = `
      <div class="color-preview-box" style="background-color: ${hex};">
        <input type="color" value="${hex}" data-index="${index}" />
      </div>
      <span class="color-hex-text">${hex.toUpperCase()}</span>
    `;

    // Handle color picker change
    const colorInput = row.querySelector('input[type="color"]');
    colorInput.addEventListener('input', (e) => {
      const newHex = e.target.value;
      state.brandColors[index] = newHex;
      row.querySelector('.color-preview-box').style.backgroundColor = newHex;
      row.querySelector('.color-hex-text').textContent = newHex.toUpperCase();
      if (index === state.activeColorIndex) {
        updateStageBrandColor();
      }
    });

    // Select primary color row
    row.addEventListener('click', () => {
      state.activeColorIndex = index;
      updateStageBrandColor();
    });

    dom.swatchesList.appendChild(row);
  });
}

function updateStageBrandColor() {
  const primaryColor = state.brandColors[state.activeColorIndex] || state.brandColors[0] || '#0047ff';
  dom.brandCard.style.backgroundColor = primaryColor;
}

// Random Palette Generator
const curatedPalettes = [
  ['#0047FF', '#0F0A0E', '#EAB4B0', '#FFFFFF', '#000000', '#1A43F4'],
  ['#FF3B30', '#1C1C1E', '#F2F2F7', '#FF9500', '#5856D6', '#AF52DE'],
  ['#34C759', '#102A18', '#A3E635', '#F4FBF7', '#064E3B', '#059669'],
  ['#6366F1', '#0B0F19', '#C7D2FE', '#EEF2FF', '#312E81', '#4338CA'],
  ['#EC4899', '#180B13', '#FBCFE8', '#FDF2F8', '#831843', '#BE185D'],
  ['#F59E0B', '#1C1917', '#FDE68A', '#FEF3C7', '#78350F', '#B45309'],
];

dom.randomPaletteBtn.addEventListener('click', () => {
  const randomPalette = curatedPalettes[Math.floor(Math.random() * curatedPalettes.length)];
  state.brandColors = [...randomPalette];
  state.activeColorIndex = 0;
  renderColorSwatches();
  updateStageBrandColor();
});

// ── 5. Audio Presets ──
dom.presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    dom.presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const audioVal = btn.dataset.audio;
    state.audioPreset = audioVal;
    dom.currentAudioLabel.textContent = audioVal === 'none' ? 'None' : `Audio ${audioVal}`;
  });
});

dom.customAudioToggle.addEventListener('click', () => {
  const isVisible = dom.customAudioContent.style.display !== 'none';
  dom.customAudioContent.style.display = isVisible ? 'none' : 'block';
});

dom.customAudioBtn.addEventListener('click', () => dom.customAudioInput.click());

dom.customAudioInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  state.customAudioFile = file;
  state.audioPreset = 'custom';
  dom.customAudioName.textContent = file.name;
  dom.currentAudioLabel.textContent = 'Custom';
  dom.presetBtns.forEach(b => b.classList.remove('active'));
});

// ── 6. Advanced Settings (Font & Animation Style) ──
dom.styleChoiceBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    dom.styleChoiceBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.animatedStyle = btn.dataset.style;
    updateStagePreview(state.currentTime);
  });
});

dom.uploadFontBtn.addEventListener('click', () => dom.fontFileInput.click());
dom.fontFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const fontName = file.name.replace(/\.[^/.]+$/, "");
  const reader = new FileReader();
  reader.onload = function(evt) {
    const font = new FontFace(fontName, evt.target.result);
    font.load().then(loadedFont => {
      document.fonts.add(loadedFont);
      dom.currentFontName.textContent = fontName;
    });
  };
  reader.readAsArrayBuffer(file);
});

// ── 7. Interactive Timeline & Scrubber Preview ──
function updateStagePreview(timeInSeconds) {
  state.currentTime = timeInSeconds;
  const progressPercent = (timeInSeconds / state.duration) * 100;
  dom.scrubberProgress.style.width = `${progressPercent}%`;
  dom.scrubberHandle.style.left = `${progressPercent}%`;

  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  const decimal = Math.floor((timeInSeconds % 1) * 100);
  dom.currentTimeLabel.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

  // Calculate concrete fold angles based on animatedStyle
  let foldStart = 0.5;
  let foldEnd = 2.4;
  let logoIn = 2.0;

  if (state.animatedStyle === 'softer') {
    foldStart = 0.3;
    foldEnd = 2.8;
    logoIn = 2.4;
  } else if (state.animatedStyle === 'fewer-cuts') {
    foldStart = 0.8;
    foldEnd = 2.0;
    logoIn = 1.8;
  }

  // Fold Progress (0 -> 1)
  let foldProgress = 0;
  if (timeInSeconds > foldStart) {
    foldProgress = Math.min(1, (timeInSeconds - foldStart) / (foldEnd - foldStart));
  }

  const topAngle = foldProgress * -88;
  const bottomAngle = foldProgress * 88;
  const shadowOpacity = Math.max(0, 1 - foldProgress * 1.5);

  dom.topPanel.style.transform = `perspective(700px) rotateX(${topAngle}deg)`;
  dom.bottomPanel.style.transform = `perspective(700px) rotateX(${bottomAngle}deg)`;
  dom.creaseShadow.style.opacity = shadowOpacity;

  // Logo Scale & Opacity
  let logoProgress = 0;
  if (timeInSeconds > logoIn) {
    logoProgress = Math.min(1, (timeInSeconds - logoIn) / (state.duration - logoIn));
  }
  dom.stageLogoImg.style.opacity = Math.min(1, logoProgress * 1.8);
}

// Scrubber Click & Drag
let isScrubbing = false;
function handleScrubber(e) {
  const rect = dom.timelineScrubber.getBoundingClientRect();
  const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
  const ratio = clickX / rect.width;
  updateStagePreview(ratio * state.duration);
}

dom.timelineScrubber.addEventListener('mousedown', (e) => {
  isScrubbing = true;
  handleScrubber(e);
});

window.addEventListener('mousemove', (e) => {
  if (isScrubbing) handleScrubber(e);
});

window.addEventListener('mouseup', () => {
  isScrubbing = false;
});

// Play / Pause Animation Loop
let animFrameId = null;
let lastTimestamp = null;

function playLoop(timestamp) {
  if (!state.isPlaying) return;

  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  let newTime = state.currentTime + delta;
  if (newTime >= state.duration) {
    if (state.isLooping) {
      newTime = 0;
    } else {
      pausePlayback();
      return;
    }
  }

  updateStagePreview(newTime);
  animFrameId = requestAnimationFrame(playLoop);
}

function startPlayback() {
  state.isPlaying = true;
  dom.playIcon.style.display = 'none';
  dom.pauseIcon.style.display = 'block';
  lastTimestamp = null;
  animFrameId = requestAnimationFrame(playLoop);
}

function pausePlayback() {
  state.isPlaying = false;
  dom.playIcon.style.display = 'block';
  dom.pauseIcon.style.display = 'none';
  if (animFrameId) cancelAnimationFrame(animFrameId);
}

dom.playPauseBtn.addEventListener('click', () => {
  if (state.isPlaying) pausePlayback();
  else startPlayback();
});

dom.loopToggleBtn.addEventListener('click', () => {
  state.isLooping = !state.isLooping;
  dom.loopToggleBtn.style.color = state.isLooping ? '#18181b' : '#a1a1aa';
});

// ── 8. Render & Video Export ──
dom.framesSelect.addEventListener('change', (e) => {
  state.framesMultiplier = parseInt(e.target.value);
});

dom.downloadVideoBtn.addEventListener('click', async () => {
  if (!state.logoFile && !state.logoUrl) {
    alert('Please upload a logo first.');
    return;
  }

  pausePlayback();
  dom.exportModal.style.display = 'flex';
  dom.exportActionArea.style.display = 'none';
  dom.exportProgressFill.style.width = '10%';
  dom.exportStatusTitle.textContent = 'Preparing render...';
  dom.exportStatusSubtitle.textContent = 'Bundling Remotion components';

  // Fake animated progress
  let progress = 10;
  const progressInterval = setInterval(() => {
    if (progress < 85) {
      progress += 5;
      dom.exportProgressFill.style.width = `${progress}%`;
      if (progress > 30) dom.exportStatusTitle.textContent = 'Rendering frames...';
      if (progress > 60) dom.exportStatusSubtitle.textContent = 'Encoding MP4 video';
    }
  }, 1000);

  try {
    const formData = new FormData();
    if (state.logoFile) formData.append('logo', state.logoFile);
    if (state.customAudioFile) formData.append('customAudio', state.customAudioFile);

    formData.append('logoSize', state.logoSize);
    formData.append('logoX', state.logoX);
    formData.append('logoY', state.logoY);
    formData.append('brandColors', JSON.stringify(state.brandColors));
    formData.append('audioPreset', state.audioPreset);
    formData.append('animatedStyle', state.animatedStyle);
    formData.append('framesMultiplier', state.framesMultiplier);
    formData.append('style', 'matchcut');

    const response = await fetch('/render', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    clearInterval(progressInterval);

    if (result.success && result.videoUrl) {
      dom.exportProgressFill.style.width = '100%';
      dom.exportStatusTitle.textContent = 'Your video is ready!';
      dom.exportStatusSubtitle.textContent = 'Click below to download high quality MP4';
      dom.exportActionArea.style.display = 'block';
      dom.exportDownloadLink.href = result.videoUrl;
      dom.exportDownloadLink.setAttribute('download', result.filename || 'logomotion.mp4');
    } else {
      throw new Error(result.error || 'Rendering failed');
    }
  } catch (err) {
    clearInterval(progressInterval);
    dom.exportStatusTitle.textContent = 'Render error';
    dom.exportStatusSubtitle.textContent = err.message || 'An unexpected error occurred';
    dom.exportActionArea.style.display = 'block';
  }
});

function closeExportModal() {
  dom.exportModal.style.display = 'none';
}
window.closeExportModal = closeExportModal;

// ── Initial Setup ──
renderColorSwatches();
updateStageBrandColor();
updateLayoutUI();
updateStagePreview(0);
