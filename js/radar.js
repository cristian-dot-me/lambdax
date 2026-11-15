/**
 * LambdaX — NASA NISAR Citizen HUD
 * Detailed NASA-ISRO NISAR SAR Satellite in Orbit Illustration & Animation
 * Mission Control & Orbital Geospatial Aesthetic
 */

class HeroRadar {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.animationId = null;
    this.isVisible = true;
    this.time = 0;

    this.palette = {
      bgDark: '#061A26',
      surfaceSecondary: '#113740',
      accentPrimary: '#52D9D9',
      accentHighlight: '#04D9C4',
      textPrimary: '#F0FDFE',
      textMuted: '#8EA4B0',
      goldFoil: '#E5A93C',
      goldFoilDark: '#9A6B1F'
    };

    this.stars = [];
    this.initStars();
    this.setupResize();
    this.setupIntersection();
    this.animate();
  }

  initStars() {
    this.stars = [];
    // Deterministic-feel starfield for clean aerospace backdrop
    const count = 48;
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: (Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1,
        y: (Math.sin(i * 269.5 + 183.3) * 43758.5453) % 1,
        radius: 0.6 + ((i * 17) % 10) * 0.11,
        alpha: 0.18 + ((i * 29) % 10) * 0.06,
        twinkleSpeed: 0.6 + ((i * 13) % 7) * 0.25,
        phase: i * 0.9,
        cyan: i % 4 === 0
      });
    }
    this.stars.forEach(s => {
      if (s.x < 0) s.x += 1;
      if (s.y < 0) s.y += 1;
      // Keep stars mostly in the upper 82% above the Earth limb
      s.y = s.y * 0.82;
    });
  }

  setupResize() {
    const resize = () => {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement
        ? this.canvas.parentElement.getBoundingClientRect()
        : this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const size = Math.min(rect.width || 520, 540);

      this.canvas.width = size * dpr;
      this.canvas.height = size * dpr;
      this.canvas.style.width = `${size}px`;
      this.canvas.style.height = `${size}px`;

      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
      this.size = size;
    };

    window.addEventListener('resize', resize);
    resize();
  }

  setupIntersection() {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && !this.animationId) {
          this.animate();
        }
      });
    }, { threshold: 0.05 });

    observer.observe(this.canvas);
  }

  /* -------------------------------------------------------------
   * 1. Deep Space Starfield & Ambient Orbital Halo
   * ------------------------------------------------------------- */
  drawSpaceBackdrop() {
    const { ctx, size, time, stars } = this;
    const s = size / 520;

    // Subtle deep-space ambient nebula glow behind spacecraft
    const ambient = ctx.createRadialGradient(
      size * 0.52, size * 0.44, 10 * s,
      size * 0.52, size * 0.44, 240 * s
    );
    ambient.addColorStop(0, 'rgba(17, 55, 64, 0.52)');
    ambient.addColorStop(0.55, 'rgba(4, 217, 196, 0.07)');
    ambient.addColorStop(1, 'rgba(6, 26, 38, 0)');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, size, size);

    // Stars
    stars.forEach(star => {
      const twinkle = 0.65 + 0.35 * Math.sin(time * star.twinkleSpeed + star.phase);
      const alpha = star.alpha * twinkle;
      ctx.save();
      ctx.beginPath();
      ctx.arc(star.x * size, star.y * size, star.radius * s, 0, Math.PI * 2);
      ctx.fillStyle = star.cyan
        ? `rgba(82, 217, 217, ${alpha.toFixed(3)})`
        : `rgba(240, 253, 254, ${alpha.toFixed(3)})`;
      if (star.radius > 1.2) {
        ctx.shadowColor = '#52D9D9';
        ctx.shadowBlur = 4 * s;
      }
      ctx.fill();
      ctx.restore();
    });

    // Subtle orbital reference trajectory arc passing through spacecraft
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      size * 0.5,
      size * 1.18,
      size * 0.92,
      size * 0.66,
      -0.14,
      Math.PI * 1.18,
      Math.PI * 1.82
    );
    ctx.strokeStyle = 'rgba(82, 217, 217, 0.18)';
    ctx.lineWidth = 1 * s;
    ctx.setLineDash([5 * s, 6 * s]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 2. Curved Earth Horizon, Atmospheric Glow & Active SAR Swath
   * ------------------------------------------------------------- */
  drawEarthHorizon() {
    const { ctx, size, time } = this;
    const s = size / 520;

    const earthCx = size * 0.5;
    const earthCy = size * 1.54;
    const earthR = size * 0.72;

    ctx.save();

    // Outer atmospheric scattering halo
    const atmoGrad = ctx.createRadialGradient(
      earthCx, earthCy, earthR - 18 * s,
      earthCx, earthCy, earthR + 58 * s
    );
    atmoGrad.addColorStop(0, 'rgba(4, 217, 196, 0.38)');
    atmoGrad.addColorStop(0.28, 'rgba(82, 217, 217, 0.18)');
    atmoGrad.addColorStop(0.65, 'rgba(17, 55, 64, 0.08)');
    atmoGrad.addColorStop(1, 'rgba(6, 26, 38, 0)');

    ctx.beginPath();
    ctx.arc(earthCx, earthCy, earthR + 58 * s, Math.PI * 1.15, Math.PI * 1.85);
    ctx.lineTo(earthCx, earthCy);
    ctx.closePath();
    ctx.fillStyle = atmoGrad;
    ctx.fill();

    // Planetary body fill
    const bodyGrad = ctx.createRadialGradient(
      earthCx, earthCy - earthR * 0.95, 10 * s,
      earthCx, earthCy - earthR * 0.4, earthR * 0.7
    );
    bodyGrad.addColorStop(0, '#0D313B');
    bodyGrad.addColorStop(0.35, '#08202B');
    bodyGrad.addColorStop(1, '#061A26');

    ctx.beginPath();
    ctx.arc(earthCx, earthCy, earthR, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Clip to Earth disk for geodesic grid and SAR ground swath
    ctx.save();
    ctx.beginPath();
    ctx.arc(earthCx, earthCy, earthR, 0, Math.PI * 2);
    ctx.clip();

    // Geodesic latitude arcs
    ctx.strokeStyle = 'rgba(82, 217, 217, 0.11)';
    ctx.lineWidth = 0.8 * s;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(earthCx, earthCy + i * 24 * s, earthR - i * 10 * s, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }

    // Geodesic longitude curves
    for (let offset = -200; offset <= 200; offset += 50) {
      ctx.beginPath();
      ctx.moveTo(earthCx + offset * s * 0.55, earthCy - earthR);
      ctx.quadraticCurveTo(
        earthCx + offset * s * 1.25,
        earthCy - earthR + 65 * s,
        earthCx + offset * s * 1.65,
        size
      );
      ctx.stroke();
    }

    // Illuminated SAR Ground Swath Corridor on Earth surface
    const swathLeftTop = size * 0.34;
    const swathRightTop = size * 0.62;
    const swathLeftBot = size * 0.22;
    const swathRightBot = size * 0.68;
    const horizonY = earthCy - earthR + 6 * s;

    const swathSurfaceGrad = ctx.createLinearGradient(swathLeftTop, horizonY, swathRightBot, size);
    swathSurfaceGrad.addColorStop(0, 'rgba(4, 217, 196, 0.28)');
    swathSurfaceGrad.addColorStop(0.5, 'rgba(82, 217, 217, 0.14)');
    swathSurfaceGrad.addColorStop(1, 'rgba(4, 217, 196, 0.03)');

    ctx.beginPath();
    ctx.moveTo(swathLeftTop, horizonY);
    ctx.lineTo(swathRightTop, horizonY);
    ctx.lineTo(swathRightBot, size + 10 * s);
    ctx.lineTo(swathLeftBot, size + 10 * s);
    ctx.closePath();
    ctx.fillStyle = swathSurfaceGrad;
    ctx.fill();

    // Swath boundary lines on ground
    ctx.strokeStyle = 'rgba(4, 217, 196, 0.5)';
    ctx.lineWidth = 1.1 * s;
    ctx.setLineDash([4 * s, 4 * s]);
    ctx.beginPath();
    ctx.moveTo(swathLeftTop, horizonY);
    ctx.lineTo(swathLeftBot, size);
    ctx.moveTo(swathRightTop, horizonY);
    ctx.lineTo(swathRightBot, size);
    ctx.stroke();
    ctx.setLineDash([]);

    // Animated SAR scan cells along ground swath
    const scanOffset = (time * 18) % 24;
    for (let row = 0; row < 5; row++) {
      const yProg = ((row * 24 + scanOffset) / 115);
      if (yProg > 1) continue;
      const y = horizonY + yProg * (size - horizonY);
      const lX = swathLeftTop + (swathLeftBot - swathLeftTop) * yProg;
      const rX = swathRightTop + (swathRightBot - swathRightTop) * yProg;
      const rowAlpha = (1 - yProg) * 0.45;

      ctx.strokeStyle = `rgba(82, 217, 217, ${rowAlpha.toFixed(3)})`;
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(lX, y);
      ctx.lineTo(rX, y);
      ctx.stroke();
    }

    ctx.restore(); // End Earth clip

    // Crisp glowing Earth horizon limb line
    ctx.beginPath();
    ctx.arc(earthCx, earthCy, earthR, Math.PI * 1.21, Math.PI * 1.79);
    ctx.strokeStyle = '#04D9C4';
    ctx.lineWidth = 2 * s;
    ctx.shadowColor = '#04D9C4';
    ctx.shadowBlur = 16 * s;
    ctx.stroke();

    // Secondary inner cyan highlight
    ctx.beginPath();
    ctx.arc(earthCx, earthCy, earthR - 1.5 * s, Math.PI * 1.28, Math.PI * 1.72);
    ctx.strokeStyle = '#F0FDFE';
    ctx.lineWidth = 0.8 * s;
    ctx.globalAlpha = 0.65;
    ctx.stroke();

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 3. Active SAR Radar Beam (Feedhorn -> 12m Reflector -> Earth)
   * ------------------------------------------------------------- */
  drawSARBeam(satTransform) {
    const { ctx, size, time } = this;
    const s = size / 520;
    const { busX, busY, refX, refY } = satTransform;

    ctx.save();

    // A) Downlink SAR Swath Cone from 12m Reflector to Earth Limb
    const earthLeftX = size * 0.31;
    const earthRightX = size * 0.64;
    const earthTargetY = size * 0.84;

    const beamGrad = ctx.createLinearGradient(refX, refY, size * 0.48, earthTargetY);
    beamGrad.addColorStop(0, 'rgba(4, 217, 196, 0.24)');
    beamGrad.addColorStop(0.45, 'rgba(82, 217, 217, 0.10)');
    beamGrad.addColorStop(1, 'rgba(4, 217, 196, 0.02)');

    ctx.beginPath();
    ctx.moveTo(refX - 46 * s, refY + 12 * s);
    ctx.lineTo(refX + 46 * s, refY - 8 * s);
    ctx.lineTo(earthRightX, earthTargetY);
    ctx.lineTo(earthLeftX, earthTargetY);
    ctx.closePath();
    ctx.fillStyle = beamGrad;
    ctx.fill();

    // Outer beam boundary rays
    ctx.strokeStyle = 'rgba(4, 217, 196, 0.32)';
    ctx.lineWidth = 1 * s;
    ctx.setLineDash([4 * s, 6 * s]);
    ctx.beginPath();
    ctx.moveTo(refX - 46 * s, refY + 12 * s);
    ctx.lineTo(earthLeftX, earthTargetY);
    ctx.moveTo(refX + 46 * s, refY - 8 * s);
    ctx.lineTo(earthRightX, earthTargetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Animated Radar Pulse Wavefronts propagating from 12m Reflector to Earth
    const numWaves = 4;
    for (let i = 0; i < numWaves; i++) {
      const p = ((time * 0.38 + i / numWaves) % 1);
      const wx = refX + (size * 0.475 - refX) * p;
      const wy = refY + (earthTargetY - refY) * p;
      const rx = (38 + p * 48) * s;
      const ry = (8 + p * 10) * s;
      const alpha = Math.sin(p * Math.PI) * 0.42;

      ctx.beginPath();
      ctx.ellipse(wx, wy, rx, ry, -0.1, 0.15, Math.PI - 0.15);
      ctx.strokeStyle = `rgba(4, 217, 196, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.3 * s;
      ctx.stroke();
    }

    // B) Uplink Feed Cone from Spacecraft L/S-Band Feed Tiles to 12m Reflector
    const feedOriginX = busX + 8 * s;
    const feedOriginY = busY - 18 * s;

    const feedGrad = ctx.createLinearGradient(feedOriginX, feedOriginY, refX, refY);
    feedGrad.addColorStop(0, 'rgba(4, 217, 196, 0.42)');
    feedGrad.addColorStop(1, 'rgba(82, 217, 217, 0.14)');

    ctx.beginPath();
    ctx.moveTo(feedOriginX - 8 * s, feedOriginY);
    ctx.lineTo(feedOriginX + 10 * s, feedOriginY - 4 * s);
    ctx.lineTo(refX + 42 * s, refY - 6 * s);
    ctx.lineTo(refX - 42 * s, refY + 10 * s);
    ctx.closePath();
    ctx.fillStyle = feedGrad;
    ctx.fill();

    // Uplink pulse arcs from feedhorn to reflector
    for (let i = 0; i < 3; i++) {
      const p = ((time * 0.65 + i / 3) % 1);
      const fx = feedOriginX + (refX - feedOriginX) * p;
      const fy = feedOriginY + (refY - feedOriginY) * p;
      const r = (10 + p * 28) * s;
      const alpha = (1 - p * 0.5) * 0.45;

      ctx.beginPath();
      ctx.arc(fx, fy, r, Math.PI * 1.15, Math.PI * 1.75);
      ctx.strokeStyle = `rgba(82, 217, 217, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.1 * s;
      ctx.stroke();
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 4. Solar Array Wing Helper (Port & Starboard Wings)
   * ------------------------------------------------------------- */
  drawSolarWing(originX, originY, angle, length, width, panelsCount, isForeground) {
    const { ctx, size, time } = this;
    const s = size / 520;

    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(angle);

    const yokeLen = 22 * s;
    // Structural gimbal yoke (A-frame strut)
    ctx.strokeStyle = '#52D9D9';
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(0, -5 * s);
    ctx.lineTo(yokeLen, -width * 0.28);
    ctx.moveTo(0, 5 * s);
    ctx.lineTo(yokeLen, width * 0.28);
    ctx.moveTo(0, 0);
    ctx.lineTo(yokeLen, 0);
    ctx.stroke();

    // Hinge node
    ctx.fillStyle = '#04D9C4';
    ctx.beginPath();
    ctx.arc(0, 0, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    const gap = 3.5 * s;
    const panelLen = (length - yokeLen - gap * (panelsCount - 1)) / panelsCount;

    for (let p = 0; p < panelsCount; p++) {
      const px = yokeLen + p * (panelLen + gap);
      const py = -width / 2;

      // Photovoltaic cell gradient
      const cellGrad = ctx.createLinearGradient(px, py, px + panelLen, py + width);
      cellGrad.addColorStop(0, '#082231');
      cellGrad.addColorStop(0.5, '#113740');
      cellGrad.addColorStop(1, '#092736');

      ctx.fillStyle = cellGrad;
      ctx.strokeStyle = isForeground ? '#52D9D9' : 'rgba(82, 217, 217, 0.72)';
      ctx.lineWidth = (isForeground ? 1.4 : 1.1) * s;

      ctx.beginPath();
      ctx.rect(px, py, panelLen, width);
      ctx.fill();
      ctx.stroke();

      // Subtle solar cell grid lines
      ctx.strokeStyle = 'rgba(82, 217, 217, 0.22)';
      ctx.lineWidth = 0.7 * s;
      const subCols = 4;
      for (let c = 1; c < subCols; c++) {
        const cx = px + (panelLen / subCols) * c;
        ctx.beginPath();
        ctx.moveTo(cx, py);
        ctx.lineTo(cx, py + width);
        ctx.stroke();
      }
      // Horizontal busbars
      for (let r = 1; r <= 2; r++) {
        const ry = py + (width / 3) * r;
        ctx.beginPath();
        ctx.moveTo(px, ry);
        ctx.lineTo(px + panelLen, ry);
        ctx.stroke();
      }

      // Inter-panel hinges
      if (p < panelsCount - 1) {
        ctx.strokeStyle = '#04D9C4';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(px + panelLen, -width * 0.28);
        ctx.lineTo(px + panelLen + gap, -width * 0.28);
        ctx.moveTo(px + panelLen, width * 0.28);
        ctx.lineTo(px + panelLen + gap, width * 0.28);
        ctx.stroke();
      }
    }

    // Subtle slow orbital sunlight shimmer across wing
    const shimmerPos = ((Math.sin(time * 0.55 + (isForeground ? 0 : 1.5)) + 1) * 0.5);
    const shimmerX = yokeLen + shimmerPos * (length - yokeLen);
    const shimmerGrad = ctx.createLinearGradient(shimmerX - 18 * s, 0, shimmerX + 18 * s, 0);
    shimmerGrad.addColorStop(0, 'rgba(4, 217, 196, 0)');
    shimmerGrad.addColorStop(0.5, 'rgba(4, 217, 196, 0.18)');
    shimmerGrad.addColorStop(1, 'rgba(4, 217, 196, 0)');
    ctx.fillStyle = shimmerGrad;
    ctx.fillRect(yokeLen, -width / 2, length - yokeLen, width);

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 5. Deployable Astromast Boom & 12-Meter SAR Mesh Reflector
   * ------------------------------------------------------------- */
  drawBoomAndReflector(busX, busY, refX, refY) {
    const { ctx, size, time } = this;
    const s = size / 520;

    // Boom base on upper radar tower
    const boomBaseX = busX + 26 * s;
    const boomBaseY = busY - 26 * s;
    // Boom tip hinge on outer perimeter of the 12m reflector
    const boomTipX = refX + 58 * s;
    const boomTipY = refY - 16 * s;

    ctx.save();

    // Draw Astromast Lattice Boom (3D Triangular Cross-Braced Mast)
    const dx = boomTipX - boomBaseX;
    const dy = boomTipY - boomBaseY;
    const boomLen = Math.hypot(dx, dy);
    const nx = -dy / boomLen;
    const ny = dx / boomLen;
    const halfW = 5.5 * s;

    // Outer mast longerons
    ctx.strokeStyle = '#52D9D9';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(boomBaseX + nx * halfW, boomBaseY + ny * halfW);
    ctx.lineTo(boomTipX + nx * halfW * 0.75, boomTipY + ny * halfW * 0.75);
    ctx.moveTo(boomBaseX - nx * halfW, boomBaseY - ny * halfW);
    ctx.lineTo(boomTipX - nx * halfW * 0.75, boomTipY - ny * halfW * 0.75);
    ctx.stroke();

    // Central spine longeron
    ctx.strokeStyle = 'rgba(4, 217, 196, 0.55)';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(boomBaseX, boomBaseY);
    ctx.lineTo(boomTipX, boomTipY);
    ctx.stroke();

    // Cross-bracing bays along the boom
    const bays = 9;
    ctx.strokeStyle = 'rgba(82, 217, 217, 0.65)';
    ctx.lineWidth = 0.95 * s;
    ctx.beginPath();
    for (let i = 0; i < bays; i++) {
      const t0 = i / bays;
      const t1 = (i + 1) / bays;
      const w0 = halfW * (1 - t0 * 0.25);
      const w1 = halfW * (1 - t1 * 0.25);

      const x0A = boomBaseX + dx * t0 + nx * w0;
      const y0A = boomBaseY + dy * t0 + ny * w0;
      const x0B = boomBaseX + dx * t0 - nx * w0;
      const y0B = boomBaseY + dy * t0 - ny * w0;

      const x1A = boomBaseX + dx * t1 + nx * w1;
      const y1A = boomBaseY + dy * t1 + ny * w1;
      const x1B = boomBaseX + dx * t1 - nx * w1;
      const y1B = boomBaseY + dy * t1 - ny * w1;

      // Batten ring
      ctx.moveTo(x0A, y0A);
      ctx.lineTo(x0B, y0B);
      // Diagonal X-bracing
      ctx.moveTo(x0A, y0A);
      ctx.lineTo(x1B, y1B);
      ctx.moveTo(x0B, y0B);
      ctx.lineTo(x1A, y1A);
    }
    ctx.stroke();

    // Boom hinge bracket at reflector perimeter
    ctx.fillStyle = '#113740';
    ctx.strokeStyle = '#04D9C4';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.arc(boomTipX, boomTipY, 4.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // -------------------------------------------------------------
    // 12-Meter Deployable Wire-Mesh SAR Antenna Reflector
    // -------------------------------------------------------------
    ctx.save();
    ctx.translate(refX, refY);
    ctx.rotate(-0.18); // Tilted toward spacecraft feed & Earth swath

    const rx = 64 * s;
    const ry = 25 * s;
    const hoopDepth = 9 * s;

    // Outer ambient glow around the 12m reflector
    ctx.save();
    ctx.shadowColor = '#04D9C4';
    ctx.shadowBlur = 22 * s;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(4, 217, 196, 0.55)';
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    ctx.restore();

    // Upper hoop cylinder depth rim (back half of deployable hoop truss)
    ctx.fillStyle = 'rgba(17, 55, 64, 0.55)';
    ctx.strokeStyle = 'rgba(82, 217, 217, 0.5)';
    ctx.lineWidth = 1.1 * s;
    ctx.beginPath();
    ctx.ellipse(0, -hoopDepth, rx, ry, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(rx, 0);
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Parabolic Gold-Cyan Wire Mesh Surface
    const meshGrad = ctx.createRadialGradient(-8 * s, 3 * s, 4 * s, 0, 0, rx);
    meshGrad.addColorStop(0, 'rgba(4, 217, 196, 0.32)');
    meshGrad.addColorStop(0.45, 'rgba(229, 169, 60, 0.20)'); // Gold wire-mesh tint
    meshGrad.addColorStop(0.82, 'rgba(17, 55, 64, 0.65)');
    meshGrad.addColorStop(1, 'rgba(82, 217, 217, 0.35)');

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = meshGrad;
    ctx.fill();

    // Concentric geodesic tension rings on parabolic mesh
    const ringFracs = [0.25, 0.5, 0.75];
    ringFracs.forEach((f, idx) => {
      const sag = (1 - f * f) * 3.5 * s;
      ctx.beginPath();
      ctx.ellipse(0, -sag, rx * f, ry * f, 0, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 1
        ? 'rgba(229, 169, 60, 0.42)'
        : 'rgba(82, 217, 217, 0.35)';
      ctx.lineWidth = 0.85 * s;
      ctx.stroke();
    });

    // 24 Radial geodesic mesh ribs & perimeter hoop truss struts
    const numRibs = 24;
    ctx.strokeStyle = 'rgba(82, 217, 217, 0.32)';
    ctx.lineWidth = 0.75 * s;
    ctx.beginPath();
    for (let i = 0; i < numRibs; i++) {
      const theta = (i / numRibs) * Math.PI * 2;
      const px = Math.cos(theta) * rx;
      const py = Math.sin(theta) * ry;
      ctx.moveTo(0, -3.5 * s);
      ctx.lineTo(px, py);

      // Vertical hoop column struts around the rim
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - hoopDepth);
    }
    ctx.stroke();

    // Animated radar phase ring across reflector mesh
    const pulseFrac = (time * 0.45) % 1;
    ctx.beginPath();
    ctx.ellipse(
      0,
      -(1 - pulseFrac * pulseFrac) * 3 * s,
      rx * pulseFrac,
      ry * pulseFrac,
      0,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = `rgba(4, 217, 196, ${((1 - pulseFrac) * 0.65).toFixed(3)})`;
    ctx.lineWidth = 1.4 * s;
    ctx.stroke();

    // Upper & Lower Structural Hoop Rings
    ctx.beginPath();
    ctx.ellipse(0, -hoopDepth, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(82, 217, 217, 0.65)';
    ctx.lineWidth = 1.2 * s;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#04D9C4';
    ctx.lineWidth = 1.8 * s;
    ctx.stroke();

    // Perimeter deployment hinge nodes on the hoop
    ctx.fillStyle = '#F0FDFE';
    for (let i = 0; i < numRibs; i += 2) {
      const theta = (i / numRibs) * Math.PI * 2;
      const px = Math.cos(theta) * rx;
      const py = Math.sin(theta) * ry;
      ctx.beginPath();
      ctx.arc(px, py, 1.5 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central parabolic hub vertex
    ctx.fillStyle = '#04D9C4';
    ctx.beginPath();
    ctx.arc(0, -3.5 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 6. Spacecraft Bus & Dual-Radar Payload
   * ------------------------------------------------------------- */
  drawSpacecraftBus(busX, busY) {
    const { ctx, size, time } = this;
    const s = size / 520;

    ctx.save();
    ctx.translate(busX, busY);
    ctx.rotate(-0.12);

    // 1. Nadir High-Gain Ka-Band Downlink Antenna (underside of bus)
    ctx.strokeStyle = '#52D9D9';
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.moveTo(-12 * s, 24 * s);
    ctx.lineTo(-16 * s, 36 * s);
    ctx.stroke();

    ctx.fillStyle = '#113740';
    ctx.beginPath();
    ctx.ellipse(-18 * s, 38 * s, 9 * s, 4 * s, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Main Spacecraft Bus (ISRO I-3K Heritage Bus — Left/Rear Section with Gold MLI Foil)
    // Top face of bus
    ctx.fillStyle = '#143C47';
    ctx.strokeStyle = '#52D9D9';
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.moveTo(-42 * s, -8 * s);
    ctx.lineTo(-6 * s, -22 * s);
    ctx.lineTo(14 * s, -12 * s);
    ctx.lineTo(-22 * s, 2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Front-left face (Gold/Amber Multi-Layer Insulation thermal blanket)
    const foilGrad = ctx.createLinearGradient(-42 * s, -8 * s, -22 * s, 28 * s);
    foilGrad.addColorStop(0, 'rgba(229, 169, 60, 0.78)');
    foilGrad.addColorStop(0.5, 'rgba(181, 124, 30, 0.68)');
    foilGrad.addColorStop(1, 'rgba(120, 80, 18, 0.75)');

    ctx.fillStyle = foilGrad;
    ctx.strokeStyle = '#52D9D9';
    ctx.beginPath();
    ctx.moveTo(-42 * s, -8 * s);
    ctx.lineTo(-22 * s, 2 * s);
    ctx.lineTo(-22 * s, 28 * s);
    ctx.lineTo(-42 * s, 18 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // MLI thermal quilting lines
    ctx.strokeStyle = 'rgba(240, 253, 254, 0.25)';
    ctx.lineWidth = 0.7 * s;
    ctx.beginPath();
    ctx.moveTo(-42 * s, 5 * s);
    ctx.lineTo(-22 * s, 15 * s);
    ctx.moveTo(-32 * s, -3 * s);
    ctx.lineTo(-32 * s, 23 * s);
    ctx.stroke();

    // 3. NASA-ISRO Integrated Radar Instrument Tower (Right/Forward Octagonal Payload Module)
    // Side structural panel
    const bodyGrad = ctx.createLinearGradient(-22 * s, 2 * s, 32 * s, 26 * s);
    bodyGrad.addColorStop(0, '#113740');
    bodyGrad.addColorStop(1, '#071F2C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#04D9C4';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(-22 * s, 2 * s);
    ctx.lineTo(14 * s, -12 * s);
    ctx.lineTo(34 * s, -4 * s);
    ctx.lineTo(34 * s, 18 * s);
    ctx.lineTo(-22 * s, 28 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Internal structural truss framing on radar module
    ctx.strokeStyle = 'rgba(82, 217, 217, 0.38)';
    ctx.lineWidth = 0.9 * s;
    ctx.beginPath();
    ctx.moveTo(-4 * s, -5 * s);
    ctx.lineTo(-4 * s, 25 * s);
    ctx.moveTo(14 * s, -12 * s);
    ctx.lineTo(14 * s, 21 * s);
    ctx.moveTo(-22 * s, 15 * s);
    ctx.lineTo(34 * s, 7 * s);
    ctx.stroke();

    // 4. Phased-Array Radar Feed Assembly (Upper Deck Aimed at 12m Reflector)
    ctx.fillStyle = '#0B2B36';
    ctx.strokeStyle = '#04D9C4';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(-6 * s, -22 * s);
    ctx.lineTo(26 * s, -30 * s);
    ctx.lineTo(38 * s, -18 * s);
    ctx.lineTo(14 * s, -12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Active Radar Feedhorn Array Tiles (pulsing cyan glow)
    const feedPulse = 0.65 + 0.35 * Math.sin(time * 2.4);
    ctx.save();
    ctx.fillStyle = `rgba(4, 217, 196, ${(0.45 * feedPulse).toFixed(3)})`;
    ctx.strokeStyle = '#F0FDFE';
    ctx.lineWidth = 0.9 * s;
    ctx.shadowColor = '#04D9C4';
    ctx.shadowBlur = 10 * s;

    // Two rows of phased-array feed tiles
    for (let t = 0; t < 3; t++) {
      const tx = 2 * s + t * 9 * s;
      const ty = -21 * s - t * 2.2 * s;
      ctx.beginPath();
      ctx.rect(tx, ty, 6.5 * s, 5 * s);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Spacecraft status beacon LED
    const beaconAlpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.8));
    ctx.save();
    ctx.fillStyle = '#04D9C4';
    ctx.shadowColor = '#04D9C4';
    ctx.shadowBlur = 8 * s;
    ctx.globalAlpha = beaconAlpha;
    ctx.beginPath();
    ctx.arc(-12 * s, 8 * s, 2.2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 7. Mission-Control Technical Callouts & Telemetry Overlay
   * ------------------------------------------------------------- */
  drawCalloutsAndHUD(satTransform) {
    const { ctx, size } = this;
    const s = size / 520;
    const isEs = document.documentElement.lang === 'es';

    const { busX, busY, refX, refY } = satTransform;

    ctx.save();
    ctx.font = `600 ${Math.max(9, Math.round(10 * s))}px 'JetBrains Mono', Consolas, monospace`;

    // Helper for sleek leader callout lines
    const drawCallout = (px, py, elbowX, elbowY, endX, label, align = 'left') => {
      ctx.save();
      // Target point reticle
      ctx.fillStyle = '#04D9C4';
      ctx.beginPath();
      ctx.arc(px, py, 2.2 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(82, 217, 217, 0.45)';
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.arc(px, py, 5 * s, 0, Math.PI * 2);
      ctx.stroke();

      // Leader line
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(elbowX, elbowY);
      ctx.lineTo(endX, elbowY);
      ctx.stroke();

      // Label text
      ctx.fillStyle = 'rgba(240, 253, 254, 0.88)';
      ctx.textAlign = align;
      ctx.fillText(label, align === 'left' ? endX + 5 * s : endX - 5 * s, elbowY + 3 * s);
      ctx.restore();
    };

    // Callout 1: 12m Deployable SAR Mesh Reflector
    drawCallout(
      refX - 44 * s,
      refY - 12 * s,
      refX - 78 * s,
      refY - 34 * s,
      refX - 118 * s,
      isEs ? 'REFLECTOR SAR 12m' : '12m SAR REFLECTOR',
      'right'
    );

    // Callout 2: Deployable Boom
    drawCallout(
      (busX + refX) * 0.5 + 42 * s,
      (busY + refY) * 0.5 - 18 * s,
      (busX + refX) * 0.5 + 68 * s,
      (busY + refY) * 0.5 - 32 * s,
      (busX + refX) * 0.5 + 90 * s,
      isEs ? 'BRAZO DESPLEGABLE' : 'DEPLOYABLE BOOM',
      'left'
    );

    // Callout 3: NISAR Radar Payload
    drawCallout(
      busX - 30 * s,
      busY + 12 * s,
      busX - 58 * s,
      busY + 34 * s,
      busX - 82 * s,
      isEs ? 'MÓDULO RADAR NISAR' : 'NISAR RADAR PAYLOAD',
      'right'
    );

    // Top-Left & Top-Right Subtle Orbital Telemetry Header
    ctx.font = `500 ${Math.max(9, Math.round(10 * s))}px 'JetBrains Mono', Consolas, monospace`;
    ctx.fillStyle = 'rgba(82, 217, 217, 0.78)';
    ctx.textAlign = 'left';
    ctx.fillText('NASA-ISRO NISAR // SAR OBSERVATORY', 16 * s, 24 * s);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(4, 217, 196, 0.85)';
    ctx.fillText(isEs ? 'ÓRBITA: 747 KM LEO' : 'ORBIT: 747 KM LEO', size - 16 * s, 24 * s);

    // Bottom Earth Swath Telemetry Tag
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(240, 253, 254, 0.75)';
    ctx.fillText(
      isEs
        ? 'FRANJA RADAR SAR DE 240 KM // PENETRACIÓN DE NUBES Y DOSEL'
        : '240 KM SAR GROUND SWATH // ALL-WEATHER CLOUD PENETRATION',
      size * 0.5,
      size - 16 * s
    );

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 8. Main Animation Loop
   * ------------------------------------------------------------- */
  animate() {
    if (!this.isVisible) {
      this.animationId = null;
      return;
    }

    const { ctx, size } = this;
    const s = size / 520;

    ctx.clearRect(0, 0, size, size);

    // Gentle, lightweight orbital floating & micro-rotation
    const floatY = Math.sin(this.time * 0.75) * 6 * s;
    const floatX = Math.cos(this.time * 0.5) * 3 * s;
    const pitchTilt = Math.sin(this.time * 0.45) * 0.022;

    // Key anchor coordinates for the NISAR spacecraft
    const busX = size * 0.46 + floatX;
    const busY = size * 0.50 + floatY;
    const refX = size * 0.55 + floatX + Math.sin(pitchTilt) * 120 * s;
    const refY = size * 0.22 + floatY;

    const satTransform = { busX, busY, refX, refY, pitchTilt };

    // 1. Space starfield & orbital trajectory arc
    this.drawSpaceBackdrop();

    // 2. Curved Earth horizon, atmospheric glow & ground swath
    this.drawEarthHorizon();

    // 3. Port (back-left) solar array wing
    this.drawSolarWing(
      busX - 34 * s,
      busY - 4 * s,
      Math.PI + 0.22 + pitchTilt * 0.8,
      142 * s,
      28 * s,
      4,
      false
    );

    // 4. Active SAR Microwave Beam (Feed -> 12m Reflector -> Earth Swath)
    this.drawSARBeam(satTransform);

    // 5. Deployable Astromast Boom & 12-Meter Wire-Mesh Antenna Reflector
    this.drawBoomAndReflector(busX, busY, refX, refY);

    // 6. Spacecraft Bus & Radar Instrument Payload
    this.drawSpacecraftBus(busX, busY);

    // 7. Starboard (front-right) solar array wing
    this.drawSolarWing(
      busX + 26 * s,
      busY + 8 * s,
      0.22 + pitchTilt * 0.8,
      148 * s,
      30 * s,
      4,
      true
    );

    // 8. Mission-control callouts & orbital telemetry
    this.drawCalloutsAndHUD(satTransform);

    this.time += 0.016;
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  start() {
    if (!this.animationId) {
      this.animate();
    }
  }
}

// Global initialization helper preserved for app.js
window.initHeroRadar = function(canvasId) {
  return new HeroRadar(canvasId);
};
