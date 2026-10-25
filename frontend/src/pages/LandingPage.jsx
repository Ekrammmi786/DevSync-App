import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";

const lerp = (a, b, t) => a + (b - a) * t;

/* WebGL capability check */
function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/* 3D Scene Factories */
function createGalaxy(scene, isMobile) {
  const COUNT = isMobile ? 18000 : 50000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  const colorCore = new THREE.Color("#f59e0b");
  const colorMid = new THREE.Color("#a855f7");
  const colorRim = new THREE.Color("#6366f1");

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const radius = Math.random() * 8.5 + 0.4;
    const arms = 3;
    const spinAngle = radius * 1.25;
    const branchAngle = ((i % arms) / arms) * Math.PI * 2;
    const rX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.85;
    const rY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.35;
    const rZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.85;

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + rX;
    positions[i3 + 1] = rY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + rZ;

    const t = radius / 9.0;
    const c = new THREE.Color();
    if (t < 0.45) {
      c.lerpColors(colorCore, colorMid, t / 0.45);
    } else {
      c.lerpColors(colorMid, colorRim, (t - 0.45) / 0.55);
    }
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: isMobile ? 0.05 : 0.038,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.92,
  });

  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return { mesh: pts, geo, mat };
}

function createTorusKnot(scene) {
  const geo = new THREE.TorusKnotGeometry(1.6, 0.42, 160, 24, 2, 3);
  const mat = new THREE.MeshStandardMaterial({
    color: "#06b6d4",
    metalness: 0.88,
    roughness: 0.15,
    wireframe: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(3.6, 0, 0);
  mesh.visible = false;
  scene.add(mesh);
  return { mesh, geo, mat };
}

function createNetworkOrbs(scene) {
  const group = new THREE.Group();
  const orbs = [];
  const count = 22;

  for (let i = 0; i < count; i++) {
    const geo = new THREE.SphereGeometry(Math.random() * 0.22 + 0.1, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.68 + Math.random() * 0.12, 0.85, 0.65),
      emissive: new THREE.Color().setHSL(0.68 + Math.random() * 0.12, 0.9, 0.3),
      metalness: 0.3,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const angle = (i / count) * Math.PI * 2;
    const rad = Math.random() * 2.6 + 1.2;
    mesh.position.set(
      Math.cos(angle) * rad,
      (Math.random() - 0.5) * 1.8,
      Math.sin(angle) * rad
    );
    group.add(mesh);
    orbs.push(mesh);
  }

  const linePositions = [];
  for (let i = 0; i < orbs.length; i++) {
    for (let j = i + 1; j < orbs.length; j++) {
      if (Math.random() > 0.68) {
        linePositions.push(...orbs[i].position.toArray());
        linePositions.push(...orbs[j].position.toArray());
      }
    }
  }

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: "#a855f7",
    opacity: 0.45,
    transparent: true,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  group.add(lines);

  group.position.set(-3.5, 0, 0);
  group.visible = false;
  scene.add(group);
  return { group, lines, orbs };
}

function createCrystal(scene) {
  const geo = new THREE.OctahedronGeometry(1.65, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: "#10b981",
    emissive: "#064e3b",
    metalness: 0.7,
    roughness: 0.08,
    transparent: true,
    opacity: 0.9,
  });
  const solid = new THREE.Mesh(geo, mat);

  const wireGeo = new THREE.OctahedronGeometry(1.68, 0);
  const wireMat = new THREE.MeshBasicMaterial({
    color: "#34d399",
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const wire = new THREE.Mesh(wireGeo, wireMat);

  const group = new THREE.Group();
  group.add(solid, wire);
  group.visible = false;
  scene.add(group);
  return { group, geo, mat, wireGeo, wireMat };
}

/* Glassmorphism panel styling token */
const GLASS_CARD = {
  background: "rgba(10, 6, 22, 0.76)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
};

const TECH_TAGS = ["React", "TypeScript", "Node.js", "Python", "Go", "Docker", "Tailwind", "Next.js", "PostgreSQL"];

const LandingPage = () => {
  const canvasRef = useRef(null);
  const scrollRef = useRef(0);
  const targetScrollRef = useRef(0);

  const [hasWebGL, setHasWebGL] = useState(true);
  const [activeTab, setActiveTab] = useState("pairing");
  const [selectedTech, setSelectedTech] = useState("React");

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setHasWebGL(false);
      return;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor("#0a0616", 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2.5, 9);

    scene.add(new THREE.AmbientLight("#ffffff", 0.45));
    const p1 = new THREE.PointLight("#f59e0b", 2.2, 22);
    p1.position.set(4, 5, 4);
    scene.add(p1);

    const p2 = new THREE.PointLight("#6366f1", 2.0, 20);
    p2.position.set(-4, -2, -4);
    scene.add(p2);

    const p3 = new THREE.PointLight("#06b6d4", 1.8, 18);
    p3.position.set(0, 6, -5);
    scene.add(p3);

    const galaxyData = createGalaxy(scene, isMobile);
    const torusData = createTorusKnot(scene);
    const networkData = createNetworkOrbs(scene);
    const crystalData = createCrystal(scene);

    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    let currentRotation = { x: 0, y: 0 };

    const handlePointerDown = (x, y) => {
      isDragging = true;
      prevMouse = { x, y };
    };

    const handlePointerMove = (x, y) => {
      if (!isDragging || prefersReducedMotion) return;
      targetRotation.y += (x - prevMouse.x) * 0.0035;
      targetRotation.x += (y - prevMouse.y) * 0.0035;
      prevMouse = { x, y };
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const onMouseDown = (e) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e) => handlePointerMove(e.clientX, e.clientY);
    const onTouchStart = (e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", handlePointerUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", handlePointerUp);

    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      targetScrollRef.current = total > 0 ? window.scrollY / total : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let frameId;
    let isTabVisible = true;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && !frameId) {
        clock.start();
        animate();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const animate = () => {
      if (!isTabVisible) {
        frameId = null;
        return;
      }
      frameId = requestAnimationFrame(animate);

      const t = clock.getElapsedTime();
      if (!prefersReducedMotion) {
        scrollRef.current = lerp(scrollRef.current, targetScrollRef.current, 0.065);
      } else {
        scrollRef.current = targetScrollRef.current;
      }
      const s = scrollRef.current;

      galaxyData.mesh.visible = s < 0.3;
      torusData.mesh.visible = s >= 0.16 && s < 0.54;
      networkData.group.visible = s >= 0.41 && s < 0.79;
      crystalData.group.visible = s >= 0.66;

      currentRotation.x = lerp(currentRotation.x, targetRotation.x, 0.08);
      currentRotation.y = lerp(currentRotation.y, targetRotation.y, 0.08);

      if (galaxyData.mesh.visible) {
        galaxyData.mesh.rotation.x = currentRotation.x;
        galaxyData.mesh.rotation.y = prefersReducedMotion ? 0 : t * 0.07 + currentRotation.y;
      }

      if (torusData.mesh.visible && !prefersReducedMotion) {
        torusData.mesh.rotation.y = t * 0.45;
        torusData.mesh.rotation.x = t * 0.22;
      }

      if (networkData.group.visible && !prefersReducedMotion) {
        networkData.group.rotation.y = t * 0.18;
      }

      if (crystalData.group.visible && !prefersReducedMotion) {
        crystalData.group.rotation.y = t * 0.38;
        crystalData.group.rotation.x = t * 0.14;
      }

      if (!prefersReducedMotion) {
        if (s < 0.25) {
          camera.position.x = lerp(camera.position.x, 0, 0.05);
          camera.position.y = lerp(camera.position.y, 2.5 + Math.sin(t * 0.4) * 0.15, 0.05);
          camera.position.z = lerp(camera.position.z, 9, 0.05);
          camera.lookAt(0, 0, 0);
        } else if (s < 0.5) {
          camera.position.x = lerp(camera.position.x, isMobile ? 0 : -3.8, 0.04);
          camera.position.y = lerp(camera.position.y, 1, 0.04);
          camera.position.z = lerp(camera.position.z, isMobile ? 8 : 6, 0.04);
          camera.lookAt(isMobile ? 0 : 3.5, 0, 0);
        } else if (s < 0.75) {
          camera.position.x = lerp(camera.position.x, isMobile ? 0 : 3.8, 0.04);
          camera.position.y = lerp(camera.position.y, 1.4, 0.04);
          camera.position.z = lerp(camera.position.z, isMobile ? 8 : 6, 0.04);
          camera.lookAt(isMobile ? 0 : -3.5, 0, 0);
        } else {
          camera.position.x = lerp(camera.position.x, 0, 0.04);
          camera.position.y = lerp(camera.position.y, 1, 0.04);
          camera.position.z = lerp(camera.position.z, 5.2, 0.04);
          camera.lookAt(0, 0, 0);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", handlePointerUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", handlePointerUp);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);

      galaxyData.geo.dispose();
      galaxyData.mat.dispose();
      torusData.geo.dispose();
      torusData.mat.dispose();
      crystalData.geo.dispose();
      crystalData.mat.dispose();
      crystalData.wireGeo.dispose();
      crystalData.wireMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      style={{
        background: "#0a0616",
        color: "#ffffff",
        minHeight: "100vh",
        position: "relative",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; background: #0a0616; }
        a:focus-visible, button:focus-visible {
          outline: 2px solid #f59e0b !important;
          outline-offset: 3px !important;
        }
        .land-btn-main:hover {
          transform: translateY(-2px) scale(1.03) !important;
          box-shadow: 0 0 35px rgba(168, 85, 247, 0.65) !important;
        }
        .land-btn-ghost:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
        }
        .land-nav-link:hover {
          color: #ffffff !important;
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* 3D WebGL Canvas or CSS Gradient Fallback */}
      {hasWebGL ? (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
            display: "block",
            pointerEvents: "auto",
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
            background:
              "radial-gradient(ellipse at 50% 20%, rgba(245,158,11,0.18), transparent 60%), radial-gradient(ellipse at 80% 60%, rgba(168,85,247,0.18), transparent 50%), #0a0616",
          }}
        />
      )}

      {/* Subtle Progress Bar */}
      <ScrollBar />

      {/* FIXED NAVIGATION */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
          background: "rgba(10, 6, 22, 0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
          aria-label="DevSync Home"
        >
          <span style={{ fontSize: "1.4rem" }}>⚡</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.25rem",
              background: "linear-gradient(135deg, #f59e0b, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            DevSync
          </span>
        </Link>

        <nav
          style={{
            display: "flex",
            gap: "1.25rem",
            alignItems: "center",
          }}
          aria-label="Landing Navigation"
        >
          <a
            href="#story-match"
            className="land-nav-link"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              textDecoration: "none",
              fontSize: "0.9rem",
              transition: "color 0.2s",
            }}
          >
            Match
          </a>
          <a
            href="#story-collab"
            className="land-nav-link"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              textDecoration: "none",
              fontSize: "0.9rem",
              transition: "color 0.2s",
            }}
          >
            Collaborate
          </a>
          <a
            href="#story-devscore"
            className="land-nav-link"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              textDecoration: "none",
              fontSize: "0.9rem",
              transition: "color 0.2s",
            }}
          >
            DevScore
          </a>
          <Link
            to="/login"
            className="land-btn-ghost"
            style={{
              color: "rgba(255, 255, 255, 0.85)",
              textDecoration: "none",
              padding: "0.45rem 1.15rem",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "9999px",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="land-btn-main"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #a855f7)",
              color: "#ffffff",
              textDecoration: "none",
              padding: "0.5rem 1.35rem",
              borderRadius: "9999px",
              fontSize: "0.875rem",
              fontWeight: 600,
              boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            Join Free ✦
          </Link>
        </nav>
      </header>

      {/* ACT 1: HERO - THE DEVELOPER COSMOS */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
          padding: "6rem 1.5rem 3rem",
          pointerEvents: "none",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "840px" }}>
          {/* Status Beacon */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 1.1rem",
              borderRadius: "9999px",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              background: "rgba(245, 158, 11, 0.08)",
              color: "#f59e0b",
              fontSize: "0.825rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              marginBottom: "1.75rem",
              pointerEvents: "auto",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 10px #10b981",
              }}
            />
            <span>Active Developer Mesh · Real-Time Pairing</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.6rem, 6.5vw, 4.8rem)",
              fontWeight: 900,
              lineHeight: 1.12,
              marginBottom: "1.35rem",
              background:
                "linear-gradient(135deg, #ffffff 10%, #f59e0b 45%, #a855f7 80%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Code Beyond Flat.<br />Sync With Your Ideal Pair.
          </h1>

          <p
            style={{
              fontSize: "clamp(1.05rem, 2.2vw, 1.25rem)",
              color: "rgba(255, 255, 255, 0.72)",
              maxWidth: "620px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
            }}
          >
            DevSync connects developers by tech stack, active goals, and timezone.
            Collaborate via HD video, live chat, and build a verified DevScore together.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
              pointerEvents: "auto",
              marginBottom: "2rem",
            }}
          >
            <Link
              to="/signup"
              className="land-btn-main"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #a855f7)",
                color: "#ffffff",
                textDecoration: "none",
                padding: "0.95rem 2.4rem",
                borderRadius: "9999px",
                fontSize: "1.05rem",
                fontWeight: 700,
                boxShadow: "0 0 35px rgba(168, 85, 247, 0.45)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              Get Started Free ✦
            </Link>
            <a
              href="#story-match"
              className="land-btn-ghost"
              style={{
                color: "rgba(255, 255, 255, 0.85)",
                textDecoration: "none",
                padding: "0.95rem 2.2rem",
                borderRadius: "9999px",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                fontSize: "1.05rem",
                fontWeight: 500,
                background: "rgba(255, 255, 255, 0.04)",
                transition: "all 0.2s",
              }}
            >
              Explore Story ↓
            </a>
          </div>

          {/* Interactive Stack Pills */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              pointerEvents: "auto",
            }}
          >
            {TECH_TAGS.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "rgba(255, 255, 255, 0.65)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ACT 2: CONNECT & STACK COMPATIBILITY (Torus Knot) */}
      <section
        id="story-match"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          position: "relative",
          zIndex: 10,
          padding: "4rem 5vw",
        }}
      >
        <div
          style={{
            maxWidth: "520px",
            width: "100%",
            padding: "2.5rem",
            borderRadius: "1.5rem",
            ...GLASS_CARD,
            borderLeft: "3px solid #06b6d4",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#06b6d4",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Act II · Precise Synergy
          </div>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: "1rem",
              background: "linear-gradient(135deg, #ffffff, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Pairing with Purpose, Not Random Luck
          </h2>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.68)",
              lineHeight: 1.7,
              fontSize: "0.95rem",
              marginBottom: "1.5rem",
            }}
          >
            Great collaboration requires aligned workflows. DevSync scans your active tech
            stack, coding goals, and availability so you find developers who complement
            your exact pace.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            {[
              { title: "Stack Compatibility", desc: "Filter by exact libraries & tools" },
              { title: "Timezone Alignment", desc: "Real-time active overlaps" },
              { title: "Goal Targeting", desc: "Hackathons, learning, interview prep" },
              { title: "DevScore Metric", desc: "Reputation built on consistency" },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  background: "rgba(6, 182, 212, 0.06)",
                  border: "1px solid rgba(6, 182, 212, 0.2)",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                }}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                  {f.title}
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.55)" }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#06b6d4",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            <span>Explore Developer Directory</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* ACT 3: COLLABORATE IN REAL-TIME (Network Constellation) */}
      <section
        id="story-collab"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          position: "relative",
          zIndex: 10,
          padding: "4rem 5vw",
        }}
      >
        <div
          style={{
            maxWidth: "520px",
            width: "100%",
            padding: "2.5rem",
            borderRadius: "1.5rem",
            ...GLASS_CARD,
            borderLeft: "3px solid #a855f7",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#a855f7",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Act III · Seamless Connection
          </div>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: "1rem",
              background: "linear-gradient(135deg, #ffffff, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Instant HD Video & Live Code Chat
          </h2>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.68)",
              lineHeight: 1.7,
              fontSize: "0.95rem",
              marginBottom: "1.5rem",
            }}
          >
            Switch from discovery to execution without hopping between third-party apps.
            DevSync integrates high-performance messaging and HD video rooms powered by
            GetStream.
          </p>

          <div
            style={{
              background: "rgba(168, 85, 247, 0.08)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              borderRadius: "0.85rem",
              padding: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10b981",
                  }}
                />
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  Active Stream Session
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#a855f7",
                  fontWeight: 600,
                }}
              >
                1080p · Encrypted
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.6)" }}>
              Includes screen sharing, active speaker spotlighting, and persistent channel
              chat for continuous project iteration.
            </p>
          </div>

          <Link
            to="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#a855f7",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            <span>Learn About Live Calls</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* ACT 4: GROW YOUR DEVSCORE (Emerald Crystal) */}
      <section
        id="story-devscore"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
          padding: "4rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "680px", width: "100%", textAlign: "center" }}>
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#10b981",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Act IV · True Credibility
          </div>
          <h2
            style={{
              fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: "1rem",
              background: "linear-gradient(135deg, #ffffff, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Your Verified DevScore
          </h2>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.68)",
              lineHeight: 1.7,
              fontSize: "1rem",
              marginBottom: "2.5rem",
              maxWidth: "560px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            DevScore is a transparent scoring engine measuring technical breadth, peer
            collaboration milestones, and active problem-solving consistency.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              {
                icon: "👤",
                title: "Profile Completeness",
                points: "+20 Pts",
                desc: "Bio, active timezone, learning goals",
                color: "#f59e0b",
              },
              {
                icon: "⚡",
                title: "Technical Breadth",
                points: "+30 Pts",
                desc: "Verified tech stack and coding languages",
                color: "#06b6d4",
              },
              {
                icon: "🔗",
                title: "Social Proof",
                points: "+25 Pts",
                desc: "GitHub commits, LinkedIn, portfolio links",
                color: "#a855f7",
              },
              {
                icon: "📈",
                title: "Peer Engagement",
                points: "+25 Pts",
                desc: "Completed calls, friend connections, ratings",
                color: "#10b981",
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  ...GLASS_CARD,
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  textAlign: "left",
                  borderTop: `2px solid ${card.color}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{card.icon}</span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: card.color,
                      background: `${card.color}18`,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "9999px",
                    }}
                  >
                    {card.points}
                  </span>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff" }}>
                  {card.title}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "rgba(255, 255, 255, 0.55)",
                    marginTop: "0.35rem",
                  }}
                >
                  {card.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACT 5: THE WORKFLOW (Three Simple Steps) */}
      <section
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
          padding: "5rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "880px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                fontWeight: 800,
                background: "linear-gradient(135deg, #ffffff, rgba(255, 255, 255, 0.6))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              How DevSync Works
            </h2>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "0.95rem",
                marginTop: "0.5rem",
              }}
            >
              Start shipping in under three minutes.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                step: "01",
                title: "Create Your Identity",
                desc: "Sign up securely with verified email auth. Configure your tech stack and learning priorities.",
                color: "#f59e0b",
              },
              {
                step: "02",
                title: "Discover & Filter Pairs",
                desc: "Use the directory to discover compatible engineers with shared goals, timezones, and DevScores.",
                color: "#a855f7",
              },
              {
                step: "03",
                title: "Sync & Level Up",
                desc: "Initiate live chats, launch HD peer-programming calls, and build a lasting engineering network.",
                color: "#10b981",
              },
            ].map((s) => (
              <div
                key={s.step}
                style={{
                  ...GLASS_CARD,
                  padding: "2rem",
                  borderRadius: "1.25rem",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-0.5rem",
                    right: "0.5rem",
                    fontSize: "4.5rem",
                    fontWeight: 900,
                    color: `${s.color}0a`,
                    pointerEvents: "none",
                  }}
                >
                  {s.step}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: s.color,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                  }}
                >
                  Step {s.step}
                </div>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    marginBottom: "0.75rem",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.875rem",
                    lineHeight: 1.65,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACT 6: THE GATEWAY - FINAL CALL TO ACTION */}
      <section
        style={{
          minHeight: "55vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
          padding: "4rem 1.5rem 6rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "620px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚡</div>
          <h2
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: "1rem",
              background: "linear-gradient(135deg, #ffffff, #f59e0b 50%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Ready to Build Together?
          </h2>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.65)",
              marginBottom: "2.25rem",
              lineHeight: 1.7,
              fontSize: "1.05rem",
            }}
          >
            Never code alone again. Join DevSync and sync with developers who challenge
            and elevate your craft.
          </p>
          <Link
            to="/signup"
            className="land-btn-main"
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #f59e0b, #a855f7)",
              color: "#ffffff",
              textDecoration: "none",
              padding: "1rem 2.8rem",
              borderRadius: "9999px",
              fontSize: "1.1rem",
              fontWeight: 700,
              boxShadow: "0 0 45px rgba(168, 85, 247, 0.5)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            Join Free — It Takes 30s ✦
          </Link>
          <p
            style={{
              marginTop: "1.25rem",
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            No credit card required · Free community plan · Instant access
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          position: "relative",
          zIndex: 10,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(10, 6, 22, 0.85)",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>⚡</span>
          <span
            style={{
              fontWeight: 800,
              background: "linear-gradient(135deg, #f59e0b, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            DevSync
          </span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.35)" }}>
          The real-time developer pairing and collaboration network.
        </p>
      </footer>
    </div>
  );
};

/* Scroll progress indicator */
const ScrollBar = () => {
  useEffect(() => {
    let bar = document.getElementById("ds-scroll-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "ds-scroll-bar";
      Object.assign(bar.style, {
        position: "fixed",
        top: 0,
        left: 0,
        height: "2px",
        background: "linear-gradient(90deg, #f59e0b, #a855f7, #6366f1)",
        zIndex: 200,
        width: "0%",
        transition: "width 0.1s linear",
        pointerEvents: "none",
      });
      document.body.appendChild(bar);
    }

    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = total > 0 ? `${(window.scrollY / total) * 100}%` : "0%";
    };

    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      bar?.remove();
    };
  }, []);

  return null;
};

export default LandingPage;
