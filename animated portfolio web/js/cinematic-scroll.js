/**
 * Cinematic Scroll-Driven Animation Engine
 * Controls 362 sequential 1080x1920 frames via pinned viewport scroll scrubbing
 * Features:
 * - Ultra-smooth requestAnimationFrame lerp interpolation
 * - Progressive loading with zero-flicker nearest-frame fallback
 * - Widescreen aspect-ratio containment (no distortion or stretching)
 * - Synchronized narrative story cards & real-time HUD metrics
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 362;
  const FRAME_DIR = 'frames_30fps_no_ai_text';
  const FRAME_PREFIX = 'frame_';
  const FRAME_EXT = '.jpg';

  // DOM Elements
  const track = document.getElementById('cinematic-experience');
  const canvas = document.getElementById('cinematic-canvas');
  if (!track || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  const loaderOverlay = document.getElementById('cinematic-loader');
  const loaderText = document.getElementById('cinematic-loader-text');
  const hudCurrentFrame = document.getElementById('hud-current-frame');
  const hudProgressFill = document.getElementById('hud-progress-fill');
  const narrativeCards = document.querySelectorAll('.narrative-card');

  // Frame Cache & State
  const images = new Array(TOTAL_FRAMES + 1);
  const isLoaded = new Array(TOTAL_FRAMES + 1).fill(false);
  let loadedCount = 0;
  let targetFrame = 1;
  let currentFrame = 1;
  let isInitialRenderDone = false;
  let animationFrameId = null;

  // Frame Path Generator
  function getFrameSrc(index) {
    const padded = String(index).padStart(4, '0');
    return `${FRAME_DIR}/${FRAME_PREFIX}${padded}${FRAME_EXT}`;
  }

  // Find Nearest Loaded Frame to eliminate any flicker
  function getNearestLoadedFrame(targetIdx) {
    const rounded = Math.round(targetIdx);
    if (images[rounded] && isLoaded[rounded]) {
      return images[rounded];
    }
    // Search outward for closest loaded frame
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = rounded - offset;
      if (prev >= 1 && isLoaded[prev] && images[prev]) {
        return images[prev];
      }
      const next = rounded + offset;
      if (next <= TOTAL_FRAMES && isLoaded[next] && images[next]) {
        return images[next];
      }
    }
    // Fallback to frame 1
    return images[1] || null;
  }

  // Progressive Preloading Pipeline
  function preloadImage(index) {
    return new Promise((resolve) => {
      if (images[index]) {
        resolve(images[index]);
        return;
      }
      const img = new Image();
      img.src = getFrameSrc(index);
      img.onload = () => {
        images[index] = img;
        isLoaded[index] = true;
        loadedCount++;

        // As soon as Frame 1 loads, render it immediately
        if (index === 1 && !isInitialRenderDone) {
          isInitialRenderDone = true;
          renderFrame(1);
          if (loaderOverlay) {
            loaderOverlay.classList.add('hidden');
          }
        }

        // Update progress in loader if visible
        if (loaderText && loadedCount <= 30) {
          const pct = Math.round((loadedCount / 30) * 100);
          loaderText.textContent = `INITIALIZING CINEMATIC ENGINE (${pct}%)`;
        }

        resolve(img);
      };
      img.onerror = () => {
        // Fallback gracefully on network hiccup
        resolve(null);
      };
    });
  }

  // Load Priority Frames First, then remaining in concurrent batches
  async function initPreloader() {
    // Stage 1: Load frame 1 immediately for instant display
    await preloadImage(1);

    // Stage 2: Load key sequence milestones (every 10th frame) to give instant scrub responsiveness
    const keyFrames = [];
    for (let i = 2; i <= TOTAL_FRAMES; i += 10) {
      keyFrames.push(i);
    }
    for (let i = 2; i <= 25; i++) {
      if (!keyFrames.includes(i)) keyFrames.push(i);
    }

    await Promise.all(keyFrames.map(idx => preloadImage(idx)));

    // Stage 3: Progressively load remaining frames with concurrency pool
    const remainingFrames = [];
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      if (!isLoaded[i]) remainingFrames.push(i);
    }

    const CONCURRENCY = 6;
    let poolIndex = 0;

    async function loadWorker() {
      while (poolIndex < remainingFrames.length) {
        const frameToLoad = remainingFrames[poolIndex++];
        await preloadImage(frameToLoad);
      }
    }

    const workers = [];
    for (let w = 0; w < CONCURRENCY; w++) {
      workers.push(loadWorker());
    }
    await Promise.all(workers);
  }

  // Draw Frame to Canvas with Widescreen Adaptation (No Distortion)
  function renderFrame(frameIdx) {
    const img = getNearestLoadedFrame(frameIdx);
    if (!img) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const displayW = rect.width;
    const displayH = rect.height;

    if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear canvas with deep dark background
    ctx.fillStyle = '#090807';
    ctx.fillRect(0, 0, displayW, displayH);

    // Calculate Aspect Ratio Containment (1080x1920)
    const imgW = img.naturalWidth || 1080;
    const imgH = img.naturalHeight || 1920;
    const imgAspect = imgW / imgH; // ~0.5625
    const canvasAspect = displayW / displayH;

    let drawW, drawH, drawX, drawY;

    if (canvasAspect > imgAspect) {
      // Widescreen display: Fit height completely without clipping or stretching
      drawH = displayH;
      drawW = displayH * imgAspect;
      drawX = (displayW - drawW) / 2;
      drawY = 0;
    } else {
      // Mobile / Portrait display: Fill width
      drawW = displayW;
      drawH = displayW / imgAspect;
      drawX = 0;
      drawY = (displayH - drawH) / 2;
    }

    // Soft Ambient Vignette Glow Behind Center Frame
    const centerX = displayW / 2;
    const centerY = displayH / 2;
    const gradient = ctx.createRadialGradient(
      centerX, centerY, drawW * 0.2,
      centerX, centerY, Math.max(displayW, displayH) * 0.6
    );
    gradient.addColorStop(0, 'rgba(255, 132, 0, 0.08)');
    gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.03)');
    gradient.addColorStop(1, 'rgba(9, 8, 7, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, displayW, displayH);

    // Draw the image centered
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Soft Edge Blending on Wide Screens
    if (canvasAspect > imgAspect) {
      // Left edge soft gradient
      const leftFade = ctx.createLinearGradient(drawX, 0, drawX + 40, 0);
      leftFade.addColorStop(0, '#090807');
      leftFade.addColorStop(1, 'rgba(9, 8, 7, 0)');
      ctx.fillStyle = leftFade;
      ctx.fillRect(drawX, 0, 40, displayH);

      // Right edge soft gradient
      const rightFade = ctx.createLinearGradient(drawX + drawW - 40, 0, drawX + drawW, 0);
      rightFade.addColorStop(0, 'rgba(9, 8, 7, 0)');
      rightFade.addColorStop(1, '#090807');
      ctx.fillStyle = rightFade;
      ctx.fillRect(drawX + drawW - 40, 0, 40, displayH);
    }

    ctx.restore();
  }

  // Calculate Scroll Progress
  function getScrollProgress() {
    const rect = track.getBoundingClientRect();
    const scrollDistance = track.offsetHeight - window.innerHeight;
    if (scrollDistance <= 0) return 0;
    const scrolled = -rect.top;
    return Math.max(0, Math.min(1, scrolled / scrollDistance));
  }

  // Update Narrative Milestones based on Scroll Progress
  function updateMilestones(progress) {
    // 4 Milestones across [0, 1]
    const milestones = [
      { id: 'milestone-1', min: 0.02, max: 0.24 },
      { id: 'milestone-2', min: 0.28, max: 0.50 },
      { id: 'milestone-3', min: 0.54, max: 0.76 },
      { id: 'milestone-4', min: 0.80, max: 0.98 }
    ];

    narrativeCards.forEach((card) => {
      const cardId = card.getAttribute('data-milestone');
      const config = milestones.find(m => m.id === cardId);
      if (config && progress >= config.min && progress <= config.max) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  // Scroll Event Listener
  function onScroll() {
    const progress = getScrollProgress();
    // Map progress to frame index [1, TOTAL_FRAMES]
    targetFrame = 1 + progress * (TOTAL_FRAMES - 1);

    // Update Progress Bar
    if (hudProgressFill) {
      hudProgressFill.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    updateMilestones(progress);
  }

  // Animation Loop (Lerp Interpolation for 60fps Silk Smoothness)
  function renderLoop() {
    // Lerp towards targetFrame
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.005) {
      currentFrame += diff * 0.22;
      const displayIdx = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(currentFrame)));
      renderFrame(displayIdx);

      if (hudCurrentFrame) {
        hudCurrentFrame.textContent = String(displayIdx).padStart(3, '0');
      }
    }

    animationFrameId = requestAnimationFrame(renderLoop);
  }

  // Handle Resize
  function onResize() {
    const displayIdx = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(currentFrame)));
    renderFrame(displayIdx);
  }

  // Initialize
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  initPreloader();
  onScroll();
  renderLoop();
})();
