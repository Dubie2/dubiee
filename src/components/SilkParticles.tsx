import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const COUNT = 90;

function Pearls() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const scroll = useRef(0);

  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: (Math.random() - 0.5) * 14,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 6,
        s: 0.018 + Math.random() * 0.035,
        speed: 0.15 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useEffect(() => {
    const onScroll = () => {
      scroll.current = window.scrollY / Math.max(1, window.innerHeight);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    seeds.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 0.6,
        p.y + Math.cos(t * p.speed * 0.8 + p.phase) * 0.5 + scroll.current * 1.6,
        p.z,
      );
      dummy.rotation.set(t * 0.2 + p.phase, t * 0.15, 0);
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial
        color="#E6E6FA"
        roughness={0.15}
        metalness={0.35}
        transparent
        opacity={0.5}
      />
    </instancedMesh>
  );
}

export function SilkParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
      <Canvas camera={{ position: [0, 0, 8], fov: 55 }} dpr={[1, 1.8]}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 6, 5]} intensity={1.6} color="#B19CD9" />
        <directionalLight position={[-5, -3, 2]} intensity={0.8} color="#ffffff" />
        <Pearls />
      </Canvas>
    </div>
  );
}
