import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const TURNOS = ["Mañana", "Tarde", "Noche"];
const TURNO_HORARIOS = {
  "Mañana": "05:45 – 13:45",
  "Tarde": "13:45 – 21:45",
  "Noche": "21:45 – 05:45",
};
const TURNO_COLORS = {
  "Mañana": "#f59e0b",
  "Tarde": "#f97316",
  "Noche": "#8b5cf6",
};

const MODULES = [
  { id: "dashboard", icon: "🏠", label: "Dashboard" },
  { id: "negocio", icon: "💼", label: "Negocio" },
  { id: "lectura", icon: "📚", label: "Lectura" },
  { id: "dieta", icon: "🥗", label: "Dieta" },
  { id: "sueno", icon: "😴", label: "Sueño" },
  { id: "pareja", icon: "💑", label: "Pareja" },
  { id: "finanzas", icon: "💰", label: "Finanzas" },
  { id: "entreno", icon: "💪", label: "Entreno" },
  { id: "mentalidad", icon: "🧠", label: "Mentalidad" },
];

const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function useLocalStorage(key, defaultVal) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : defaultVal; }
    catch { return defaultVal; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(val)); }, [key, val]);
  return [val, setVal];
}

async function callClaude(systemPrompt, messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "Error al conectar con la IA.";
}

function GoldButton({ onClick, children, className = "", disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
        bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-900
        hover:from-amber-400 hover:to-yellow-300 hover:shadow-lg hover:shadow-amber-500/25
        disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-xl font-bold text-amber-400 mb-4 tracking-wide">{children}</h2>;
}

// ─── AI CHAT COMPONENT ───────────────────────────────────────────────────────
function AIChat({ systemPrompt, placeholder, title }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const reply = await callClaude(systemPrompt, newMsgs);
      setMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch { setMessages([...newMsgs, { role: "assistant", content: "Error de conexión. Verifica tu API key." }]); }
    setLoading(false);
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-amber-400 font-bold text-sm uppercase tracking-widest">{title}</span>
      </div>
      <div className="h-64 overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.length === 0 && (
          <p className="text-zinc-500 text-sm italic text-center mt-8">{placeholder}</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-2 text-sm leading-relaxed
              ${m.role === "user"
                ? "bg-amber-500/20 border border-amber-500/30 text-amber-100"
                : "bg-zinc-800 border border-zinc-700 text-zinc-200"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2">
              <span className="text-amber-400 animate-pulse text-sm">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Escribe tu pregunta..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200
            placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
        <GoldButton onClick={send} disabled={loading}>Enviar</GoldButton>
      </div>
    </Card>
  );
}

// ─── MODULE 1: DASHBOARD ──────────────────────────────────────────────────────
function Dashboard({ turno, userName, habits, calories, sleep }) {
  const [frase, setFrase] = useState("");
  const [loadingFrase, setLoadingFrase] = useState(false);
  const [nivelVida, setNivelVida] = useState(0);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";

  useEffect(() => {
    const completedHabits = Object.values(habits).filter(Boolean).length;
    const totalHabits = Object.keys(habits).length || 1;
    const habitScore = (completedHabits / totalHabits) * 40;
    const calScore = Math.min((calories / 3200) * 30, 30);
    const sleepScore = Math.min((sleep / 10) * 30, 30);
    setNivelVida(Math.round(habitScore + calScore + sleepScore));
  }, [habits, calories, sleep]);

  async function generarFrase() {
    setLoadingFrase(true);
    try {
      const r = await callClaude(
        "Eres un coach de mentalidad de élite. Genera UNA frase motivacional ultra-potente, original y concreta para un joven de 20 años que está construyendo un negocio de coches desde cero, trabajando turnos rotativos y luchando por su futuro. Máximo 2 líneas. Sin hashtags ni emojis excesivos.",
        [{ role: "user", content: "Dame la frase motivacional de hoy." }]
      );
      setFrase(r);
    } catch { setFrase("El éxito no es un accidente. Es trabajo, perseverancia y aprendizaje constante."); }
    setLoadingFrase(false);
  }

  useEffect(() => { generarFrase(); }, []);

  const completedHabits = Object.values(habits).filter(Boolean).length;
  const totalHabits = Object.keys(habits).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            {saludo}{userName ? `, ${userName}` : ""} 👋
          </h1>
          <p className="text-zinc-400 mt-1 text-lg">Tu sistema de vida personal</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-black text-amber-400">{nivelVida}</div>
          <div className="text-zinc-500 text-xs uppercase tracking-widest">Nivel de vida</div>
          <div className="w-32 h-2 bg-zinc-800 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-500"
              style={{ width: `${nivelVida}%` }}
            />
          </div>
        </div>
      </div>

      {/* Turno activo */}
      <Card className="border-l-4" style={{ borderLeftColor: TURNO_COLORS[turno] }}>
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {turno === "Mañana" ? "🌅" : turno === "Tarde" ? "🌆" : "🌙"}
          </div>
          <div>
            <div className="text-zinc-400 text-sm uppercase tracking-widest">Turno activo</div>
            <div className="text-white text-2xl font-bold">{turno}</div>
            <div className="text-zinc-400 text-sm">{TURNO_HORARIOS[turno]}</div>
          </div>
        </div>
      </Card>

      {/* Grid resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Calorías hoy", value: `${calories} kcal`, icon: "🔥", target: "3.200 kcal" },
          { label: "Hábitos", value: `${completedHabits}/${totalHabits}`, icon: "✅", target: "completados" },
          { label: "Sueño anoche", value: `${sleep}/10`, icon: "😴", target: "calidad" },
          { label: "Negocio", value: "En marcha", icon: "💼", target: "Etapa inicial" },
        ].map((item, i) => (
          <Card key={i} className="text-center">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-white font-bold text-lg">{item.value}</div>
            <div className="text-zinc-500 text-xs mt-1">{item.label}</div>
            <div className="text-amber-500 text-xs mt-1">{item.target}</div>
          </Card>
        ))}
      </div>

      {/* Frase motivacional */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-amber-500/30">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="text-amber-400 text-xs uppercase tracking-widest mb-3">💡 Frase del día</div>
            <p className="text-white text-lg font-medium leading-relaxed italic">
              {loadingFrase ? "Generando tu dosis de motivación..." : frase || "Cargando..."}
            </p>
          </div>
          <button onClick={generarFrase} className="text-zinc-500 hover:text-amber-400 transition-colors text-xl mt-1">↻</button>
        </div>
      </Card>
    </div>
  );
}

// ─── MODULE 2: NEGOCIO ────────────────────────────────────────────────────────
function Negocio() {
  const [operaciones, setOperaciones] = useLocalStorage("mp_operaciones", []);
  const [notas, setNotas] = useLocalStorage("mp_notas_negocio", "");
  const [form, setForm] = useState({ modelo: "", precioCompra: "", gastos: "", precioVenta: "" });
  const [checklistDE, setChecklistDE] = useLocalStorage("mp_checklist_negocio", {});

  const checklist = [
    "Darse de alta como autónomo",
    "Contratar gestoría especializada en importaciones",
    "Obtener NIF intracomunitario",
    "Registrarse en mobile.de y AutoScout24.de",
    "Investigar subastas BCA y ADESA Alemania",
    "Calcular costes de transporte DE→ES (~500-800€)",
    "Estudiar proceso ITV española para importados",
    "Calcular impuesto de matriculación (varía por emisiones)",
    "Abrir cuenta bancaria separada para el negocio",
    "Crear perfiles en Wallapop, Coches.net, Milanuncios",
    "Definir rango de precio objetivo (3.000-8.000€ compra)",
    "Establecer margen mínimo por operación (1.500-2.000€)",
  ];

  function addOp() {
    if (!form.modelo) return;
    const beneficio = (parseFloat(form.precioVenta) || 0) - (parseFloat(form.precioCompra) || 0) - (parseFloat(form.gastos) || 0);
    setOperaciones([...operaciones, { ...form, beneficio, id: Date.now(), fecha: new Date().toLocaleDateString() }]);
    setForm({ modelo: "", precioCompra: "", gastos: "", precioVenta: "" });
  }

  const totalBeneficio = operaciones.reduce((s, o) => s + (o.beneficio || 0), 0);

  const SP = `Eres el mayor experto mundial en importación y compraventa de vehículos entre Alemania y España. Tienes 25 años de experiencia en el sector, conoces perfectamente los trámites de importación, los mejores portales de subastas alemanes (mobile.de, autoscout24.de, BCA, ADESA), las homologaciones, el impuesto de matriculación español, y las estrategias de venta online. Tu usuario tiene 20 años, acaba de empezar y tiene 2.000€. Das consejos extremadamente concretos, con números reales, pasos específicos y sin rodeos. Nunca das respuestas genéricas.`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl">💼</span>
        <div>
          <h1 className="text-3xl font-black text-white">Negocio de Coches</h1>
          <p className="text-zinc-400">Importación DE → ES · Etapa inicial</p>
        </div>
      </div>

      {/* Checklist */}
      <Card>
        <SectionTitle>📋 Checklist de Arranque</SectionTitle>
        <div className="grid md:grid-cols-2 gap-2">
          {checklist.map((item, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer group p-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <input
                type="checkbox"
                checked={!!checklistDE[i]}
                onChange={() => setChecklistDE({ ...checklistDE, [i]: !checklistDE[i] })}
                className="mt-0.5 accent-amber-500 w-4 h-4 flex-shrink-0"
              />
              <span className={`text-sm ${checklistDE[i] ? "line-through text-zinc-600" : "text-zinc-300"}`}>{item}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 text-amber-400 text-sm font-semibold">
          ✅ {Object.values(checklistDE).filter(Boolean).length}/{checklist.length} completados
        </div>
      </Card>

      {/* Tracker de operaciones */}
      <Card>
        <SectionTitle>📊 Tracker de Operaciones</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { placeholder: "Modelo del coche", key: "modelo" },
            { placeholder: "Precio compra (€)", key: "precioCompra", type: "number" },
            { placeholder: "Gastos totales (€)", key: "gastos", type: "number" },
            { placeholder: "Precio venta (€)", key: "precioVenta", type: "number" },
          ].map(f => (
            <input
              key={f.key}
              type={f.type || "text"}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white
                placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          ))}
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-zinc-400 text-sm">
            Beneficio estimado: <span className="text-amber-400 font-bold text-lg">
              {((parseFloat(form.precioVenta) || 0) - (parseFloat(form.precioCompra) || 0) - (parseFloat(form.gastos) || 0)).toFixed(0)}€
            </span>
          </div>
          <GoldButton onClick={addOp}>+ Añadir operación</GoldButton>
        </div>

        {operaciones.length > 0 ? (
          <div className="space-y-2">
            {operaciones.map(op => (
              <div key={op.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                <div>
                  <span className="text-white font-semibold">{op.modelo}</span>
                  <span className="text-zinc-500 text-xs ml-3">{op.fecha}</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <span className="text-zinc-400">Compra: <span className="text-white">{op.precioCompra}€</span></span>
                  <span className="text-zinc-400">Gastos: <span className="text-white">{op.gastos}€</span></span>
                  <span className="text-zinc-400">Venta: <span className="text-white">{op.precioVenta}€</span></span>
                  <span className={`font-bold ${op.beneficio >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {op.beneficio >= 0 ? "+" : ""}{op.beneficio}€
                  </span>
                </div>
              </div>
            ))}
            <div className="text-right text-lg font-bold mt-2">
              Beneficio total: <span className={totalBeneficio >= 0 ? "text-green-400" : "text-red-400"}>{totalBeneficio.toFixed(0)}€</span>
            </div>
          </div>
        ) : (
          <p className="text-zinc-600 text-sm italic text-center py-4">Sin operaciones registradas aún. ¡Tu primer coche está por llegar!</p>
        )}
      </Card>

      {/* Notas */}
      <Card>
        <SectionTitle>📝 Notas estratégicas</SectionTitle>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="Ideas, contactos, estrategias, oportunidades..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-sm text-zinc-200
            placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none h-32"
        />
      </Card>

      <AIChat
        systemPrompt={SP}
        placeholder="Pregúntame sobre: trámites de importación, dónde comprar en Alemania, cómo negociar precios, qué coches tienen mejor margen..."
        title="🤖 Mentor de Negocio — Experto DE→ES"
      />
    </div>
  );
}

// ─── MODULE 3: LECTURA ────────────────────────────────────────────────────────
function Lectura() {
  const [progreso, setProgreso] = useLocalStorage("mp_lectura_progreso", { piensa: 0, negociar: 0 });
  const [notas, setNotas] = useLocalStorage("mp_lectura_notas", { piensa: "", negociar: "" });

  const libros = [
    {
      key: "piensa",
      titulo: "Piense y Hágase Rico",
      autor: "Napoleon Hill",
      cover: "📕",
      conceptos: [
        { nombre: "El Deseo", aplicacion: "Define exactamente cuánto quieres ganar con los coches este año. Escríbelo. Ponle fecha. Eso activa tu subconsciente." },
        { nombre: "La Fe (autosugestión)", aplicacion: "Repite cada mañana: 'Soy un experto en importación de coches. Genero beneficios reales.' Tu cerebro lo creará." },
        { nombre: "Conocimiento especializado", aplicacion: "Aprende ITV, impuesto matriculación, mobile.de. El conocimiento específico del sector es tu ventaja competitiva." },
        { nombre: "El Subconsciente", aplicacion: "Visualiza cada noche que cierras una operación de +2.000€. Programa tu mente para detectar oportunidades." },
        { nombre: "El Cerebro como transmisor", aplicacion: "Rodéate de personas del sector: foros de importadores, grupos de Telegram, vendedores veteranos." },
      ],
    },
    {
      key: "negociar",
      titulo: "Negociar lo Imposible",
      autor: "Deepak Malhotra",
      cover: "📘",
      conceptos: [
        { nombre: "Poder de las alternativas (BATNA)", aplicacion: "Cuando negocies en Alemania, tener 3-4 coches en vista hace que no necesites ese coche específico. Eso te da poder." },
        { nombre: "El proceso importa", aplicacion: "En las subastas alemanas, llega antes, habla con el subastador, crea relación. El proceso crea ventajas." },
        { nombre: "Framing (encuadre)", aplicacion: "Al vender en España, presenta el coche como 'importado directamente de Alemania por mí' — diferencia del concesionario." },
        { nombre: "Legitimidad", aplicacion: "Usa datos reales: 'Este modelo vale X en AutoScout24.de'. La legitimidad desactiva la resistencia del comprador." },
        { nombre: "Creatividad en las soluciones", aplicacion: "Si el comprador no llega a tu precio, ofrece: 'Te incluyo la ITV pasada y la garantía de 3 meses'. Valor sin bajar precio." },
      ],
    },
  ];

  const SP = `Eres el mayor experto mundial en los libros 'Piense y Hágase Rico' y 'Negociar lo Imposible', y en desarrollo personal aplicado a emprendedores jóvenes. Cuando el usuario te hace preguntas, conectas directamente los conceptos de los libros con su situación real: montar un negocio de coches, negociar compras en Alemania, cerrar ventas en España. Siempre das ejemplos prácticos y concretos. Nunca eres vago.`;

  const podcasts = [
    { nombre: "Negocios en Coches", tipo: "🎙️ Podcast", desc: "Comunidad española de compraventa de vehículos" },
    { nombre: "My First Million", tipo: "🎙️ Podcast", desc: "Ideas de negocio y mentalidad emprendedora" },
    { nombre: "The Importers", tipo: "📺 YouTube", desc: "Importación de coches europeos" },
    { nombre: "Scalable", tipo: "🎙️ Podcast", desc: "Negocios escalables desde cero" },
    { nombre: "r/personalfinance ES", tipo: "💬 Reddit", desc: "Finanzas personales en español" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl">📚</span>
        <div>
          <h1 className="text-3xl font-black text-white">Lectura & Formación</h1>
          <p className="text-zinc-400">Tu biblioteca personal</p>
        </div>
      </div>

      {libros.map(libro => (
        <Card key={libro.key}>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{libro.cover}</span>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">{libro.titulo}</h3>
              <p className="text-zinc-400 text-sm">{libro.autor}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all"
                    style={{ width: `${progreso[libro.key]}%` }}
                  />
                </div>
                <span className="text-amber-400 text-sm font-bold">{progreso[libro.key]}%</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={progreso[libro.key]}
                onChange={e => setProgreso({ ...progreso, [libro.key]: parseInt(e.target.value) })}
                className="w-full mt-1 accent-amber-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-amber-400 font-semibold text-sm mb-2 uppercase tracking-wider">5 Conceptos Clave → Tu Vida Real</h4>
            <div className="space-y-2">
              {libro.conceptos.map((c, i) => (
                <div key={i} className="bg-zinc-800 rounded-lg p-3">
                  <span className="text-amber-300 font-semibold text-sm">{c.nombre}: </span>
                  <span className="text-zinc-300 text-sm">{c.aplicacion}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-amber-400 font-semibold text-sm mb-2 uppercase tracking-wider">Mis notas</h4>
            <textarea
              value={notas[libro.key]}
              onChange={e => setNotas({ ...notas, [libro.key]: e.target.value })}
              placeholder={`Tus reflexiones sobre ${libro.titulo}...`}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200
                placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none h-24"
            />
          </div>
        </Card>
      ))}

      <Card>
        <SectionTitle>🎧 Recursos recomendados</SectionTitle>
        <div className="grid md:grid-cols-2 gap-3">
          {podcasts.map((p, i) => (
            <div key={i} className="bg-zinc-800 rounded-lg p-3 flex items-start gap-3">
              <span className="text-xl">{p.tipo.split(" ")[0]}</span>
              <div>
                <div className="text-white font-semibold text-sm">{p.nombre}</div>
                <div className="text-zinc-500 text-xs">{p.tipo.split(" ").slice(1).join(" ")} · {p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <AIChat
        systemPrompt={SP}
        placeholder="Pregúntame cómo aplicar los conceptos del libro a tu negocio de coches, a negociar en subastas alemanas, o a tu vida..."
        title="🤖 Tutor Experto en Libros"
      />
    </div>
  );
}

// ─── MODULE 4: DIETA ──────────────────────────────────────────────────────────
function Dieta({ turno }) {
  const [calories, setCalories] = useLocalStorage("mp_calories_today", 0);
  const [protein, setProtein] = useLocalStorage("mp_protein_today", 0);
  const [addCal, setAddCal] = useState("");
  const [addProt, setAddProt] = useState("");

  const planes = {
    Mañana: [
      { hora: "05:15", comida: "Pre-turno", items: ["3 huevos revueltos (200 kcal, 18g P)", "2 tostadas con mantequilla de cacahuete (350 kcal, 15g P)", "1 plátano (90 kcal, 1g P)"], total: "640 kcal · 34g proteína" },
      { hora: "09:00", comida: "Mid-turno (si puedes)", items: ["Bocadillo de atún con pan integral (400 kcal, 28g P)", "Barrita de proteína (200 kcal, 20g P)"], total: "600 kcal · 48g proteína" },
      { hora: "14:00", comida: "Post-turno — COMIDA GRANDE", items: ["200g arroz blanco cocido (260 kcal, 5g P)", "200g pechuga de pollo a la plancha (220 kcal, 44g P)", "Aguacate entero (240 kcal, 3g P)", "Aceite de oliva + verduras (150 kcal)"], total: "870 kcal · 52g proteína" },
      { hora: "17:00", comida: "Merienda", items: ["500ml leche entera + 40g proteína whey (480 kcal, 55g P)", "1 puñado de frutos secos (180 kcal, 5g P)"], total: "660 kcal · 60g proteína" },
      { hora: "20:00", comida: "Cena", items: ["150g salmón al horno (290 kcal, 36g P)", "150g patata cocida (120 kcal, 3g P)", "Ensalada con aceite (100 kcal)"], total: "510 kcal · 39g proteína" },
    ],
    Tarde: [
      { hora: "09:00", comida: "Desayuno fuerte", items: ["4 huevos + 2 tostadas (480 kcal, 36g P)", "Batido: 500ml leche + 40g whey + plátano (480 kcal, 50g P)"], total: "960 kcal · 86g proteína" },
      { hora: "13:00", comida: "Almuerzo pre-turno", items: ["200g pechuga + 200g arroz + verduras (590 kcal, 53g P)", "1 fruta + frutos secos (250 kcal, 5g P)"], total: "840 kcal · 58g proteína" },
      { hora: "18:30", comida: "Durante turno", items: ["Bocadillo de atún grande (400 kcal, 28g P)", "Barrita proteína (200 kcal, 20g P)"], total: "600 kcal · 48g proteína" },
      { hora: "22:00", comida: "Cena post-turno — RECUPERACIÓN", items: ["200g carne picada (400 kcal, 44g P)", "150g arroz + verduras (220 kcal, 5g P)", "1 vaso leche (120 kcal, 6g P)"], total: "740 kcal · 55g proteína" },
      { hora: "23:30", comida: "Snack antes de dormir", items: ["200g requesón/queso cottage (140 kcal, 22g P)", "1 cucharada de mantequilla de cacahuete (95 kcal, 4g P)"], total: "235 kcal · 26g proteína" },
    ],
    Noche: [
      { hora: "21:00", comida: "Pre-turno (cena energética)", items: ["300g pasta con atún (600 kcal, 45g P)", "Aceite de oliva + queso parmesano (150 kcal, 5g P)"], total: "750 kcal · 50g proteína" },
      { hora: "00:00", comida: "Mid-noche", items: ["Bocadillo de tortilla francesa (350 kcal, 20g P)", "Barrita energética (200 kcal, 10g P)"], total: "550 kcal · 30g proteína" },
      { hora: "03:00", comida: "Segunda toma nocturna", items: ["Batido proteína + leche entera (380 kcal, 45g P)", "Plátano + frutos secos (250 kcal, 6g P)"], total: "630 kcal · 51g proteína" },
      { hora: "06:00", comida: "Post-turno (antes de dormir)", items: ["200g requesón con miel (220 kcal, 28g P)", "Tostadas con mantequilla (300 kcal, 5g P)"], total: "520 kcal · 33g proteína" },
      { hora: "14:00", comida: "Desayuno post-sueño", items: ["4 huevos + 200g arroz + aguacate (780 kcal, 48g P)", "Batido proteína (380 kcal, 45g P)"], total: "1160 kcal · 93g proteína" },
    ],
  };

  const SP = `Eres el mejor nutricionista deportivo del mundo, especializado en jóvenes delgados que quieren ganar masa muscular lo más rápido posible. Tu paciente tiene 58kg, 171cm y 20 años, trabaja en turnos rotativos y entrena en casa. Das planes de alimentación extremadamente concretos con gramos exactos, marcas de supermercado si hace falta, y estrategias para comer suficiente incluso sin apetito. Nunca das respuestas genéricas ni vagos 'come más proteína'.`;

  const planActual = planes[turno];
  const calMeta = 3200;
  const protMeta = 120;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl">🥗</span>
        <div>
          <h1 className="text-3xl font-black text-white">Dieta — Superávit</h1>
          <p className="text-zinc-400">Plan para turno {turno} · Meta: {calMeta} kcal/día · {protMeta}g proteína</p>
        </div>
      </div>

      {/* Tracker */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="text-zinc-400 text-sm mb-1">🔥 Calorías hoy</div>
          <div className="text-3xl font-black text-white">{calories} <span className="text-zinc-500 text-lg">/ {calMeta}</span></div>
          <div className="h-2 bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all" style={{ width: `${Math.min((calories / calMeta) * 100, 100)}%` }} />
          </div>
          <div className="flex gap-2 mt-3">
            <input type="number" placeholder="+ kcal" value={addCal} onChange={e => setAddCal(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
            <GoldButton onClick={() => { setCalories(calories + parseInt(addCal || 0)); setAddCal(""); }}>+</GoldButton>
          </div>
        </Card>
        <Card>
          <div className="text-zinc-400 text-sm mb-1">💪 Proteína hoy</div>
          <div className="text-3xl font-black text-white">{protein}g <span className="text-zinc-500 text-lg">/ {protMeta}g</span></div>
          <div className="h-2 bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-300 rounded-full transition-all" style={{ width: `${Math.min((protein / protMeta) * 100, 100)}%` }} />
          </div>
          <div className="flex gap-2 mt-3">
            <input type="number" placeholder="+ gramos" value={addProt} onChange={e => setAddProt(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
            <GoldButton onClick={() => { setProtein(protein + parseInt(addProt || 0)); setAddProt(""); }}>+</GoldButton>
          </div>
        </Card>
      </div>

      {/* Plan del día */}
      <Card>
        <SectionTitle>🕐 Plan de comidas — Turno {turno}</SectionTitle>
        <div className="space-y-3">
          {planActual.map((comida, i) => (
            <div key={i} className="bg-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-bold text-sm w-12">{comida.hora}</span>
                  <span className="text-white font-semibold">{comida.comida}</span>
                </div>
                <span className="text-amber-400 text-xs font-semibold">{comida.total}</span>
              </div>
              <ul className="space-y-1 ml-15">
                {comida.items.map((item, j) => (
                  <li key={j} className="text-zinc-400 text-sm flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">·</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <AIChat
        systemPrompt={SP}
        placeholder="Pregúntame sobre: cómo ganar peso rápido, qué comer antes/después de entrenar, snacks calóricos fáciles, suplementos..."
        title="🤖 Nutricionista Deportivo Experto"
      />
    </div>
  );
}

// ─── MODULE 5: SUEÑO ──────────────────────────────────────────────────────────
function Sueno({ turno }) {
  const [horaDormir, setHoraDormir] = useState("22:00");
  const [ciclos, setCiclos] = useState([]);
  const [sleepLog, setSleepLog] = useLocalStorage("mp_sleep_log", []);
  const [qualityInput, setQualityInput] = useState({ calidad: 7, horas: 7.5, notas: "" });

  function calcularCiclos() {
    const [h, m] = horaDormir.split(":").map(Number);
    const base = h * 60 + m + 14; // 14 min para dormirse
    const opts = [3, 4, 5, 6].map(ciclo => {
      const total = base + ciclo * 90;
      const wh = Math.floor(total / 60) % 24;
      const wm = total % 60;
      return { ciclos: ciclo, horas: (ciclo * 90 / 60).toFixed(1), tiempo: `${wh.toString().padStart(2, "0")}:${wm.toString().padStart(2, "0")}` };
    });
    setCiclos(opts);
  }

  function addSleepLog() {
    setSleepLog([...sleepLog.slice(-29), { ...qualityInput, fecha: new Date().toLocaleDateString(), id: Date.now() }]);
    setQualityInput({ calidad: 7, horas: 7.5, notas: "" });
  }

  const rutinas = {
    Mañana: {
      pre: ["22:00 — Apaga pantallas", "22:05 — Habitación a 18-20°C", "22:10 — Ducha tibia", "22:20 — Melatonina 0.5mg (si necesitas)", "22:30 — Leer libro físico 10 min", "22:40 — Respiración 4-7-8 y ojos cerrados"],
      post: ["05:15 — Alarma (sin snooze)", "05:17 — Luz brillante inmediata (ventana/lámpara)", "05:20 — 500ml agua fría", "05:25 — 5 min de movimiento ligero", "05:30 — Desayuno preparado la noche anterior", "05:40 — Turno listo"],
    },
    Tarde: {
      pre: ["00:00 — Pantallas OFF", "00:05 — Gafas de luz azul si no puedes evitar el móvil", "00:15 — Ducha templada", "00:25 — Melatonina si tardas en dormir", "00:30 — Respiración profunda"],
      post: ["08:00 — Alarma", "08:05 — Luz solar directa 10 min (balcón/ventana)", "08:15 — Agua + cafeína", "08:25 — Repaso rápido del plan del día", "08:30 — Desayuno calórico"],
    },
    Noche: {
      pre: ["07:00 — Llega a casa, blackout curtains CERRADAS", "07:05 — Tapones de oídos + antifaz", "07:10 — Melatonina 1mg (turno noche requiere más)", "07:15 — No comer pesado — solo snack ligero", "07:20 — Avisar a familia/pareja de no molestar"],
      post: ["14:30 — Alarma gradual (no brusca)", "14:35 — Luz brillante artificial inmediata", "14:45 — Comida calórica grande", "15:00 — 10 min de sol si es posible", "15:15 — Cafeína (última toma antes del turno)"],
    },
  };

  const rutina = rutinas[turno];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl">😴</span>
        <div>
          <h1 className="text-3xl font-black text-white">Sueño & Recuperación</h1>
          <p className="text-zinc-400">Optimizado para turno {turno}</p>
        </div>
      </div>

      {/* Calculadora */}
      <Card>
        <SectionTitle>⏰ Calculadora de ciclos (90 min)</SectionTitle>
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Me duermo a las:</label>
            <input type="time" value={horaDormir} onChange={e => setHoraDormir(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
          </div>
          <GoldButton onClick={calcularCiclos} className="mt-5">Calcular</GoldButton>
        </div>
        {ciclos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {ciclos.map(c => (
              <div key={c.ciclos} className={`rounded-xl p-4 text-center border ${c.ciclos === 5 ? "border-amber-500 bg-amber-500/10" : "border-zinc-700 bg-zinc-800"}`}>
                <div className="text-2xl font-black text-white">{c.tiempo}</div>
                <div className="text-amber-400 text-sm font-semibold mt-1">{c.horas}h · {c.ciclos} ciclos</div>
                {c.ciclos === 5 && <div className="text-xs text-amber-400 mt-1">⭐ Óptimo</div>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Rutinas */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>🌙 Rutina pre-sueño</SectionTitle>
          <ul className="space-y-2">
            {rutina.pre.map((item, i) => (
              <li key={i} className="text-zinc-300 text-sm flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 text-xs">●</span>{item}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionTitle>☀️ Rutina post-despertar</SectionTitle>
          <ul className="space-y-2">
            {rutina.post.map((item, i) => (
              <li key={i} className="text-zinc-300 text-sm flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 text-xs">●</span>{item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Tracker */}
      <Card>
        <SectionTitle>📊 Registrar sueño de anoche</SectionTitle>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-zinc-400 text-sm">Horas dormidas</label>
            <input type="number" step="0.5" min="0" max="12" value={qualityInput.horas}
              onChange={e => setQualityInput({ ...qualityInput, horas: parseFloat(e.target.value) })}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm">Calidad (1-10)</label>
            <input type="range" min="1" max="10" value={qualityInput.calidad}
              onChange={e => setQualityInput({ ...qualityInput, calidad: parseInt(e.target.value) })}
              className="w-full mt-2 accent-amber-500" />
            <div className="text-amber-400 text-center font-bold">{qualityInput.calidad}/10</div>
          </div>
          <div>
            <label className="text-zinc-400 text-sm">Notas</label>
            <input value={qualityInput.notas} onChange={e => setQualityInput({ ...qualityInput, notas: e.target.value })}
              placeholder="Cómo te sientes..."
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
          </div>
        </div>
        <GoldButton onClick={addSleepLog} className="mt-4">Guardar registro</GoldButton>
      </Card>

      {sleepLog.length > 1 && (
        <Card>
          <SectionTitle>📈 Historial de sueño</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sleepLog.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="fecha" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", color: "#fff" }} />
              <Line type="monotone" dataKey="calidad" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b" }} name="Calidad" />
              <Line type="monotone" dataKey="horas" stroke="#60a5fa" strokeWidth={2} dot={{ fill: "#60a5fa" }} name="Horas" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

// ─── MODULE 6: PAREJA ─────────────────────────────────────────────────────────
function Pareja() {
  const [diario, setDiario] = useLocalStorage("mp_pareja_diario", []);
  const [tracker, setTracker] = useLocalStorage("mp_pareja_tracker", []);
  const [nuevaEntrada, setNuevaEntrada] = useState("");
  const [semana, setSemana] = useState({ comunicacion: 5, calidad: 5, intimidad: 5, conflictos: 5, conexion: 5 });

  function addEntrada() {
    if (!nuevaEntrada.trim()) return;
    setDiario([{ texto: nuevaEntrada, fecha: new Date().toLocaleDateString(), id: Date.now() }, ...diario.slice(0, 29)]);
    setNuevaEntrada("");
  }

  function saveWeek() {
    setTracker([...tracker.slice(-11), { ...semana, semana: new Date().toLocaleDateString(), id: Date.now() }]);
  }

  const SP = `Eres el mejor terapeuta de pareja y sexólogo del mundo, con décadas de experiencia tratando parejas jóvenes con problemas de comunicación y vida íntima deteriorada. Tu usuario tiene 20 años y su relación sufre discusiones frecuentes y una vida sexual prácticamente inexistente, lo que genera un círculo vicioso de tensión. Tu enfoque es directo, empático pero sin rodeos. Das estrategias concretas y accionables para mejorar la comunicación, reducir conflictos y revitalizar la conexión íntima. Nunca juzgas, siempre propones soluciones reales.`;

  const areas = [
    { key: "comunicacion", label: "Comunicación", icon: "💬" },
    { key: "calidad", label: "Tiempo de calidad", icon: "⏰" },
    { key: "intimidad", label: "Intimidad física", icon: "❤️" },
    { key: "conflictos", label: "Gestión de conflictos", icon: "🤝" },
    { key: "conexion", label: "Conexión emocional", icon: "🔗" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl">💑</span>
        <div>
          <h1 className="text-3xl font-black text-white">Relación de Pareja</h1>
          <p className="text-zinc-400">Diario, tracker y estrategias</p>
        </div>
      </div>

      {/* Tracker semanal */}
      <Card>
        <SectionTitle>📊 Estado de la relación esta semana</SectionTitle>
        <div className="space-y-3">
          {areas.map(area => (
            <div key={area.key} className="flex items-center gap-4">
              <span className="text-lg w-6">{area.icon}</span>
              <span className="text-zinc-300 text-sm w-40">{area.label}</span>
              <input type="range" min="1" max="10" value={semana[area.key]}
                onChange={e => setSemana({ ...semana, [area.key]: parseInt(e.target.value) })}
                className="flex-1 accent-amber-500" />
              <span className="text-amber-400 font-bold w-8 text-center">{semana[area.key]}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 items-center">
          <GoldButton onClick={saveWeek}>Guardar semana</GoldButton>
          <span className="text-zinc-500 text-sm">Promedio: <span className="text-amber-400 font-bold">
            {(Object.values(semana).reduce((a, b) => a + b, 0) / 5).toFixed(1)}/10
          </span></span>
        </div>
      </Card>

      {tracker.length > 1 && (
        <Card>
          <SectionTitle>📈 Evolución</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={tracker.slice(-8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="semana" tick={{ fill: "#71717a", fontSize: 9 }} />
              <YAxis domain={[0, 10]} tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", color: "#fff" }} />
              {areas.map((a, i) => (
                <Line key={a.key} type="monotone" dataKey={a.key} stroke={["#f59e0b", "#60a5fa", "#f472b6", "#34d399", "#a78bfa"][i]} strokeWidth={1.5} dot={false} name={a.label} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Diario */}
      <Card>
        <SectionTitle>📓 Diario de pareja</SectionTitle>
        <textarea
          value={nuevaEntrada}
          onChange={e => setNuevaEntrada(e.target.value)}
          placeholder="¿Cómo está yendo la relación hoy? ¿Qué pasó? ¿Cómo te sientes?"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-sm text-zinc-200
            placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none h-24"
        />
        <GoldButton onClick={addEntrada} className="mt-2">Guardar entrada</GoldButton>
        {diario.length > 0 && (
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {diario.map(e => (
              <div key={e.id} className="bg-zinc-800 rounded-lg p-3">
                <div className="text-zinc-500 text-xs mb-1">{e.fecha}</div>
                <div className="text-zinc-300 text-sm">{e.texto}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AIChat
        systemPrompt={SP}
        placeholder="Describe la situación actual y te daré un plan de acción concreto. Sin juicios, solo soluciones reales..."
        title="🤖 Terapeuta de Pareja & Sexólogo Experto"
      />
    </div>
  );
}

// ─── MODULE 7: FINANZAS ───────────────────────────────────────────────────────
function Finanzas() {
  const [datos, setDatos] = useLocalStorage("mp_finanzas", {
    ingresos: 1500, gastosF: 800, ahorros: 2000, inversion: 0,
  });
  const [gastos, setGastos] = useLocalStorage("mp_gastos_diarios", []);
  const [nuevoGasto, setNuevoGasto] = useState({ desc: "", monto: "", cat: "Comida" });
  const [compoundInput, setCompoundInput] = useState({ mensual: 200, anos: 10, interes: 7 });
  const [compoundResult, setCompoundResult] = useState(null);

  function calcCompound() {
    const { mensual, anos, interes } = compoundInput;
    const r = interes / 100 / 12;
    const n = anos * 12;
    const fv = mensual * ((Math.pow(1 + r, n) - 1) / r);
    setCompoundResult(fv.toFixed(0));
  }

  function addGasto() {
    if (!nuevoGasto.desc || !nuevoGasto.monto) return;
    setGastos([{ ...nuevoGasto, fecha: new Date().toLocaleDateString(), id: Date.now() }, ...gastos.slice(0, 49)]);
    setNuevoGasto({ desc: "", monto: "", cat: "Comida" });
  }

  const SP = `Eres el mejor asesor financiero del mundo especializado en jóvenes de 20 años que empiezan desde cero. Tu usuario tiene 2.000€, trabaja por turnos, está montando un negocio de importación de coches y quiere construir riqueza real. Conoces perfectamente los fondos indexados, ETFs, interés compuesto, cómo separar finanzas personales de las del negocio, cómo gestionar el capital inicial de un negocio de coches y cómo construir patrimonio desde cero siendo joven. Das consejos extremadamente concretos: qué broker usar, qué fondo comprar, cuánto destinar a cada cosa, con números reales.`;

  const ahorroPotencial = datos.ingresos - datos.gastosF;
  const cats = ["Comida", "Transporte", "Ocio", "Negocio", "Otro"];
  const gastosPorCat = cats.map(c => ({ name: c, total: gastos.filter(g => g.cat === c).reduce((s, g) => s + parseFloat(g.monto || 0), 0) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl">💰</span>
        <div>
          <h1 className="text-3xl font-black text-white">Finanzas Personales</h1>
          <p className="text-zinc-400">Construcción de patrimonio desde cero</p>
        </div>
      </div>

      {/* Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Ingresos/mes", key: "ingresos", color: "text-green-400", icon: "📈" },
          { label: "Gastos fijos", key: "gastosF", color: "text-red-400", icon: "📉" },
          { label: "Ahorros totales", key: "ahorros", color: "text-amber-400", icon: "🏦" },
          { label: "Inversiones", key: "inversion", color: "text-blue-400", icon: "📊" },
        ].map(f => (
          <Card key={f.key} className="text-center">
            <div className="text-2xl mb-1">{f.icon}</div>
            <div className={`text-2xl font-black ${f.color}`}>{datos[f.key]}€</div>
            <div className="text-zinc-500 text-xs mt-1">{f.label}</div>
            <input type="number" value={datos[f.key]}
              onChange={e => setDatos({ ...datos, [f.key]: parseFloat(e.target.value) || 0 })}
              className="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-center text-white focus:outline-none focus:border-amber-500" />
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-zinc-400 text-sm">Potencial de ahorro mensual</div>
            <div className="text-3xl font-black text-green-400">{ahorroPotencial}€</div>
          </div>
          <div className="text-right">
            <div className="text-zinc-400 text-sm">Tasa de ahorro</div>
            <div className="text-3xl font-black text-amber-400">{datos.ingresos > 0 ? ((ahorroPotencial / datos.ingresos) * 100).toFixed(0) : 0}%</div>
          </div>
        </div>
      </Card>

      {/* Objetivos */}
      <Card>
        <SectionTitle>🎯 Objetivos financieros</SectionTitle>
        <div className="space-y-3">
          {[
            { label: "Fondo emergencia (3 meses)", meta: datos.gastosF * 3, actual: datos.ahorros * 0.3, color: "from-green-500 to-emerald-300" },
            { label: "Capital negocio coches", meta: 5000, actual: datos.ahorros, color: "from-amber-500 to-yellow-300" },
            { label: "Inversión (ETF S&P500)", meta: 10000, actual: datos.inversion, color: "from-blue-500 to-cyan-300" },
          ].map((obj, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-300">{obj.label}</span>
                <span className="text-zinc-400">{Math.min(obj.actual, obj.meta).toFixed(0)}€ / {obj.meta}€</span>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${obj.color} rounded-full transition-all`}
                  style={{ width: `${Math.min((obj.actual / obj.meta) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Compound calculator */}
      <Card>
        <SectionTitle>📐 Calculadora de interés compuesto</SectionTitle>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {[
            { label: "Ahorro mensual (€)", key: "mensual" },
            { label: "Años", key: "anos" },
            { label: "Interés anual (%)", key: "interes" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-zinc-400 text-sm">{f.label}</label>
              <input type="number" value={compoundInput[f.key]}
                onChange={e => setCompoundInput({ ...compoundInput, [f.key]: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
            </div>
          ))}
        </div>
        <GoldButton onClick={calcCompound}>Calcular</GoldButton>
        {compoundResult && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
            <div className="text-zinc-400 text-sm">Tendrás en {compoundInput.anos} años:</div>
            <div className="text-4xl font-black text-amber-400 mt-1">{parseInt(compoundResult).toLocaleString()}€</div>
            <div className="text-zinc-500 text-sm mt-1">Invertido: {(compoundInput.mensual * compoundInput.anos * 12).toLocaleString()}€ · Ganado: {(parseInt(compoundResult) - compoundInput.mensual * compoundInput.anos * 12).toLocaleString()}€</div>
          </div>
        )}
      </Card>

      {/* Gastos diarios */}
      <Card>
        <SectionTitle>💳 Tracker de gastos</SectionTitle>
        <div className="flex gap-2 flex-wrap mb-4">
          <input value={nuevoGasto.desc} onChange={e => setNuevoGasto({ ...nuevoGasto, desc: e.target.value })}
            placeholder="Descripción" className="flex-1 min-w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          <input type="number" value={nuevoGasto.monto} onChange={e => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
            placeholder="€" className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          <select value={nuevoGasto.cat} onChange={e => setNuevoGasto({ ...nuevoGasto, cat: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
          <GoldButton onClick={addGasto}>+</GoldButton>
        </div>
        {gastos.length > 0 && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {gastos.slice(0, 10).map(g => (
              <div key={g.id} className="flex justify-between items-center bg-zinc-800 rounded-lg px-3 py-2 text-sm">
                <span className="text-zinc-300">{g.desc}</span>
                <div className="flex gap-3">
                  <span className="text-zinc-500 text-xs">{g.cat}</span>
                  <span className="text-red-400 font-semibold">-{g.monto}€</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AIChat
        systemPrompt={SP}
        placeholder="Pregúntame: qué broker usar, cómo separar dinero del negocio, dónde invertir los primeros 2.000€, plan financiero a 5 años..."
        title="🤖 Asesor Financiero Experto"
      />
    </div>
  );
}

// ─── MODULE 8: ENTRENO ────────────────────────────────────────────────────────
function Entreno({ turno }) {
  const [log, setLog] = useLocalStorage("mp_entreno_log", []);
  const [hoyLog, setHoyLog] = useState({});

  const planes = {
    Mañana: ["Lunes", "Miércoles", "Viernes", "Sábado"],
    Tarde: ["Lunes", "Martes", "Jueves", "Sábado"],
    Noche: ["Martes", "Jueves", "Sábado", "Domingo"],
  };

  const rutina = [
    {
      dia: "Push (Pecho, Hombros, Tríceps)",
      ejercicios: [
        { nombre: "Press de banca con barra", series: "4x8-10", nota: "Foco en contracción del pecho" },
        { nombre: "Press inclinado con mancuernas", series: "3x10-12", nota: "45° de inclinación" },
        { nombre: "Aperturas con mancuernas", series: "3x12-15", nota: "Lento en la bajada" },
        { nombre: "Press militar con barra", series: "4x8-10", nota: "Core apretado" },
        { nombre: "Fondos entre sillas", series: "3x máx", nota: "Peso corporal" },
      ],
    },
    {
      dia: "Pull (Espalda, Bíceps)",
      ejercicios: [
        { nombre: "Remo con mancuerna (un brazo)", series: "4x10-12", nota: "Codo pegado al cuerpo" },
        { nombre: "Remo con barra", series: "4x8-10", nota: "Espalda neutral" },
        { nombre: "Curl con barra", series: "3x10-12", nota: "Sin balanceo" },
        { nombre: "Curl martillo", series: "3x12", nota: "Agarre neutro" },
        { nombre: "Encogimientos de hombros", series: "3x15", nota: "Pausa arriba 1s" },
      ],
    },
    {
      dia: "Pierna (Cuádriceps, Glúteos, Isquios)",
      ejercicios: [
        { nombre: "Sentadilla con barra", series: "4x8-10", nota: "Paralelo o por debajo" },
        { nombre: "Peso muerto rumano", series: "4x10-12", nota: "Cadera hacia atrás" },
        { nombre: "Zancadas con mancuernas", series: "3x12/pierna", nota: "Paso largo" },
        { nombre: "Extensión de gemelos de pie", series: "4x15-20", nota: "Máximo rango" },
        { nombre: "Hip thrust con barra", series: "3x12", nota: "Glúteo al tope arriba" },
      ],
    },
    {
      dia: "Saco de boxeo + Core",
      ejercicios: [
        { nombre: "Saco: 5 asaltos de 3 min", series: "5 rondas", nota: "1 min descanso entre rondas" },
        { nombre: "Plancha", series: "3x60s", nota: "Cuerpo recto" },
        { nombre: "Crunch bicicleta", series: "3x20/lado", nota: "Lento y controlado" },
        { nombre: "Elevaciones de piernas", series: "3x15", nota: "Sin balanceo" },
      ],
    },
  ];

  function saveSession(idx) {
    setLog([{ sesion: rutina[idx % rutina.length].dia, fecha: new Date().toLocaleDateString(), id: Date.now() }, ...log.slice(0, 29)]);
  }

  const SP = `Eres el mejor entrenador personal del mundo especializado en entrenamiento en casa para ganar masa muscular. Tu atleta tiene 20 años, 58kg, 171cm, saco de boxeo, banco con pesas y mancuernas. Trabaja en turnos rotativos. Das planes de entrenamiento extremadamente concretos con series, repeticiones, técnica y progresión semanal. Sabes perfectamente cómo maximizar la ganancia muscular sin máquinas. Nunca das consejos genéricos.`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl">💪</span>
        <div>
          <h1 className="text-3xl font-black text-white">Entrenamiento en Casa</h1>
          <p className="text-zinc-400">Días de entreno para turno {turno}: {planes[turno].join(", ")}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {rutina.map((ses, idx) => (
          <Card key={idx}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider">{ses.dia}</h3>
              <GoldButton onClick={() => saveSession(idx)} className="text-xs py-1 px-3">✓ Hecho</GoldButton>
            </div>
            <div className="space-y-2">
              {ses.ejercicios.map((ej, i) => (
                <div key={i} className="bg-zinc-800 rounded-lg px-3 py-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm font-medium">{ej.nombre}</span>
                    <span className="text-amber-400 text-xs font-bold">{ej.series}</span>
                  </div>
                  <span className="text-zinc-500 text-xs italic">{ej.nota}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {log.length > 0 && (
        <Card>
          <SectionTitle>📋 Últimas sesiones</SectionTitle>
          <div className="space-y-1">
            {log.slice(0, 8).map(l => (
              <div key={l.id} className="flex justify-between bg-zinc-800 rounded-lg px-3 py-2 text-sm">
                <span className="text-zinc-300">{l.sesion}</span>
                <span className="text-zinc-500">{l.fecha}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Material recomendado */}
      <Card>
        <SectionTitle>🛒 Material recomendado (por prioridad)</SectionTitle>
        <div className="space-y-2">
          {[
            { item: "Barra olímpica 20kg + discos hasta 100kg", precio: "~200€", prio: 1 },
            { item: "Mancuernas regulables 2-32kg", precio: "~150€", prio: 2 },
            { item: "Pull-up bar para puerta", precio: "~25€", prio: 3 },
            { item: "Banco ajustable declinable", precio: "~80€", prio: 4 },
            { item: "Kettlebell 16kg", precio: "~40€", prio: 5 },
          ].map(m => (
            <div key={m.prio} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-bold w-5">#{m.prio}</span>
                <span className="text-zinc-300">{m.item}</span>
              </div>
              <span className="text-green-400 font-semibold">{m.precio}</span>
            </div>
          ))}
        </div>
      </Card>

      <AIChat
        systemPrompt={SP}
        placeholder="Pregúntame: cómo progresar sin máquinas, técnica de ejercicios, rutina para ganar 10kg de músculo, entrenamiento con turnos nocturnos..."
        title="🤖 Entrenador Personal Experto"
      />
    </div>
  );
}

// ─── MODULE 9: MENTALIDAD ────────────────────────────────────────────────────
function Mentalidad() {
  const defaultHabits = { "📖 Leer 30 min": false, "💪 Entrenamiento": false, "💧 2L de agua": false, "🥗 Calorías cumplidas": false, "🧘 Meditación 10 min": false, "📵 Sin redes antes de dormir": false };
  const [habits, setHabits] = useLocalStorage("mp_habits", defaultHabits);
  const [gratitud, setGratitud] = useLocalStorage("mp_gratitud", []);
  const [nuevaGrat, setNuevaGrat] = useState(["", "", ""]);
  const [estado, setEstado] = useLocalStorage("mp_estado_hoy", { animo: 7, energia: 7 });
  const [intencion, setIntencion] = useLocalStorage("mp_intencion", "");
  const [streakData, setStreakData] = useLocalStorage("mp_streak", { dias: 0, ultimo: "" });

  useEffect(() => {
    const hoy = new Date().toLocaleDateString();
    if (streakData.ultimo !== hoy) {
      const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
      if (streakData.ultimo === ayer.toLocaleDateString()) {
        setStreakData({ dias: streakData.dias + 1, ultimo: hoy });
      }
    }
  }, []);

  function saveGratitud() {
    if (nuevaGrat.some(g => g.trim())) {
      setGratitud([{ items: nuevaGrat.filter(g => g.trim()), fecha: new Date().toLocaleDateString(), id: Date.now() }, ...gratitud.slice(0, 29)]);
      setNuevaGrat(["", "", ""]);
    }
  }

  const completedCount = Object.values(habits).filter(Boolean).length;
  const totalCount = Object.keys(habits).length;

  const SP = `Eres el mejor coach de mentalidad y psicología del rendimiento del mundo. Tu cliente tiene 20 años, está construyendo un negocio desde cero, tiene una relación complicada y trabaja en turnos rotativos. Das herramientas concretas de mentalidad, gestión del estrés, disciplina y motivación. Conoces Estoicismo, psicología positiva, neurociencia del hábito. Nunca eres vago ni das frases motivacionales vacías. Das estrategias reales.`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl">🧠</span>
        <div>
          <h1 className="text-3xl font-black text-white">Mentalidad & Hábitos</h1>
          <p className="text-zinc-400">Sistema de excelencia diaria</p>
        </div>
      </div>

      {/* Racha + estado */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-4xl font-black text-amber-400">{streakData.dias}</div>
          <div className="text-zinc-500 text-xs uppercase tracking-widest mt-1">🔥 Días racha</div>
        </Card>
        <Card className="text-center">
          <div className="text-4xl font-black text-white">{completedCount}/{totalCount}</div>
          <div className="text-zinc-500 text-xs uppercase tracking-widest mt-1">✅ Hábitos hoy</div>
        </Card>
        <Card className="text-center">
          <div className="text-4xl font-black text-green-400">{estado.energia}/10</div>
          <div className="text-zinc-500 text-xs uppercase tracking-widest mt-1">⚡ Energía</div>
        </Card>
      </div>

      {/* Intención del día */}
      <Card className="border-amber-500/40">
        <SectionTitle>🎯 Intención del día</SectionTitle>
        <input
          value={intencion}
          onChange={e => setIntencion(e.target.value)}
          placeholder="Una cosa que marcará este día..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg
            placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-medium"
        />
      </Card>

      {/* Hábitos */}
      <Card>
        <SectionTitle>✅ Hábitos de hoy</SectionTitle>
        <div className="grid md:grid-cols-2 gap-2">
          {Object.entries(habits).map(([habit, done]) => (
            <label key={habit} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-zinc-800 transition-colors">
              <div onClick={() => setHabits({ ...habits, [habit]: !done })}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0
                  ${done ? "bg-amber-500 border-amber-500" : "border-zinc-600"}`}>
                {done && <span className="text-black text-xs font-bold">✓</span>}
              </div>
              <span className={`text-sm ${done ? "line-through text-zinc-500" : "text-zinc-200"}`}>{habit}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%` }} />
        </div>
      </Card>

      {/* Estado del día */}
      <Card>
        <SectionTitle>📊 Estado de hoy</SectionTitle>
        <div className="grid md:grid-cols-2 gap-6">
          {[{ key: "animo", label: "Estado de ánimo", icon: "😊" }, { key: "energia", label: "Nivel de energía", icon: "⚡" }].map(e => (
            <div key={e.key}>
              <label className="text-zinc-400 text-sm flex items-center gap-2">{e.icon} {e.label}</label>
              <input type="range" min="1" max="10" value={estado[e.key]}
                onChange={ev => setEstado({ ...estado, [e.key]: parseInt(ev.target.value) })}
                className="w-full mt-2 accent-amber-500" />
              <div className="text-amber-400 text-right font-bold">{estado[e.key]}/10</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Gratitud */}
      <Card>
        <SectionTitle>🙏 3 cosas por las que estoy agradecido hoy</SectionTitle>
        <div className="space-y-2 mb-3">
          {nuevaGrat.map((g, i) => (
            <input key={i} value={g} onChange={e => { const n = [...nuevaGrat]; n[i] = e.target.value; setNuevaGrat(n); }}
              placeholder={`${i + 1}. Algo por lo que estoy agradecido...`}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
          ))}
        </div>
        <GoldButton onClick={saveGratitud}>Guardar</GoldButton>
        {gratitud.length > 0 && (
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {gratitud.slice(0, 5).map(g => (
              <div key={g.id} className="bg-zinc-800 rounded-lg p-3">
                <div className="text-zinc-500 text-xs mb-1">{g.fecha}</div>
                {g.items.map((item, i) => (
                  <div key={i} className="text-zinc-300 text-sm">{i + 1}. {item}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      <AIChat
        systemPrompt={SP}
        placeholder="Pregúntame: cómo mantener disciplina con turnos rotativos, cómo gestionar el estrés del negocio, herramientas de mentalidad estoica..."
        title="🤖 Coach de Mentalidad & Rendimiento"
      />
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MasterPlan() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [turno, setTurno] = useLocalStorage("mp_turno", "Mañana");
  const [userName, setUserName] = useLocalStorage("mp_username", "");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Shared state for dashboard
  const [habits] = useLocalStorage("mp_habits", {});
  const [calories] = useLocalStorage("mp_calories_today", 0);
  const [sleepLog] = useLocalStorage("mp_sleep_log", []);
  const lastSleep = sleepLog[sleepLog.length - 1]?.calidad || 0;

  // Username prompt
  const [askName, setAskName] = useState(!userName);
  const [nameInput, setNameInput] = useState("");

  function confirmName() {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setAskName(false);
    }
  }

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard": return <Dashboard turno={turno} userName={userName} habits={habits} calories={calories} sleep={lastSleep} />;
      case "negocio": return <Negocio />;
      case "lectura": return <Lectura />;
      case "dieta": return <Dieta turno={turno} />;
      case "sueno": return <Sueno turno={turno} />;
      case "pareja": return <Pareja />;
      case "finanzas": return <Finanzas />;
      case "entreno": return <Entreno turno={turno} />;
      case "mentalidad": return <Mentalidad />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Name modal */}
      {askName && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-full max-w-md text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-2xl font-black text-white mb-2">Bienvenido a MASTER PLAN</h2>
            <p className="text-zinc-400 mb-6 text-sm">Tu sistema de vida personal completo. ¿Cómo te llamas?</p>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && confirmName()}
              placeholder="Tu nombre..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg mb-4
                focus:outline-none focus:border-amber-500 text-center"
              autoFocus
            />
            <GoldButton onClick={confirmName} className="w-full py-3 text-base">Comenzar →</GoldButton>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-16"} flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 fixed h-full z-30`}>
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center flex-shrink-0">
            <span className="text-black font-black text-sm">M</span>
          </div>
          {sidebarOpen && <span className="font-black text-white tracking-wider text-sm">MASTER PLAN</span>}
        </div>

        {/* Turno selector */}
        <div className="p-3 border-b border-zinc-800">
          {sidebarOpen ? (
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Turno activo</div>
              <div className="flex gap-1">
                {TURNOS.map(t => (
                  <button key={t} onClick={() => setTurno(t)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all
                      ${turno === t ? "text-black" : "text-zinc-500 bg-zinc-800 hover:bg-zinc-700"}`}
                    style={turno === t ? { background: TURNO_COLORS[t] } : {}}>
                    {t.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm mx-auto"
              style={{ background: TURNO_COLORS[turno] + "33", border: `1px solid ${TURNO_COLORS[turno]}` }}>
              {turno === "Mañana" ? "🌅" : turno === "Tarde" ? "🌆" : "🌙"}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
          {MODULES.map(mod => (
            <button key={mod.id} onClick={() => setActiveModule(mod.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left
                ${activeModule === mod.id
                  ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"}`}>
              <span className="text-lg flex-shrink-0">{mod.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{mod.label}</span>}
            </button>
          ))}
        </nav>

        {/* Toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 text-zinc-600 hover:text-zinc-300 transition-colors border-t border-zinc-800 text-center">
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${sidebarOpen ? "ml-56" : "ml-16"} transition-all duration-300`}>
        <div className="max-w-5xl mx-auto p-6 md:p-8">
          {renderModule()}
        </div>
      </main>
    </div>
  );
}
