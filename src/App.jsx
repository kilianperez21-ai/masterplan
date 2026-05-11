import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// ─── STORAGE ──────────────────────────────────────────────────────────────────
function useLS(key, def) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; }
    catch { return def; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(v)); }, [key, v]);
  return [v, setV];
}

// ─── AI ───────────────────────────────────────────────────────────────────────
async function callAI(system, messages, onChunk) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, system, messages }),
  });
  const d = await res.json();
  return d.content?.map(b => b.text || "").join("") || "Error de conexión.";
}

// ─── MODULES ──────────────────────────────────────────────────────────────────
const ALL_MODULES = [
  { id: "habitos",       icon: "🧠", label: "Mentalidad",    color: "#a78bfa" },
  { id: "finanzas",      icon: "💰", label: "Finanzas",      color: "#34d399" },
  { id: "entreno",       icon: "💪", label: "Entreno",       color: "#f97316" },
  { id: "sueno",         icon: "😴", label: "Sueño",         color: "#60a5fa" },
  { id: "negocio",       icon: "💼", label: "Negocio",       color: "#fbbf24" },
  { id: "estudios",      icon: "📚", label: "Estudios",      color: "#f472b6" },
  { id: "lectura",       icon: "📖", label: "Lectura",       color: "#fb923c" },
  { id: "relaciones",    icon: "💑", label: "Relaciones",    color: "#fb7185" },
  { id: "nutricion",     icon: "🍎", label: "Nutrición",     color: "#4ade80" },
  { id: "productividad", icon: "🎯", label: "Productividad", color: "#38bdf8" },
  { id: "bienestar",     icon: "🧘", label: "Bienestar",     color: "#c084fc" },
];

function buildSP(moduleId, user) {
  const extra = user.extra ? `IMPORTANTE - Ten siempre en cuenta: ${user.extra}.` : "";
  const base = `Usuario: ${user.nombre}, ${user.edad} años, ${user.sexo}. Peso: ${user.peso}kg, altura: ${user.altura}cm. Objetivo físico: ${user.objetivoFisico}. Trabajo: ${user.trabajo}. Horario: ${user.horario}. Ahorros: ${user.dinero}€. Negocio: ${user.negocio}. Estudios: ${user.estudia}. Pareja: ${user.pareja}. ${extra} USA siempre esta información. NUNCA respondas de forma genérica.`;
  const sp = {
    habitos: "Eres el mejor coach de mentalidad y psicología del rendimiento. Das herramientas concretas basadas en estoicismo, neurociencia y psicología positiva.",
    finanzas: "Eres el mejor asesor financiero para personas que empiezan desde cero. Das consejos con números reales: brokers, fondos, presupuestos.",
    entreno: "Eres el mejor entrenador personal. Creas planes concretos con series, reps y progresión adaptados al equipamiento disponible.",
    sueno: "Eres el mayor experto en optimización del sueño. Das consejos específicos sobre ciclos, rutinas y suplementos.",
    negocio: "Eres el mayor experto en emprendimiento. Das pasos concretos, números reales y estrategias para el negocio específico del usuario.",
    estudios: "Eres el mayor experto en aprendizaje acelerado. Adaptas todo a lo que estudia el usuario. Creas preguntas de examen personalizadas.",
    lectura: "Eres el mejor coach de desarrollo personal a través de la lectura. Recomiendas libros y podcasts muy específicos según el perfil del usuario.",
    relaciones: "Eres el mejor terapeuta de pareja y psicólogo de relaciones. Haces preguntas profundas, detectas patrones y das estrategias muy concretas.",
    nutricion: "Eres el mejor nutricionista deportivo. Creas dietas personalizadas con alimentos concretos, cantidades y horarios.",
    productividad: "Eres el mejor coach de productividad. Ayudas a gestionar el tiempo, eliminar distracciones y foco digital.",
    bienestar: "Eres el mejor psicólogo de bienestar mental. Enseñas meditación, gestión del estrés y equilibrio emocional de forma práctica.",
  };
  return `${sp[moduleId] || "Eres un experto de élite."}\n\n${base}`;
}

// ─── DESIGN ───────────────────────────────────────────────────────────────────
const BG = "#08080f";
const CARD = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";

function Card({ children, className = "", style = {}, onClick }) {
  return <div onClick={onClick} className={`rounded-2xl p-4 ${className} ${onClick ? "cursor-pointer active:scale-95 transition-transform" : ""}`} style={{ background: CARD, border: `1px solid ${BORDER}`, ...style }}>{children}</div>;
}
function Lbl({ children, className = "" }) { return <div className={`text-xs text-white/30 uppercase tracking-widest mb-2 font-semibold ${className}`}>{children}</div>; }
function Inp({ value, onChange, placeholder, type = "text", className = "" }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    className={`w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500 ${className}`}
    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />;
}
function Sel({ value, onChange, children }) {
  return <select value={value} onChange={onChange} className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none" style={{ background: "#12121f", border: `1px solid ${BORDER}` }}>{children}</select>;
}
function Tag({ children, color, active, onClick }) {
  return <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
    style={{ background: active ? color + "25" : CARD, border: `1px solid ${active ? color : BORDER}`, color: active ? color : "rgba(255,255,255,0.4)" }}>{children}</button>;
}
function GoldBtn({ children, onClick, color = "#7c3aed", disabled = false, ghost = false, small = false }) {
  return <button onClick={onClick} disabled={disabled}
    className={`${small ? "px-4 py-2 text-xs" : "w-full py-3.5 text-sm"} rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-30`}
    style={{ background: ghost ? "rgba(255,255,255,0.06)" : color, color: "white", border: ghost ? `1px solid ${BORDER}` : "none" }}>{children}</button>;
}
function ProgressBar({ value, max, color }) {
  return <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
  </div>;
}
function XBtn({ onClick }) {
  return <button onClick={onClick} className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-red-500/20 transition-all flex-shrink-0 text-xs">✕</button>;
}

// ─── AI CHAT ─────────────────────────────────────────────────────────────────
function AIChat({ sp, color, name, initMsg }) {
  const [msgs, setMsgs] = useState(initMsg ? [{ role: "assistant", content: initMsg }] : []);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send(text) {
    const content = text || inp.trim();
    if (!content || loading) return;
    const um = { role: "user", content };
    const nm = [...msgs, um];
    setMsgs(nm); setInp(""); setLoading(true);
    try { const r = await callAI(sp, nm); setMsgs([...nm, { role: "assistant", content: r }]); }
    catch { setMsgs([...nm, { role: "assistant", content: "Error de conexión." }]); }
    setLoading(false);
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>IA Experta · {name}</span>
      </div>
      <div className="h-56 overflow-y-auto flex flex-col gap-2 mb-3 pr-1">
        {msgs.length === 0 && <div className="flex items-center justify-center h-full"><p className="text-white/20 text-xs text-center">Conozco tu perfil completo.<br />Pregúntame lo que necesites.</p></div>}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[88%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed"
              style={{ background: m.role === "user" ? color + "25" : "rgba(255,255,255,0.06)", border: `1px solid ${m.role === "user" ? color + "40" : BORDER}`, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="rounded-2xl px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.06)" }}><span className="animate-pulse" style={{ color }}>Pensando...</span></div></div>}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Escribe tu pregunta..." className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
        <button onClick={() => send()} disabled={loading} className="rounded-xl px-4 font-bold text-white text-lg active:scale-95 disabled:opacity-40" style={{ background: color }}>→</button>
      </div>
    </Card>
  );
}

// ─── NOTAS CON CARPETAS ───────────────────────────────────────────────────────
function NotasCarpetas({ storeKey, color }) {
  const [carpetas, setCarpetas] = useLS(`${storeKey}_carpetas`, []);
  const [carpetaActiva, setCarpetaActiva] = useState(null);
  const [nuevaCarpeta, setNuevaCarpeta] = useState("");
  const [nuevaNota, setNuevaNota] = useState("");

  function addCarpeta() {
    if (!nuevaCarpeta.trim()) return;
    setCarpetas([...carpetas, { id: Date.now(), nombre: nuevaCarpeta.trim(), notas: [] }]);
    setNuevaCarpeta("");
  }
  function delCarpeta(id) { setCarpetas(carpetas.filter(c => c.id !== id)); if (carpetaActiva === id) setCarpetaActiva(null); }
  function addNota() {
    if (!nuevaNota.trim() || !carpetaActiva) return;
    setCarpetas(carpetas.map(c => c.id === carpetaActiva ? { ...c, notas: [...c.notas, { id: Date.now(), texto: nuevaNota.trim(), fecha: new Date().toLocaleDateString() }] } : c));
    setNuevaNota("");
  }
  function delNota(carpetaId, notaId) { setCarpetas(carpetas.map(c => c.id === carpetaId ? { ...c, notas: c.notas.filter(n => n.id !== notaId) } : c)); }

  const carpetaActual = carpetas.find(c => c.id === carpetaActiva);

  if (carpetaActual) return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => setCarpetaActiva(null)} className="text-white/40 hover:text-white transition-colors text-sm">← Volver</button>
        <span className="text-white font-bold text-sm">📁 {carpetaActual.nombre}</span>
      </div>
      <textarea value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} placeholder="Escribe una nota..."
        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none h-24 mb-2"
        style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
      <GoldBtn onClick={addNota} color={color} small>+ Añadir nota</GoldBtn>
      <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
        {carpetaActual.notas.length === 0 && <p className="text-white/20 text-xs text-center py-4">Carpeta vacía</p>}
        {carpetaActual.notas.map(n => (
          <div key={n.id} className="rounded-xl p-3 flex gap-2" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="flex-1"><div className="text-white/25 text-xs mb-1">{n.fecha}</div><div className="text-white/70 text-sm">{n.texto}</div></div>
            <XBtn onClick={() => delNota(carpetaActiva, n.id)} />
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <Card>
      <Lbl>📁 Mis carpetas de notas</Lbl>
      <div className="flex gap-2 mb-3">
        <Inp value={nuevaCarpeta} onChange={e => setNuevaCarpeta(e.target.value)} placeholder="Nueva carpeta..." className="flex-1" />
        <button onClick={addCarpeta} className="rounded-xl px-4 font-bold text-white" style={{ background: color }}>+</button>
      </div>
      {carpetas.length === 0 && <p className="text-white/20 text-xs text-center py-4">Sin carpetas todavía</p>}
      <div className="space-y-2">
        {carpetas.map(c => (
          <div key={c.id} className="flex items-center gap-2 rounded-xl px-4 py-3 cursor-pointer transition-all hover:bg-white/5"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
            <span className="text-lg">📁</span>
            <div className="flex-1" onClick={() => setCarpetaActiva(c.id)}>
              <div className="text-white font-semibold text-sm">{c.nombre}</div>
              <div className="text-white/30 text-xs">{c.notas.length} nota{c.notas.length !== 1 ? "s" : ""}</div>
            </div>
            <XBtn onClick={() => delCarpeta(c.id)} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({
    nombre: "", edad: "", sexo: "Masculino",
    peso: "", altura: "", objetivoFisico: "Ganar músculo",
    trabajo: "Empleado", horario: "Horario normal (9-17h)", actividad: "Moderado",
    dinero: "0", negocio: "No tengo negocio", estudia: "No estudio", pareja: "Sin pareja",
    modulos: [], extra: "",
  });
  const u = (k, v) => setD(p => ({ ...p, [k]: v }));
  const toggleM = id => setD(p => ({ ...p, modulos: p.modulos.includes(id) ? p.modulos.filter(x => x !== id) : [...p.modulos, id] }));
  const titles = ["¿Quién eres?", "Tu cuerpo", "Estilo de vida", "Situación actual", "Tus módulos", "Algo más"];
  const subs = ["Cuéntanos sobre ti", "Para personalizar tu plan", "Cómo es tu día a día", "Dónde estás ahora", "Activa lo que quieras trabajar", "Alergias, lesiones, lo que sea..."];
  const canNext = () => { if (step === 0) return d.nombre.trim() && d.edad; if (step === 1) return d.peso && d.altura; if (step === 4) return d.modulos.length > 0; return true; };

  const steps = [
    <div key="s0" className="space-y-4">
      <div><Lbl>Tu nombre</Lbl><Inp value={d.nombre} onChange={e => u("nombre", e.target.value)} placeholder="¿Cómo te llamas?" /></div>
      <div><Lbl>Edad</Lbl><Inp type="number" value={d.edad} onChange={e => u("edad", e.target.value)} placeholder="Años" /></div>
      <div><Lbl>Sexo</Lbl><Sel value={d.sexo} onChange={e => u("sexo", e.target.value)}><option>Masculino</option><option>Femenino</option><option>Prefiero no decirlo</option></Sel></div>
    </div>,
    <div key="s1" className="space-y-4">
      <div><Lbl>Peso (kg)</Lbl><Inp type="number" value={d.peso} onChange={e => u("peso", e.target.value)} placeholder="Ej: 70" /></div>
      <div><Lbl>Altura (cm)</Lbl><Inp type="number" value={d.altura} onChange={e => u("altura", e.target.value)} placeholder="Ej: 175" /></div>
      <div><Lbl>Objetivo físico</Lbl><Sel value={d.objetivoFisico} onChange={e => u("objetivoFisico", e.target.value)}><option>Perder peso</option><option>Ganar músculo</option><option>Mantenimiento</option><option>Mejorar rendimiento</option></Sel></div>
    </div>,
    <div key="s2" className="space-y-4">
      <div><Lbl>Situación laboral</Lbl><Sel value={d.trabajo} onChange={e => u("trabajo", e.target.value)}><option>Empleado</option><option>Autónomo</option><option>Emprendedor</option><option>Estudiante</option><option>En paro</option><option>Turnos rotativos</option></Sel></div>
      <div><Lbl>Horario habitual</Lbl><Sel value={d.horario} onChange={e => u("horario", e.target.value)}><option>Horario normal (9-17h)</option><option>Turno mañana (6-14h)</option><option>Turno tarde (14-22h)</option><option>Turno noche (22-6h)</option><option>Horario flexible</option><option>Irregular</option></Sel></div>
      <div><Lbl>Nivel de actividad</Lbl><Sel value={d.actividad} onChange={e => u("actividad", e.target.value)}><option>Sedentario</option><option>Moderado</option><option>Activo</option><option>Muy activo</option></Sel></div>
    </div>,
    <div key="s3" className="space-y-4">
      <div><Lbl>Dinero ahorrado (€)</Lbl><Inp type="number" value={d.dinero} onChange={e => u("dinero", e.target.value)} placeholder="Ej: 2000" /></div>
      <div><Lbl>¿Tienes negocio?</Lbl><Sel value={d.negocio} onChange={e => u("negocio", e.target.value)}><option>No tengo negocio</option><option>Tengo una idea</option><option>Recién empezado</option><option>En funcionamiento</option></Sel></div>
      <div><Lbl>¿Estás estudiando?</Lbl><Sel value={d.estudia} onChange={e => u("estudia", e.target.value)}><option>No estudio</option><option>Universidad</option><option>Formación profesional</option><option>Cursos online</option><option>Oposiciones</option><option>Idiomas</option></Sel></div>
      <div><Lbl>Situación sentimental</Lbl><Sel value={d.pareja} onChange={e => u("pareja", e.target.value)}><option>Sin pareja</option><option>En pareja</option><option>Casado/a</option><option>Complicado</option></Sel></div>
    </div>,
    <div key="s4" className="space-y-2">
      <p className="text-white/30 text-xs mb-3">Activa solo los que quieres. Puedes cambiarlos después.</p>
      {ALL_MODULES.map(mod => {
        const on = d.modulos.includes(mod.id);
        return <button key={mod.id} onClick={() => toggleM(mod.id)} className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left active:scale-98"
          style={{ background: on ? mod.color + "15" : CARD, border: `1px solid ${on ? mod.color + "50" : BORDER}` }}>
          <span className="text-2xl">{mod.icon}</span>
          <div className="flex-1"><div className="text-white text-sm font-bold">{mod.label}</div></div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: on ? mod.color : "rgba(255,255,255,0.08)" }}>{on && <span className="text-white text-xs font-bold">✓</span>}</div>
        </button>;
      })}
    </div>,
    <div key="s5" className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
        <p className="text-white/60 text-sm leading-relaxed">Esta info va a todos tus asistentes IA para personalizarlo al máximo. Alergias, lesiones, condiciones médicas, restricciones, contexto personal...</p>
      </div>
      <textarea value={d.extra} onChange={e => u("extra", e.target.value)} placeholder="Ej: Soy celíaco, lesión en hombro, turno noche, ansiedad diagnosticada, vegano..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none h-40" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
    </div>,
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      <div className="px-5 pt-16 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}><span className="text-white font-black">L</span></div>
          <span className="text-white font-black tracking-widest text-lg">LIFEOS</span>
        </div>
        <div className="flex gap-1.5 mb-6">{titles.map((_, i) => <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500" style={{ background: i <= step ? "#7c3aed" : "rgba(255,255,255,0.1)" }} />)}</div>
        <p className="text-white/30 text-xs uppercase tracking-widest">Paso {step + 1} de {titles.length}</p>
        <h1 className="text-2xl font-black text-white mt-1">{titles[step]}</h1>
        <p className="text-white/40 text-sm mt-1">{subs[step]}</p>
      </div>
      <div className="flex-1 px-5 overflow-y-auto pb-4">{steps[step]}</div>
      <div className="px-5 pb-10 pt-4 flex-shrink-0">
        <div className="flex gap-3">
          {step > 0 && <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white/40" style={{ background: CARD, border: `1px solid ${BORDER}` }}>← Atrás</button>}
          <button onClick={() => step < titles.length - 1 ? setStep(s => s + 1) : onDone(d)} disabled={!canNext()} className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white active:scale-95 disabled:opacity-30" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            {step === titles.length - 1 ? "🚀 Comenzar LIFEOS" : "Continuar →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, goTo }) {
  const [frase, setFrase] = useState("Generando tu dosis diaria...");
  const hora = new Date().getHours();
  const sal = hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";
  const mods = ALL_MODULES.filter(m => user.modulos.includes(m.id));

  useEffect(() => {
    callAI(`Eres un coach de élite. Genera UNA frase motivacional corta y poderosa para ${user.nombre}, ${user.edad} años, objetivo: ${user.objetivoFisico}. Máximo 2 líneas. Sin hashtags. Original y directa.`,
      [{ role: "user", content: "Frase del día." }]).then(setFrase).catch(() => setFrase("El único momento para empezar siempre fue ahora."));
  }, []);

  return (
    <div className="space-y-5">
      <div className="pt-1">
        <p className="text-white/30 text-sm">{sal} 👋</p>
        <h1 className="text-3xl font-black text-white">{user.nombre}</h1>
        <p className="text-white/20 text-xs mt-1">Tu sistema operativo de vida · LIFEOS</p>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.05))", border: "1px solid rgba(124,58,237,0.25)" }}>
        <div className="flex gap-3"><span className="text-xl">✨</span><p className="text-white/80 text-sm leading-relaxed italic flex-1">{frase}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[["🎯", user.objetivoFisico, "Objetivo"], ["💼", user.trabajo, "Trabajo"], ["⏰", user.horario.split("(")[0].trim(), "Horario"], ["💰", `${user.dinero}€`, "Ahorros"]].map(([ic, v, l]) => (
          <Card key={l} className="text-center"><div className="text-xl mb-1">{ic}</div><div className="text-white font-bold text-sm truncate">{v}</div><div className="text-white/25 text-xs mt-0.5">{l}</div></Card>
        ))}
      </div>
      <div><Lbl>Tus módulos</Lbl>
        <div className="grid grid-cols-2 gap-3">
          {mods.map(mod => (
            <button key={mod.id} onClick={() => goTo(mod.id)} className="p-4 rounded-2xl text-left transition-all active:scale-95" style={{ background: mod.color + "10", border: `1px solid ${mod.color}25` }}>
              <span className="text-2xl block mb-2">{mod.icon}</span>
              <div className="text-white font-bold text-sm">{mod.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FINANZAS ─────────────────────────────────────────────────────────────────
function Finanzas({ user }) {
  const mod = ALL_MODULES.find(m => m.id === "finanzas");
  const [dat, setDat] = useLS("lo_fin", { ingresos: 0, gastos: 0, ahorros: parseInt(user.dinero) || 0, inversiones: 0 });
  const [gastos, setGastos] = useLS("lo_gastos_lista", []);
  const [ng, setNg] = useState({ desc: "", monto: "", cat: "Comida" });
  const [comp, setComp] = useState({ m: 200, y: 10, i: 7 });
  const [res, setRes] = useState(null);
  const cats = ["Comida", "Transporte", "Ocio", "Salud", "Educación", "Negocio", "Ropa", "Suscripciones", "Otro"];

  const calcC = () => { const r = comp.i / 100 / 12; const n = comp.y * 12; setRes((comp.m * ((Math.pow(1 + r, n) - 1) / r)).toFixed(0)); };
  const totalGastos = gastos.reduce((s, g) => s + parseFloat(g.monto || 0), 0);
  const addGasto = () => { if (ng.desc && ng.monto) { setGastos([{ ...ng, fecha: new Date().toLocaleDateString(), id: Date.now() }, ...gastos]); setNg({ desc: "", monto: "", cat: "Comida" }); } };
  const delGasto = id => setGastos(gastos.filter(g => g.id !== id));

  const catColors = { Comida: "#4ade80", Transporte: "#60a5fa", Ocio: "#f472b6", Salud: "#f97316", Educación: "#a78bfa", Negocio: "#fbbf24", Ropa: "#fb7185", Suscripciones: "#38bdf8", Otro: "#94a3b8" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Control financiero personal</p></div></div>

      <div className="grid grid-cols-2 gap-3">
        {[{ l: "Ingresos/mes", k: "ingresos", c: "#34d399", i: "📈" }, { l: "Gastos fijos", k: "gastos", c: "#f87171", i: "📉" }, { l: "Ahorros", k: "ahorros", c: "#fbbf24", i: "🏦" }, { l: "Inversiones", k: "inversiones", c: "#60a5fa", i: "📊" }].map(f => (
          <Card key={f.k} className="text-center">
            <div className="text-lg">{f.i}</div>
            <div className="text-xl font-black mt-1" style={{ color: f.c }}>{dat[f.k]}€</div>
            <div className="text-white/25 text-xs mb-1">{f.l}</div>
            <input type="number" value={dat[f.k]} onChange={e => setDat({ ...dat, [f.k]: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg px-2 py-1 text-xs text-center text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex justify-between items-center">
          <div><div className="text-white/30 text-xs">Ahorro potencial</div><div className="text-2xl font-black" style={{ color: mod.color }}>{dat.ingresos - dat.gastos}€/mes</div></div>
          <div className="text-right"><div className="text-white/30 text-xs">Tasa ahorro</div><div className="text-2xl font-black text-white">{dat.ingresos > 0 ? Math.round(((dat.ingresos - dat.gastos) / dat.ingresos) * 100) : 0}%</div></div>
        </div>
      </Card>

      {/* Tracker de gastos con borrado y suma */}
      <Card>
        <Lbl>💳 Tracker de gastos</Lbl>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input value={ng.desc} onChange={e => setNg({ ...ng, desc: e.target.value })} onKeyDown={e => e.key === "Enter" && addGasto()} placeholder="Descripción" className="flex-1 min-w-20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          <input type="number" value={ng.monto} onChange={e => setNg({ ...ng, monto: e.target.value })} placeholder="€" className="w-16 rounded-xl px-2 py-2 text-sm text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          <select value={ng.cat} onChange={e => setNg({ ...ng, cat: e.target.value })} className="rounded-xl px-2 py-2 text-xs text-white" style={{ background: "#12121f", border: `1px solid ${BORDER}` }}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={addGasto} className="rounded-xl px-4 py-2 font-bold text-white text-lg" style={{ background: mod.color }}>+</button>
        </div>

        {gastos.length > 0 && (
          <>
            <div className="space-y-2 max-h-52 overflow-y-auto mb-3">
              {gastos.map(g => (
                <div key={g.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColors[g.cat] || "#94a3b8" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 text-sm truncate">{g.desc}</div>
                    <div className="text-white/25 text-xs">{g.cat} · {g.fecha}</div>
                  </div>
                  <span className="text-red-400 font-bold text-sm flex-shrink-0">-{g.monto}€</span>
                  <XBtn onClick={() => delGasto(g.id)} />
                </div>
              ))}
            </div>
            <div className="rounded-xl px-4 py-3 flex justify-between items-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <span className="text-white/50 text-sm font-semibold">Total gastado</span>
              <span className="text-red-400 font-black text-lg">-{totalGastos.toFixed(2)}€</span>
            </div>
          </>
        )}
      </Card>

      <Card>
        <Lbl>📐 Calculadora interés compuesto</Lbl>
        {[{ l: "Ahorro mensual (€)", k: "m" }, { l: "Años", k: "y" }, { l: "Interés anual (%)", k: "i" }].map(f => (
          <div key={f.k} className="flex items-center gap-3 mb-2">
            <span className="text-white/30 text-xs w-36">{f.l}</span>
            <input type="number" value={comp[f.k]} onChange={e => setComp({ ...comp, [f.k]: parseFloat(e.target.value) || 0 })} className="flex-1 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          </div>
        ))}
        <GoldBtn onClick={calcC} ghost>Calcular</GoldBtn>
        {res && <div className="mt-3 rounded-2xl p-4 text-center" style={{ background: mod.color + "15", border: `1px solid ${mod.color}40` }}>
          <div className="text-white/40 text-xs">En {comp.y} años tendrás</div>
          <div className="text-3xl font-black mt-1" style={{ color: mod.color }}>{parseInt(res).toLocaleString()}€</div>
          <div className="text-white/30 text-xs mt-1">Invertido: {(comp.m * comp.y * 12).toLocaleString()}€ · Intereses: {(parseInt(res) - comp.m * comp.y * 12).toLocaleString()}€</div>
        </div>}
      </Card>

      <AIChat sp={buildSP("finanzas", user)} color={mod.color} name={mod.label} />
    </div>
  );
}

// ─── SUEÑO ────────────────────────────────────────────────────────────────────
function Sueno({ user }) {
  const mod = ALL_MODULES.find(m => m.id === "sueno");
  const [horaDormir, setHoraDormir] = useState("23:00");
  const [ciclos, setCiclos] = useState([]);
  const [registro, setRegistro] = useLS("lo_sueno_reg", []);
  const [hoy, setHoy] = useState({ horas: 7.5, calidad: 7, nota: "" });

  function calcCiclos() {
    const [h, m] = horaDormir.split(":").map(Number);
    const base = h * 60 + m + 14;
    const opts = [3, 4, 5, 6].map(c => {
      const total = base + c * 90;
      const wh = Math.floor(total / 60) % 24;
      const wm = total % 60;
      return { ciclos: c, horas: (c * 90 / 60).toFixed(1), tiempo: `${String(wh).padStart(2, "0")}:${String(wm).padStart(2, "0")}` };
    });
    setCiclos(opts);
  }

  function guardar() {
    setRegistro([{ ...hoy, fecha: new Date().toLocaleDateString(), id: Date.now() }, ...registro.slice(0, 29)]);
    setHoy({ horas: 7.5, calidad: 7, nota: "" });
  }

  const cualidad = (n) => n >= 8 ? "🟢 Excelente" : n >= 6 ? "🟡 Bueno" : "🔴 Mejorable";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Optimiza tu descanso</p></div></div>

      {/* Calculadora de ciclos */}
      <Card>
        <Lbl>⏰ Calculadora de ciclos de sueño</Lbl>
        <p className="text-white/40 text-xs mb-3">Los ciclos de sueño duran 90 min. Despertarte al final de un ciclo te hará sentir descansado.</p>
        <div className="flex gap-3 items-end mb-4">
          <div className="flex-1">
            <div className="text-white/40 text-xs mb-1">Me duermo a las:</div>
            <input type="time" value={horaDormir} onChange={e => setHoraDormir(e.target.value)} className="w-full rounded-xl px-4 py-3 text-white focus:outline-none text-lg font-bold" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          </div>
          <GoldBtn onClick={calcCiclos} color={mod.color} small className="flex-shrink-0">Calcular</GoldBtn>
        </div>
        {ciclos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {ciclos.map(c => (
              <div key={c.ciclos} className="rounded-2xl p-4 text-center transition-all" style={{ background: c.ciclos === 5 ? mod.color + "20" : CARD, border: `1px solid ${c.ciclos === 5 ? mod.color : BORDER}` }}>
                <div className="text-2xl font-black text-white">{c.tiempo}</div>
                <div className="text-xs mt-1" style={{ color: c.ciclos === 5 ? mod.color : "rgba(255,255,255,0.4)" }}>{c.horas}h · {c.ciclos} ciclos</div>
                {c.ciclos === 5 && <div className="text-xs font-bold mt-1" style={{ color: mod.color }}>⭐ Óptimo</div>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Registro */}
      <Card>
        <Lbl>📊 Registrar sueño de anoche</Lbl>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1"><span>Horas dormidas</span><span className="text-white font-bold">{hoy.horas}h</span></div>
            <input type="range" min="3" max="12" step="0.5" value={hoy.horas} onChange={e => setHoy({ ...hoy, horas: parseFloat(e.target.value) })} className="w-full" style={{ accentColor: mod.color }} />
          </div>
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1"><span>Calidad del sueño</span><span className="text-white font-bold">{hoy.calidad}/10 · {cualidad(hoy.calidad)}</span></div>
            <input type="range" min="1" max="10" value={hoy.calidad} onChange={e => setHoy({ ...hoy, calidad: parseInt(e.target.value) })} className="w-full" style={{ accentColor: mod.color }} />
          </div>
          <Inp value={hoy.nota} onChange={e => setHoy({ ...hoy, nota: e.target.value })} placeholder="¿Algo que afectó tu sueño?" />
          <GoldBtn onClick={guardar} color={mod.color}>Guardar registro</GoldBtn>
        </div>
      </Card>

      {registro.length > 0 && (
        <Card>
          <Lbl>📈 Últimos registros</Lbl>
          <div className="space-y-2">
            {registro.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="flex-1"><div className="text-white/60 text-xs">{r.fecha}</div>{r.nota && <div className="text-white/30 text-xs mt-0.5">{r.nota}</div>}</div>
                <div className="text-right"><div className="text-white font-bold text-sm">{r.horas}h</div><div className="text-xs" style={{ color: mod.color }}>{r.calidad}/10</div></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <NotasCarpetas storeKey="lo_sueno" color={mod.color} />
      <AIChat sp={buildSP("sueno", user)} color={mod.color} name={mod.label} />
    </div>
  );
}

// ─── NEGOCIO ──────────────────────────────────────────────────────────────────
function Negocio({ user }) {
  const mod = ALL_MODULES.find(m => m.id === "negocio");
  const [setup, setSetup] = useLS("lo_neg_setup", null);
  const [form, setForm] = useState({ tipo: "", nivel: "Recién empezado", solo: "Solo", descripcion: "" });
  const [metas, setMetas] = useLS("lo_neg_metas", []);
  const [newMeta, setNewMeta] = useState({ texto: "", fecha: "", completada: false });
  const [operaciones, setOps] = useLS("lo_neg_ops", []);
  const [newOp, setNewOp] = useState({ desc: "", ingreso: "", gasto: "" });

  function guardarSetup() {
    if (!form.tipo.trim()) return;
    setSetup(form);
  }

  function addMeta() {
    if (!newMeta.texto.trim()) return;
    setMetas([...metas, { ...newMeta, id: Date.now(), completada: false }]);
    setNewMeta({ texto: "", fecha: "", completada: false });
  }

  function toggleMeta(id) { setMetas(metas.map(m => m.id === id ? { ...m, completada: !m.completada } : m)); }
  function delMeta(id) { setMetas(metas.filter(m => m.id !== id)); }

  function addOp() {
    if (!newOp.desc) return;
    const beneficio = (parseFloat(newOp.ingreso) || 0) - (parseFloat(newOp.gasto) || 0);
    setOps([{ ...newOp, beneficio, fecha: new Date().toLocaleDateString(), id: Date.now() }, ...operaciones]);
    setNewOp({ desc: "", ingreso: "", gasto: "" });
  }

  const totalBeneficio = operaciones.reduce((s, o) => s + (o.beneficio || 0), 0);
  const metasCompletas = metas.filter(m => m.completada).length;

  if (!setup) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Cuéntanos sobre tu negocio</p></div></div>
      <Card style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
        <p className="text-white/60 text-sm leading-relaxed">Para ayudarte de verdad necesito conocer tu negocio. Responde estas preguntas y crearé un plan personalizado para ti.</p>
      </Card>
      <div className="space-y-4">
        <div><Lbl>¿Qué tipo de negocio tienes o quieres montar?</Lbl><Inp value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} placeholder="Ej: Compraventa de coches, tienda online, bar, consultoría..." /></div>
        <div><Lbl>¿En qué nivel estás?</Lbl><Sel value={form.nivel} onChange={e => setForm({ ...form, nivel: e.target.value })}><option>Solo tengo la idea</option><option>Recién empezado</option><option>Llevo meses funcionando</option><option>Ya tengo ingresos estables</option></Sel></div>
        <div><Lbl>¿Lo haces solo o en equipo?</Lbl><Sel value={form.solo} onChange={e => setForm({ ...form, solo: e.target.value })}><option>Solo</option><option>Con un socio</option><option>Con equipo pequeño</option><option>Con equipo grande</option></Sel></div>
        <div><Lbl>Describe tu negocio brevemente</Lbl><textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Qué vendes, a quién, cómo funciona, cuál es tu situación actual..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none h-28" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} /></div>
        <GoldBtn onClick={guardarSetup} color={mod.color}>Crear mi plan de negocio →</GoldBtn>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">{setup.tipo}</p></div></div>
        <button onClick={() => setSetup(null)} className="text-white/30 text-xs hover:text-white transition-colors">Editar</button>
      </div>

      <Card style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
        <div className="flex justify-between items-start">
          <div><div className="text-white/40 text-xs">Tipo de negocio</div><div className="text-white font-bold">{setup.tipo}</div></div>
          <div className="text-right"><div className="text-white/40 text-xs">Estado</div><div className="text-white font-bold">{setup.nivel}</div></div>
        </div>
        <div className="mt-2 text-white/40 text-xs">{setup.solo} · {setup.descripcion}</div>
      </Card>

      {/* Metas */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <Lbl className="mb-0">🎯 Mis metas de negocio</Lbl>
          <span className="text-xs font-bold" style={{ color: mod.color }}>{metasCompletas}/{metas.length} completadas</span>
        </div>
        {metas.length > 0 && <ProgressBar value={metasCompletas} max={metas.length} color={mod.color} />}
        <div className="space-y-2 mt-3 mb-3 max-h-48 overflow-y-auto">
          {metas.map(m => (
            <div key={m.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: m.completada ? mod.color + "10" : "rgba(255,255,255,0.04)", border: `1px solid ${m.completada ? mod.color + "30" : BORDER}` }}>
              <button onClick={() => toggleMeta(m.id)} className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all" style={{ background: m.completada ? mod.color : "rgba(255,255,255,0.1)" }}>{m.completada && <span className="text-white text-xs font-bold">✓</span>}</button>
              <div className="flex-1"><div className={`text-sm ${m.completada ? "line-through text-white/30" : "text-white"}`}>{m.texto}</div>{m.fecha && <div className="text-white/25 text-xs">Fecha límite: {m.fecha}</div>}</div>
              <XBtn onClick={() => delMeta(m.id)} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Inp value={newMeta.texto} onChange={e => setNewMeta({ ...newMeta, texto: e.target.value })} placeholder="Nueva meta..." className="flex-1" />
          <input type="date" value={newMeta.fecha} onChange={e => setNewMeta({ ...newMeta, fecha: e.target.value })} className="rounded-xl px-3 py-2 text-sm text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          <button onClick={addMeta} className="rounded-xl px-4 py-2 font-bold text-white" style={{ background: mod.color }}>+</button>
        </div>
      </Card>

      {/* Operaciones / ingresos */}
      <Card>
        <Lbl>📊 Registro de operaciones</Lbl>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Inp value={newOp.desc} onChange={e => setNewOp({ ...newOp, desc: e.target.value })} placeholder="Descripción" />
          <Inp type="number" value={newOp.ingreso} onChange={e => setNewOp({ ...newOp, ingreso: e.target.value })} placeholder="Ingreso €" />
          <Inp type="number" value={newOp.gasto} onChange={e => setNewOp({ ...newOp, gasto: e.target.value })} placeholder="Gasto €" />
        </div>
        <GoldBtn onClick={addOp} color={mod.color} ghost>+ Añadir operación</GoldBtn>
        {operaciones.length > 0 && (
          <>
            <div className="space-y-2 mt-3 max-h-40 overflow-y-auto">
              {operaciones.map(o => (
                <div key={o.id} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="flex-1"><div className="text-white/70 text-sm">{o.desc}</div><div className="text-white/25 text-xs">{o.fecha}</div></div>
                  <span className={`font-bold text-sm ${o.beneficio >= 0 ? "text-green-400" : "text-red-400"}`}>{o.beneficio >= 0 ? "+" : ""}{o.beneficio}€</span>
                  <XBtn onClick={() => setOps(operaciones.filter(x => x.id !== o.id))} />
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl px-4 py-3 flex justify-between" style={{ background: totalBeneficio >= 0 ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${totalBeneficio >= 0 ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}` }}>
              <span className="text-white/50 text-sm font-semibold">Beneficio total</span>
              <span className={`font-black text-lg ${totalBeneficio >= 0 ? "text-green-400" : "text-red-400"}`}>{totalBeneficio >= 0 ? "+" : ""}{totalBeneficio.toFixed(0)}€</span>
            </div>
          </>
        )}
      </Card>

      <NotasCarpetas storeKey="lo_neg" color={mod.color} />
      <AIChat sp={`${buildSP("negocio", user)}\nEl usuario tiene este negocio: ${setup.tipo}. Nivel: ${setup.nivel}. ${setup.descripcion}. Trabaja ${setup.solo}.`} color={mod.color} name={mod.label}
        initMsg={`¡Hola! Ya conozco tu negocio de ${setup.tipo}. Estás en nivel "${setup.nivel}" y trabajas ${setup.solo.toLowerCase()}. ¿Qué es lo que más te preocupa ahora mismo o en qué quieres que te ayude primero?`} />
    </div>
  );
}

// ─── ESTUDIOS ─────────────────────────────────────────────────────────────────
function Estudios({ user }) {
  const mod = ALL_MODULES.find(m => m.id === "estudios");
  const [setup, setSetup] = useLS("lo_est_setup", null);
  const [form, setForm] = useState({ materia: user.estudia !== "No estudio" ? user.estudia : "", objetivo: "", nivel: "Principiante" });
  const [pregunta, setPregunta] = useLS("lo_est_pregunta", null);
  const [respuesta, setRespuesta] = useState("");
  const [puntos, setPuntos] = useLS("lo_est_puntos", 0);
  const [streak, setStreak] = useLS("lo_est_streak", 0);
  const [historial, setHistorial] = useLS("lo_est_hist", []);
  const [loading, setLoading] = useState(false);

  async function generarPregunta() {
    if (!setup) return;
    setLoading(true); setRespuesta("");
    const r = await callAI(
      `Eres un profesor experto en ${setup.materia}. El estudiante tiene nivel ${setup.nivel} y su objetivo es ${setup.objetivo}. Genera UNA pregunta de examen concreta, interesante y educativa sobre ${setup.materia}. 
      Responde SOLO en este formato JSON sin markdown:
      {"pregunta": "texto de la pregunta", "respuesta_correcta": "respuesta esperada", "pista": "una pista breve"}`,
      [{ role: "user", content: "Dame una pregunta de hoy." }]
    );
    try {
      const clean = r.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setPregunta({ ...parsed, id: Date.now(), fecha: new Date().toLocaleDateString() });
    } catch { setPregunta({ pregunta: r, respuesta_correcta: "Ver con el asistente IA", pista: "", id: Date.now(), fecha: new Date().toLocaleDateString() }); }
    setLoading(false);
  }

  async function verificarRespuesta() {
    if (!respuesta.trim() || !pregunta) return;
    setLoading(true);
    const r = await callAI(
      `Eres un profesor de ${setup.materia}. La pregunta era: "${pregunta.pregunta}". La respuesta correcta esperada: "${pregunta.respuesta_correcta}". El alumno respondió: "${respuesta}". 
      Evalúa si la respuesta es correcta (no tiene que ser exacta, valora el concepto). Responde con "CORRECTO" o "INCORRECTO" al inicio y luego explica brevemente por qué y da la respuesta completa correcta.`,
      [{ role: "user", content: "Evalúa mi respuesta." }]
    );
    const correcto = r.toUpperCase().startsWith("CORRECTO");
    if (correcto) { setPuntos(p => p + 10); setStreak(s => s + 1); }
    else setStreak(0);
    setHistorial([{ pregunta: pregunta.pregunta, respuesta, correcto, feedback: r, fecha: pregunta.fecha, id: Date.now() }, ...historial.slice(0, 19)]);
    setPregunta({ ...pregunta, evaluada: true, correcto, feedback: r });
    setLoading(false);
  }

  if (!setup) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Personaliza tu aprendizaje</p></div></div>
      <Card style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.2)" }}><p className="text-white/60 text-sm">Cuéntame qué estás estudiando para darte preguntas diarias y un plan personalizado.</p></Card>
      <div><Lbl>¿Qué estás estudiando?</Lbl><Inp value={form.materia} onChange={e => setForm({ ...form, materia: e.target.value })} placeholder="Ej: ADE, Derecho, Inglés, Programación..." /></div>
      <div><Lbl>¿Cuál es tu objetivo?</Lbl><Inp value={form.objetivo} onChange={e => setForm({ ...form, objetivo: e.target.value })} placeholder="Ej: Aprobar el examen de junio, certificado B2..." /></div>
      <div><Lbl>Tu nivel actual</Lbl><Sel value={form.nivel} onChange={e => setForm({ ...form, nivel: e.target.value })}><option>Principiante</option><option>Intermedio</option><option>Avanzado</option></Sel></div>
      <GoldBtn onClick={() => form.materia.trim() && setSetup(form)} color={mod.color}>Comenzar mi plan →</GoldBtn>
    </div>
  );

  const correctas = historial.filter(h => h.correcto).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">{setup.materia} · {setup.nivel}</p></div></div>
        <button onClick={() => setSetup(null)} className="text-white/30 text-xs">Editar</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center"><div className="text-2xl font-black" style={{ color: mod.color }}>{puntos}</div><div className="text-white/30 text-xs mt-1">⭐ Puntos</div></Card>
        <Card className="text-center"><div className="text-2xl font-black text-white">{streak}</div><div className="text-white/30 text-xs mt-1">🔥 Racha</div></Card>
        <Card className="text-center"><div className="text-2xl font-black text-green-400">{historial.length > 0 ? Math.round((correctas / historial.length) * 100) : 0}%</div><div className="text-white/30 text-xs mt-1">✅ Aciertos</div></Card>
      </div>

      {/* Pregunta del día */}
      <Card>
        <Lbl>🎯 Pregunta del día — {setup.materia}</Lbl>
        {!pregunta ? (
          <div className="text-center py-6">
            <p className="text-white/40 text-sm mb-4">¿Listo para tu pregunta de hoy?</p>
            <GoldBtn onClick={generarPregunta} color={mod.color} disabled={loading}>{loading ? "Generando..." : "🎲 Generar pregunta"}</GoldBtn>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl p-4" style={{ background: mod.color + "10", border: `1px solid ${mod.color}30` }}>
              <p className="text-white text-sm leading-relaxed font-medium">{pregunta.pregunta}</p>
              {pregunta.pista && !pregunta.evaluada && <p className="text-white/40 text-xs mt-2">💡 Pista: {pregunta.pista}</p>}
            </div>
            {!pregunta.evaluada ? (
              <>
                <textarea value={respuesta} onChange={e => setRespuesta(e.target.value)} placeholder="Escribe tu respuesta..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none h-24" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
                <div className="flex gap-2">
                  <GoldBtn onClick={verificarRespuesta} color={mod.color} disabled={loading || !respuesta.trim()}>{loading ? "Evaluando..." : "✓ Comprobar respuesta"}</GoldBtn>
                  <GoldBtn onClick={generarPregunta} ghost disabled={loading}>↻ Otra</GoldBtn>
                </div>
              </>
            ) : (
              <>
                <div className={`rounded-2xl p-4`} style={{ background: pregunta.correcto ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${pregunta.correcto ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                  <div className={`font-bold text-sm mb-2 ${pregunta.correcto ? "text-green-400" : "text-red-400"}`}>{pregunta.correcto ? "✅ ¡Correcto! +10 puntos" : "❌ Incorrecto"}</div>
                  <p className="text-white/70 text-sm leading-relaxed">{pregunta.feedback}</p>
                </div>
                <GoldBtn onClick={generarPregunta} color={mod.color}>🎲 Siguiente pregunta</GoldBtn>
              </>
            )}
          </div>
        )}
      </Card>

      {historial.length > 0 && (
        <Card>
          <Lbl>📋 Historial de preguntas</Lbl>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {historial.slice(0, 8).map(h => (
              <div key={h.id} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2"><span>{h.correcto ? "✅" : "❌"}</span><span className="text-white/60 text-xs flex-1 truncate">{h.pregunta}</span><span className="text-white/25 text-xs">{h.fecha}</span></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <NotasCarpetas storeKey="lo_est" color={mod.color} />
      <AIChat sp={`${buildSP("estudios", user)}\nEl estudiante estudia: ${setup.materia}. Nivel: ${setup.nivel}. Objetivo: ${setup.objetivo}. Hazle preguntas, explica conceptos y adapta todo a su materia.`} color={mod.color} name={mod.label} />
    </div>
  );
}

// ─── LECTURA ──────────────────────────────────────────────────────────────────
function Lectura({ user }) {
  const mod = ALL_MODULES.find(m => m.id === "lectura");
  const [libros, setLibros] = useLS("lo_lec_libros", []);
  const [newLibro, setNewLibro] = useState({ titulo: "", autor: "", tipo: "Libro", paginas: "", pagActual: "" });
  const [recs, setRecs] = useLS("lo_lec_recs", null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  async function generarRecs() {
    setLoadingRecs(true);
    const r = await callAI(
      `Eres el mejor recomendador de libros y podcasts del mundo. Basándote en el perfil del usuario, recomienda 4 libros y 3 podcasts MUY específicos y relevantes para él. 
      Responde en formato JSON sin markdown: {"libros": [{"titulo": "", "autor": "", "por_que": ""}], "podcasts": [{"nombre": "", "por_que": ""}]}`,
      [{ role: "user", content: `Mi perfil: ${user.edad} años, objetivo físico: ${user.objetivoFisico}, trabajo: ${user.trabajo}, negocio: ${user.negocio}, estudios: ${user.estudia}. ${user.extra || ""}` }]
    );
    try { const c = r.replace(/```json|```/g, "").trim(); setRecs(JSON.parse(c)); }
    catch { setRecs({ libros: [{ titulo: "El poder del ahora", autor: "Eckhart Tolle", por_que: "Para mejorar tu bienestar mental" }], podcasts: [{ nombre: "My First Million", por_que: "Ideas de negocio y emprendimiento" }] }); }
    setLoadingRecs(false);
  }

  function addLibro() {
    if (!newLibro.titulo.trim()) return;
    setLibros([...libros, { ...newLibro, id: Date.now(), terminado: false, fechaInicio: new Date().toLocaleDateString() }]);
    setNewLibro({ titulo: "", autor: "", tipo: "Libro", paginas: "", pagActual: "" });
  }

  function updateProg(id, pag) { setLibros(libros.map(l => l.id === id ? { ...l, pagActual: pag } : l)); }
  function toggleTerminado(id) { setLibros(libros.map(l => l.id === id ? { ...l, terminado: !l.terminado } : l)); }
  function delLibro(id) { setLibros(libros.filter(l => l.id !== id)); }

  const terminados = libros.filter(l => l.terminado).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Tu biblioteca personal</p></div></div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center"><div className="text-3xl font-black" style={{ color: mod.color }}>{libros.length}</div><div className="text-white/30 text-xs mt-1">📚 En biblioteca</div></Card>
        <Card className="text-center"><div className="text-3xl font-black text-green-400">{terminados}</div><div className="text-white/30 text-xs mt-1">✅ Terminados</div></Card>
      </div>

      {/* Añadir libro */}
      <Card>
        <Lbl>+ Añadir a mi biblioteca</Lbl>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Inp value={newLibro.titulo} onChange={e => setNewLibro({ ...newLibro, titulo: e.target.value })} placeholder="Título" className="flex-1" />
            <Sel value={newLibro.tipo} onChange={e => setNewLibro({ ...newLibro, tipo: e.target.value })}><option>Libro</option><option>Podcast</option><option>Curso</option></Sel>
          </div>
          <div className="flex gap-2">
            <Inp value={newLibro.autor} onChange={e => setNewLibro({ ...newLibro, autor: e.target.value })} placeholder="Autor" className="flex-1" />
            <Inp type="number" value={newLibro.paginas} onChange={e => setNewLibro({ ...newLibro, paginas: e.target.value })} placeholder="Págs" className="w-20" />
          </div>
          <GoldBtn onClick={addLibro} color={mod.color} ghost>Añadir</GoldBtn>
        </div>
      </Card>

      {/* Biblioteca */}
      {libros.length > 0 && (
        <Card>
          <Lbl>Mi biblioteca</Lbl>
          <div className="space-y-3">
            {libros.map(l => {
              const prog = l.paginas && l.pagActual ? Math.min(Math.round((parseFloat(l.pagActual) / parseFloat(l.paginas)) * 100), 100) : 0;
              return (
                <div key={l.id} className="rounded-2xl p-3" style={{ background: l.terminado ? "rgba(74,222,128,0.05)" : "rgba(255,255,255,0.04)", border: `1px solid ${l.terminado ? "rgba(74,222,128,0.2)" : BORDER}` }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{l.tipo === "Libro" ? "📖" : l.tipo === "Podcast" ? "🎙️" : "🖥️"}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-white font-bold text-sm ${l.terminado ? "line-through text-white/40" : ""}`}>{l.titulo}</div>
                      {l.autor && <div className="text-white/30 text-xs">{l.autor}</div>}
                      {l.paginas && !l.terminado && (
                        <>
                          <div className="flex items-center gap-2 mt-2">
                            <input type="number" value={l.pagActual} onChange={e => updateProg(l.id, e.target.value)} placeholder="Página actual" className="w-24 rounded-lg px-2 py-1 text-xs text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
                            <span className="text-white/30 text-xs">/ {l.paginas} págs · {prog}%</span>
                          </div>
                          <ProgressBar value={prog} max={100} color={mod.color} />
                        </>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleTerminado(l.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all" style={{ background: l.terminado ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)" }}>{l.terminado ? "✓" : "○"}</button>
                      <XBtn onClick={() => delLibro(l.id)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recomendaciones IA */}
      <Card>
        <Lbl>✨ Recomendaciones personalizadas para ti</Lbl>
        {!recs ? (
          <div className="text-center py-4">
            <p className="text-white/40 text-sm mb-3">Te recomendaré libros y podcasts según tu perfil exacto.</p>
            <GoldBtn onClick={generarRecs} color={mod.color} disabled={loadingRecs}>{loadingRecs ? "Analizando tu perfil..." : "Generar recomendaciones IA"}</GoldBtn>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-white/40 mb-2">📚 LIBROS</div>
              {recs.libros?.map((l, i) => (
                <div key={i} className="rounded-xl p-3 mb-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-white font-semibold text-sm">{l.titulo}</div>
                  <div className="text-white/40 text-xs">{l.autor}</div>
                  <div className="text-white/50 text-xs mt-1" style={{ color: mod.color }}>→ {l.por_que}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-bold text-white/40 mb-2">🎙️ PODCASTS</div>
              {recs.podcasts?.map((p, i) => (
                <div key={i} className="rounded-xl p-3 mb-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-white font-semibold text-sm">{p.nombre}</div>
                  <div className="text-white/50 text-xs mt-1" style={{ color: mod.color }}>→ {p.por_que}</div>
                </div>
              ))}
            </div>
            <GoldBtn onClick={generarRecs} ghost disabled={loadingRecs}>↻ Regenerar</GoldBtn>
          </div>
        )}
      </Card>

      <AIChat sp={buildSP("lectura", user)} color={mod.color} name="Recomendador Experto" />
    </div>
  );
}

// ─── RELACIONES ───────────────────────────────────────────────────────────────
function Relaciones({ user }) {
  const mod = ALL_MODULES.find(m => m.id === "relaciones");
  const [tracker, setTracker] = useLS("lo_rel_tracker", []);
  const [semana, setSemana] = useState({ comunicacion: 5, calidad: 5, intimidad: 5, conflictos: 5, conexion: 5 });
  const [planes, setPlanes] = useLS("lo_rel_planes", []);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [situacion, setSituacion] = useState("");

  const areas = [
    { k: "comunicacion", l: "Comunicación", i: "💬" },
    { k: "calidad", l: "Tiempo de calidad", i: "⏰" },
    { k: "intimidad", l: "Intimidad", i: "❤️" },
    { k: "conflictos", l: "Gestión conflictos", i: "🤝" },
    { k: "conexion", l: "Conexión emocional", i: "🔗" },
  ];

  function guardarSemana() { setTracker([{ ...semana, fecha: new Date().toLocaleDateString(), id: Date.now() }, ...tracker.slice(0, 11)]); }

  async function generarPlan() {
    if (!situacion.trim()) return;
    setLoadingPlan(true);
    const r = await callAI(
      `Eres el mejor terapeuta de pareja. Genera un plan de acción concreto y empático para esta situación. Da 3-4 pasos muy específicos y accionables. También sugiere 2 planes de pareja creativos y concretos para reconectar.`,
      [{ role: "user", content: `Mi situación: ${situacion}. Mi pareja: ${user.pareja}. ${user.extra || ""}` }]
    );
    setPlanes([{ situacion, plan: r, fecha: new Date().toLocaleDateString(), id: Date.now() }, ...planes.slice(0, 9)]);
    setSituacion("");
    setLoadingPlan(false);
  }

  const promedio = (Object.values(semana).reduce((a, b) => a + b, 0) / 5).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Tu vida sentimental</p></div></div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Lbl className="mb-0">Estado de la relación</Lbl>
          <div className="text-right"><span className="text-2xl font-black" style={{ color: parseFloat(promedio) >= 7 ? "#4ade80" : parseFloat(promedio) >= 5 ? "#fbbf24" : "#f87171" }}>{promedio}</span><span className="text-white/30 text-sm">/10</span></div>
        </div>
        {areas.map(a => (
          <div key={a.k} className="flex items-center gap-3 mb-3">
            <span className="w-5 text-center">{a.i}</span>
            <span className="text-white/50 text-xs w-32">{a.l}</span>
            <input type="range" min="1" max="10" value={semana[a.k]} onChange={e => setSemana({ ...semana, [a.k]: parseInt(e.target.value) })} className="flex-1" style={{ accentColor: mod.color }} />
            <span className="text-white font-bold text-sm w-6 text-right">{semana[a.k]}</span>
          </div>
        ))}
        <GoldBtn onClick={guardarSemana} color={mod.color} ghost>Guardar esta semana</GoldBtn>
      </Card>

      {/* Plan de acción */}
      <Card>
        <Lbl>🆘 Situación que quiero resolver</Lbl>
        <p className="text-white/40 text-xs mb-3">Descríbeme qué está pasando y te daré un plan concreto como haría un terapeuta de pareja.</p>
        <textarea value={situacion} onChange={e => setSituacion(e.target.value)} placeholder="Ej: Llevamos semanas sin conectar, hay mucha tensión por el trabajo, no encontramos tiempo para estar juntos..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none h-28 mb-3" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
        <GoldBtn onClick={generarPlan} color={mod.color} disabled={loadingPlan || !situacion.trim()}>{loadingPlan ? "Analizando..." : "🧠 Crear plan de acción"}</GoldBtn>
      </Card>

      {planes.length > 0 && (
        <Card>
          <Lbl>📋 Planes de acción anteriores</Lbl>
          {planes.slice(0, 3).map(p => (
            <div key={p.id} className="rounded-2xl p-4 mb-3" style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)" }}>
              <div className="text-white/30 text-xs mb-2">{p.fecha} · {p.situacion.slice(0, 50)}...</div>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{p.plan}</p>
            </div>
          ))}
        </Card>
      )}

      <AIChat sp={`${buildSP("relaciones", user)}\nHaz preguntas profundas como un terapeuta. No des consejos directamente sin antes entender la situación completa. Sé empático pero directo.`} color={mod.color} name="Terapeuta de Pareja"
        initMsg="Hola. Estoy aquí para ayudarte con tu vida sentimental. Para darte el mejor consejo, necesito entender tu situación. ¿Qué está pasando ahora mismo en tu relación? ¿O hay algo concreto que quieras mejorar?" />
    </div>
  );
}

// ─── NUTRICIÓN ────────────────────────────────────────────────────────────────
function Nutricion({ user }) {
  const mod = ALL_MODULES.find(m => m.id === "nutricion");
  const [setup, setSetup] = useLS("lo_nut_setup", null);
  const [form, setForm] = useState({ alergias: "", restricciones: "Ninguna", comidasDia: "3", presupuesto: "Medio" });
  const [dieta, setDieta] = useLS("lo_nut_dieta", null);
  const [loadingDieta, setLoadingDieta] = useState(false);
  const [checkedComidas, setCheckedComidas] = useLS("lo_nut_checked", {});
  const [cals, setCals] = useLS("lo_nut_cals", 0);
  const [addCal, setAddCal] = useState("");

  const imc = user.peso && user.altura ? (user.peso / Math.pow(user.altura / 100, 2)).toFixed(1) : null;
  const tmb = user.peso && user.altura && user.edad ? Math.round(10 * user.peso + 6.25 * user.altura - 5 * user.edad + (user.sexo === "Femenino" ? -161 : 5)) : 1800;
  const calMeta = user.objetivoFisico === "Perder peso" ? tmb - 300 : user.objetivoFisico === "Ganar músculo" ? tmb + 400 : tmb;

  async function generarDieta() {
    setLoadingDieta(true);
    const r = await callAI(
      `Eres el mejor nutricionista deportivo. Crea una dieta personalizada de lunes a sábado. 
      Responde SOLO en JSON sin markdown:
      {"lunes": {"desayuno": "", "almuerzo": "", "merienda": "", "cena": ""}, "martes": {...}, "miercoles": {...}, "jueves": {...}, "viernes": {...}, "sabado": {...}}
      Cada comida debe ser específica con alimentos y cantidades aproximadas. Máximo 30 palabras por comida.`,
      [{ role: "user", content: `Datos: peso ${user.peso}kg, altura ${user.altura}cm, edad ${user.edad}, objetivo: ${user.objetivoFisico}, calorías meta: ${calMeta}kcal. Restricciones: ${setup.restricciones}. Alergias: ${setup.alergias || "ninguna"}. Comidas al día: ${setup.comidasDia}. Presupuesto: ${setup.presupuesto}.` }]
    );
    try { const c = r.replace(/```json|```/g, "").trim(); setDieta(JSON.parse(c)); setCheckedComidas({}); }
    catch { setDieta(null); }
    setLoadingDieta(false);
  }

  async function regenerarComida(dia, tipo) {
    const r = await callAI(
      `Eres nutricionista. Sugiere UNA alternativa de ${tipo} para el ${dia} con estas características: objetivo ${user.objetivoFisico}, ~${Math.round(calMeta / 4)}kcal, restricciones: ${setup?.restricciones}. Solo el nombre del plato y los ingredientes principales. Máximo 25 palabras.`,
      [{ role: "user", content: "Dame una alternativa." }]
    );
    setDieta(prev => ({ ...prev, [dia]: { ...prev[dia], [tipo]: r } }));
    setCheckedComidas(prev => ({ ...prev, [`${dia}_${tipo}`]: false }));
  }

  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const tipos = ["desayuno", "almuerzo", "merienda", "cena"];
  const comidasTotales = dieta ? dias.length * tipos.length : 0;
  const comidasHechas = Object.values(checkedComidas).filter(Boolean).length;

  if (!setup) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Crea tu dieta personalizada</p></div></div>
      {imc && <Card style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}><div className="flex justify-between"><div><div className="text-white/40 text-xs">Tu IMC</div><div className="text-2xl font-black text-white">{imc}</div></div><div className="text-right"><div className="text-white/40 text-xs">Calorías estimadas</div><div className="text-2xl font-black" style={{ color: mod.color }}>{calMeta} kcal</div></div></div></Card>}
      <div><Lbl>Alergias o intolerancias</Lbl><Inp value={form.alergias} onChange={e => setForm({ ...form, alergias: e.target.value })} placeholder="Ej: Gluten, lactosa, frutos secos..." /></div>
      <div><Lbl>Restricciones alimentarias</Lbl><Sel value={form.restricciones} onChange={e => setForm({ ...form, restricciones: e.target.value })}><option>Ninguna</option><option>Vegetariano</option><option>Vegano</option><option>Sin gluten</option><option>Sin lactosa</option><option>Halal</option></Sel></div>
      <div><Lbl>Comidas al día</Lbl><Sel value={form.comidasDia} onChange={e => setForm({ ...form, comidasDia: e.target.value })}><option>2</option><option>3</option><option>4</option><option>5</option></Sel></div>
      <div><Lbl>Presupuesto semanal</Lbl><Sel value={form.presupuesto} onChange={e => setForm({ ...form, presupuesto: e.target.value })}><option>Bajo (menos de 50€/sem)</option><option>Medio (50-100€/sem)</option><option>Alto (más de 100€/sem)</option></Sel></div>
      <GoldBtn onClick={() => { setSetup(form); }} color={mod.color}>Crear mi dieta personalizada →</GoldBtn>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Meta: {calMeta} kcal · {user.objetivoFisico}</p></div></div>
        <button onClick={() => setSetup(null)} className="text-white/30 text-xs">Editar</button>
      </div>

      {/* Tracker calorías */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <Lbl className="mb-0">🔥 Calorías de hoy</Lbl>
          <span className="text-white font-black" style={{ color: mod.color }}>{cals} / {calMeta}</span>
        </div>
        <ProgressBar value={cals} max={calMeta} color={mod.color} />
        <div className="flex gap-2 mt-3">
          <Inp type="number" value={addCal} onChange={e => setAddCal(e.target.value)} placeholder="+ kcal" className="flex-1" />
          <button onClick={() => { setCals(c => c + parseInt(addCal || 0)); setAddCal(""); }} className="rounded-xl px-4 font-bold text-white" style={{ background: mod.color }}>+</button>
          <button onClick={() => setCals(0)} className="rounded-xl px-3 text-white/30 hover:text-white text-sm" style={{ background: CARD }}>Reset</button>
        </div>
      </Card>

      {!dieta ? (
        <Card className="text-center py-8">
          <p className="text-white/40 text-sm mb-4">Tu dieta personalizada de lunes a sábado está lista para generarse.</p>
          <GoldBtn onClick={generarDieta} color={mod.color} disabled={loadingDieta}>{loadingDieta ? "🍽️ Creando tu dieta..." : "✨ Generar dieta personalizada"}</GoldBtn>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div className="text-white/40 text-xs">{comidasHechas}/{comidasTotales} comidas completadas esta semana</div>
            <GoldBtn onClick={generarDieta} ghost small disabled={loadingDieta}>↻ Nueva dieta</GoldBtn>
          </div>
          {dias.map(dia => (
            <Card key={dia}>
              <div className="text-white font-black capitalize text-sm mb-3" style={{ color: mod.color }}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</div>
              {tipos.map(tipo => {
                const key = `${dia}_${tipo}`;
                const done = checkedComidas[key];
                if (!dieta[dia]?.[tipo]) return null;
                return (
                  <div key={tipo} className="flex items-start gap-2 mb-2 rounded-xl p-2.5 transition-all" style={{ background: done ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)" }}>
                    <button onClick={() => setCheckedComidas(p => ({ ...p, [key]: !p[key] }))} className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all" style={{ background: done ? "#4ade80" : "rgba(255,255,255,0.1)" }}>{done && <span className="text-white text-xs font-bold">✓</span>}</button>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/40 text-xs uppercase tracking-wide">{tipo}</div>
                      <div className={`text-sm mt-0.5 ${done ? "line-through text-white/30" : "text-white/80"}`}>{dieta[dia][tipo]}</div>
                    </div>
                    <button onClick={() => regenerarComida(dia, tipo)} className="text-white/25 hover:text-white text-xs flex-shrink-0" title="Cambiar esta comida">↻</button>
                  </div>
                );
              })}
            </Card>
          ))}
        </>
      )}

      <AIChat sp={buildSP("nutricion", user)} color={mod.color} name="Nutricionista Experto" />
    </div>
  );
}

// ─── PRODUCTIVIDAD ────────────────────────────────────────────────────────────
function Productividad({ user }) {
  const mod = ALL_MODULES.find(m => m.id === "productividad");
  const [tareas, setTareas] = useLS("lo_prod_tareas", []);
  const [newTarea, setNewTarea] = useState({ texto: "", prioridad: "Media", categoria: "Personal" });
  const [pomodoro, setPomodoro] = useState({ activo: false, segundos: 25 * 60, modo: "trabajo", completados: 0 });
  const [movil, setMovil] = useLS("lo_prod_movil", { objetivo: 120, hoy: 0 });
  const [addMovil, setAddMovil] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    if (pomodoro.activo) {
      timerRef.current = setInterval(() => {
        setPomodoro(p => {
          if (p.segundos <= 1) {
            clearInterval(timerRef.current);
            const isWork = p.modo === "trabajo";
            return { ...p, activo: false, segundos: isWork ? 5 * 60 : 25 * 60, modo: isWork ? "descanso" : "trabajo", completados: isWork ? p.completados + 1 : p.completados };
          }
          return { ...p, segundos: p.segundos - 1 };
        });
      }, 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [pomodoro.activo]);

  const mins = String(Math.floor(pomodoro.segundos / 60)).padStart(2, "0");
  const secs = String(pomodoro.segundos % 60).padStart(2, "0");

  function addTarea() {
    if (!newTarea.texto.trim()) return;
    setTareas([{ ...newTarea, id: Date.now(), completada: false, fecha: new Date().toLocaleDateString() }, ...tareas]);
    setNewTarea({ texto: "", prioridad: "Media", categoria: "Personal" });
  }

  const prioColors = { Alta: "#f87171", Media: "#fbbf24", Baja: "#4ade80" };
  const completadas = tareas.filter(t => t.completada).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Foco, tiempo y resultados</p></div></div>

      {/* Pomodoro */}
      <Card style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.1), rgba(56,189,248,0.03))", border: "1px solid rgba(56,189,248,0.2)" }}>
        <Lbl>⏱️ Técnica Pomodoro</Lbl>
        <div className="text-center py-2">
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: pomodoro.modo === "trabajo" ? mod.color : "#4ade80" }}>
            {pomodoro.modo === "trabajo" ? "🎯 TIEMPO DE FOCO" : "☕ DESCANSO"}
          </div>
          <div className="text-6xl font-black text-white mb-4">{mins}:{secs}</div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setPomodoro(p => ({ ...p, activo: !p.activo }))} className="px-8 py-3 rounded-2xl font-bold text-white transition-all active:scale-95" style={{ background: pomodoro.activo ? "#f87171" : mod.color }}>
              {pomodoro.activo ? "⏸ Pausa" : "▶ Iniciar"}
            </button>
            <button onClick={() => setPomodoro({ activo: false, segundos: 25 * 60, modo: "trabajo", completados: pomodoro.completados })} className="px-4 py-3 rounded-2xl font-bold text-white/40" style={{ background: CARD }}>↺</button>
          </div>
          <div className="mt-3 text-white/30 text-xs">{pomodoro.completados} pomodoros completados hoy 🍅</div>
        </div>
      </Card>

      {/* Control del móvil */}
      <Card>
        <Lbl>📱 Control uso del móvil</Lbl>
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/40 text-xs">Objetivo: máx {movil.objetivo} min/día</span>
          <span className="font-black" style={{ color: movil.hoy > movil.objetivo ? "#f87171" : "#4ade80" }}>{movil.hoy} min</span>
        </div>
        <ProgressBar value={movil.hoy} max={movil.objetivo} color={movil.hoy > movil.objetivo ? "#f87171" : mod.color} />
        <div className="flex gap-2 mt-3">
          <Inp type="number" value={addMovil} onChange={e => setAddMovil(e.target.value)} placeholder="Añadir min de uso" className="flex-1" />
          <button onClick={() => { setMovil(m => ({ ...m, hoy: m.hoy + parseInt(addMovil || 0) })); setAddMovil(""); }} className="rounded-xl px-4 py-2 font-bold text-white" style={{ background: mod.color }}>+</button>
          <button onClick={() => setMovil(m => ({ ...m, hoy: 0 }))} className="rounded-xl px-3 text-white/30 text-sm" style={{ background: CARD }}>Reset</button>
        </div>
        <div className="flex gap-2 mt-2">
          <span className="text-white/30 text-xs">Objetivo diario:</span>
          <input type="number" value={movil.objetivo} onChange={e => setMovil(m => ({ ...m, objetivo: parseInt(e.target.value) || 120 }))} className="w-16 rounded-lg px-2 text-xs text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          <span className="text-white/30 text-xs">minutos</span>
        </div>
      </Card>

      {/* Tareas */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <Lbl className="mb-0">✅ Mis tareas</Lbl>
          <span className="text-xs" style={{ color: mod.color }}>{completadas}/{tareas.length} hechas</span>
        </div>
        <div className="flex gap-2 mb-3 flex-wrap">
          <Inp value={newTarea.texto} onChange={e => setNewTarea({ ...newTarea, texto: e.target.value })} onKeyDown={e => e.key === "Enter" && addTarea()} placeholder="Nueva tarea..." className="flex-1 min-w-32" />
          <Sel value={newTarea.prioridad} onChange={e => setNewTarea({ ...newTarea, prioridad: e.target.value })} className="w-24"><option>Alta</option><option>Media</option><option>Baja</option></Sel>
          <button onClick={addTarea} className="rounded-xl px-4 font-bold text-white" style={{ background: mod.color }}>+</button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tareas.length === 0 && <p className="text-white/20 text-xs text-center py-4">Sin tareas. ¡Añade tu primera!</p>}
          {tareas.map(t => (
            <div key={t.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all" style={{ background: t.completada ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.04)" }}>
              <button onClick={() => setTareas(tareas.map(x => x.id === t.id ? { ...x, completada: !x.completada } : x))} className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all" style={{ background: t.completada ? "#4ade80" : "rgba(255,255,255,0.1)" }}>{t.completada && <span className="text-white text-xs font-bold">✓</span>}</button>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: prioColors[t.prioridad] }} />
              <span className={`flex-1 text-sm ${t.completada ? "line-through text-white/30" : "text-white/80"}`}>{t.texto}</span>
              <XBtn onClick={() => setTareas(tareas.filter(x => x.id !== t.id))} />
            </div>
          ))}
        </div>
      </Card>

      <AIChat sp={buildSP("productividad", user)} color={mod.color} name="Coach de Productividad"
        initMsg="¡Hola! Soy tu coach de productividad. Puedo ayudarte con gestión del tiempo, eliminar distracciones, foco digital y sistemas de trabajo. ¿Cuál es tu mayor problema de productividad ahora mismo?" />
    </div>
  );
}

// ─── BIENESTAR ────────────────────────────────────────────────────────────────
function Bienestar({ user }) {
  const mod = ALL_MODULES.find(m => m.id === "bienestar");
  const [meditacion, setMeditacion] = useState({ activa: false, segundos: 0, duracion: 5 * 60 });
  const [fase, setFase] = useState("inhala"); // inhala, aguanta, exhala
  const [respiracion, setRespiracion] = useState(false);
  const [diario, setDiario] = useLS("lo_bien_diario", []);
  const [nuevaEntrada, setNuevaEntrada] = useState({ texto: "", estado: "Bien", estres: 5 });
  const timerRef = useRef(null);
  const respRef = useRef(null);

  useEffect(() => {
    if (meditacion.activa) {
      timerRef.current = setInterval(() => {
        setMeditacion(m => {
          if (m.segundos >= m.duracion) { clearInterval(timerRef.current); return { ...m, activa: false, segundos: 0 }; }
          return { ...m, segundos: m.segundos + 1 };
        });
      }, 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [meditacion.activa]);

  useEffect(() => {
    if (respiracion) {
      const ciclo = [["inhala", 4000], ["aguanta", 7000], ["exhala", 8000]];
      let i = 0;
      const next = () => { setFase(ciclo[i][0]); respRef.current = setTimeout(() => { i = (i + 1) % 3; if (respiracion) next(); }, ciclo[i][1]); };
      next();
    } else { clearTimeout(respRef.current); setFase("inhala"); }
    return () => clearTimeout(respRef.current);
  }, [respiracion]);

  const medMins = String(Math.floor(meditacion.segundos / 60)).padStart(2, "0");
  const medSecs = String(meditacion.segundos % 60).padStart(2, "0");

  function guardarEntrada() {
    if (!nuevaEntrada.texto.trim()) return;
    setDiario([{ ...nuevaEntrada, fecha: new Date().toLocaleDateString(), id: Date.now() }, ...diario.slice(0, 29)]);
    setNuevaEntrada({ texto: "", estado: "Bien", estres: 5 });
  }

  const faseColors = { inhala: "#60a5fa", aguanta: "#a78bfa", exhala: "#4ade80" };
  const faseTexto = { inhala: "Inhala... 4s", aguanta: "Aguanta... 7s", exhala: "Exhala... 8s" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Salud mental y equilibrio</p></div></div>

      {/* Meditación */}
      <Card style={{ background: "linear-gradient(135deg, rgba(192,132,252,0.1), rgba(192,132,252,0.03))", border: "1px solid rgba(192,132,252,0.2)" }}>
        <Lbl>🧘 Meditación guiada</Lbl>
        <div className="mb-3">
          <div className="flex gap-2 justify-center mb-4">
            {[5, 10, 15, 20].map(m => (
              <button key={m} onClick={() => setMeditacion(med => ({ ...med, duracion: m * 60, segundos: 0, activa: false }))} className="px-3 py-1.5 rounded-full text-xs font-bold transition-all" style={{ background: meditacion.duracion === m * 60 ? mod.color + "30" : CARD, border: `1px solid ${meditacion.duracion === m * 60 ? mod.color : BORDER}`, color: meditacion.duracion === m * 60 ? mod.color : "rgba(255,255,255,0.4)" }}>{m} min</button>
            ))}
          </div>
          <div className="text-center">
            <div className="text-5xl font-black text-white mb-2">{medMins}:{medSecs}</div>
            <div className="text-white/30 text-xs mb-4">
              {!meditacion.activa && meditacion.segundos === 0 ? "Cierra los ojos. Enfócate en tu respiración." :
                meditacion.activa ? "Suelta los pensamientos. Solo observa." : "¡Bien hecho! 🌟"}
            </div>
            <button onClick={() => setMeditacion(m => ({ ...m, activa: !m.activa, segundos: m.activa ? m.segundos : 0 }))} className="px-8 py-3 rounded-2xl font-bold text-white active:scale-95 transition-all" style={{ background: meditacion.activa ? "#f87171" : mod.color }}>
              {meditacion.activa ? "⏸ Pausar" : meditacion.segundos > 0 ? "▶ Continuar" : "▶ Comenzar"}
            </button>
          </div>
        </div>
      </Card>

      {/* Respiración 4-7-8 */}
      <Card>
        <Lbl>💨 Respiración 4-7-8 (anti-estrés)</Lbl>
        <p className="text-white/40 text-xs mb-4">Técnica científicamente probada para reducir la ansiedad en minutos.</p>
        <div className="text-center">
          {respiracion && (
            <div className="mb-4">
              <div className="text-3xl font-black mb-2" style={{ color: faseColors[fase] }}>{faseTexto[fase]}</div>
              <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-1000" style={{ background: faseColors[fase] + "20", border: `3px solid ${faseColors[fase]}`, transform: fase === "inhala" ? "scale(1.3)" : fase === "exhala" ? "scale(0.8)" : "scale(1.1)" }}>
                <span className="text-4xl">{fase === "inhala" ? "⬆" : fase === "aguanta" ? "●" : "⬇"}</span>
              </div>
            </div>
          )}
          <button onClick={() => setRespiracion(r => !r)} className="px-8 py-3 rounded-2xl font-bold text-white active:scale-95" style={{ background: respiracion ? "#f87171" : mod.color }}>
            {respiracion ? "⏹ Detener" : "▶ Iniciar respiración"}
          </button>
        </div>
      </Card>

      {/* Diario emocional */}
      <Card>
        <Lbl>📓 Diario emocional</Lbl>
        <div className="space-y-3 mb-3">
          <div>
            <div className="text-white/40 text-xs mb-2">¿Cómo te sientes hoy?</div>
            <div className="flex gap-2 flex-wrap">
              {["Genial 🌟", "Bien 😊", "Normal 😐", "Bajo 😔", "Mal 😢", "Estresado 😤"].map(e => (
                <Tag key={e} active={nuevaEntrada.estado === e} color={mod.color} onClick={() => setNuevaEntrada(prev => ({ ...prev, estado: e }))}>{e}</Tag>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1"><span>Nivel de estrés</span><span className="font-bold" style={{ color: mod.color }}>{nuevaEntrada.estres}/10</span></div>
            <input type="range" min="1" max="10" value={nuevaEntrada.estres} onChange={e => setNuevaEntrada(prev => ({ ...prev, estres: parseInt(e.target.value) }))} className="w-full" style={{ accentColor: mod.color }} />
          </div>
          <textarea value={nuevaEntrada.texto} onChange={e => setNuevaEntrada(prev => ({ ...prev, texto: e.target.value }))} placeholder="¿Qué ha pasado hoy? ¿Qué sientes? Escribe sin filtros..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none h-24" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          <GoldBtn onClick={guardarEntrada} color={mod.color} ghost>Guardar entrada</GoldBtn>
        </div>
        {diario.slice(0, 3).map(e => (
          <div key={e.id} className="rounded-xl p-3 mb-2" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="flex justify-between text-xs text-white/30 mb-1"><span>{e.fecha}</span><span>{e.estado} · Estrés: {e.estres}/10</span></div>
            <p className="text-white/60 text-sm">{e.texto}</p>
          </div>
        ))}
      </Card>

      <AIChat sp={buildSP("bienestar", user)} color={mod.color} name="Psicólogo de Bienestar"
        initMsg="Hola. Estoy aquí para ayudarte con tu bienestar mental. ¿Cómo te encuentras hoy? ¿Hay algo que te esté pesando o generando estrés?" />
    </div>
  );
}

// ─── MENTALIDAD ───────────────────────────────────────────────────────────────
function Mentalidad({ user }) {
  const mod = ALL_MODULES.find(m => m.id === "habitos");
  const defH = { "📖 Leer 20 min": false, "💧 2L de agua": false, "🏃 Ejercicio hoy": false, "📵 Sin móvil por la mañana": false, "🙏 Gratitud": false, "🌙 Buena noche de sueño": false };
  const [habits, setHabits] = useLS("lo_hab", defH);
  const [grats, setGrats] = useLS("lo_grat", []);
  const [ng, setNg] = useState(["", "", ""]);
  const [int, setInt] = useLS("lo_int", "");
  const [animo, setAnimo] = useLS("lo_animo", 7);
  const [streak, setStreak] = useLS("lo_hab_streak", 0);
  const [lastDate, setLastDate] = useLS("lo_hab_date", "");

  const done = Object.values(habits).filter(Boolean).length;
  const total = Object.keys(habits).length;
  const pct = Math.round((done / total) * 100);

  function resetHabits() {
    const hoy = new Date().toLocaleDateString();
    if (lastDate !== hoy) {
      if (Object.values(habits).every(Boolean)) setStreak(s => s + 1); else if (done < total / 2) setStreak(0);
      setHabits(Object.fromEntries(Object.keys(habits).map(k => [k, false])));
      setLastDate(hoy);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Hábitos y mentalidad ganadora</p></div></div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center"><div className="text-3xl font-black" style={{ color: mod.color }}>{streak}</div><div className="text-white/30 text-xs mt-1">🔥 Racha días</div></Card>
        <Card className="text-center"><div className="text-3xl font-black text-white">{done}/{total}</div><div className="text-white/30 text-xs mt-1">✅ Hábitos</div></Card>
        <Card className="text-center"><div className="text-3xl font-black text-yellow-400">{animo}/10</div><div className="text-white/30 text-xs mt-1">😊 Ánimo</div></Card>
      </div>

      <Card style={{ background: pct === 100 ? "rgba(167,139,250,0.1)" : CARD, border: pct === 100 ? "1px solid rgba(167,139,250,0.3)" : `1px solid ${BORDER}` }}>
        <div className="flex justify-between items-center mb-2">
          <Lbl className="mb-0">🎯 Intención del día</Lbl>
          {pct === 100 && <span className="text-xs font-bold" style={{ color: mod.color }}>🏆 ¡Día perfecto!</span>}
        </div>
        <Inp value={int} onChange={e => setInt(e.target.value)} placeholder="Una cosa que marcará este día..." />
        <div className="mt-3"><ProgressBar value={done} max={total} color={mod.color} /></div>
        <div className="text-right text-xs mt-1" style={{ color: mod.color }}>{pct}% completado</div>
      </Card>

      <Card>
        <Lbl>Hábitos de hoy</Lbl>
        {Object.entries(habits).map(([h, v]) => (
          <button key={h} onClick={() => setHabits({ ...habits, [h]: !v })} className="w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all text-left active:scale-98" style={{ background: v ? mod.color + "15" : "rgba(255,255,255,0.04)", border: `1px solid ${v ? mod.color + "40" : BORDER}` }}>
            <div className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 transition-all" style={{ background: v ? mod.color : "rgba(255,255,255,0.1)" }}>{v && <span className="text-white text-xs font-bold">✓</span>}</div>
            <span className={`text-sm flex-1 ${v ? "line-through text-white/30" : "text-white"}`}>{h}</span>
            {v && <span className="text-xs" style={{ color: mod.color }}>+1</span>}
          </button>
        ))}
        <button onClick={resetHabits} className="text-white/20 text-xs hover:text-white/40 transition-colors mt-1">↺ Nuevo día</button>
      </Card>

      <Card>
        <Lbl>📊 Estado de hoy</Lbl>
        <div className="flex justify-between text-xs text-white/40 mb-1"><span>Estado de ánimo</span><span className="font-bold" style={{ color: mod.color }}>{animo}/10</span></div>
        <input type="range" min="1" max="10" value={animo} onChange={e => setAnimo(parseInt(e.target.value))} className="w-full" style={{ accentColor: mod.color }} />
      </Card>

      <Card>
        <Lbl>🙏 Gratitud de hoy</Lbl>
        <div className="space-y-2 mb-3">
          {ng.map((g, i) => <input key={i} value={g} onChange={e => { const n = [...ng]; n[i] = e.target.value; setNg(n); }} placeholder={`${i + 1}. Hoy agradezco...`} className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />)}
        </div>
        <GoldBtn onClick={() => { const items = ng.filter(g => g.trim()); if (items.length) { setGrats([{ items, fecha: new Date().toLocaleDateString(), id: Date.now() }, ...grats.slice(0, 29)]); setNg(["", "", ""]); } }} ghost>Guardar gratitud</GoldBtn>
        {grats.slice(0, 2).map(g => <div key={g.id} className="mt-2 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}><div className="text-white/25 text-xs mb-1">{g.fecha}</div>{g.items.map((it, i) => <div key={i} className="text-white/50 text-xs">{i + 1}. {it}</div>)}</div>)}
      </Card>

      <AIChat sp={buildSP("habitos", user)} color={mod.color} name="Coach de Mentalidad" />
    </div>
  );
}

// ─── ENTRENO ──────────────────────────────────────────────────────────────────
function Entreno({ user }) {
  const mod = ALL_MODULES.find(m => m.id === "entreno");
  const [log, setLog] = useLS("lo_eLog", []);
  const [equip, setEquip] = useLS("lo_equip", []);
  const [peso, setPeso] = useLS("lo_peso_hist", [{ fecha: new Date().toLocaleDateString(), peso: parseFloat(user.peso) || 70, id: Date.now() }]);
  const [newPeso, setNewPeso] = useState("");
  const equips = ["Gimnasio completo", "Mancuernas", "Barra y discos", "Banco", "Saco de boxeo", "Bandas elásticas", "Solo peso corporal", "Máquinas cardio"];
  const toggleE = e => setEquip(eq => eq.includes(e) ? eq.filter(x => x !== e) : [...eq, e]);

  const sес = [
    { n: "Empuje — Pecho · Hombros · Tríceps", e: ["Press banca 4×8-10", "Press inclinado 3×10-12", "Aperturas 3×12-15", "Press militar 4×8-10", "Fondos 3×máx"] },
    { n: "Tirón — Espalda · Bíceps", e: ["Remo un brazo 4×10-12", "Dominadas/Jalón 4×8-10", "Curl barra 3×10-12", "Curl martillo 3×12", "Face pull 3×15"] },
    { n: "Pierna — Cuádriceps · Glúteos", e: ["Sentadilla 4×8-10", "Peso muerto rumano 4×10", "Zancadas 3×12/pierna", "Gemelos 4×15-20", "Hip thrust 3×12"] },
    { n: "Cardio · Core · Funcional", e: ["20 min cardio moderado", "Plancha 3×60s", "Crunch bicicleta 3×20", "Mountain climbers 3×30s", "Burpees 3×10"] },
  ];

  function addPeso() {
    if (!newPeso) return;
    setPeso([...peso, { fecha: new Date().toLocaleDateString(), peso: parseFloat(newPeso), id: Date.now() }]);
    setNewPeso("");
  }

  const pesoActual = peso[peso.length - 1]?.peso || parseFloat(user.peso);
  const pesoInicial = peso[0]?.peso || parseFloat(user.peso);
  const cambio = (pesoActual - pesoInicial).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Objetivo: {user.objetivoFisico}</p></div></div>

      {/* Tracker de peso */}
      <Card>
        <Lbl>⚖️ Control de peso</Lbl>
        <div className="flex items-center gap-4 mb-3">
          <div className="text-center"><div className="text-3xl font-black text-white">{pesoActual}kg</div><div className="text-white/30 text-xs">Peso actual</div></div>
          <div className="flex-1">
            <div className="text-center mb-1"><span className={`text-lg font-black ${parseFloat(cambio) >= 0 ? "text-green-400" : "text-red-400"}`}>{parseFloat(cambio) >= 0 ? "+" : ""}{cambio}kg</span><span className="text-white/30 text-xs ml-1">desde el inicio</span></div>
            <ProgressBar value={Math.abs(parseFloat(cambio))} max={10} color={parseFloat(cambio) >= 0 ? "#4ade80" : "#f87171"} />
          </div>
        </div>
        <div className="flex gap-2">
          <Inp type="number" value={newPeso} onChange={e => setNewPeso(e.target.value)} placeholder="Nuevo peso (kg)" className="flex-1" />
          <button onClick={addPeso} className="rounded-xl px-4 font-bold text-white" style={{ background: mod.color }}>+ Registrar</button>
        </div>
        {peso.length > 1 && (
          <div className="mt-3 space-y-1 max-h-24 overflow-y-auto">
            {peso.slice(-4).reverse().map(p => (
              <div key={p.id} className="flex justify-between rounded-lg px-3 py-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                <span className="text-white/40 text-xs">{p.fecha}</span>
                <span className="text-white font-bold text-sm">{p.peso}kg</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <Lbl>Tu equipamiento</Lbl>
        <div className="flex flex-wrap gap-2">
          {equips.map(e => <Tag key={e} active={equip.includes(e)} color={mod.color} onClick={() => toggleE(e)}>{e}</Tag>)}
        </div>
      </Card>

      {sес.map((s, i) => (
        <Card key={i}>
          <div className="flex justify-between items-start mb-3">
            <div className="text-sm font-bold text-white flex-1 pr-2">{s.n}</div>
            <button onClick={() => setLog([{ s: s.n, f: new Date().toLocaleDateString(), id: Date.now() }, ...log.slice(0, 29)])} className="text-xs px-3 py-1.5 rounded-full font-bold flex-shrink-0 active:scale-95" style={{ background: mod.color + "25", color: mod.color }}>✓ Hecho</button>
          </div>
          {s.e.map((ej, j) => <div key={j} className="flex items-center gap-2 text-xs text-white/45 mb-1.5"><span style={{ color: mod.color }}>·</span>{ej}</div>)}
        </Card>
      ))}

      {log.length > 0 && <Card><Lbl>Últimas sesiones</Lbl>{log.slice(0, 5).map(l => <div key={l.id} className="flex justify-between rounded-xl px-3 py-2 mb-1" style={{ background: "rgba(255,255,255,0.04)" }}><span className="text-white/60 text-sm">{l.s}</span><span className="text-white/25 text-xs">{l.f}</span></div>)}</Card>}

      <AIChat sp={buildSP("entreno", user)} color={mod.color} name="Entrenador Personal" />
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({ user, onReset }) {
  return (
    <div className="space-y-4">
      <div className="py-1"><h2 className="text-xl font-black text-white">Ajustes</h2></div>
      <Card>
        <Lbl>Tu perfil</Lbl>
        {[["Nombre", user.nombre], ["Edad", `${user.edad} años`], ["Cuerpo", `${user.peso}kg · ${user.altura}cm`], ["Objetivo", user.objetivoFisico], ["Trabajo", user.trabajo], ["Horario", user.horario], ["Ahorros", `${user.dinero}€`], ["Negocio", user.negocio], ["Estudios", user.estudia], ["Pareja", user.pareja]].map(([k, v]) => (
          <div key={k} className="flex justify-between py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}><span className="text-white/30 text-sm">{k}</span><span className="text-white text-sm font-medium">{v}</span></div>
        ))}
      </Card>
      {user.extra && <Card><Lbl>Notas personales</Lbl><p className="text-white/50 text-sm leading-relaxed">{user.extra}</p></Card>}
      <Card><Lbl>Módulos activos</Lbl><div className="flex flex-wrap gap-2">{ALL_MODULES.filter(m => user.modulos.includes(m.id)).map(m => <span key={m.id} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: m.color + "18", color: m.color, border: `1px solid ${m.color}35` }}>{m.icon} {m.label}</span>)}</div></Card>
      <Card><Lbl>⚠️ Zona peligrosa</Lbl><p className="text-white/30 text-xs mb-3">Borrará todos tus datos.</p><button onClick={onReset} className="w-full py-3.5 rounded-2xl font-bold text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>Reiniciar LIFEOS</button></Card>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function Nav({ active, goTo, mods }) {
  const items = [{ id: "dashboard", icon: "🏠", label: "Inicio", color: "#7c3aed" }, ...ALL_MODULES.filter(m => mods.includes(m.id))];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-6 pt-3 px-3" style={{ background: `linear-gradient(transparent, ${BG} 50%)` }}>
      <div className="flex items-center gap-0.5 rounded-2xl px-2 py-2 overflow-x-auto no-scrollbar" style={{ background: "rgba(12,12,22,0.98)", border: `1px solid ${BORDER}`, backdropFilter: "blur(20px)", WebkitOverflowScrolling: "touch" }}>
        {items.map(m => {
          const on = active === m.id;
          return (
            <button key={m.id} onClick={() => goTo(m.id)} className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all flex-shrink-0" style={{ background: on ? m.color + "20" : "transparent" }}>
              <span className="text-lg leading-none">{m.icon}</span>
              <span style={{ color: on ? m.color : "rgba(255,255,255,0.25)", fontSize: "9px", fontWeight: on ? "800" : "600" }} className="truncate max-w-12">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit() {
    if (!email || !password) { setError("Rellena todos los campos"); return; }
    setLoading(true); setError(""); setSuccess("");
    if (mode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError("Email o contraseña incorrectos");
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else if (data.user && !data.session) setSuccess("¡Revisa tu email para confirmar tu cuenta!");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: BG }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            <span className="text-white font-black text-2xl">L</span>
          </div>
          <h1 className="text-3xl font-black text-white">LIFEOS</h1>
          <p className="text-white/40 text-sm mt-1">Tu sistema operativo de vida</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "rgba(255,255,255,0.04)" }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={{ background: mode === m ? "#7c3aed" : "transparent", color: mode === m ? "white" : "rgba(255,255,255,0.4)" }}>
                {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>
          <div className="space-y-3 mb-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500"
              style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500"
              style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          </div>
          {error && <div className="rounded-xl px-4 py-3 mb-4 text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
          {success && <div className="rounded-xl px-4 py-3 mb-4 text-sm text-green-400" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>{success}</div>}
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3.5 rounded-2xl font-bold text-sm text-white active:scale-95 disabled:opacity-30" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            {loading ? "Cargando..." : mode === "login" ? "Entrar →" : "Crear cuenta →"}
          </button>
        </div>
        <p className="text-white/20 text-xs text-center mt-6">golifeos.net · Tu vida, tu sistema</p>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function LifeOS() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useLS("lo_user", null);
  const [active, setActive] = useState("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    localStorage.clear();
    setActive("dashboard");
  }

  const reset = () => { handleSignOut(); };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
          <span className="text-white font-black text-2xl">L</span>
        </div>
        <div className="text-white/40 text-sm animate-pulse">Cargando LIFEOS...</div>
      </div>
    </div>
  );

  if (!session) return <AuthScreen />;
  if (!user) return <Onboarding onDone={d => { setUser(d); setActive("dashboard"); }} />;

  const render = () => {
    switch (active) {
      case "dashboard": return <Dashboard user={user} goTo={setActive} />;
      case "settings": return <Settings user={user} onReset={reset} />;
      case "habitos": return <Mentalidad user={user} />;
      case "finanzas": return <Finanzas user={user} />;
      case "entreno": return <Entreno user={user} />;
      case "sueno": return <Sueno user={user} />;
      case "negocio": return <Negocio user={user} />;
      case "estudios": return <Estudios user={user} />;
      case "lectura": return <Lectura user={user} />;
      case "relaciones": return <Relaciones user={user} />;
      case "nutricion": return <Nutricion user={user} />;
      case "productividad": return <Productividad user={user} />;
      case "bienestar": return <Bienestar user={user} />;
      default: return <Dashboard user={user} goTo={setActive} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif" }}>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      <div className="h-14" />
      <div className="flex items-center justify-between px-5 mb-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActive("dashboard")}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}><span className="text-white font-black text-xs">L</span></div>
          <span className="text-white font-black tracking-widest text-xs">LIFEOS</span>
        </div>
        <button onClick={() => setActive("settings")} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}><span className="text-sm">⚙️</span></button>
      </div>
      <div className="px-5 pb-44">{render()}</div>
      <Nav active={active} goTo={setActive} mods={user.modulos} />
    </div>
  );
}
