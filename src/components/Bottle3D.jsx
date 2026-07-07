import { useEffect, useRef } from "react";
import * as THREE from "three";

// Wraps a front image and back image onto a cylindrical bottle mesh that
// genuinely rotates in 3D — as it turns, you see the real front label,
// then blank sides, then the real back label, not a flat photo swap.
export default function Bottle3D({ frontImage, backImage, autoRotate = true }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lighting — soft ambient + a key light for believable shading
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);

    const loader = new THREE.TextureLoader();
    const group = new THREE.Group();
    scene.add(group);

    let frontMesh, backMesh;

    loader.load(frontImage, (frontTex) => {
      frontTex.colorSpace = THREE.SRGBColorSpace;
      const frontMat = new THREE.MeshStandardMaterial({
        map: frontTex,
        transparent: true,
        roughness: 0.35,
        metalness: 0,
      });
      // Half-cylinder facing forward (front label)
      const frontGeo = new THREE.CylinderGeometry(1, 1, 2.6, 64, 1, true, -Math.PI / 2, Math.PI);
      frontMesh = new THREE.Mesh(frontGeo, frontMat);
      group.add(frontMesh);
    });

    loader.load(backImage, (backTex) => {
      backTex.colorSpace = THREE.SRGBColorSpace;
      const backMat = new THREE.MeshStandardMaterial({
        map: backTex,
        transparent: true,
        roughness: 0.35,
        metalness: 0,
      });
      // Half-cylinder facing backward (back label) — mirrored so text reads correctly
      const backGeo = new THREE.CylinderGeometry(1, 1, 2.6, 64, 1, true, Math.PI / 2, Math.PI);
      backGeo.scale(-1, 1, 1);
      backMesh = new THREE.Mesh(backGeo, backMat);
      group.add(backMesh);
    });

    let rotationY = 0;
    let dragging = false;
    let lastX = 0;
    let autoRotateActive = autoRotate;
    let resumeTimeout;

    const onPointerDown = (e) => {
      dragging = true;
      autoRotateActive = false;
      lastX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      rotationY += (x - lastX) * 0.01;
      lastX = x;
    };
    const onPointerUp = () => {
      dragging = false;
      clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => (autoRotateActive = autoRotate), 1500);
    };

    container.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    container.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    let raf;
    const animate = () => {
      if (autoRotateActive && !dragging) rotationY += 0.006;
      group.rotation.y = rotationY;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      container.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [frontImage, backImage, autoRotate]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", cursor: "grab", touchAction: "none" }}
    />
  );
}