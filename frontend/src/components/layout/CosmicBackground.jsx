import { useEffect, useRef } from "react";
import * as THREE from "three";

const CosmicBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check WebGL availability
    let gl;
    try {
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    } catch {
      return;
    }
    if (!gl) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 800 : 1600;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 25;

    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    const c1 = new THREE.Color("#f59e0b"); // amber
    const c2 = new THREE.Color("#a855f7"); // violet
    const c3 = new THREE.Color("#06b6d4"); // cyan

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 60;
      positions[i3 + 1] = (Math.random() - 0.5) * 45;
      positions[i3 + 2] = (Math.random() - 0.5) * 40;

      const pick = Math.random();
      const col = new THREE.Color();
      if (pick < 0.35) {
        col.lerpColors(c1, c2, Math.random());
      } else if (pick < 0.7) {
        col.lerpColors(c2, c3, Math.random());
      } else {
        col.copy(c2);
      }

      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: isMobile ? 0.12 : 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    };

    if (!prefersReducedMotion) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
    }

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    let frameId;
    let isVisible = true;
    const clock = new THREE.Clock();

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && !frameId) {
        clock.start();
        animate();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const animate = () => {
      if (!isVisible) {
        frameId = null;
        return;
      }
      frameId = requestAnimationFrame(animate);

      if (!prefersReducedMotion) {
        const delta = clock.getDelta();
        pts.rotation.y += delta * 0.04;
        pts.rotation.x += delta * 0.015;

        camera.position.x += (mouseX * 4 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 4 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 10%, rgba(168, 85, 247, 0.12), transparent 50%), radial-gradient(circle at 85% 70%, rgba(245, 158, 11, 0.08), transparent 45%), radial-gradient(circle at 15% 85%, rgba(6, 182, 212, 0.08), transparent 45%), #0a0616",
      }}
    >
      {/* DevSync developer illustration background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/devsync-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.07,
          mixBlendMode: "screen",
          filter: "saturate(1.4) brightness(0.8)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-70"
      />
    </div>
  );
};

export default CosmicBackground;
