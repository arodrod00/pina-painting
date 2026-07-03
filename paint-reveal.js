/*
 * Paint-reveal cursor effect.
 * A fixed full-viewport canvas sits behind page content on a cream background.
 * Pointer movement drags an elongated brush-stroke texture (soft pastel,
 * bristle streaks along its length) oriented to the direction of travel, so
 * it reads like an actual brush dragged across a wall rather than a round
 * splatter. Dabs persist and accumulate.
 */
(function () {
  var canvas = document.getElementById('paint-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  // Soft pastels only — kept light so a stroke never fights with dark body
  // text when it lands behind a headline.
  var brushColors = ['#F4C9CC', '#FBE3B0', '#C9E4D8', '#C7DDF2', '#DED0EE'];
  var brushTextures = [];

  // Builds one elongated brush-stroke texture out of individual bristle
  // strands — no solid filled body — so the dab reads as separate hairs
  // dragging paint rather than a flat, crayon-like block of color. Each
  // strand has its own stagger, width, and opacity, and a couple of them
  // skip a short gap to mimic a dry-brush pass.
  function buildBrushTexture(color) {
    var w = 220, h = 70;
    var off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    var octx = off.getContext('2d');
    var cy = h / 2;

    var bristleCount = 13;
    for (var i = 0; i < bristleCount; i++) {
      var yOff = (i / (bristleCount - 1) - 0.5) * h * 0.85 + (Math.random() - 0.5) * 5;
      var xStart = w * (0.04 + Math.random() * 0.1);
      var xEnd = w * (0.86 + Math.random() * 0.1);
      var wobble = (Math.random() - 0.5) * 7;
      var midX = (xStart + xEnd) / 2;

      var hasGap = Math.random() < 0.35;
      var gapAt = xStart + (xEnd - xStart) * (0.35 + Math.random() * 0.3);
      var gapWidth = (xEnd - xStart) * 0.08;

      octx.strokeStyle = color + (Math.random() > 0.45 ? '70' : '40');
      octx.lineWidth = 1.2 + Math.random() * 2.6;
      octx.lineCap = 'round';

      octx.beginPath();
      octx.moveTo(xStart, cy + yOff);
      octx.quadraticCurveTo(midX, cy + yOff + wobble, hasGap ? gapAt - gapWidth : xEnd, cy + yOff + (hasGap ? wobble * 0.5 : 0));
      octx.stroke();

      if (hasGap) {
        octx.beginPath();
        octx.moveTo(gapAt + gapWidth, cy + yOff + wobble * 0.5);
        octx.quadraticCurveTo(midX, cy + yOff + wobble, xEnd, cy + yOff);
        octx.stroke();
      }
    }

    return off;
  }

  function resize() {
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  brushColors.forEach(function (c) {
    brushTextures.push(buildBrushTexture(c));
  });

  resize();
  window.addEventListener('resize', resize);

  var last = null;
  var lastAngle = 0;
  var strokeSeed = Math.floor(Math.random() * brushTextures.length);

  function dabAt(x, y, length, rotation, alpha) {
    var tex = brushTextures[strokeSeed];
    var thickness = length * (tex.height / tex.width);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(tex, -length / 2, -thickness / 2, length, thickness);
    ctx.restore();
  }

  function paintSegment(x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var angle = dist > 1 ? Math.atan2(dy, dx) : lastAngle;
    lastAngle = angle;
    var step = 10;
    var steps = Math.max(1, Math.floor(dist / step));
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var x = x0 + dx * t;
      var y = y0 + dy * t;
      var length = 70 + Math.random() * 40;
      var jitter = (Math.random() - 0.5) * 0.15;
      var alpha = 0.32 + Math.random() * 0.2;
      dabAt(x, y, length, angle + jitter, alpha);
    }
  }

  function handleMove(x, y) {
    if (last) {
      paintSegment(last.x, last.y, x, y);
    } else {
      dabAt(x, y, 60, lastAngle, 0.4);
    }
    last = { x: x, y: y };
  }

  // Input events (mousemove especially) can fire far more often than the
  // display refreshes. Queue the latest point and only paint once per
  // animation frame so drawing never competes with the browser's own
  // scroll/composite work on the main thread.
  var pendingPoint = null;
  var frameQueued = false;
  function flushPaint() {
    frameQueued = false;
    if (pendingPoint) {
      handleMove(pendingPoint.x, pendingPoint.y);
      pendingPoint = null;
    }
  }
  function queueMove(x, y) {
    pendingPoint = { x: x, y: y };
    if (!frameQueued) {
      frameQueued = true;
      requestAnimationFrame(flushPaint);
    }
  }

  window.addEventListener('mousemove', function (e) {
    queueMove(e.clientX, e.clientY);
  }, { passive: true });
  window.addEventListener('mouseleave', function () {
    last = null;
    strokeSeed = Math.floor(Math.random() * brushTextures.length);
  });

  window.addEventListener('touchmove', function (e) {
    var t = e.touches[0];
    if (!t) return;
    queueMove(t.clientX, t.clientY);
  }, { passive: true });
  window.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    if (!t) return;
    strokeSeed = Math.floor(Math.random() * brushTextures.length);
    handleMove(t.clientX, t.clientY);
  }, { passive: true });
  window.addEventListener('touchend', function () {
    last = null;
  });
})();
