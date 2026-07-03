// ==================== Constants ====================
const FONT_MAIN_TEXT_PATH = 'assets/NotoSansHans-Black.otf';
const FONT_SUB_TEXT_PATH = 'assets/EndfieldByButan.ttf';
const FONT_MAIN_TEXT_ENG_PATH = 'assets/NovecentoWideUltraBold.otf';

const MAIN_TEXT_HEIGHT = 0.2472;
const MAIN_TEXT_SEP = 0.021875;

const SUB_TEXT_HEIGHT = 0.025;
const SUB_TEXT_SEP_PIXEL = 1;

const MAIN_TEXT_HEIGHT_WITH_SECOND_LINE = 0.184;
const MAIN_TEXT_SEP_WITH_SECOND_LINE = 0.00165;
const SUB_TEXT_HEIGHT_WITH_SECOND_LINE = 0.029;

const SECOND_LINE_TEXT_HEIGHT = 0.108;
const SECOND_LINE_TEXT_SEP = 0.0015;

const SECOND_LINE_TEXT_POSITION_Y = 0.924;
const SUB_LINE_TEXT_POSITION_SEP = 0.004;

const SUB_TEXT_SEP_MIDDLE = 0.0113;

const SECOND_LINE_FADE_SCALE = 0.3;
const SUB_TEXT_FADE_SCALE = 0.5;
const SUB_TEXT_FADE_MIN_ALPHA = 0.05;

const DYNAMIC_SPACING_MIN_RATIO = 0.002;
const DYNAMIC_SPACING_DECAY_RATE = 1;
const KERNING_ADJUSTMENT_PX = 0; // 字距微调（像素），与原项目不一致时调整此值

const SHADOW_LONG_AXIS_RATIO = 1.2;
const SHADOW_SHORT_AXIS_RATIO = 1;
const SHADOW_EDGE_AREA_RATIO = 0.33;
const SHADOW_NOISE_RATE = 0.4;
const SHADOW_DEFAULT_OPACITY = 0.15;
const SHADOW_OFF = 0.2;

// ==================== Font Loading ====================
async function loadFonts() {
  const fontFaces = await Promise.all([
    new FontFace('NotoSansHansBlack', `url(${FONT_MAIN_TEXT_PATH})`).load(),
    new FontFace('NovecentoWideUltraBold', `url(${FONT_MAIN_TEXT_ENG_PATH})`).load(),
    new FontFace('EndfieldByButan', `url(${FONT_SUB_TEXT_PATH})`).load(),
  ]);
  for (const f of fontFaces) {
    document.fonts.add(f);
  }
  await document.fonts.ready;
}

// ==================== Helpers ====================
function isChineseChar(ch) {
  return '\u4e00' <= ch && ch <= '\u9fff';
}

function measureChar(ctx, ch, fontStr) {
  ctx.font = fontStr;
  const m = ctx.measureText(ch);
  const charWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const ascent = m.actualBoundingBoxAscent;
  const descent = m.actualBoundingBoxDescent;
  return {
    width: m.width,
    boxLeft: -m.actualBoundingBoxLeft,
    boxTop: -m.actualBoundingBoxAscent,
    boxRight: m.actualBoundingBoxRight,
    boxBottom: m.actualBoundingBoxDescent,
    charWidth,
    ascent,
    descent,
  };
}

// ==================== createTextLayerExact ====================
function createTextLayerExact(text, fontSize, spacingPx = 0, color = [255, 255, 255, 255],
  fontPaths = [FONT_MAIN_TEXT_PATH, FONT_MAIN_TEXT_ENG_PATH]) {
  if (!text) {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    return c;
  }

  const useMixed = Array.isArray(fontPaths);
  const cnFont = useMixed ? `${fontSize}px NotoSansHansBlack` : '';
  const enFont = useMixed ? `${fontSize}px NovecentoWideUltraBold` : '';
  const defaultFont = !useMixed ? `${fontSize}px ${fontPaths}` : '';

  function getFontStr(ch) {
    if (!useMixed) return defaultFont;
    return isChineseChar(ch) ? cnFont : enFont;
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1; tempCanvas.height = 1;
  const tCtx = tempCanvas.getContext('2d');

  let totalWidth = 0;
  let minTop = Infinity;
  let maxBottom = -Infinity;
  const charMetrics = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const fs = getFontStr(ch);
    const m = measureChar(tCtx, ch, fs);
    charMetrics.push(m);
    totalWidth += m.charWidth;
    if (i < text.length - 1) totalWidth += spacingPx;
    minTop = Math.min(minTop, m.boxTop);
    maxBottom = Math.max(maxBottom, m.boxBottom);
  }

  const width = Math.max(1, Math.round(totalWidth));
  const height = maxBottom - minTop;
  const offsetY = -minTop;

  const firstM = charMetrics[0];
  const offsetX = -firstM.boxLeft;

  const layer = document.createElement('canvas');
  layer.width = width;
  layer.height = height;
  const ctx = layer.getContext('2d');

  const colorStr = `rgba(${color[0]},${color[1]},${color[2]},${color[3] / 255})`;

  let x = offsetX;
  const y = offsetY;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const fs = getFontStr(ch);
    ctx.font = fs;
    ctx.fillStyle = colorStr;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(ch, Math.round(x), Math.round(y));
    x += charMetrics[i].charWidth + spacingPx;
  }

  return layer;
}

// Measure subtitle char using advance width for proper Sarkaz font kerning
function measureSubtitleChar(ctx, ch, fontStr) {
  ctx.font = fontStr;
  const m = ctx.measureText(ch);
  return {
    width: m.width,
    charWidth: m.width,
    boxLeft: -m.actualBoundingBoxLeft,
    boxTop: -m.actualBoundingBoxAscent,
    boxRight: m.actualBoundingBoxRight,
    boxBottom: m.actualBoundingBoxDescent,
  };
}

// ==================== createSubtitleLayer ====================
function createSubtitleLayer(paragraphs, fontSize, color = [255, 255, 255, 255],
  spacingPx = SUB_TEXT_SEP_PIXEL, fontPath = FONT_SUB_TEXT_PATH) {
  if (!paragraphs || paragraphs.length === 0) {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    return c;
  }

  const fontStr = `${fontSize}px EndfieldByButan`;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1; tempCanvas.height = 1;
  const tCtx = tempCanvas.getContext('2d');

  const blockImages = [];
  const colorStr = `rgba(${color[0]},${color[1]},${color[2]},${color[3] / 255})`;

  for (const para of paragraphs) {
    const firstLine = para.slice(0, 2);
    const secondLine = para.slice(2);

    function getLineMetrics(line) {
      let total = 0;
      const measures = [];
      for (const ch of line) {
        const m = measureSubtitleChar(tCtx, ch, fontStr);
        measures.push(m);
        total += m.charWidth;
      }
      return { total, measures };
    }

    if (!secondLine.length) {
      const { total: w, measures } = getLineMetrics(firstLine);
      const width = Math.max(1, Math.round(w));
      if (!firstLine.length) {
        const c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        blockImages.push({ canvas: c, w: 1, h: 1 });
        continue;
      }
      const top = Math.min(...measures.map(m => m.boxTop));
      const bottom = Math.max(...measures.map(m => m.boxBottom));
      const height = bottom - top;
      const layer = document.createElement('canvas');
      layer.width = width;
      layer.height = Math.max(1, height);
      const ctx = layer.getContext('2d');
      ctx.font = fontStr;
      ctx.fillStyle = colorStr;
      ctx.textBaseline = 'alphabetic';
      let x = 0;
      const y = -top;
      for (let i = 0; i < firstLine.length; i++) {
        ctx.fillText(firstLine[i], Math.round(x), Math.round(y));
        x += measures[i].charWidth;
      }
      blockImages.push({ canvas: layer, w: width, h: Math.max(1, height) });
      continue;
    }

    // Two lines
    const m1 = [];
    let w1 = 0;
    for (const ch of firstLine) {
      const m = measureChar(tCtx, ch, fontStr);
      m1.push(m);
      w1 += m.charWidth;
    }
    const m2 = [];
    let w2 = 0;
    for (const ch of secondLine) {
      const m = measureChar(tCtx, ch, fontStr);
      m2.push(m);
      w2 += m.charWidth;
    }

    const top1 = m1.length ? Math.min(...m1.map(m => m.boxTop)) : 0;
    const bottom1 = m1.length ? Math.max(...m1.map(m => m.boxBottom)) : 0;
    const top2 = m2.length ? Math.min(...m2.map(m => m.boxTop)) : 0;
    const bottom2 = m2.length ? Math.max(...m2.map(m => m.boxBottom)) : 0;

    const paraWidth = Math.max(1, Math.round(Math.max(w1, w2)));
    const paraHeight = Math.max(1, Math.round((bottom1 - top1) + (bottom2 - top2)));

    const layer = document.createElement('canvas');
    layer.width = paraWidth;
    layer.height = paraHeight;
    const ctx = layer.getContext('2d');
    ctx.font = fontStr;
    ctx.fillStyle = colorStr;
    ctx.textBaseline = 'alphabetic';

    let x = 0;
    const y1 = -top1;
    for (let i = 0; i < firstLine.length; i++) {
      ctx.fillText(firstLine[i], Math.round(x), Math.round(y1));
      x += m1[i].charWidth;
    }
    x = 0;
    const y2 = (bottom1 - top1) - top2;
    for (let i = 0; i < secondLine.length; i++) {
      ctx.fillText(secondLine[i], Math.round(x), Math.round(y2));
      x += m2[i].charWidth;
    }

    blockImages.push({ canvas: layer, w: paraWidth, h: paraHeight });
  }

  // Horizontal arrangement
  const totalW = blockImages.reduce((s, b) => s + b.w, 0) + spacingPx * (blockImages.length - 1);
  const maxH = Math.max(...blockImages.map(b => b.h));
  const result = document.createElement('canvas');
  result.width = Math.max(1, Math.round(totalW));
  result.height = Math.max(1, maxH);
  const rCtx = result.getContext('2d');
  let xOff = 0;
  for (const b of blockImages) {
    const yOff = Math.round((maxH - b.h) / 2);
    rCtx.drawImage(b.canvas, Math.round(xOff), yOff);
    xOff += b.w + spacingPx;
  }
  return result;
}

// ==================== applyVerticalAlphaGradient ====================
function applyVerticalAlphaGradient(layer, yStart, yEnd, startAlpha, endAlpha, preserveOriginalShape = true) {
  const ctx = layer.getContext('2d');
  const imageData = ctx.getImageData(0, 0, layer.width, layer.height);
  const data = imageData.data;
  const w = layer.width;
  const h = layer.height;

  yStart = Math.max(0, Math.min(yStart, h - 1));
  yEnd = Math.max(0, Math.min(yEnd, h - 1));
  if (yStart === yEnd) return layer;

  for (let y = yStart; y <= yEnd; y++) {
    const t = (y - yStart) / (yEnd - yStart);
    const alphaFactor = startAlpha * (1 - t) + endAlpha * t;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a === 0) continue;
      let newA;
      if (preserveOriginalShape) {
        newA = Math.round(a * (alphaFactor / 255));
      } else {
        newA = Math.round(alphaFactor);
      }
      newA = Math.max(0, Math.min(255, newA));
      data[idx + 3] = newA;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return layer;
}

// ==================== convenience wrappers ====================
function mainTextGenerate(text, imgW, imgH, onlyOneLine = true, spacingPx = MAIN_TEXT_SEP) {
  const fontSize = onlyOneLine
    ? Math.round(imgH * MAIN_TEXT_HEIGHT)
    : Math.round(imgH * MAIN_TEXT_HEIGHT_WITH_SECOND_LINE);
  return createTextLayerExact(text, fontSize, spacingPx);
}

function secondLineTextGenerate(text, imgW, imgH) {
  const fontSize = Math.round(imgH * SECOND_LINE_TEXT_HEIGHT);
  const spacingPx = Math.round(imgW * SECOND_LINE_TEXT_SEP);
  const layer = createTextLayerExact(text, fontSize, spacingPx);
  const textHeight = layer.height;
  return applyVerticalAlphaGradient(layer, 0, Math.round(SECOND_LINE_FADE_SCALE * textHeight), 0, 255);
}

function subTextGenerate(text, imgH, onlyOneLine = true) {
  const removeChars = /[·’!"#$%&'()＃！（）*+,\-./:;<=>?@，：？￥★、…．＞【】［］《》？“”‘’\[\]^_`{|}~]+/g;
  const clean = text.replace(removeChars, '');
  const paragraphs = [];
  for (const ch of clean) {
    const code = wubi(ch)[0].toUpperCase();
    paragraphs.push(code);
  }
  const fontSize = onlyOneLine
    ? Math.round(imgH * SUB_TEXT_HEIGHT)
    : Math.round(imgH * SUB_TEXT_HEIGHT_WITH_SECOND_LINE);
  const layer = createSubtitleLayer(paragraphs, fontSize);
  const textHeight = layer.height;
  return applyVerticalAlphaGradient(layer,
    Math.round(SUB_TEXT_FADE_SCALE * textHeight), textHeight - 1,
    255, Math.round(SUB_TEXT_FADE_MIN_ALPHA * 255));
}

// ==================== combineHorizontal ====================
function combineHorizontal(images, spacing) {
  if (!images.length) {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    return c;
  }
  if (images.length === 1) return images[0];
  const totalW = images.reduce((s, img) => s + img.width, 0) + spacing * (images.length - 1);
  const maxH = Math.max(...images.map(img => img.height));
  const combined = document.createElement('canvas');
  combined.width = Math.max(1, totalW);
  combined.height = maxH;
  const ctx = combined.getContext('2d');
  let x = 0;
  for (const img of images) {
    const y = Math.round((maxH - img.height) / 2);
    ctx.drawImage(img, x, y);
    x += img.width + spacing;
  }
  return combined;
}

// ==================== compositeLayersCentered ====================
function compositeLayersCentered(layers, canvasSize = null, background = null) {
  if (!layers.length) {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    return c;
  }

  const minX = Math.min(...layers.map(([_, ox]) => ox));
  const maxX = Math.max(...layers.map(([layer, ox]) => ox + layer.width));
  const minY = Math.min(...layers.map(([_, __, oy]) => oy));
  const maxY = Math.max(...layers.map(([layer, __, oy]) => oy + layer.height));

  const compW = maxX - minX;
  const compH = maxY - minY;

  let canvasW, canvasH, finalCtx;

  if (background) {
    canvasW = background.width;
    canvasH = background.height;
  } else if (canvasSize) {
    canvasW = canvasSize[0];
    canvasH = canvasSize[1];
  } else {
    canvasW = compW;
    canvasH = compH;
  }

  const final = document.createElement('canvas');
  final.width = canvasW;
  final.height = canvasH;
  finalCtx = final.getContext('2d');

  if (background) {
    finalCtx.drawImage(background, 0, 0);
  }

  const startX = Math.round((canvasW - compW) / 2 - minX);
  const startY = Math.round((canvasH - compH) / 2 - minY);

  for (const [layer, offX, offY] of layers) {
    finalCtx.drawImage(layer, startX + offX, startY + offY);
  }

  return final;
}

// ==================== calcDynamicSpacing ====================
function calcDynamicSpacing(baseSpacing, charCount, minRatio = DYNAMIC_SPACING_MIN_RATIO, decayRate = DYNAMIC_SPACING_DECAY_RATE) {
  if (charCount <= 1) return baseSpacing;
  const ratio = minRatio + (baseSpacing - minRatio) * Math.exp(-decayRate * (charCount - 1));
  return Math.max(minRatio, ratio);
}

// ==================== createEllipseShadow ====================
function createEllipseShadow(compW, compH, opacity = SHADOW_DEFAULT_OPACITY) {
  const longAxis = compW * SHADOW_LONG_AXIS_RATIO;
  const shortAxis = compH * SHADOW_SHORT_AXIS_RATIO;
  const centerX = compW / 2;
  const centerY = compH / 2 + compH * SHADOW_OFF;

  const shadowW = Math.ceil(longAxis);
  const shadowH = Math.ceil(shortAxis);

  const shadow = document.createElement('canvas');
  shadow.width = shadowW;
  shadow.height = shadowH;
  const ctx = shadow.getContext('2d');

  // Draw black ellipse
  ctx.fillStyle = `rgba(0,0,0,${opacity})`;
  ctx.beginPath();
  ctx.ellipse(shadowW / 2, shadowH / 2, longAxis / 2, shortAxis / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Add noise
  const imageData = ctx.getImageData(0, 0, shadowW, shadowH);
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0 && Math.random() < SHADOW_NOISE_RATE) {
      const gray = Math.floor(128 + Math.random() * 72);
      data[i - 3] = gray;
      data[i - 2] = gray;
      data[i - 1] = gray;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Edge feathering
  const cx = shadowW / 2;
  const cy = shadowH / 2;
  const aLen = longAxis / 2;
  const bLen = shortAxis / 2;
  const edgeWidth = Math.min(aLen, bLen) * SHADOW_EDGE_AREA_RATIO;

  const imgData2 = ctx.getImageData(0, 0, shadowW, shadowH);
  const d2 = imgData2.data;
  for (let y = 0; y < shadowH; y++) {
    for (let x = 0; x < shadowW; x++) {
      const idx = (y * shadowW + x) * 4;
      const a = d2[idx + 3];
      if (a === 0) continue;
      const dx = (x - cx) / aLen;
      const dy = (y - cy) / bLen;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= 1) {
        d2[idx + 3] = 0;
      } else {
        const innerDist = 1 - dist;
        const normEdge = edgeWidth / Math.min(aLen, bLen);
        if (innerDist < normEdge) {
          const factor = innerDist / normEdge;
          d2[idx + 3] = Math.round(a * factor);
        }
      }
    }
  }
  ctx.putImageData(imgData2, 0, 0);

  const offsetX = Math.round(centerX - shadowW / 2);
  const offsetY = Math.round(centerY - shadowH / 2);
  return { layer: shadow, offsetX, offsetY };
}

// ==================== generateImage ====================
async function generateImage(width, height, mainText, secondLine = '',
  subTextEnabled = false, shadowEnabled = false, shadowOpacity = 0.08, backgroundImage = null) {
  await wubiDict98.load();

  let canvasW, canvasH, bgImg;
  if (backgroundImage) {
    canvasW = backgroundImage.width;
    canvasH = backgroundImage.height;
    bgImg = backgroundImage;
  } else {
    canvasW = width;
    canvasH = height;
    bgImg = null;
  }

  // Dynamic spacing
  const mainLen = mainText.length;
  const baseSep = secondLine ? MAIN_TEXT_SEP_WITH_SECOND_LINE : MAIN_TEXT_SEP;
  const dynamicSepRatio = calcDynamicSpacing(baseSep, mainLen);
  let spacingPx = Math.round(canvasW * dynamicSepRatio) + KERNING_ADJUSTMENT_PX;
  spacingPx = Math.max(1, spacingPx);

  const layers = [];

  // Main title
  if (secondLine) {
    layers.push({ layer: mainTextGenerate(mainText, canvasW, canvasH, false, spacingPx), offX: 0, offY: 0 });
  } else {
    layers.push({ layer: mainTextGenerate(mainText, canvasW, canvasH, true, spacingPx), offX: 0, offY: 0 });
  }

  // Second line
  if (secondLine) {
    const sl = secondLineTextGenerate(secondLine, canvasW, canvasH);
    layers.push({ layer: sl, offX: 0, offY: 0 });
  }

  // Subtitle
  if (subTextEnabled) {
    const mainSub = subTextGenerate(mainText, canvasH, !secondLine);
    const subLayers = [mainSub];
    if (secondLine) {
      const secondSub = subTextGenerate(secondLine, canvasH, false);
      subLayers.push(secondSub);
    }
    const combinedSub = combineHorizontal(subLayers, Math.round(canvasW * SUB_TEXT_SEP_MIDDLE));
    layers.push({ layer: combinedSub, offX: 0, offY: 0 });
  }

  if (!layers.length) {
    const c = document.createElement('canvas');
    c.width = canvasW; c.height = canvasH;
    return c;
  }

  // Horizontal centering
  const widths = layers.map(l => l.layer.width);
  const maxW = Math.max(...widths);
  const centeredLayers = layers.map(l => ({
    layer: l.layer,
    offX: Math.round((maxW - l.layer.width) / 2),
    offY: 0
  }));

  // Vertical stacking
  let currentY = 0;
  let idx = 0;

  centeredLayers[idx].offY = currentY;
  currentY += centeredLayers[idx].layer.height;
  idx++;

  if (secondLine) {
    const yOff = Math.round(centeredLayers[0].layer.height * SECOND_LINE_TEXT_POSITION_Y);
    centeredLayers[idx].offY = yOff;
    currentY = yOff + centeredLayers[idx].layer.height;
    idx++;
  }

  if (subTextEnabled) {
    const spacing = Math.round(canvasH * SUB_LINE_TEXT_POSITION_SEP);
    centeredLayers[idx].offY = currentY + spacing;
  }

  // Reverse order (main title on top)
  centeredLayers.reverse();

  // Convert to tuples for compositeLayersCentered
  let tupleLayers = centeredLayers.map(l => [l.layer, l.offX, l.offY]);

  // Shadow
  if (shadowEnabled) {
    const minX = Math.min(...tupleLayers.map(([_, ox]) => ox));
    const maxX = Math.max(...tupleLayers.map(([layer, ox]) => ox + layer.width));
    const minY = Math.min(...tupleLayers.map(([_, __, oy]) => oy));
    const maxY = Math.max(...tupleLayers.map(([layer, __, oy]) => oy + layer.height));
    const compW = maxX - minX;
    const compH = maxY - minY;
    const shadow = createEllipseShadow(compW, compH, shadowOpacity);
    tupleLayers.unshift([shadow.layer, shadow.offsetX, shadow.offsetY]);
  }

  return compositeLayersCentered(tupleLayers, [canvasW, canvasH], bgImg);
}
