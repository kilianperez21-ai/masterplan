import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// ─── AI ───────────────────────────────────────────────────────────────────────
async function callAI(system, messages) {
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
  { id: "habitos",       icon: "🧠", label: "Mentalidad",    color: "#a78bfa", free: true },
  { id: "finanzas",      icon: "💰", label: "Finanzas",      color: "#34d399", free: true },
  { id: "entreno",       icon: "💪", label: "Entreno",       color: "#f97316", free: true },
  { id: "sueno",         icon: "😴", label: "Sueño",         color: "#60a5fa", free: true },
  { id: "negocio",       icon: "💼", label: "Negocio",       color: "#fbbf24", free: false },
  { id: "estudios",      icon: "📚", label: "Estudios",      color: "#f472b6", free: false },
  { id: "lectura",       icon: "📖", label: "Lectura",       color: "#fb923c", free: false },
  { id: "relaciones",    icon: "💑", label: "Relaciones",    color: "#fb7185", free: false },
  { id: "nutricion",     icon: "🍎", label: "Nutrición",     color: "#4ade80", free: false },
  { id: "productividad", icon: "🎯", label: "Productividad", color: "#38bdf8", free: false },
  { id: "bienestar",     icon: "🧘", label: "Bienestar",     color: "#c084fc", free: false },
];

function buildSP(moduleId, user) {
  const extra = user.extra ? `IMPORTANTE - Ten siempre en cuenta: ${user.extra}.` : "";
  const base = `Usuario: ${user.nombre}, ${user.edad} años, ${user.sexo}. Peso: ${user.peso}kg, altura: ${user.altura}cm. Objetivo: ${user.objetivoFisico}. Trabajo: ${user.trabajo}. Horario: ${user.horario}. Ahorros: ${user.dinero}€. Negocio: ${user.negocio}. Estudios: ${user.estudia}. Pareja: ${user.pareja}. ${extra} USA siempre esta info. NUNCA respondas genérico.`;
  const sp = {
    habitos: "Eres el mejor coach de mentalidad. Das herramientas concretas de estoicismo, neurociencia y psicología positiva.",
    finanzas: "Eres el mejor asesor financiero para jóvenes. Das consejos con números reales: brokers, fondos, presupuestos.",
    entreno: "Eres el mejor entrenador personal. Planes concretos con series, reps y progresión adaptados al equipamiento.",
    sueno: "Eres el mayor experto en optimización del sueño. Ciclos circadianos, rutinas y suplementos específicos.",
    negocio: "Eres el mayor experto en emprendimiento. Pasos concretos y estrategias para el negocio específico del usuario.",
    estudios: "Eres el mayor experto en aprendizaje acelerado. Adaptas todo a la materia del usuario. Creas preguntas personalizadas.",
    lectura: "Eres el mejor recomendador de libros y podcasts. Recomiendas según el perfil exacto del usuario.",
    relaciones: "Eres el mejor terapeuta de pareja. Haces preguntas profundas y das estrategias muy concretas.",
    nutricion: "Eres el mejor nutricionista deportivo. Planes con gramos exactos adaptados al objetivo del usuario.",
    productividad: "Eres el mejor coach de productividad. Gestión del tiempo, eliminación de distracciones y foco digital.",
    bienestar: "Eres el mejor psicólogo de bienestar mental. Técnicas concretas de gestión del estrés y equilibrio emocional.",
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
function GoldBtn({ children, onClick, color = "#7c3aed", disabled = false, ghost = false, small = false, className = "" }) {
  return <button onClick={onClick} disabled={disabled}
    className={`${small ? "px-4 py-2 text-xs" : "w-full py-3.5 text-sm"} rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-30 ${className}`}
    style={{ background: ghost ? "rgba(255,255,255,0.06)" : color, color: "white", border: ghost ? `1px solid ${BORDER}` : "none" }}>{children}</button>;
}
function ProgressBar({ value, max, color }) {
  return <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
  </div>;
}
function XBtn({ onClick }) {
  return <button onClick={e => { e.stopPropagation(); onClick(); }} className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-red-500/20 transition-all flex-shrink-0 text-xs">✕</button>;
}

// ─── SUPABASE DATA HOOKS ──────────────────────────────────────────────────────
function useCloudData(userId, key, defaultVal) {
  const [data, setData] = useState(defaultVal);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from("module_data").select("data").eq("user_id", userId).eq("module_key", key).single()
      .then(({ data: row }) => {
        if (row?.data) setData(row.data);
        setLoaded(true);
      });
  }, [userId, key]);

  const save = async (newData) => {
    setData(newData);
    await supabase.from("module_data").upsert({ user_id: userId, module_key: key, data: newData, updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
  };

  return [data, save, loaded];
}

// ─── AI CHAT ─────────────────────────────────────────────────────────────────
function AIChat({ sp, color, name, initMsg, isPremium, onUpgrade }) {
  const [msgs, setMsgs] = useState(initMsg ? [{ role: "assistant", content: initMsg }] : []);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  if (!isPremium) return (
    <Card style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.05))", border: "1px solid rgba(124,58,237,0.3)" }}>
      <div className="text-center py-4">
        <div className="text-3xl mb-3">🔒</div>
        <div className="text-white font-bold mb-1">Asistente IA — Plan Premium</div>
        <p className="text-white/40 text-sm mb-4">Desbloquea el asistente IA experto en {name} y todos los módulos avanzados.</p>
        <GoldBtn onClick={onUpgrade} color="#7c3aed">✨ Hazte Premium — 7,99€/mes</GoldBtn>
      </div>
    </Card>
  );

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
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#7c3aed20", color: "#a78bfa" }}>PREMIUM</span>
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
function NotasCarpetas({ userId, storeKey, color }) {
  const [carpetas, setCarpetas] = useCloudData(userId, `${storeKey}_carpetas`, []);
  const [carpetaActiva, setCarpetaActiva] = useState(null);
  const [nuevaCarpeta, setNuevaCarpeta] = useState("");
  const [nuevaNota, setNuevaNota] = useState("");

  function addCarpeta() {
    if (!nuevaCarpeta.trim()) return;
    const updated = [...carpetas, { id: Date.now(), nombre: nuevaCarpeta.trim(), notas: [] }];
    setCarpetas(updated); setNuevaCarpeta("");
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
        <button onClick={() => setCarpetaActiva(null)} className="text-white/40 hover:text-white text-sm">← Volver</button>
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
          <div key={c.id} className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
            <span className="text-lg">📁</span>
            <div className="flex-1 cursor-pointer" onClick={() => setCarpetaActiva(c.id)}>
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

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
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
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError("Email o contraseña incorrectos");
      else onAuth(data.user);
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else if (data.user && !data.session) setSuccess("¡Cuenta creada! Revisa tu email para confirmar.");
      else if (data.user) onAuth(data.user);
    }
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
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

        <Card>
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "rgba(255,255,255,0.04)" }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={{ background: mode === m ? "#7c3aed" : "transparent", color: mode === m ? "white" : "rgba(255,255,255,0.4)" }}>
                {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          <div className="space-y-3 mb-4">
            <Inp value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" type="email" />
            <Inp value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password" />
          </div>

          {error && <div className="rounded-xl px-4 py-3 mb-4 text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
          {success && <div className="rounded-xl px-4 py-3 mb-4 text-sm text-green-400" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>{success}</div>}

          <GoldBtn onClick={handleSubmit} disabled={loading}>
            {loading ? "Cargando..." : mode === "login" ? "Entrar →" : "Crear cuenta →"}
          </GoldBtn>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: BORDER }} />
            <span className="text-white/20 text-xs">o continúa con</span>
            <div className="flex-1 h-px" style={{ background: BORDER }} />
          </div>

          <button onClick={handleGoogle} className="w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-3 transition-all active:scale-95"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <span className="text-lg">G</span> Google
          </button>
        </Card>

        <p className="text-white/20 text-xs text-center mt-6">Al registrarte aceptas nuestros términos de uso.</p>
      </div>
    </div>
  );
}

// ─── PREMIUM SCREEN ───────────────────────────────────────────────────────────
function PremiumScreen({ user, onBack, isPremium }) {
  const benefits = [
    "🤖 Asistentes IA en todos los módulos",
    "🍎 Dieta personalizada generada por IA",
    "📚 Preguntas de examen IA para estudios",
    "📖 Recomendaciones de libros y podcasts",
    "💼 Plan de negocio personalizado con IA",
    "💑 Terapeuta de pareja IA",
    "🧘 Meditación y bienestar con IA",
    "☁️ Datos sincronizados en todos tus dispositivos",
    "🔄 Actualizaciones continuas",
  ];

  if (isPremium) return (
    <div className="space-y-4">
      <div className="py-1 flex items-center gap-3">
        <button onClick={onBack} className="text-white/40 hover:text-white">←</button>
        <h2 className="text-xl font-black text-white">Mi suscripción</h2>
      </div>
      <Card style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))", border: "1px solid rgba(124,58,237,0.4)" }}>
        <div className="text-center py-4">
          <div className="text-4xl mb-3">👑</div>
          <div className="text-white font-black text-xl mb-1">Plan Premium Activo</div>
          <div className="text-white/40 text-sm mb-4">Tienes acceso a todas las funciones</div>
          <div className="rounded-xl px-4 py-2 inline-block" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <span className="text-violet-300 font-bold">7,99€/mes</span>
          </div>
        </div>
      </Card>
      <Card>
        <Lbl>Lo que incluye tu plan</Lbl>
        <div className="space-y-2">
          {benefits.map((b, i) => <div key={i} className="flex items-center gap-2 text-sm text-white/70"><span className="text-green-400">✓</span>{b}</div>)}
        </div>
      </Card>
      <Card>
        <Lbl>⚠️ Gestionar suscripción</Lbl>
        <p className="text-white/30 text-xs mb-3">Para cancelar tu suscripción contacta con nosotros o gestiona desde Stripe.</p>
        <button className="w-full py-3 rounded-2xl font-bold text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          Cancelar suscripción
        </button>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="py-1 flex items-center gap-3">
        <button onClick={onBack} className="text-white/40 hover:text-white">←</button>
        <h2 className="text-xl font-black text-white">Hazte Premium</h2>
      </div>

      <Card style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.08))", border: "1px solid rgba(124,58,237,0.35)" }}>
        <div className="text-center py-2">
          <div className="text-4xl mb-3">👑</div>
          <div className="text-white font-black text-2xl mb-1">Plan Premium</div>
          <div className="text-white/40 text-sm mb-2">Desbloquea todo el poder de LIFEOS</div>
          <div className="text-4xl font-black text-white mb-1">7,99€<span className="text-lg text-white/40">/mes</span></div>
          <div className="text-white/30 text-xs">Cancela cuando quieras</div>
        </div>
      </Card>

      <Card>
        <Lbl>Todo lo que incluye</Lbl>
        <div className="space-y-2.5">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.3)" }}>
                <span className="text-violet-300 text-xs font-bold">✓</span>
              </div>
              <span className="text-white/70">{b}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        <GoldBtn color="linear-gradient(135deg, #7c3aed, #4f46e5)">✨ Empezar prueba gratuita 7 días</GoldBtn>
        <p className="text-white/20 text-xs text-center">Sin compromiso. Cancela cuando quieras.</p>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🆓</span>
          <div>
            <div className="text-white font-bold text-sm">Plan Gratuito actual</div>
            <div className="text-white/30 text-xs">Mentalidad, Finanzas, Entreno y Sueño incluidos</div>
          </div>
        </div>
      </Card>
    </div>
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
      <p className="text-white/30 text-xs mb-3">Activa solo los que quieres. Los marcados con 🔒 requieren plan Premium.</p>
      {ALL_MODULES.map(mod => {
        const on = d.modulos.includes(mod.id);
        return <button key={mod.id} onClick={() => toggleM(mod.id)} className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left active:scale-98"
          style={{ background: on ? mod.color + "15" : CARD, border: `1px solid ${on ? mod.color + "50" : BORDER}` }}>
          <span className="text-2xl">{mod.icon}</span>
          <div className="flex-1"><div className="text-white text-sm font-bold">{mod.label}</div><div className="text-white/30 text-xs">{mod.free ? "Gratis" : "🔒 Premium"}</div></div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: on ? mod.color : "rgba(255,255,255,0.08)" }}>{on && <span className="text-white text-xs font-bold">✓</span>}</div>
        </button>;
      })}
    </div>,
    <div key="s5" className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
        <p className="text-white/60 text-sm leading-relaxed">Esta info va a todos tus asistentes IA. Alergias, lesiones, condiciones médicas, restricciones...</p>
      </div>
      <textarea value={d.extra} onChange={e => u("extra", e.target.value)} placeholder="Ej: Soy celíaco, lesión en hombro, turno noche, ansiedad, vegano..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none h-40" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
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
function Dashboard({ user, profile, goTo, isPremium }) {
  const [frase, setFrase] = useState("Generando tu dosis diaria...");
  const hora = new Date().getHours();
  const sal = hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";
  const mods = ALL_MODULES.filter(m => profile.modulos?.includes(m.id));

  useEffect(() => {
    callAI(`Genera UNA frase motivacional corta y poderosa para ${profile.nombre}, ${profile.edad} años, objetivo: ${profile.objetivoFisico}. Máximo 2 líneas. Sin hashtags.`,
      [{ role: "user", content: "Frase del día." }]).then(setFrase).catch(() => setFrase("El único momento para empezar siempre fue ahora."));
  }, []);

  return (
    <div className="space-y-5">
      <div className="pt-1">
        <p className="text-white/30 text-sm">{sal} 👋</p>
        <h1 className="text-3xl font-black text-white">{profile.nombre}</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-white/20 text-xs">Tu sistema operativo de vida</p>
          {isPremium
            ? <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#7c3aed20", color: "#a78bfa" }}>👑 PREMIUM</span>
            : <button onClick={() => goTo("premium")} className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>✨ Upgrade</button>
          }
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.05))", border: "1px solid rgba(124,58,237,0.25)" }}>
        <div className="flex gap-3"><span className="text-xl">✨</span><p className="text-white/80 text-sm leading-relaxed italic flex-1">{frase}</p></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[["🎯", profile.objetivoFisico, "Objetivo"], ["💼", profile.trabajo, "Trabajo"], ["⏰", (profile.horario || "").split("(")[0].trim(), "Horario"], ["💰", `${profile.dinero}€`, "Ahorros"]].map(([ic, v, l]) => (
          <Card key={l} className="text-center"><div className="text-xl mb-1">{ic}</div><div className="text-white font-bold text-sm truncate">{v}</div><div className="text-white/25 text-xs mt-0.5">{l}</div></Card>
        ))}
      </div>

      <div>
        <Lbl>Tus módulos</Lbl>
        <div className="grid grid-cols-2 gap-3">
          {mods.map(mod => {
            const locked = !mod.free && !isPremium;
            return (
              <button key={mod.id} onClick={() => goTo(locked ? "premium" : mod.id)} className="p-4 rounded-2xl text-left transition-all active:scale-95 relative" style={{ background: mod.color + "10", border: `1px solid ${mod.color}25`, opacity: locked ? 0.6 : 1 }}>
                {locked && <div className="absolute top-2 right-2 text-xs">🔒</div>}
                <span className="text-2xl block mb-2">{mod.icon}</span>
                <div className="text-white font-bold text-sm">{mod.label}</div>
                <div className="text-white/30 text-xs mt-0.5">{mod.free ? "Gratis" : "Premium"}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({ user, profile, onSignOut, goTo, isPremium }) {
  return (
    <div className="space-y-4">
      <div className="py-1"><h2 className="text-xl font-black text-white">Ajustes</h2></div>

      <Card style={{ background: isPremium ? "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.05))" : CARD, border: isPremium ? "1px solid rgba(124,58,237,0.3)" : `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "rgba(124,58,237,0.2)" }}>{isPremium ? "👑" : "👤"}</div>
          <div className="flex-1">
            <div className="text-white font-bold">{profile.nombre}</div>
            <div className="text-white/30 text-xs">{user.email}</div>
            <div className="text-xs mt-0.5" style={{ color: isPremium ? "#a78bfa" : "#fbbf24" }}>{isPremium ? "Plan Premium" : "Plan Gratuito"}</div>
          </div>
        </div>
      </Card>

      {!isPremium && (
        <button onClick={() => goTo("premium")} className="w-full py-3.5 rounded-2xl font-bold text-sm text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
          ✨ Hazte Premium — 7,99€/mes
        </button>
      )}

      {isPremium && (
        <button onClick={() => goTo("premium")} className="w-full py-3.5 rounded-2xl font-bold text-sm" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}>
          👑 Gestionar suscripción
        </button>
      )}

      <Card>
        <Lbl>Tu perfil</Lbl>
        {[["Nombre", profile.nombre], ["Edad", `${profile.edad} años`], ["Cuerpo", `${profile.peso}kg · ${profile.altura}cm`], ["Objetivo", profile.objetivoFisico], ["Trabajo", profile.trabajo], ["Ahorros", `${profile.dinero}€`]].map(([k, v]) => (
          <div key={k} className="flex justify-between py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}><span className="text-white/30 text-sm">{k}</span><span className="text-white text-sm font-medium">{v}</span></div>
        ))}
      </Card>

      <Card>
        <Lbl>⚠️ Cuenta</Lbl>
        <button onClick={onSignOut} className="w-full py-3.5 rounded-2xl font-bold text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          Cerrar sesión
        </button>
      </Card>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function Nav({ active, goTo, mods }) {
  const items = [{ id: "dashboard", icon: "🏠", label: "Inicio", color: "#7c3aed" }, ...ALL_MODULES.filter(m => mods.includes(m.id))];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-6 pt-3 px-3" style={{ background: `linear-gradient(transparent, ${BG} 50%)` }}>
      <div className="flex items-center gap-0.5 rounded-2xl px-2 py-2 overflow-x-auto no-scrollbar" style={{ background: "rgba(12,12,22,0.98)", border: `1px solid ${BORDER}`, backdropFilter: "blur(20px)" }}>
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

// ─── SIMPLE MODULE WRAPPER (for modules without full implementation) ───────────
function SimpleModule({ moduleId, userId, user, isPremium, onUpgrade }) {
  const mod = ALL_MODULES.find(m => m.id === moduleId);
  const [notas, setNotas] = useCloudData(userId, `notas_${moduleId}`, "");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2></div></div>
      <Card>
        <Lbl>📝 Mis notas</Lbl>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Escribe aquí..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none h-36" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
      </Card>
      <NotasCarpetas userId={userId} storeKey={moduleId} color={mod.color} />
      <AIChat sp={buildSP(moduleId, user)} color={mod.color} name={mod.label} isPremium={isPremium} onUpgrade={onUpgrade} />
    </div>
  );
}

// ─── FINANZAS ─────────────────────────────────────────────────────────────────
function Finanzas({ userId, user, isPremium, onUpgrade }) {
  const mod = ALL_MODULES.find(m => m.id === "finanzas");
  const [dat, setDat] = useCloudData(userId, "finanzas_dat", { ingresos: 0, gastos: 0, ahorros: parseInt(user.dinero) || 0, inversiones: 0 });
  const [gastos, setGastos] = useCloudData(userId, "finanzas_gastos", []);
  const [ng, setNg] = useState({ desc: "", monto: "", cat: "Comida" });
  const [comp, setComp] = useState({ m: 200, y: 10, i: 7 });
  const [res, setRes] = useState(null);
  const cats = ["Comida", "Transporte", "Ocio", "Salud", "Educación", "Negocio", "Ropa", "Suscripciones", "Otro"];
  const catColors = { Comida: "#4ade80", Transporte: "#60a5fa", Ocio: "#f472b6", Salud: "#f97316", Educación: "#a78bfa", Negocio: "#fbbf24", Ropa: "#fb7185", Suscripciones: "#38bdf8", Otro: "#94a3b8" };

  const calcC = () => { const r = comp.i / 100 / 12; const n = comp.y * 12; setRes((comp.m * ((Math.pow(1 + r, n) - 1) / r)).toFixed(0)); };
  const totalGastos = (gastos || []).reduce((s, g) => s + parseFloat(g.monto || 0), 0);
  const addGasto = () => { if (ng.desc && ng.monto) { setGastos([{ ...ng, fecha: new Date().toLocaleDateString(), id: Date.now() }, ...(gastos || [])]); setNg({ desc: "", monto: "", cat: "Comida" }); } };
  const delGasto = id => setGastos((gastos || []).filter(g => g.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2><p className="text-white/30 text-xs">Control financiero</p></div></div>

      <div className="grid grid-cols-2 gap-3">
        {[{ l: "Ingresos/mes", k: "ingresos", c: "#34d399", i: "📈" }, { l: "Gastos fijos", k: "gastos", c: "#f87171", i: "📉" }, { l: "Ahorros", k: "ahorros", c: "#fbbf24", i: "🏦" }, { l: "Inversiones", k: "inversiones", c: "#60a5fa", i: "📊" }].map(f => (
          <Card key={f.k} className="text-center">
            <div>{f.i}</div>
            <div className="text-xl font-black mt-1" style={{ color: f.c }}>{(dat || {})[f.k] || 0}€</div>
            <div className="text-white/25 text-xs mb-1">{f.l}</div>
            <input type="number" value={(dat || {})[f.k] || 0} onChange={e => setDat({ ...(dat || {}), [f.k]: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg px-2 py-1 text-xs text-center text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          </Card>
        ))}
      </div>

      <Card>
        <Lbl>💳 Tracker de gastos</Lbl>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input value={ng.desc} onChange={e => setNg({ ...ng, desc: e.target.value })} onKeyDown={e => e.key === "Enter" && addGasto()} placeholder="Descripción" className="flex-1 min-w-20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          <input type="number" value={ng.monto} onChange={e => setNg({ ...ng, monto: e.target.value })} placeholder="€" className="w-16 rounded-xl px-2 py-2 text-sm text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          <select value={ng.cat} onChange={e => setNg({ ...ng, cat: e.target.value })} className="rounded-xl px-2 py-2 text-xs text-white" style={{ background: "#12121f", border: `1px solid ${BORDER}` }}>{cats.map(c => <option key={c}>{c}</option>)}</select>
          <button onClick={addGasto} className="rounded-xl px-4 py-2 font-bold text-white text-lg" style={{ background: mod.color }}>+</button>
        </div>
        {(gastos || []).length > 0 && (
          <>
            <div className="space-y-2 max-h-52 overflow-y-auto mb-3">
              {(gastos || []).map(g => (
                <div key={g.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColors[g.cat] || "#94a3b8" }} />
                  <div className="flex-1 min-w-0"><div className="text-white/80 text-sm truncate">{g.desc}</div><div className="text-white/25 text-xs">{g.cat} · {g.fecha}</div></div>
                  <span className="text-red-400 font-bold text-sm flex-shrink-0">-{g.monto}€</span>
                  <XBtn onClick={() => delGasto(g.id)} />
                </div>
              ))}
            </div>
            <div className="rounded-xl px-4 py-3 flex justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <span className="text-white/50 text-sm font-semibold">Total gastado</span>
              <span className="text-red-400 font-black text-lg">-{totalGastos.toFixed(2)}€</span>
            </div>
          </>
        )}
      </Card>

      <Card>
        <Lbl>📐 Interés compuesto</Lbl>
        {[{ l: "€/mes", k: "m" }, { l: "Años", k: "y" }, { l: "Interés %", k: "i" }].map(f => (
          <div key={f.k} className="flex items-center gap-3 mb-2">
            <span className="text-white/30 text-xs w-20">{f.l}</span>
            <input type="number" value={comp[f.k]} onChange={e => setComp({ ...comp, [f.k]: parseFloat(e.target.value) || 0 })} className="flex-1 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }} />
          </div>
        ))}
        <GoldBtn onClick={calcC} ghost>Calcular</GoldBtn>
        {res && <div className="mt-3 rounded-2xl p-4 text-center" style={{ background: mod.color + "15", border: `1px solid ${mod.color}40` }}>
          <div className="text-white/40 text-xs">En {comp.y} años tendrás</div>
          <div className="text-3xl font-black mt-1" style={{ color: mod.color }}>{parseInt(res).toLocaleString()}€</div>
        </div>}
      </Card>

      <AIChat sp={buildSP("finanzas", user)} color={mod.color} name={mod.label} isPremium={isPremium} onUpgrade={onUpgrade} />
    </div>
  );
}

// ─── MENTALIDAD ───────────────────────────────────────────────────────────────
function Mentalidad({ userId, user, isPremium, onUpgrade }) {
  const mod = ALL_MODULES.find(m => m.id === "habitos");
  const defH = { "📖 Leer 20 min": false, "💧 2L de agua": false, "🏃 Ejercicio hoy": false, "📵 Sin móvil por la mañana": false, "🙏 Gratitud": false };
  const [habits, setHabits] = useCloudData(userId, "hab_habits", defH);
  const [int, setInt] = useCloudData(userId, "hab_intencion", "");
  const [animo, setAnimo] = useCloudData(userId, "hab_animo", 7);

  const done = Object.values(habits || {}).filter(Boolean).length;
  const total = Object.keys(habits || {}).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-1"><span className="text-3xl">{mod.icon}</span><div><h2 className="text-xl font-black text-white">{mod.label}</h2></div></div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center"><div className="text-3xl font-black text-white">{done}/{total}</div><div className="text-white/30 text-xs mt-1">Hábitos hoy</div><ProgressBar value={done} max={total} color={mod.color} /></Card>
        <Card className="text-center"><div className="text-3xl font-black text-white">{animo}<span className="text-lg text-white/30">/10</span></div><div className="text-white/30 text-xs mt-1">Ánimo</div><input type="range" min="1" max="10" value={animo || 7} onChange={e => setAnimo(parseInt(e.target.value))} className="w-full mt-1" style={{ accentColor: mod.color }} /></Card>
      </div>
      <Card><Lbl>🎯 Intención del día</Lbl><Inp value={int || ""} onChange={e => setInt(e.target.value)} placeholder="Una cosa que marcará este día..." /></Card>
      <Card>
        <Lbl>Hábitos de hoy</Lbl>
        {Object.entries(habits || {}).map(([h, v]) => (
          <button key={h} onClick={() => setHabits({ ...(habits || {}), [h]: !v })} className="w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all text-left" style={{ background: v ? mod.color + "15" : "rgba(255,255,255,0.04)", border: `1px solid ${v ? mod.color + "40" : BORDER}` }}>
            <div className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: v ? mod.color : "rgba(255,255,255,0.1)" }}>{v && <span className="text-white text-xs font-bold">✓</span>}</div>
            <span className={`text-sm flex-1 ${v ? "line-through text-white/30" : "text-white"}`}>{h}</span>
          </button>
        ))}
      </Card>
      <AIChat sp={buildSP("habitos", user)} color={mod.color} name={mod.label} isPremium={isPremium} onUpgrade={onUpgrade} />
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function LifeOS() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isPremium = profile?.plan === "premium";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data && data.nombre) setProfile(data);
    else setShowOnboarding(true);
    setLoading(false);
  }

  async function handleOnboardingDone(data) {
    const profileData = {
      id: session.user.id,
      nombre: data.nombre, edad: parseInt(data.edad), sexo: data.sexo,
      peso: parseFloat(data.peso), altura: parseFloat(data.altura),
      objetivo_fisico: data.objetivoFisico, trabajo: data.trabajo,
      horario: data.horario, actividad: data.actividad,
      dinero: data.dinero, negocio: data.negocio,
      estudia: data.estudia, pareja: data.pareja,
      modulos: data.modulos, extra: data.extra, plan: "free",
    };
    await supabase.from("profiles").upsert(profileData);
    setProfile({ ...profileData, objetivoFisico: data.objetivoFisico });
    setShowOnboarding(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null); setProfile(null); setActive("dashboard");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
          <span className="text-white font-black text-2xl">L</span>
        </div>
        <div className="text-white/40 text-sm animate-pulse">Cargando LIFEOS...</div>
      </div>
    </div>
  );

  if (!session) return <AuthScreen onAuth={() => {}} />;
  if (showOnboarding) return <Onboarding onDone={handleOnboardingDone} />;
  if (!profile) return <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}><div className="text-white/40">Cargando perfil...</div></div>;

  // Normalize profile keys
  const userProfile = {
    ...profile,
    objetivoFisico: profile.objetivo_fisico || profile.objetivoFisico || "Ganar músculo",
    modulos: profile.modulos || [],
  };

  const goTo = (id) => setActive(id);

  const renderModule = () => {
    const commonProps = { userId: session.user.id, user: userProfile, isPremium, onUpgrade: () => goTo("premium") };
    switch (active) {
      case "dashboard": return <Dashboard user={session.user} profile={userProfile} goTo={goTo} isPremium={isPremium} />;
      case "settings": return <Settings user={session.user} profile={userProfile} onSignOut={handleSignOut} goTo={goTo} isPremium={isPremium} />;
      case "premium": return <PremiumScreen user={session.user} onBack={() => goTo("dashboard")} isPremium={isPremium} />;
      case "habitos": return <Mentalidad {...commonProps} />;
      case "finanzas": return <Finanzas {...commonProps} />;
      default: return <SimpleModule moduleId={active} {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif" }}>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      <div className="h-14" />
      <div className="flex items-center justify-between px-5 mb-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => goTo("dashboard")}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}><span className="text-white font-black text-xs">L</span></div>
          <span className="text-white font-black tracking-widest text-xs">LIFEOS</span>
        </div>
        <button onClick={() => goTo("settings")} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}><span className="text-sm">⚙️</span></button>
      </div>
      <div className="px-5 pb-44">{renderModule()}</div>
      <Nav active={active} goTo={goTo} mods={userProfile.modulos || []} />
    </div>
  );
}
