(function() {
  'use strict';

  // ---- DOM References ----
  const bgPath = document.getElementById('bg-path');
  const bgBrowse = document.getElementById('bg-browse');
  const bgClear = document.getElementById('bg-clear');
  const canvasWidth = document.getElementById('canvas-width');
  const canvasHeight = document.getElementById('canvas-height');
  const mainText = document.getElementById('main-text');
  const secondLine = document.getElementById('second-line');
  const subTextEnabled = document.getElementById('sub-text-enabled');
  const shadowEnabled = document.getElementById('shadow-enabled');
  const shadowOpacity = document.getElementById('shadow-opacity');
  const shadowOpacityLabel = document.getElementById('shadow-opacity-label');
  const btnSave = document.getElementById('btn-save');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnReset = document.getElementById('btn-reset');
  const previewCanvas = document.getElementById('preview-canvas');
  const previewWrapper = document.getElementById('preview-wrapper');
  const scaleLabel = document.getElementById('scale-label');
  const loadingText = document.getElementById('loading-text');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');

  // ---- State ----
  let backgroundImage = null;
  let previewImageCache = null;
  let updateTimer = null;
  let isGenerating = false;
  let isDarkTheme = true;

  // ---- Hidden file input ----
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/png,image/jpeg,image/bmp,image/webp';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  // ---- Initialization ----
  async function init() {
    try {
      await loadFonts();
      generatePreview();
    } catch (e) {
      console.error('Font loading failed:', e);
    }
  }

  // ========== Theme Toggle ==========
  function applyTheme(dark) {
    isDarkTheme = dark;
    document.body.className = dark ? 'theme-dark' : 'theme-light';
    themeToggleIcon.textContent = dark ? '☀️' : '🌙';
    btnThemeToggle.title = dark ? '切换为浅色主题' : '切换为深色主题';
    btnThemeToggle.classList.toggle('active', dark);
  }

  btnThemeToggle.addEventListener('click', () => applyTheme(!isDarkTheme));

  // ========== Event Handlers ==========
  bgBrowse.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        backgroundImage = img;
        bgPath.value = file.name;
        canvasWidth.value = img.width;
        canvasHeight.value = img.height;
        updateWidthHeightState();
        onParamChanged();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  bgClear.addEventListener('click', () => {
    backgroundImage = null;
    bgPath.value = '';
    updateWidthHeightState();
    onParamChanged();
  });

  shadowEnabled.addEventListener('change', () => {
    shadowOpacity.disabled = !shadowEnabled.checked;
    onParamChanged();
  });

  shadowOpacity.addEventListener('input', () => {
    shadowOpacityLabel.textContent = parseFloat(shadowOpacity.value).toFixed(2);
    onParamChanged();
  });

  // ========== Debounced param change ==========
  function onParamChanged() {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(generatePreview, 200);
  }

  // ========== Bind input events ==========
  [canvasWidth, canvasHeight, mainText, secondLine, subTextEnabled].forEach(el => {
    el.addEventListener('input', onParamChanged);
    el.addEventListener('change', onParamChanged);
  });

  // ========== Width/Height state ==========
  function updateWidthHeightState() {
    const disabled = !!backgroundImage;
    canvasWidth.disabled = disabled;
    canvasHeight.disabled = disabled;
  }

  // ========== Reset defaults ==========
  btnReset.addEventListener('click', () => {
    backgroundImage = null;
    bgPath.value = '';
    canvasWidth.value = 1920;
    canvasHeight.value = 1080;
    canvasWidth.disabled = false;
    canvasHeight.disabled = false;
    mainText.value = '主标题';
    secondLine.value = '';
    subTextEnabled.checked = false;
    shadowEnabled.checked = false;
    shadowOpacity.value = 0.15;
    shadowOpacity.disabled = true;
    shadowOpacityLabel.textContent = '0.15';
    updateWidthHeightState();
    generatePreview();
  });

  // ========== Refresh ==========
  btnRefresh.addEventListener('click', generatePreview);

  // ========== Generate Preview ==========
  async function generatePreview() {
    if (isGenerating) return;
    isGenerating = true;

    const w = parseInt(canvasWidth.value) || 1920;
    const h = parseInt(canvasHeight.value) || 1080;

    if (w <= 0 || h <= 0) {
      isGenerating = false;
      return;
    }

    setButtonsDisabled(true);
    loadingText.style.display = 'block';

    try {
      const result = await generateImage(
        w, h,
        mainText.value || ' ',
        secondLine.value || '',
        subTextEnabled.checked,
        shadowEnabled.checked,
        parseFloat(shadowOpacity.value) || 0.08,
        backgroundImage
      );
      previewImageCache = result;
      showPreview(result);
    } catch (err) {
      console.error('Generate failed:', err);
      showError(err.message || '生成失败');
    } finally {
      loadingText.style.display = 'none';
      setButtonsDisabled(false);
      isGenerating = false;
    }
  }

  // ========== Show Preview ==========
  function showPreview(img) {
    const wrapperW = previewWrapper.clientWidth;
    const wrapperH = previewWrapper.clientHeight;
    if (wrapperW <= 0 || wrapperH <= 0) return;

    const scale = Math.min(wrapperW / img.width, wrapperH / img.height);
    const dispW = Math.round(img.width * scale);
    const dispH = Math.round(img.height * scale);

    previewCanvas.width = dispW;
    previewCanvas.height = dispH;

    const ctx = previewCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, dispW, dispH);

    scaleLabel.textContent = `缩放: ${(scale * 100).toFixed(1)}%`;
  }

  // ========== Show Error ==========
  function showError(msg) {
    const ctx = previewCanvas.getContext('2d');
    previewCanvas.width = 400;
    previewCanvas.height = 100;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 400, 100);
    ctx.fillStyle = '#ff6666';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`生成失败: ${msg}`, 200, 55);
    scaleLabel.textContent = '缩放: --%';
  }

  // ========== Save Image ==========
  btnSave.addEventListener('click', () => {
    if (!previewImageCache) {
      generatePreview().then(() => saveCurrentPreview());
      return;
    }
    saveCurrentPreview();
  });

  function saveCurrentPreview() {
    if (!previewImageCache) return;
    const link = document.createElement('a');
    link.download = 'output.png';
    previewImageCache.toBlob((blob) => {
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  }

  // ========== ResizeObserver ==========
  const resizeObserver = new ResizeObserver(() => {
    if (previewImageCache) showPreview(previewImageCache);
  });
  resizeObserver.observe(previewWrapper);

  // ========== Helpers ==========
  function setButtonsDisabled(disabled) {
    btnSave.disabled = disabled;
    btnRefresh.disabled = disabled;
    btnReset.disabled = disabled;
  }

  // ========== Boot ==========
  init();

})();
