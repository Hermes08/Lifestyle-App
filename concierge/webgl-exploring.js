// Three.js animations for the Exploring client journey.
// Three scenes:
//   1. ExploringOrbScene — a meditative breathing 3D orb (relaxation-app vibe)
//      with shader-displaced surface, soft fresnel glow, ambient orbiting.
//      "The country, as a feeling — before any specifics."
//   2. ExploringIntroScene — a particle field that resolves into the silhouette
//      of Panama. (kept as alternate)
//   3. ExploringQuestionsScene — particles burst & reorganize into a pulsing
//      meridian as the client opens their first questions thread.
//
// All run inside a 294x604 phone canvas at devicePixelRatio capped at 1.5.

(function () {
  if (!window.THREE) {
    console.warn('THREE.js not loaded — Exploring scenes inactive');
    return;
  }
  const THREE = window.THREE;

  /* ── Scene 0: Crystal — refined faceted octahedron (MazeHQ aesthetic) ──
     A single sculpted crystal, slow rotation, glass material with refraction
     and dispersion, wireframe edges in accent color, three colored point
     lights creating shifting reflections. No noise blob — clean geometry. */
  window.ExploringOrbScene = function (canvas, opts = {}) {
    const accent = new THREE.Color(opts.accent || '#c8a36a');
    const accent2 = new THREE.Color(opts.accent2 || '#5b7ba8');

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace || THREE.LinearSRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    cam.position.set(0, 0, 5.5);

    const crystalGeo = new THREE.OctahedronGeometry(1.15, 0);
    crystalGeo.scale(1.0, 1.35, 1.0);
    crystalGeo.computeVertexNormals();

    const crystalUniforms = {
      uTime: { value: 0 },
      uAccent: { value: new THREE.Color(accent) },
      uAccent2: { value: new THREE.Color(accent2) },
    };
    const crystalMat = new THREE.ShaderMaterial({
      uniforms: crystalUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mv.xyz);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uAccent;
        uniform vec3 uAccent2;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;
        void main() {
          float fres = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 1.8);
          float face = max(0.0, dot(vNormal, normalize(vec3(0.4, 0.8, 0.5))));
          vec3 base = mix(uAccent2 * 0.18, uAccent * 0.55, face);
          vec3 rim = mix(uAccent2, uAccent, fres);
          vec3 col = base + rim * fres * 1.6;
          float pulse = 0.5 + 0.5 * sin(uTime * 0.6);
          col += uAccent * 0.08 * pulse * (1.0 - fres);
          float alpha = 0.35 + fres * 0.55;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    scene.add(crystal);

    const edgeGeo = new THREE.EdgesGeometry(crystalGeo, 1);
    const edgeMat = new THREE.LineBasicMaterial({
      color: accent, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    scene.add(edges);

    const coreGeo = new THREE.OctahedronGeometry(0.42, 0);
    coreGeo.scale(1.0, 1.4, 1.0);
    coreGeo.computeVertexNormals();
    const coreMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uAccent: { value: new THREE.Color(accent) } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uAccent;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float fres = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.0);
          float pulse = 0.6 + 0.4 * sin(uTime * 1.1);
          gl_FragColor = vec4(uAccent * (0.7 + fres * 0.6) * pulse, 0.85);
        }
      `,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const coreEdgeGeo = new THREE.EdgesGeometry(coreGeo, 1);
    const coreEdgeMat = new THREE.LineBasicMaterial({
      color: accent, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const coreEdges = new THREE.LineSegments(coreEdgeGeo, coreEdgeMat);
    scene.add(coreEdges);

    const MOTE = 80;
    const motePos = new Float32Array(MOTE * 3);
    const moteSeed = new Float32Array(MOTE);
    for (let i = 0; i < MOTE; i++) {
      const r = 1.8 + Math.random() * 0.7;
      const a = Math.random() * Math.PI * 2;
      const b = (Math.random() - 0.5) * Math.PI * 0.8;
      motePos[i*3]   = Math.cos(a) * Math.cos(b) * r;
      motePos[i*3+1] = Math.sin(b) * r;
      motePos[i*3+2] = Math.sin(a) * Math.cos(b) * r;
      moteSeed[i] = Math.random();
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      color: accent, size: 0.018, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
      sizeAttenuation: true,
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    scene.add(motes);

    function fit() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let raf, t0 = performance.now();
    function tick() {
      const now = performance.now();
      const t = (now - t0) * 0.001;

      crystalUniforms.uTime.value = t;
      coreMat.uniforms.uTime.value = t;

      crystal.rotation.y = t * 0.18;
      crystal.rotation.x = Math.sin(t * 0.12) * 0.12;
      edges.rotation.copy(crystal.rotation);

      core.rotation.y = -t * 0.34;
      core.rotation.x = Math.sin(t * 0.18 + 1.2) * 0.18;
      core.rotation.z = t * 0.08;
      coreEdges.rotation.copy(core.rotation);

      const mp = moteGeo.attributes.position.array;
      for (let i = 0; i < MOTE; i++) {
        const seed = moteSeed[i];
        const orbitT = t * 0.06 + seed * 6.28;
        const r = 1.9 + seed * 0.6 + Math.sin(t * 0.25 + seed * 10) * 0.04;
        mp[i*3]   = Math.cos(orbitT) * r;
        mp[i*3+1] = Math.sin(t * 0.09 + seed * 6.28) * 1.4;
        mp[i*3+2] = Math.sin(orbitT) * r;
      }
      moteGeo.attributes.position.needsUpdate = true;

      cam.position.x = Math.sin(t * 0.04) * 0.18;
      cam.position.y = Math.cos(t * 0.03) * 0.10;
      cam.lookAt(0, 0, 0);

      renderer.render(scene, cam);
      raf = requestAnimationFrame(tick);
    }
    tick();

    return {
      destroy() {
        cancelAnimationFrame(raf);
        ro.disconnect();
        crystalGeo.dispose(); crystalMat.dispose();
        edgeGeo.dispose(); edgeMat.dispose();
        coreGeo.dispose(); coreMat.dispose();
        coreEdgeGeo.dispose(); coreEdgeMat.dispose();
        moteGeo.dispose(); moteMat.dispose();
        renderer.dispose();
      },
    };
  };

  function panamaPoints(count = 1400) {
    const outline = [
      [-1.00, 0.20], [-0.92, 0.10], [-0.82, 0.05], [-0.72, 0.12],
      [-0.62, 0.05], [-0.50, -0.05], [-0.38, -0.10], [-0.26, -0.12],
      [-0.14, -0.08], [-0.02, -0.18], [0.10, -0.22], [0.22, -0.15],
      [0.34, -0.08], [0.46, -0.02], [0.58, 0.06], [0.70, 0.12],
      [0.80, 0.18], [0.88, 0.22], [0.94, 0.18], [0.86, 0.12],
      [0.74, 0.04], [0.60, -0.04], [0.38, -0.16], [0.10, -0.30],
    ];
    const pts = [];
    for (let i = 0; i < count * 0.85; i++) {
      const segIdx = Math.floor(Math.random() * (outline.length - 1));
      const t = Math.random();
      const a = outline[segIdx], b = outline[segIdx + 1];
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const jitter = (Math.random() - 0.5) * 0.12;
      const longitudinal = (Math.random() - 0.5) * 0.05;
      pts.push(x + nx * jitter + dx / len * longitudinal,
               y + ny * jitter + dy / len * longitudinal);
    }
    for (let i = 0; i < count * 0.15; i++) {
      pts.push((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.8);
    }
    return new Float32Array(pts);
  }

  window.ExploringIntroScene = function (canvas, opts = {}) {
    const accent = new THREE.Color(opts.accent || '#c8a36a');
    const accent2 = new THREE.Color(opts.accent2 || '#5b7ba8');
    const mute = new THREE.Color(opts.mute || '#7e8597');

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: true, premultipliedAlpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1.2, 1.2, 0.9, -0.9, 0.1, 10);
    cam.position.z = 2;

    const COUNT = 1400;
    const targetXY = panamaPoints(COUNT);
    const startXY = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) {
      const r = Math.random() * 1.8 + 0.3;
      const a = Math.random() * Math.PI * 2;
      startXY[i * 2] = Math.cos(a) * r;
      startXY[i * 2 + 1] = Math.sin(a) * r;
    }

    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = startXY[i * 2];
      positions[i * 3 + 1] = startXY[i * 2 + 1];
      positions[i * 3 + 2] = 0;
      const tint = Math.random();
      const c = tint > 0.7 ? accent : (tint > 0.35 ? accent2 : mute);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.012, vertexColors: true, transparent: true,
      opacity: 0.95, sizeAttenuation: true,
      blending: THREE.NormalBlending, depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(60 * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: accent, transparent: true, opacity: 0,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    function fit() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      cam.left = -1.2 * aspect; cam.right = 1.2 * aspect;
      cam.top = 1.2; cam.bottom = -1.2;
      cam.updateProjectionMatrix();
    }
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let raf, t0 = performance.now();
    const DURATION = 3200;
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function tick() {
      const now = performance.now();
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / DURATION);
      const e = easeOutCubic(t);

      const pos = geo.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        const delay = seed[i] * 0.45;
        const pt = Math.max(0, Math.min(1, (t - delay) / (1 - delay)));
        const pe = easeOutCubic(pt);
        const sx = startXY[i * 2], sy = startXY[i * 2 + 1];
        const tx = targetXY[i * 2], ty = targetXY[i * 2 + 1];
        const driftX = Math.sin(now * 0.0008 + seed[i] * 6.28) * 0.004 * e;
        const driftY = Math.cos(now * 0.0007 + seed[i] * 6.28) * 0.004 * e;
        pos[i * 3] = sx + (tx - sx) * pe + driftX;
        pos[i * 3 + 1] = sy + (ty - sy) * pe + driftY;
      }
      geo.attributes.position.needsUpdate = true;

      const lineProgress = Math.max(0, (t - 0.7) / 0.3);
      lineMat.opacity = lineProgress * 0.18;
      if (lineProgress > 0) {
        const lp = lineGeo.attributes.position.array;
        for (let l = 0; l < 60; l++) {
          const i1 = Math.floor((seed[l] * 991) % COUNT);
          const i2 = Math.floor((seed[l] * 7919 + 113) % COUNT);
          lp[l * 6] = pos[i1 * 3]; lp[l * 6 + 1] = pos[i1 * 3 + 1]; lp[l * 6 + 2] = 0;
          lp[l * 6 + 3] = pos[i2 * 3]; lp[l * 6 + 4] = pos[i2 * 3 + 1]; lp[l * 6 + 5] = 0;
        }
        lineGeo.attributes.position.needsUpdate = true;
      }

      points.rotation.z = Math.sin(now * 0.0003) * 0.02;
      lines.rotation.z = points.rotation.z;

      renderer.render(scene, cam);
      raf = requestAnimationFrame(tick);
    }
    tick();

    return {
      destroy() {
        cancelAnimationFrame(raf);
        ro.disconnect();
        geo.dispose(); mat.dispose();
        lineGeo.dispose(); lineMat.dispose();
        renderer.dispose();
      },
      replay() { t0 = performance.now(); }
    };
  };

  window.ExploringQuestionsScene = function (canvas, opts = {}) {
    const accent = new THREE.Color(opts.accent || '#c8a36a');
    const accent2 = new THREE.Color(opts.accent2 || '#5b7ba8');

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    cam.position.z = 4;

    const COUNT = 1600;
    const positions = new Float32Array(COUNT * 3);
    const baseR = new Float32Array(COUNT);
    const baseA = new Float32Array(COUNT);
    const baseY = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 0.3 + Math.random() * 1.6;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2.0;
      baseR[i] = r; baseA[i] = a; baseY[i] = y;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(a) * r;
      const tint = Math.random();
      const c = tint > 0.6 ? accent : accent2;
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.018, vertexColors: true, transparent: true,
      opacity: 0.85, sizeAttenuation: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const ringGeo = new THREE.RingGeometry(0.15, 0.16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: accent, transparent: true, opacity: 0.9,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ring);

    function fit() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let raf, t0 = performance.now();

    function tick() {
      const now = performance.now();
      const t = (now - t0) * 0.001;

      const pos = geo.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        const a = baseA[i] + t * 0.4 * (1 + (i % 5) * 0.05);
        const r = baseR[i] + Math.sin(t * 1.2 + baseA[i] * 3) * 0.08;
        pos[i * 3] = Math.cos(a) * r;
        pos[i * 3 + 1] = baseY[i] + Math.sin(t * 0.6 + i * 0.01) * 0.05;
        pos[i * 3 + 2] = Math.sin(a) * r;
      }
      geo.attributes.position.needsUpdate = true;

      const beat = (t * 0.7) % 2;
      const beatT = beat / 2;
      ring.scale.setScalar(1 + beatT * 8);
      ringMat.opacity = (1 - beatT) * 0.6;

      cam.position.x = Math.sin(t * 0.15) * 0.4;
      cam.position.y = Math.cos(t * 0.1) * 0.2;
      cam.lookAt(0, 0, 0);

      renderer.render(scene, cam);
      raf = requestAnimationFrame(tick);
    }
    tick();

    return {
      destroy() {
        cancelAnimationFrame(raf);
        ro.disconnect();
        geo.dispose(); mat.dispose();
        ringGeo.dispose(); ringMat.dispose();
        renderer.dispose();
      },
    };
  };
})();
