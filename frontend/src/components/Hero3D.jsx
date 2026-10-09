import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useCanHover, useMotionPrefs } from "../lib/motionPrefs";

// Layers fan out in x/z and twist slightly so each colour shows at the edges, like the reference.
const SHEETS = [
  { color: "#ff7a1a", y: -0.95, x: 0.18, z: 0.1, twist: 0.18, phase: 0.0, rough: 0.5 },
  { color: "#cfcac2", y: -0.7, x: -0.12, z: -0.05, twist: -0.1, phase: 0.9, rough: 0.6 },
  { color: "#1d1d1d", y: -0.48, x: 0.08, z: 0.12, twist: 0.08, phase: 1.7, rough: 0.35 },
  { color: "#d4ef1f", y: -0.26, x: -0.16, z: -0.02, twist: -0.16, phase: 2.6, rough: 0.45 },
  { color: "#9aa0a8", y: -0.04, x: 0.12, z: 0.06, twist: 0.12, phase: 3.4, rough: 0.3 },
  { color: "#ff9a4a", y: 0.16, x: -0.06, z: -0.08, twist: -0.06, phase: 4.1, rough: 0.5 },
  { color: "#ffffff", y: 0.4, x: 0, z: 0, twist: 0, phase: 5.0, rough: 0.6, news: true },
];

function makeNewsTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 704;
  const g = c.getContext("2d");
  g.fillStyle = "#fbfaf7";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#121212";
  g.font = "bold 92px Georgia, serif";
  g.fillText("THE DAILY TRUTH", 70, 130);
  g.fillRect(70, 160, 884, 6);
  g.fillRect(70, 205, 520, 34);
  g.fillRect(70, 255, 430, 34);
  g.fillStyle = "#2f55ff";
  g.fillRect(620, 205, 334, 210);
  g.fillStyle = "#dcf44a";
  g.beginPath();
  g.arc(787, 310, 58, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#9a958d";
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 9; row++) {
      const w = row % 4 === 3 ? 160 : 250;
      g.fillRect(70 + col * 300, 330 + row * 38 + (col === 2 ? 110 : 0), w, 12);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function Sheet({ color, y, x, z, twist, phase, rough, news, animate }) {
  const mesh = useRef();
  const geometry = useMemo(() => new THREE.PlaneGeometry(3.4, 2.4, 56, 40), []);
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  const texture = useMemo(() => (news ? makeNewsTexture() : null), [news]);

  const deform = (t) => {
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const yy = base[i * 3 + 1];
      const edge = Math.pow(Math.abs(x) / 1.7, 2.2);
      const z =
        Math.sin(x * 1.7 + phase + t * 0.6) * 0.16 +
        Math.cos(yy * 2.2 + phase * 1.3 + t * 0.45) * 0.11 +
        edge * 0.28 * Math.sin(phase + t * 0.3);
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  useEffect(() => {
    deform(0);
    return () => {
      geometry.dispose();
      texture?.dispose();
    };
  }, []);

  useFrame((state) => {
    if (animate) deform(state.clock.elapsedTime);
  });

  return (
    <mesh ref={mesh} geometry={geometry} position={[x, y, z]} rotation={[-Math.PI / 2.6, 0, twist]}>
      <meshPhysicalMaterial
        color={color}
        map={texture}
        roughness={rough}
        metalness={0.05}
        sheen={0.15}
        sheenColor="#ffffff"
        clearcoat={news ? 0.1 : 0.3}
        envMapIntensity={0.55}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function MagnifyingGlass() {
  return (
    <group rotation={[0.35, -0.5, 0.25]}>
      <mesh>
        <torusGeometry args={[0.58, 0.085, 32, 96]} />
        <meshStandardMaterial color="#d9dce1" metalness={1} roughness={0.22} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.54, 0.54, 0.05, 64]} />
        <meshPhysicalMaterial color="#cfd9ff" transmission={1} thickness={0.35} roughness={0.04} ior={1.45} transparent />
      </mesh>
      <mesh position={[0, 0, -0.03]}>
        <circleGeometry args={[0.2, 48]} />
        <meshStandardMaterial color="#2f55ff" emissive="#2f55ff" emissiveIntensity={0.35} roughness={0.3} />
      </mesh>
      <mesh position={[0.62, -0.62, 0]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.075, 0.09, 0.85, 24]} />
        <meshStandardMaterial color="#141414" roughness={0.35} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Shield() {
  const { shape, check } = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.62);
    s.bezierCurveTo(0.22, 0.5, 0.42, 0.48, 0.5, 0.46);
    s.bezierCurveTo(0.52, 0.0, 0.42, -0.42, 0, -0.62);
    s.bezierCurveTo(-0.42, -0.42, -0.52, 0.0, -0.5, 0.46);
    s.bezierCurveTo(-0.42, 0.48, -0.22, 0.5, 0, 0.62);
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 0.0, 0.16),
      new THREE.Vector3(-0.05, -0.16, 0.16),
      new THREE.Vector3(0.24, 0.2, 0.16),
    ]);
    return { shape: s, check: path };
  }, []);
  return (
    <group scale={0.62}>
      <mesh position={[0, 0, -0.06]}>
        <extrudeGeometry args={[shape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 6, curveSegments: 24 }]} />
        <meshPhysicalMaterial color="#f4f2ee" roughness={0.35} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0, -0.1]} scale={1.12}>
        <extrudeGeometry args={[shape, { depth: 0.12, bevelEnabled: false, curveSegments: 24 }]} />
        <meshStandardMaterial color="#ff7a1a" roughness={0.45} />
      </mesh>
      <mesh>
        <tubeGeometry args={[check, 24, 0.055, 12, false]} />
        <meshStandardMaterial color="#2f55ff" roughness={0.3} />
      </mesh>
    </group>
  );
}

function Floating({ children, speed = 1, amp = 0.12, rot = 0.15, offset = 0, animate, ...props }) {
  const ref = useRef();
  useFrame((state) => {
    if (!animate) return;
    const t = state.clock.elapsedTime * speed + offset;
    ref.current.position.y = (props.position?.[1] ?? 0) + Math.sin(t) * amp;
    ref.current.rotation.z = Math.sin(t * 0.7) * rot;
    ref.current.rotation.x = Math.cos(t * 0.5) * rot * 0.5;
  });
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

function Rig({ children, animate, parallax }) {
  const group = useRef();
  useFrame((state, delta) => {
    if (!animate) return;
    const t = state.clock.elapsedTime;
    const targetY = 0.35 + Math.sin(t * 0.15) * 0.25 + (parallax ? state.pointer.x * 0.35 : 0);
    const targetX = 0.12 + (parallax ? -state.pointer.y * 0.18 : 0);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 3, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 3, delta);
  });
  return (
    <group ref={group} rotation={[0.12, 0.35, 0]}>
      {children}
    </group>
  );
}

function EnvironmentLight() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

export default function Hero3D() {
  const wrap = useRef(null);
  const [inView, setInView] = useState(true);
  const { motionOn } = useMotionPrefs();
  const canHover = useCanHover();

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.01 });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  const animate = motionOn && inView;

  return (
    <div ref={wrap} className="h-full w-full" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        frameloop={animate ? "always" : "demand"}
        camera={{ position: [0, 0.3, 6.8], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <EnvironmentLight />
        <ambientLight intensity={0.35} />
        <directionalLight position={[-3, 5, 4]} intensity={1.6} />
        <pointLight position={[2, -2, 2]} intensity={6} color="#ffb27a" />
        <Rig animate={animate} parallax={canHover}>
          <Floating animate={animate} amp={0.06} rot={0.03} speed={0.6}>
            {SHEETS.map((s) => (
              <Sheet key={s.color} {...s} animate={animate} />
            ))}
          </Floating>
          <Floating animate={animate} position={[-0.2, 1.25, 0.5]} amp={0.14} rot={0.12} speed={0.9} offset={1.2} scale={0.78}>
            <MagnifyingGlass />
          </Floating>
          <Floating animate={animate} position={[1.65, 0.75, 0.6]} amp={0.1} rot={0.18} speed={0.75} offset={2.4}>
            <Shield />
          </Floating>
        </Rig>
      </Canvas>
    </div>
  );
}
