import { useState, useEffect } from "react";

// ============================================================
// KONFIGURĀCIJA — ievadi savus Supabase datus šeit:
// ============================================================
const SUPABASE_URL = "https://zntdoyqgjvliffdechxf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudGRveXFnanZsaWZmZGVjaHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMDE4MTksImV4cCI6MjA5NDU3NzgxOX0.8R2-Kb25eU9narqFqHf495qfqkh6BknwQL23RCzplMQ";
// ============================================================
// Supabase palīgfunkcijas (bez npm pakotnes)
// ============================================================
async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const db = {
  getSessions: () => supabaseFetch("sessions?select=*&order=created_at.desc"),
  createSession: (name, date) =>
    supabaseFetch("sessions", {
      method: "POST",
      body: JSON.stringify({ name, date, active: true }),
    }),
  toggleSession: (id, active) =>
    supabaseFetch(`sessions?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
  getResponses: (session_id) =>
    supabaseFetch(`responses?session_id=eq.${session_id}&select=*&order=created_at.asc`),
  addResponse: (session_id, name, attended) =>
    supabaseFetch("responses", {
      method: "POST",
      body: JSON.stringify({ session_id, name, attended }),
    }),
  deleteSession: (id) =>
    supabaseFetch(`sessions?id=eq.${id}`, { method: "DELETE" }),
};

// ============================================================
// PIN kods vadītājam
// ============================================================
const ADMIN_PIN = "6969"; // <-- maini uz savu PIN!

// ============================================================
// Krāsu paletes & stili
// ============================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #0f1117;
    color: #e8e6f0;
    min-height: 100vh;
  }

  .app {
    max-width: 680px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    color: #c9b8ff;
    margin-bottom: 0.25rem;
  }

  .subtitle {
    color: #7a7a9a;
    font-size: 0.9rem;
    margin-bottom: 2rem;
  }

  .card {
    background: #1a1d27;
    border: 1px solid #2a2d3e;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .card h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 1.25rem;
    color: #c9b8ff;
    margin-bottom: 1rem;
  }

  input[type="text"], input[type="date"], input[type="password"] {
    width: 100%;
    background: #12141c;
    border: 1px solid #2a2d3e;
    border-radius: 10px;
    color: #e8e6f0;
    padding: 0.65rem 0.9rem;
    font-size: 0.95rem;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 0.75rem;
    outline: none;
    transition: border-color 0.2s;
  }

  input:focus {
    border-color: #7c5cbf;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.55rem 1.1rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s, transform 0.1s;
  }
  .btn:active { transform: scale(0.97); }
  .btn:disabled { opacity: 0.4; cursor: default; }

  .btn-primary { background: #7c5cbf; color: #fff; }
  .btn-primary:hover { opacity: 0.88; }

  .btn-ghost {
    background: transparent;
    border: 1px solid #2a2d3e;
    color: #a0a0c0;
  }
  .btn-ghost:hover { background: #1f2233; }

  .btn-danger { background: #3d1a1a; color: #ff7a7a; border: 1px solid #5a2222; }
  .btn-danger:hover { background: #4d2020; }

  .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.82rem; }

  .session-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1rem;
    background: #12141c;
    border-radius: 10px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    border: 1px solid transparent;
    transition: border-color 0.2s;
  }
  .session-row:hover { border-color: #3a3d5e; }
  .session-row.active-session { border-color: #7c5cbf44; }

  .session-name {
    font-weight: 500;
    color: #e8e6f0;
    font-size: 0.95rem;
  }
  .session-date {
    color: #7a7a9a;
    font-size: 0.8rem;
    margin-top: 2px;
  }

  .badge {
    font-size: 0.72rem;
    padding: 3px 8px;
    border-radius: 99px;
    font-weight: 600;
  }
  .badge-active { background: #1a3a2a; color: #6dfcb0; }
  .badge-closed { background: #2a2a3a; color: #7a7a9a; }

  .response-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem 0.8rem;
    border-radius: 8px;
    margin-bottom: 0.4rem;
    background: #12141c;
    font-size: 0.9rem;
  }

  .attended-yes { color: #6dfcb0; }
  .attended-no { color: #ff7a7a; }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  .tab {
    padding: 0.45rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.88rem;
    font-weight: 500;
    background: #1a1d27;
    border: 1px solid #2a2d3e;
    color: #7a7a9a;
    transition: all 0.2s;
  }
  .tab.active-tab {
    background: #7c5cbf22;
    border-color: #7c5cbf;
    color: #c9b8ff;
  }

  .pin-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1rem;
  }
  .pin-screen h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 1.5rem;
    color: #c9b8ff;
  }
  .pin-screen input {
    max-width: 220px;
    text-align: center;
    letter-spacing: 0.2em;
    font-size: 1.5rem;
  }

  .error { color: #ff7a7a; font-size: 0.85rem; margin-bottom: 0.5rem; }
  .success { color: #6dfcb0; font-size: 0.85rem; margin-bottom: 0.5rem; }

  .row-actions { display: flex; gap: 6px; }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .stat-box {
    background: #12141c;
    border-radius: 10px;
    padding: 0.75rem;
    text-align: center;
  }
  .stat-num { font-size: 1.6rem; font-weight: 600; color: #c9b8ff; }
  .stat-label { font-size: 0.75rem; color: #7a7a9a; margin-top: 2px; }

  .divider { border: none; border-top: 1px solid #2a2d3e; margin: 1rem 0; }

  .empty { color: #4a4a6a; text-align: center; padding: 2rem; font-size: 0.9rem; }
`;

// ============================================================
// Galvenā komponente
// ============================================================
export default function App() {
  const [tab, setTab] = useState("participant"); // "participant" | "admin"
  const [adminAuth, setAdminAuth] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Dalībnieka stāvoklis
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [partName, setPartName] = useState("");
  const [partAttended, setPartAttended] = useState(true);
  const [partMsg, setPartMsg] = useState("");
  const [partLoading, setPartLoading] = useState(false);

  // Admin stāvoklis
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [adminMsg, setAdminMsg] = useState("");
  const [responses, setResponses] = useState([]);
  const [viewSession, setViewSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const data = await db.getSessions();
      setSessions(data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function submitResponse() {
    if (!selectedSession) return;
    if (!partName.trim()) { setPartMsg("Lūdzu ievadi vārdu!"); return; }
    setPartLoading(true);
    setPartMsg("");
    try {
      await db.addResponse(selectedSession.id, partName.trim(), partAttended);
      setPartMsg("✓ Reģistrācija veiksmīga!");
      setPartName("");
    } catch (e) {
      setPartMsg("Kļūda: " + e.message);
    }
    setPartLoading(false);
  }

  async function createSession() {
    if (!newSessionName.trim()) return;
    try {
      await db.createSession(newSessionName.trim(), newSessionDate);
      setNewSessionName("");
      setAdminMsg("✓ Sesija izveidota!");
      loadSessions();
    } catch (e) {
      setAdminMsg("Kļūda: " + e.message);
    }
  }

  async function toggleSession(session) {
    try {
      await db.toggleSession(session.id, !session.active);
      loadSessions();
    } catch (e) {
      setAdminMsg("Kļūda: " + e.message);
    }
  }

  async function viewResponses(session) {
    setViewSession(session);
    try {
      const data = await db.getResponses(session.id);
      setResponses(data || []);
    } catch (e) {
      setAdminMsg("Kļūda: " + e.message);
    }
  }

  function handlePinSubmit() {
    if (pin === ADMIN_PIN) {
      setAdminAuth(true);
      setPinError("");
    } else {
      setPinError("Nepareizs PIN!");
    }
    setPin("");
  }

  const activeSessions = sessions.filter((s) => s.active);

  // --- RENDER ---
  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <h1>📋 Sesiju reģistrs</h1>
        <p className="subtitle">Apmeklējumu uzskaites sistēma</p>

        <div className="tabs">
          <div
            className={`tab ${tab === "participant" ? "active-tab" : ""}`}
            onClick={() => setTab("participant")}
          >
            👤 Dalībnieks
          </div>
          <div
            className={`tab ${tab === "admin" ? "active-tab" : ""}`}
            onClick={() => setTab("admin")}
          >
            🔐 Vadītājs
          </div>
        </div>

        {/* ===== DALĪBNIEKA SKATS ===== */}
        {tab === "participant" && (
          <div className="card">
            <h2>Reģistrēties sesijai</h2>
            <p style={{ color: "#7a7a9a", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Izvēlies aktīvo sesiju un ievadi savu vārdu.
            </p>

            {activeSessions.length === 0 ? (
              <p className="empty">Nav aktīvu sesiju. Lūdzu, uzgaidi vadītāju.</p>
            ) : (
              <>
                <label style={{ fontSize: "0.82rem", color: "#7a7a9a" }}>Izvēlies sesiju</label>
                <div style={{ marginBottom: "1rem", marginTop: "0.4rem" }}>
                  {activeSessions.map((s) => (
                    <div
                      key={s.id}
                      className={`session-row ${selectedSession?.id === s.id ? "active-session" : ""}`}
                      onClick={() => setSelectedSession(s)}
                    >
                      <div>
                        <div className="session-name">{s.name}</div>
                        <div className="session-date">{s.date}</div>
                      </div>
                      {selectedSession?.id === s.id && (
                        <span style={{ color: "#c9b8ff", fontSize: "1.2rem" }}>✓</span>
                      )}
                    </div>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Tavs vārds un uzvārds"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitResponse()}
                />

                <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.88rem", color: "#a0a0c0" }}>Vai klātienē?</label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="attended"
                      checked={partAttended === true}
                      onChange={() => setPartAttended(true)}
                    />
                    <span style={{ fontSize: "0.88rem" }}>Jā ✅</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="attended"
                      checked={partAttended === false}
                      onChange={() => setPartAttended(false)}
                    />
                    <span style={{ fontSize: "0.88rem" }}>Nē ❌</span>
                  </label>
                </div>

                {partMsg && (
                  <p className={partMsg.startsWith("✓") ? "success" : "error"}>{partMsg}</p>
                )}

                <button
                  className="btn btn-primary"
                  onClick={submitResponse}
                  disabled={partLoading || !selectedSession}
                >
                  {partLoading ? "Saglabā..." : "Reģistrēties"}
                </button>
              </>
            )}
          </div>
        )}

        {/* ===== ADMIN SKATS ===== */}
        {tab === "admin" && !adminAuth && (
          <div className="pin-screen">
            <h2>🔐 Vadītāja pieejas</h2>
            <input
              type="password"
              placeholder="PIN kods"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
              maxLength={8}
            />
            {pinError && <p className="error">{pinError}</p>}
            <button className="btn btn-primary" onClick={handlePinSubmit}>
              Ieiet
            </button>
          </div>
        )}

        {tab === "admin" && adminAuth && (
          <>
            {/* Jauna sesija */}
            <div className="card">
              <h2>Izveidot sesiju</h2>
              <input
                type="text"
                placeholder="Sesijas nosaukums (piem. 'Lekcija 3')"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
              />
              <input
                type="date"
                value={newSessionDate}
                onChange={(e) => setNewSessionDate(e.target.value)}
              />
              {adminMsg && (
                <p className={adminMsg.startsWith("✓") ? "success" : "error"}>{adminMsg}</p>
              )}
              <button className="btn btn-primary" onClick={createSession}>
                + Izveidot
              </button>
            </div>

            {/* Sesiju saraksts */}
            <div className="card">
              <h2>Visas sesijas</h2>
              {sessions.length === 0 && <p className="empty">Nav sesiju.</p>}
              {sessions.map((s) => (
                <div key={s.id} className="session-row" style={{ cursor: "default" }}>
                  <div>
                    <div className="session-name">{s.name}</div>
                    <div className="session-date">{s.date}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`badge ${s.active ? "badge-active" : "badge-closed"}`}>
                      {s.active ? "Aktīva" : "Slēgta"}
                    </span>
                    <div className="row-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => viewResponses(s)}
                      >
                        👁 Skatīt
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleSession(s)}
                      >
                        {s.active ? "Slēgt" : "Atvērt"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Atbilžu pārskats */}
            {viewSession && (
              <div className="card">
                <h2>📊 {viewSession.name} — Apmeklētāji</h2>
                <div className="stat-grid">
                  <div className="stat-box">
                    <div className="stat-num">{responses.length}</div>
                    <div className="stat-label">Kopā</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-num" style={{ color: "#6dfcb0" }}>
                      {responses.filter((r) => r.attended).length}
                    </div>
                    <div className="stat-label">Klātienē</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-num" style={{ color: "#ff7a7a" }}>
                      {responses.filter((r) => !r.attended).length}
                    </div>
                    <div className="stat-label">Prombūtnē</div>
                  </div>
                </div>
                <hr className="divider" />
                {responses.length === 0 && (
                  <p className="empty">Nav reģistrāciju.</p>
                )}
                {responses.map((r) => (
                  <div key={r.id} className="response-row">
                    <span>{r.name}</span>
                    <span className={r.attended ? "attended-yes" : "attended-no"}>
                      {r.attended ? "✅ Klātienē" : "❌ Prombūtnē"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
