/**
 * WebGLExploring — Three.js orb + meridian helpers
 */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') {
    window.WebGLExploring = { createOrb: () => () => {}, createMeridian: () => () => {} };
    return;
  }

  function createOrb(container, opts) {
    const { color = '#4a6fa5', accent = '#c8a36a', size = 140 } = opts || {};
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 3.2;
    const geo = new THREE.IcosahedronGeometry(1, 5);
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.55, metalness: 0.28, transparent: true, opacity: 0.88 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    const haloGeo = new THREE.SphereGeometry(1.18, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.10, side: THREE.BackSide });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    scene.add(halo);
    const glowGeo = new THREE.SphereGeometry(1.45, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0.04, side: THREE.BackSide });
    scene.add(new THREE.Mesh(glowGeo, glowMat));
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.PointLight(new THREE.Color(accent), 2.4, 12);
    key.position.set(2.5, 2.5, 2.5); scene.add(key);
    const fill = new THREE.PointLight(new THREE.Color(color), 1.6, 12);
    fill.position.set(-2, -1.2, 1.5); scene.add(fill);
    const posArr = geo.attributes.position.array;
    const origPos = new Float32Array(posArr);
    const nVerts = origPos.length / 3;
    let raf, t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate); t += 0.011;
      mesh.rotation.x = t * 0.11; mesh.rotation.y = t * 0.16;
      const breathe = 1 + 0.055 * Math.sin(t * 0.9);
      for (let i = 0; i < nVerts; i++) {
        const ix = i*3, iy = i*3+1, iz = i*3+2;
        const ox = origPos[ix], oy = origPos[iy], oz = origPos[iz];
        const n = 0.038 * Math.sin(ox*4.2+t*1.4) * Math.cos(oy*4.0+t*1.0) * Math.sin(oz*3.5+t*0.8);
        posArr[ix]=(ox+ox*n)*breathe; posArr[iy]=(oy+oy*n)*breathe; posArr[iz]=(oz+oz*n)*breathe;
      }
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
      halo.scale.setScalar(breathe); renderer.render(scene, camera);
    };
    animate();
    return function dispose() {
      cancelAnimationFrame(raf);
      geo.dispose(); mat.dispose(); haloGeo.dispose(); haloMat.dispose(); glowGeo.dispose(); glowMat.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }

  function createMeridian(container, opts) {
    const { color = '#4a6fa5', width = 240, height = 80 } = opts || {};
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height); renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(-aspect*0.9, aspect*0.9, 0.9, -0.9, 0.1, 20);
    camera.position.z = 6;
    const scene = new THREE.Scene();
    const c = new THREE.Color(color);
    const globeGeo = new THREE.SphereGeometry(0.68, 14, 9);
    const globeMat = new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: 0.06 });
    const globe = new THREE.Mesh(globeGeo, globeMat); scene.add(globe);
    const arcs = [];
    for (let i = 0; i < 6; i++) {
      const pts = [], tilt = (i/6)*Math.PI, r = 0.66;
      for (let j = 0; j <= 80; j++) { const theta = (j/80)*Math.PI*2; pts.push(new THREE.Vector3(r*Math.cos(theta)*Math.cos(tilt), r*Math.sin(theta), r*Math.cos(theta)*Math.sin(tilt))); }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.22-i*0.025 });
      const line = new THREE.Line(lineGeo, lineMat); scene.add(line);
      arcs.push({ line, lineGeo, lineMat, phase: i*(Math.PI/6) });
    }
    const eqPts = [];
    for (let j = 0; j <= 80; j++) { const a=(j/80)*Math.PI*2; eqPts.push(new THREE.Vector3(0.68*Math.cos(a),0,0.68*Math.sin(a))); }
    const eqGeo = new THREE.BufferGeometry().setFromPoints(eqPts);
    const eqMat = new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.12 });
    const eq = new THREE.Line(eqGeo, eqMat); scene.add(eq);
    let raf, t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate); t += 0.007;
      globe.rotation.y = t*0.38; globe.rotation.x = 0.28; eq.rotation.y = t*0.38;
      arcs.forEach(({ line, phase }) => { line.rotation.y = t*0.32+phase; line.rotation.x = 0.28; });
      renderer.render(scene, camera);
    };
    animate();
    return function dispose() {
      cancelAnimationFrame(raf);
      globeGeo.dispose(); globeMat.dispose(); eqGeo.dispose(); eqMat.dispose();
      arcs.forEach(({ lineGeo, lineMat }) => { lineGeo.dispose(); lineMat.dispose(); });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }

  window.WebGLExploring = { createOrb, createMeridian };
}());
