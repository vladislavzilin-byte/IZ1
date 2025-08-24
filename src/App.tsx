import React, { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ScrollControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from "@react-three/postprocessing";
import { motion, AnimatePresence } from "framer-motion";

const logoUrl: string | null = "/iz-logo.svg";
type Lang = "ru" | "en";

const i18n: Record<Lang, any> = {
  ru: { hero: { title: "Irina Zilina hair trend", cta: "Запустить свою систему", sub: "Новая женственная эстетика: мягкие градиенты, глубина и живые пряди в 3D." },
        sections: { aboutTitle: "О системе", about: "IZ HAIR TREND — визуальная система для укладок: 3D-демонстрация образов (волны, высокий хвост, невесты), интеграция с Instagram и быстрые сценарии записи.", feats: [{ t: "Мягкая глубина", d: "Стеклянные карточки, нежные блики и деликатный пост-обработчик." },{ t: "Живые пряди", d: "Ленты на кривых: лёгкое дыхание сцены при скролле и движении." },{ t: "Акцент на контент", d: "Портфолио: невесты, волны, обучение." }], actionTitle: "Готовы запустить?", actionText: "Нажмите и свяжитесь — подключим ваш контент и стилизуем под салон." }, footer: { domain: "izhairtrend.shop", email: "support@izhairtrend.shop", insta: "Instagram портфолио" } },
  en: { hero: { title: "Irina Zilina hair trend", cta: "Launch Your System", sub: "Soft, feminine aesthetic: silky gradients, depth and flowing hair-ribbons in 3D." },
        sections: { aboutTitle: "About", about: "IZ HAIR TREND showcases hairstyles in 3D — bridal looks, Hollywood waves — with Instagram integration and fast booking flows.", feats: [{ t: "Soft depth", d: "Glass cards, gentle highlights and subtle post-FX." },{ t: "Hair ribbons", d: "Curved, flowing ribbons emulating hair strands." },{ t: "Content first", d: "Portfolio focus: brides, waves, education." }], actionTitle: "Ready to start?", actionText: "Click to launch and contact us to tailor the setup to your salon." }, footer: { domain: "izhairtrend.shop", email: "support@izhairtrend.shop", insta: "Instagram portfolio" } }
};

const PALETTE = { bg: "#0b0b12", blush: "#ffd6df", champagne: "#fff1c9", rose: "#f5b7c8", pearl: "#f7e9f2", outline: "#ffe2ea" };
function easeOutCubic(x: number) { return 1 - Math.pow(1 - x, 3); }

function Shards({ count = 700, duration = 2.4 }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const phases = useMemo(() => new Float32Array(count).map(() => Math.random()), [count]);
  const seeds = useMemo(() => new Array(count).fill(0).map(() => new THREE.Vector3((Math.random() - 0.5) * 36, (Math.random() - 0.5) * 24, (Math.random() - 0.5) * 28)), [count]);
  const targets = useMemo(() => new Array(count).fill(0).map(() => new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 3.4)), [count]);
  const start = useRef<number>(0);
  useEffect(() => { start.current = performance.now(); }, []);
  useFrame(() => {
    const t = (performance.now() - start.current) / 1000;
    for (let i = 0; i < count; i++) {
      const p = Math.min(1, Math.max(0, (t - phases[i] * 0.6) / duration));
      const pos = seeds[i].clone().lerp(targets[i], easeOutCubic(p));
      const scale = Math.max(0.1, 1 - p * 0.85);
      dummy.position.copy(pos);
      dummy.rotation.set((pos.x + t * 0.4) * 0.12, (pos.y - t * 0.35) * 0.16, (pos.z + t * 0.18) * 0.2);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
      const c = new THREE.Color().setHSL(0.96 - 0.06 * p, 0.55, 0.72);
      // @ts-ignore
      ref.current.setColorAt(i, c);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    // @ts-ignore
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  });
  return (<instancedMesh ref={ref} args={[undefined as any, undefined as any, count]}><tetrahedronGeometry args={[0.22]} /><meshStandardMaterial metalness={0.25} roughness={0.25} emissiveIntensity={0.15} /></instancedMesh>);
}

function HairRibbons({ count = 3 }: { count?: number }) {
  const group = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const x = (state.pointer.x || 0) * 0.25;
    const y = (state.pointer.y || 0) * 0.15;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, y, 0.02);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x, 0.02);
  });
  const items = useMemo(() => new Array(count).fill(0).map((_, i) => ({ key: i, phase: Math.random() * Math.PI * 2 })), [count]);
  return <group ref={group}>{items.map(({ key, phase }) => <Ribbon key={key} phase={phase} />)}</group>;
}

function Ribbon({ phase = 0 }: { phase?: number }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const tRef = useRef(0);
  const base = useMemo(() => (Math.random() - 0.5) * 1.4, []);
  useFrame((state, delta) => {
    tRef.current += delta;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 7; i++) {
      const u = i / 6;
      const x = THREE.MathUtils.lerp(-3.5, 3.5, u);
      const y = Math.sin(u * Math.PI * 2 + phase + tRef.current * 0.8) * (0.6 + base * 0.2);
      const z = Math.cos(u * Math.PI + phase * 0.5 + tRef.current * 0.4) * 0.6;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 200, 0.08, 16, false);
    const g = mesh.current.geometry as THREE.BufferGeometry;
    g.dispose();
    mesh.current.geometry = geo;
  });
  return (<mesh ref={mesh} position={[0,0,-0.5]}><bufferGeometry /><meshPhysicalMaterial transmission={0.8} thickness={0.7} roughness={0.1} metalness={0.05} clearcoat={1} color={new THREE.Color('#ffd6df')} emissive={new THREE.Color('#f5b7c8')} emissiveIntensity={0.08} /></mesh>);
}

function HeroTitle({ lang }: { lang: Lang }) {
  const t = i18n[lang].hero.title;
  return (<Float speed={0.9} rotationIntensity={0.15} floatIntensity={0.5}>
    <Text fontSize={1.5} anchorX="center" anchorY="middle" maxWidth={12} lineHeight={1} letterSpacing={0.02} outlineWidth={0.03} outlineColor={'#ffe2ea'} outlineOpacity={1} color={'#f5b7c8'} fillOpacity={0.0}>{t.toUpperCase()}</Text>
  </Float>);
}

function IntroCurtain() {
  const [done, setDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDone(true), 1600); return () => clearTimeout(t); }, []);
  return (<AnimatePresence>{!done && (<motion.div className="fixed inset-0 z-40 pointer-events-none" initial={{opacity:1}} animate={{opacity:0}} exit={{opacity:0}} transition={{duration:1.2}}>
    <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0e0d12] to-transparent" />
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vmin] h-[70vmin] rounded-[32px] blur-3xl opacity-30" style={{background:"radial-gradient(circle at 50% 50%, #ffd6df 0%, transparent 60%)"}}/>
  </motion.div>)}</AnimatePresence>);
}

function Scene({ lang }: { lang: Lang }) {
  return (<>
    <ambientLight intensity={0.5} />
    <directionalLight intensity={0.9} position={[4,6,6]} />
    <Environment preset="city" />
    <Shards />
    <HairRibbons />
    <HeroTitle lang={lang} />
    <EffectComposer>
      <Bloom intensity={0.7} luminanceThreshold={0.18} luminanceSmoothing={0.5} />
      <DepthOfField focusDistance={0.008} focalLength={0.015} bokehScale={1.6} />
      <Noise opacity={0.02} /><Vignette eskil={false} offset={0.18} darkness={0.5} />
    </EffectComposer>
  </>);
}

function LanguageSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (<div className="fixed top-4 right-4 z-50 backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl px-3 py-2 flex gap-2 shadow-lg">
    {(["ru","en"] as Lang[]).map((L) => (
      <button key={L} onClick={() => setLang(L)} className={`text-sm font-medium tracking-wide px-2 py-1 rounded-lg transition ${lang===L ? "bg-white/15 text-white":"text-white/80 hover:text-white"}`}>{L.toUpperCase()}</button>
    ))}
  </div>);
}

function PrimaryButton({ children, onClick, className="" }: any) {
  return (<button onClick={onClick} className={`group relative inline-flex items-center justify-center px-6 py-3 rounded-2xl overflow-hidden font-semibold tracking-wide transition hover:scale-[1.02] active:scale-95 ${className}`} style={{background:"radial-gradient(120% 120% at 50% 0%, rgba(255,214,223,0.45) 0%, rgba(255,241,201,0.28) 50%, rgba(255,241,201,0.12) 100%)"}}>
    <span className="absolute inset-0 bg-gradient-to-r from-[#ffd9e6]/40 to-[#fff1c7]/40 opacity-50 blur-2xl" />
    <span className="absolute inset-0 border border-white/15 rounded-2xl" /><span className="relative text-white">{children}</span>
  </button>);
}

export default function App() {
  const [lang, setLang] = useState<Lang>("ru");
  const copy = i18n[lang];
  const [launched, setLaunched] = useState(false);
  useEffect(() => { const n = navigator?.language?.toLowerCase?.() || ""; if (n.startsWith("en")) setLang("en"); if (n.startsWith("ru")) setLang("ru"); }, []);
  return (<div className="min-h-screen w-full text-white selection:bg-pink-300/30">
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b12] via-[#0d0c12] to-[#0b0b12]" />
      <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[120vmax] h-[120vmax] rounded-full opacity-40 blur-3xl" style={{background:"radial-gradient(circle at 50% 50%, #ffd6df 0%, transparent 60%)"}} />
      <div className="absolute top-1/2 right-0 w-[60vmax] h-[60vmax] rounded-full opacity-25 blur-3xl" style={{background:"radial-gradient(circle at 50% 50%, #fff1c9 0%, transparent 60%)"}} />
    </div>
    <LanguageSwitcher lang={lang} setLang={setLang} />
    <IntroCurtain />
    <div className="fixed inset-0 -z-0">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={[PALETTE.bg]} />
        <ScrollControls pages={3}>
          <Suspense fallback={null}>
            <Scene lang={lang} />
          </Suspense>
        </ScrollControls>
      </Canvas>
    </div>
    <main className="relative z-10 flex flex-col items-center">
      <section className="w-full flex flex-col items-center justify-center text-center pt-28 pb-20 gap-6">
        {logoUrl ? <img src={logoUrl} alt="IZ Hair Trend logo" className="w-44 h-auto opacity-90 drop-shadow" /> : null}
        <div className="max-w-3xl px-6"><p className="text-white/80 text-base md:text-lg">{copy.hero.sub}</p></div>
        <PrimaryButton onClick={() => setLaunched(true)}>{copy.hero.cta}</PrimaryButton>
        <AnimatePresence>{launched && (<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="mt-3 px-4 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xl"><span className="text-sm text-white/85">{lang==="ru"?"Система запущена — прокрутите вниз, чтобы увидеть детали и подключиться.":"System launched — scroll to explore details and connect."}</span></motion.div>)}</AnimatePresence>
      </section>
      <section className="relative w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-24">
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">{copy.sections.aboutTitle}</h2>
          <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 leading-relaxed text-white/90">{copy.sections.about}</div>
        </div>
        {copy.sections.feats.map((f:any,i:number)=>(<div key={i} className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6"><h3 className="text-xl font-medium mb-2">{f.t}</h3><p className="text-white/80">{f.d}</p></div>))}
      </section>
      <section className="w-full max-w-4xl text-center px-6 pb-24">
        <h3 className="text-2xl md:text-3xl font-semibold mb-4">{copy.sections.actionTitle}</h3>
        <p className="text-white/80 mb-6">{copy.sections.actionText}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <PrimaryButton onClick={() => (window.location.href = "mailto:" + i18n[lang].footer.email)}>{lang==="ru"?"Связаться":"Contact"}</PrimaryButton>
          <a href="https://www.instagram.com/irinazilina.hairtrend" target="_blank" rel="noreferrer" className="px-6 py-3 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl text-white/90 hover:text-white transition">{i18n[lang].footer.insta}</a>
        </div>
      </section>
    </main>
    <footer className="relative z-10 w-full px-6 pb-12">
      <div className="max-w-6xl mx-auto rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 flex flex кол md:flex-row items-center justify-between gap-4">
        <div className="text-white/85"><div className="font-semibold">{i18n[lang].footer.domain}</div><div className="text-sm">{i18n[lang].footer.email}</div></div>
        <div className="text-sm text-white/70">© {new Date().getFullYear()} IZ HAIR TREND · Klaipėda · All rights reserved</div>
      </div>
    </footer>
  </div>);
}
