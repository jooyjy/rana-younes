/* 3D hero cat.
   A small three.js scene drawn over the dashed line under "Explore my work". The cat is built from simple shapes
   (no model file), walks on four legs with a trot cycle, turns smoothly, stops to look at the visitor, and hops
   when tapped. The original SVG cat stays in the page as the fallback (reduced motion, no WebGL, or if three.js
   fails to load); the hidden <button id="cat"> keeps following the 3D cat so clicks, keyboard and the meow still work. */
(function () {
  "use strict";
  var run = document.getElementById("cat-run"),
    mover = document.getElementById("cat-mover"),
    btn = document.getElementById("cat");
  if (!run || !mover || !btn) return;
  var rm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  function fallback() { if (window.__catRoam2D) window.__catRoam2D(); }
  if (rm) return;
  try {
    var t = document.createElement("canvas");
    if (!(t.getContext("webgl2") || t.getContext("webgl"))) { fallback(); return; }
  } catch (e) { fallback(); return; }

  var THREE_URL = "vendor/three.min.js"; /* three.js r149, MIT licence in vendor/three-LICENSE.txt */
  function load(cb) {
    if (window.THREE) return cb();
    var s = document.createElement("script");
    s.src = THREE_URL; s.async = true;
    s.onload = function () { window.THREE ? cb() : fallback(); };
    s.onerror = fallback;
    document.head.appendChild(s);
  }

  /* start once the hero is visible (it usually is on load) */
  load(build);

  function build() {
    var T = window.THREE;
    if (T.ColorManagement) T.ColorManagement.legacyMode = false; /* hex colours below are sRGB */
    var HEAD_ROOM = 120, FLOOR = 6;
    var canvas = document.createElement("canvas");
    canvas.className = "cat3d";
    canvas.setAttribute("aria-hidden", "true");
    run.insertBefore(canvas, run.firstChild);

    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = T.sRGBEncoding;
    var scene = new T.Scene();
    var cam = new T.OrthographicCamera(-100, 100, 100, -100, -1000, 1000);

    /* lights: soft sky, warm key from the front-left, a cool rim from behind so the black fur reads as a 3D shape */
    scene.add(new T.HemisphereLight(0xffffff, 0xd9d2c4, 0.45));
    var key = new T.DirectionalLight(0xfff4e6, 1.0); key.position.set(-120, 220, 260); scene.add(key);
    var rim = new T.DirectionalLight(0xa9b0e0, 1.7); rim.position.set(80, 120, -260); scene.add(rim);
    var fill = new T.DirectionalLight(0xffe0ea, 0.35); fill.position.set(200, 40, 120); scene.add(fill);

    /* chibi proportions (big head, big eyes, short legs) read as cute and curious */
    var fur = new T.MeshStandardMaterial({ color: 0x161616, roughness: 0.72, metalness: 0 });
    var furDark = new T.MeshStandardMaterial({ color: 0x121212, roughness: 0.75 });
    var pink = new T.MeshStandardMaterial({ color: 0xf4a9a4, roughness: 0.6 });
    var white = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    var iris = new T.MeshBasicMaterial({ color: 0x4a3f3c });
    var pupil = new T.MeshBasicMaterial({ color: 0x0a0a0a });
    var shine = new T.MeshBasicMaterial({ color: 0xffffff });
    var blush = new T.MeshBasicMaterial({ color: 0xf29a9a, transparent: true, opacity: 0.55, depthWrite: false });

    function mesh(g, m) { return new T.Mesh(g, m); }
    var root = new T.Group(); scene.add(root);           /* moves along the line */
    var rig = new T.Group(); root.add(rig);              /* turns to face the walking direction */
    var body = new T.Group(); rig.add(body);             /* bobs while walking */

    /* soft contact shadow */
    var sh = mesh(new T.CircleGeometry(1, 32), new T.MeshBasicMaterial({ color: 0x20201e, transparent: true, opacity: 0.16, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.scale.set(30, 10, 1); sh.position.y = 0.2; root.add(sh);

    /* a small round bean of a body */
    var torso = mesh(new T.CapsuleGeometry(12, 14, 10, 24), fur);
    torso.rotation.z = Math.PI / 2; torso.scale.set(0.98, 1, 0.95); torso.position.set(-2, 24, 0); body.add(torso);
    var chest = mesh(new T.SphereGeometry(12.2, 28, 20), fur); chest.position.set(8, 25.5, 0); body.add(chest);
    var haunch = mesh(new T.SphereGeometry(12.6, 28, 20), fur); haunch.position.set(-10, 23.5, 0); body.add(haunch);

    /* a big round head */
    var neck = new T.Group(); neck.position.set(13, 40, 0); body.add(neck);
    var head = new T.Group(); neck.add(head);
    var skull = mesh(new T.SphereGeometry(21, 40, 30), fur); skull.scale.set(0.98, 0.9, 1.03); head.add(skull);
    [-1, 1].forEach(function (s) {
      var cheek = mesh(new T.SphereGeometry(10, 24, 18), fur); cheek.position.set(4, -8, 10 * s); head.add(cheek);
      var ear = mesh(new T.ConeGeometry(9.5, 22, 24), fur); ear.position.set(-2, 18, 11 * s); ear.rotation.set(0.38 * s, 0, 0.05); head.add(ear);
      var inner = mesh(new T.ConeGeometry(5.8, 14, 20), pink); inner.position.set(1.4, 17, 10.8 * s); inner.rotation.set(0.38 * s, 0, 0.05); head.add(inner);
      head.userData["ear" + s] = ear;
      var bd = new T.Vector3(0.74, -0.34, 0.58 * s).normalize();
      var bl = mesh(new T.CircleGeometry(3.4, 20), blush); bl.position.copy(bd.clone().multiplyScalar(20.2)); bl.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), bd); bl.scale.set(1.3, 0.75, 1); head.add(bl);
    });
    var nose = mesh(new T.SphereGeometry(1.6, 14, 10), pink); nose.position.set(19.6, -4.2, 0); nose.scale.set(0.8, 0.7, 1.25); head.add(nose);
    /* huge curious eyes on the front of the face */
    var eyes = [];
    [-1, 1].forEach(function (s) {
      var dir = new T.Vector3(0.88, 0.12, 0.42 * s).normalize();
      var eg = new T.Group(); eg.position.copy(dir.clone().multiplyScalar(18)); eg.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), dir); head.add(eg);
      var w = mesh(new T.SphereGeometry(9, 32, 24), white); w.scale.set(1, 1.1, 0.45); eg.add(w);
      var look = new T.Group(); eg.add(look);
      var ir = mesh(new T.CircleGeometry(6.2, 32), iris); ir.position.z = 4.15; look.add(ir);
      var pu = mesh(new T.CircleGeometry(4.3, 28), pupil); pu.position.z = 4.2; look.add(pu);
      var hi = mesh(new T.CircleGeometry(1.8, 16), shine); hi.position.set(2.2, 2.5, 4.25); look.add(hi);
      var hi2 = mesh(new T.CircleGeometry(0.9, 12), shine); hi2.position.set(-1.9, -2, 4.25); look.add(hi2);
      eyes.push({ g: eg, look: look });
    });
    /* whiskers */
    var wl = new T.LineBasicMaterial({ color: 0xe6e2da, transparent: true, opacity: 0.85 });
    [-1, 1].forEach(function (s) {
      var pts = [];
      [[-1.5, 1.5], [0.5, -0.5], [2.5, -3]].forEach(function (a) {
        pts.push(new T.Vector3(16, -6 + a[0], 9 * s), new T.Vector3(22, -6 + a[1] * 2.2, 22 * s));
      });
      head.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), wl));
    });

    /* short legs: hip pivot, knee pivot, round paw */
    function leg(x, z, back) {
      var hip = new T.Group(); hip.position.set(x, 16, z); body.add(hip);
      var up = mesh(new T.CapsuleGeometry(4.6, 3, 6, 14), fur); up.position.y = -4; hip.add(up);
      var knee = new T.Group(); knee.position.y = -7.5; hip.add(knee);
      var lo = mesh(new T.CapsuleGeometry(4, 2, 6, 14), fur); lo.position.y = -3.4; knee.add(lo);
      var paw = mesh(new T.SphereGeometry(4.7, 18, 14), furDark); paw.position.set(1.5, -6.6, 0); paw.scale.set(1.3, 0.66, 1.05); knee.add(paw);
      return { hip: hip, knee: knee, back: back };
    }
    var legs = [leg(9, 6.5, false), leg(9, -6.5, false), leg(-11, 6.5, true), leg(-11, -6.5, true)];
    /* trot: diagonal pairs move together */
    var legPhase = [0, Math.PI, Math.PI, 0];

    /* tail: one smooth tube that curls up and sways */
    var TN = 20, tailPts = [], tailMesh = mesh(new T.BufferGeometry(), fur), tailTip = mesh(new T.SphereGeometry(3, 14, 10), fur);
    for (var i = 0; i < TN; i++) tailPts.push(new T.Vector3());
    body.add(tailMesh); body.add(tailTip);

    /* ---------- layout ---------- */
    var W = 0, H = 0;
    function resize() {
      W = run.clientWidth; H = run.clientHeight + HEAD_ROOM;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      renderer.setSize(W, H, false);
      cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2; cam.updateProjectionMatrix();
      /* a slight look-down so the floor plane has depth; then shift so the floor sits on the dashed line */
      cam.position.set(0, 0, 400); cam.rotation.set(-0.2, 0, 0); cam.updateMatrixWorld();
      var p = new T.Vector3(0, 0, 0).project(cam), want = 1 - 2 * (H - FLOOR) / H;
      var up = new T.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
      cam.position.addScaledVector(up, (p.y - want) * H / 2); cam.updateMatrixWorld();
    }
    resize();
    addEventListener("resize", function () { resize(); x = Math.min(x, maxX()); });

    /* ---------- behaviour ---------- */
    var SCALE = Math.max(1.05, Math.min(1.35, run.clientWidth / 280));
    root.scale.setScalar(SCALE);
    function minX() { return 40 * SCALE; }
    function maxX() { return Math.max(minX() + 1, W - 40 * SCALE); }
    var x = minX() + 20, target = x, heading = 0, headingTo = 0, state = "idle", until = performance.now() + 1500,
      phase = 0, speed = 0, hop = -1, hold = false, vis = true, last = 0, raf = 0, tt = 0,
      look = new T.Vector2(0, 0), lookTo = new T.Vector2(0.6, 0), pointer = null;

    function pick() {
      var a = minX(), b = maxX(), n, tries = 0;
      do { n = a + Math.random() * (b - a); } while (Math.abs(n - x) < Math.min(90, (b - a) * 0.35) && ++tries < 12);
      return n;
    }
    function screenX() { return x; }

    btn.addEventListener("pointerenter", function () { hold = true; });
    btn.addEventListener("pointerleave", function () { hold = false; });
    btn.addEventListener("click", function () { hop = 0; until = performance.now() + 1700; });
    document.addEventListener("pointermove", function (e) { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !raf) { last = 0; raf = requestAnimationFrame(frame); } }).observe(run);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden && vis && !raf) { last = 0; raf = requestAnimationFrame(frame); } });

    function ease(a, b, k) { return a + (b - a) * k; }

    function frame(now) {
      raf = 0;
      if (!vis || document.hidden) return;
      var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; tt += dt;
      var caught = run.classList.contains("caught");

      /* decide */
      if (hold || caught || hop >= 0) { if (state === "walk") state = "idle"; until = Math.max(until, now + 900); }
      else if (state === "idle" && now > until) { target = pick(); headingTo = target > x ? 0 : Math.PI; state = "walk"; }

      /* turn smoothly; walk once facing the right way */
      var dh = headingTo - heading; heading += dh * Math.min(1, dt * 6);
      var facing = Math.abs(dh) < 0.25;
      var want = 0;
      if (state === "walk") {
        var left = Math.abs(target - x);
        want = facing ? Math.min(78, 24 + left * 1.4) : 14;
        if (left < 1.5) { state = "idle"; until = now + 1800 + Math.random() * 3200; }
      }
      speed = ease(speed, want, Math.min(1, dt * 5));
      var dir = target > x ? 1 : -1;
      x += dir * speed * dt * (state === "walk" ? 1 : 0.2);
      x = Math.max(minX(), Math.min(maxX(), x));
      phase += speed * dt / 30 * Math.PI * 2;

      /* gait */
      var moving = Math.min(1, speed / 40);
      legs.forEach(function (L, i) {
        var p = phase + legPhase[i], s = Math.sin(p);
        var swing = 0.55 * s * moving, lift = Math.max(0, Math.cos(p)) * moving;
        L.hip.rotation.z = swing;
        L.knee.rotation.z = L.back ? 0.18 + 0.75 * lift : -0.08 - 0.9 * lift;
      });
      body.position.y = Math.abs(Math.sin(phase)) * 1.6 * moving + Math.sin(tt * 2.2) * 0.35 * (1 - moving);
      body.rotation.z = Math.sin(phase * 2) * 0.025 * moving;

      /* hop when tapped */
      var hy = 0;
      if (hop >= 0) {
        hop += dt / 0.75;
        var k = Math.min(1, hop);
        hy = Math.sin(k * Math.PI) * 26;
        legs.forEach(function (L) { L.hip.rotation.z = (L.back ? 0.5 : -0.5) * Math.sin(k * Math.PI); L.knee.rotation.z = (L.back ? -1 : 1) * Math.sin(k * Math.PI); });
        body.scale.set(1 + (k > 0.9 ? (1 - k) * 0.8 : 0), 1 - (k > 0.9 ? (1 - k) * 0.8 : 0), 1);
        if (hop >= 1) { hop = -1; body.scale.set(1, 1, 1); }
      }
      body.position.y += hy;
      sh.scale.set(36 - hy * 0.4, 12 - hy * 0.15, 1); sh.material.opacity = 0.16 - hy * 0.003;

      /* head: looks at the visitor when stopped, ahead while walking, and follows the pointer a little */
      var r = canvas.getBoundingClientRect();
      var hx = r.left + x, hyS = r.top + H - FLOOR - 52 * SCALE;
      var py = 0, px = 0;
      if (pointer) { px = Math.max(-1, Math.min(1, (pointer.x - hx) / 300)); py = Math.max(-1, Math.min(1, (pointer.y - hyS) / 220)); }
      var toCam = state === "walk" && speed > 30 ? 0.6 : 1.0;
      var facingSign = Math.cos(heading) >= 0 ? 1 : -1;
      lookTo.set(toCam - px * 0.25 * facingSign, -py * 0.3);
      look.lerp(lookTo, Math.min(1, dt * 5));
      neck.rotation.set(0, -look.x * 0.75 * facingSign, 0);
      /* curious head tilt while she stands and watches */
      var tilt = state === "walk" ? 0 : Math.sin(tt * 0.7) * 0.2;
      head.rotation.set(tilt, 0, look.y + (hop >= 0 ? 0.25 : 0) + Math.sin(tt * 1.3) * 0.03);
      eyes.forEach(function (e) { e.look.position.set(px * 0.9 * facingSign, -py * 0.9, 0); });
      /* blink */
      var bl = (tt % 4.6) > 4.45 ? 0.12 : 1;
      eyes.forEach(function (e) { e.g.scale.y = ease(e.g.scale.y, bl, 0.6); });
      /* ears twitch now and then */
      var tw = (tt % 6.3) > 6.1 ? Math.sin(tt * 40) * 0.12 : 0;
      head.userData["ear1"].rotation.x = 0.32 + tw; head.userData["ear-1"].rotation.x = -0.32 - tw;

      /* tail */
      var sway = Math.sin(tt * (state === "walk" ? 5 : 1.8)) * (state === "walk" ? 0.35 : 0.5), up = hop >= 0 ? 0.35 : 0;
      var tx = -18, ty = 26, ang = 2.2 - up; tailPts[0].set(tx, ty, 0);
      for (var j = 1; j < TN; j++) {
        ang -= 0.085 + (j > 13 ? 0.06 : 0);
        var a2 = ang + sway * (j / TN);
        tx += Math.cos(a2) * 2.2; ty += Math.sin(a2) * 2.2;
        tailPts[j].set(tx, ty, Math.sin(tt * 1.4 + j * 0.4) * 1.5 * (j / TN));
      }
      var tg = new T.TubeGeometry(new T.CatmullRomCurve3(tailPts), 28, 3.2, 10, false);
      tailMesh.geometry.dispose(); tailMesh.geometry = tg; tailTip.position.copy(tailPts[TN - 1]);

      var fr = Math.cos(heading) >= 0 ? "r" : "l"; if (run.dataset.face !== fr) run.dataset.face = fr;
      rig.rotation.y = -heading + (Math.cos(heading) >= 0 ? -0.35 : 0.35) * (1 - moving * 0.6);
      root.position.set(x - W / 2, 0, 0);

      /* keep the real button, the "Tap me!" tag and the meow bubble on top of the 3D cat */
      mover.style.transform = "translate3d(" + (x - mover.offsetWidth / 2).toFixed(1) + "px," + (-hy * SCALE).toFixed(1) + "px,0)";

      renderer.render(scene, cam);
      raf = requestAnimationFrame(frame);
    }
    btn.classList.add("is3d");
    run.classList.add("has3d");
    raf = requestAnimationFrame(frame);
  }
})();
