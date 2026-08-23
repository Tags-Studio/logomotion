/* ═══════════════════════════════════════
   LOGOMOTION — Frontend App Logic
   ═══════════════════════════════════════ */

let uploadedFiles = { logo: null, bg: null };
let selectedStyle = 'matchcut';

// ── Style option buttons ──
document.querySelectorAll('.option-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedStyle = btn.querySelector('input').value;
  });
});

// ── Trigger file input ──
function triggerUpload(inputId) {
  document.getElementById(inputId).click();
}

// ── Handle file selection ──
function handleFile(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  uploadedFiles[type] = file;
  const previewEl = document.getElementById(type === 'logo' ? 'logoPreview' : 'bgPreview');
  const boxEl = document.getElementById(type === 'logo' ? 'logoBox' : 'bgBox');

  // Show preview
  const url = URL.createObjectURL(file);
  if (type === 'logo') {
    previewEl.innerHTML = `<img src="${url}" alt="logo preview" />`;
  } else {
    previewEl.innerHTML = `<video src="${url}" autoplay muted loop></video>`;
  }
  previewEl.style.display = 'block';
  boxEl.classList.add('has-file');

  // Enable render button if logo is set
  if (uploadedFiles.logo) {
    const btn = document.getElementById('renderBtn');
    btn.disabled = false;
    document.getElementById('renderBtnText').textContent = 'اصنع الفيديو الآن 🎬';
  }
}

// ── Start Render ──
async function startRender() {
  if (!uploadedFiles.logo) return;

  hideAll();
  showProgress();
  animateProgress(5, 30, 2000); // fake 0→30% while uploading

  const formData = new FormData();
  formData.append('logo', uploadedFiles.logo);
  if (uploadedFiles.bg) formData.append('bg', uploadedFiles.bg);
  formData.append('style', selectedStyle);

  try {
    animateProgress(30, 85, 15000); // fake 30→85% during render

    const res = await fetch('/render', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'فشل الرندر');
    }

    animateProgress(85, 100, 500);
    setTimeout(() => showResult(data.videoUrl, data.filename), 600);

  } catch (err) {
    console.error(err);
    showError(err.message || 'حصل خطأ غير متوقع');
  }
}

// ── Progress animation ──
let progressInterval = null;
function animateProgress(from, to, duration) {
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  const step = (to - from) / (duration / 100);
  let current = from;

  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    current = Math.min(current + step, to);
    fill.style.width = current + '%';

    if (current < 20) text.textContent = 'جاري رفع الملفات...';
    else if (current < 50) text.textContent = 'جاري بناء الأنيميشن...';
    else if (current < 80) text.textContent = 'جاري رندر الفيديو... ده بياخد شوية ⏳';
    else if (current < 95) text.textContent = 'تقريبًا خلص... 🎬';
    else text.textContent = 'جاري الانتهاء...';

    if (current >= to) clearInterval(progressInterval);
  }, 100);
}

// ── Show / Hide areas ──
function showProgress() {
  document.getElementById('progressArea').style.display = 'block';
  document.getElementById('renderBtn').disabled = true;
  document.getElementById('renderBtnText').textContent = 'جاري الرندر...';
}

function showResult(videoUrl, filename) {
  hideProgress();
  const area = document.getElementById('resultArea');
  const video = document.getElementById('resultVideo');
  const dlBtn = document.getElementById('downloadBtn');

  video.src = videoUrl;
  dlBtn.href = videoUrl;
  dlBtn.download = filename || 'logomotion.mp4';
  area.style.display = 'block';

  document.getElementById('renderBtn').disabled = false;
  document.getElementById('renderBtnText').textContent = 'اصنع فيديو جديد 🔄';
}

function showError(message) {
  hideProgress();
  document.getElementById('errorText').textContent = message;
  document.getElementById('errorArea').style.display = 'block';
  document.getElementById('renderBtn').disabled = false;
  document.getElementById('renderBtnText').textContent = 'حاول تاني 🔄';
}

function hideProgress() {
  clearInterval(progressInterval);
  document.getElementById('progressArea').style.display = 'none';
}

function hideAll() {
  document.getElementById('progressArea').style.display = 'none';
  document.getElementById('resultArea').style.display = 'none';
  document.getElementById('errorArea').style.display = 'none';
}

function resetStudio() {
  hideAll();
  uploadedFiles = { logo: null, bg: null };
  ['logoPreview', 'bgPreview'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  ['logoBox', 'bgBox'].forEach(id => {
    document.getElementById(id).classList.remove('has-file');
  });
  document.getElementById('renderBtn').disabled = true;
  document.getElementById('renderBtnText').textContent = 'ارفع اللوجو أولًا';
}

// ── Smooth scroll nav offset ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 72, behavior: 'smooth' });
    }
  });
});

// ── Drag & Drop support ──
['logoBox', 'bgBox'].forEach(boxId => {
  const box = document.getElementById(boxId);
  const type = boxId === 'logoBox' ? 'logo' : 'bg';
  const inputId = boxId === 'logoBox' ? 'logoInput' : 'bgInput';

  box.addEventListener('dragover', e => {
    e.preventDefault();
    box.style.borderColor = 'rgba(124,110,245,0.6)';
  });
  box.addEventListener('dragleave', () => {
    box.style.borderColor = '';
  });
  box.addEventListener('drop', e => {
    e.preventDefault();
    box.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = document.getElementById(inputId);
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleFile({ target: input }, type);
    }
  });
});
