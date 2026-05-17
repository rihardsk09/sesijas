import { useState, useEffect } from "react";

// ============================================================
// KONFIGURĀCIJA — ievadi savus Supabase datus šeit:
// ============================================================
const SUPABASE_URL = "https://zntdoyqgjvliffdechxf.supabase.co/rest/v1/"; // <-- maini
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudGRveXFnanZsaWZmZGVjaHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMDE4MTksImV4cCI6MjA5NDU3NzgxOX0.8R2-Kb25eU9narqFqHf495qfqkh6BknwQL23RCzplMQ"; // <-- maini

// ============================================================
// Supabase palīgfunkcijas
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
  deleteSession: (id) =>
    supabaseFetch(`sessions?id=eq.${id}`, { method: "DELETE" }),
  getResponses: (session_id) =>
    supabaseFetch(`responses?session_id=eq.${session_id}&select=*&order=created_at.asc`),
  addResponse: (session_id, name, status, comment) =>
    supabaseFetch("responses", {
      method: "POST",
      body: JSON.stringify({ session_id, name, attended: status === "klātienē", status, comment }),
    }),
};

// ============================================================
// PIN kods vadītājam
// ============================================================
const ADMIN_PIN = "1234"; // <-- maini uz savu PIN!

// Mārupes Jauniešu krāsas
// Primārā: #7B2D8B (tumšāka violeta)
// Galvenā: #8B3A9B
// Gaiša: #a855c8
// Fons: #1a0a1e

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Montserrat', sans-serif;
    background: #120818;
    color: #f0e8f8;
    min-height: 100vh;
  }

  .app {
    max-width: 680px;
    margin: 0 auto;
    padding: 0 1rem 2rem;
  }

  .header {
    background: #7B2D8B;
    margin: 0 -1rem 2rem;
    padding: 1.5rem 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    clip-path: polygon(0 0, 100% 0, 100% 80%, 97% 100%, 0 100%);
    padding-bottom: 2.5rem;
  }

  .header-logo {
    width: 52px;
    height: 52px;
    background: white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    font-weight: 800;
    color: #7B2D8B;
    flex-shrink: 0;
    letter-spacing: -2px;
  }

  .header-text h1 {
    font-size: 1.3rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    line-height: 1.1;
  }

  .header-text p {
    font-size: 0.78rem;
    color: rgba(255,255,255,0.7);
    margin-top: 2px;
    font-weight: 400;
  }

  .card {
    background: #1f0d2a;
    border: 1px solid #3d1a52;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .card h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #d4a8f0;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input[type="text"], input[type="date"], input[type="password"], textarea {
    width: 100%;
    background: #120818;
    border: 1.5px solid #3d1a52;
    border-radius: 10px;
    color: #f0e8f8;
    padding: 0.7rem 1rem;
    font-size: 0.95rem;
    font-family: 'Montserrat', sans-serif;
    margin-bottom: 0.75rem;
    outline: none;
    transition: border-color 0.2s;
  }

  textarea { resize: vertical; min-height: 70px; }

  input:focus, textarea:focus { border-color: #a855c8; }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.6rem 1.2rem;
    border-radius: 10px;
    font-size: 0.88rem;
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .btn:active { transform: scale(0.97); }
  .btn:disabled { opacity: 0.4; cursor: default; }

  .btn-primary { background: #7B2D8B; color: #fff; }
  .btn-primary:hover { background: #9233a8; }

  .btn-ghost {
    background: transparent;
    border: 1.5px solid #3d1a52;
    color: #b08acc;
  }
  .btn-ghost:hover { background: #2a1038; border-color: #7B2D8B; }

  .btn-danger { background: #3d1020; color: #ff7ab0; border: 1.5px solid #6b1a38; }
  .btn-danger:hover { background: #521428; }

  .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.78rem; }

  .session-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1rem;
    background: #120818;
    border-radius: 10px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: border-color 0.2s;
  }
  .session-row:hover { border-color: #3d1a52; }
  .session-row.active-session { border-color: #7B2D8B; background: #1f0d2a; }

  .session-name {
    font-weight: 700;
    color: #f0e8f8;
    font-size: 0.92rem;
  }
  .session-date {
    color: #8a6aaa;
    font-size: 0.78rem;
    margin-top: 2px;
  }

  .badge {
    font-size: 0.68rem;
    padding: 3px 9px;
    border-radius: 99px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-active { background: #2a1a3a; color: #c87af0; border: 1px solid #7B2D8B; }
  .badge-closed { background: #1a1a2a; color: #5a5a7a; }

  .response-row {
    padding: 0.7rem 0.9rem;
    border-radius: 8px;
    margin-bottom: 0.4rem;
    background: #120818;
    font-size: 0.88rem;
    border-left: 3px solid #3d1a52;
  }

  .response-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .response-comment {
    color: #7a5a9a;
    font-size: 0.78rem;
    margin-top: 4px;
    font-style: italic;
  }

  .status-klatiene { color: #6dfcb0; }
  .status-attaLinati { color: #a8c8ff; }
  .status-nebūs { color: #ff8ab0; }

  .status-options {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .status-btn {
    padding: 0.5rem 1rem;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 700;
    border: 1.5px solid #3d1a52;
    background: #120818;
    color: #7a5a9a;
    transition: all 0.15s;
    font-family: 'Montserrat', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .status-btn.selected-klātienē { background: #1a3a2a; border-color: #6dfcb0; color: #6dfcb0; }
  .status-btn.selected-attālināti { background: #1a2a4a; border-color: #a8c8ff; color: #a8c8ff; }
  .status-btn.selected-nebūs { background: #3a1020; border-color: #ff8ab0; color: #ff8ab0; }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  .tab {
    flex: 1;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 700;
    background: #1f0d2a;
    border: 1.5px solid #3d1a52;
    color: #7a5a9a;
    transition: all 0.2s;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: 'Montserrat', sans-serif;
  }
  .tab.active-tab {
    background: #7B2D8B;
    border-color: #7B2D8B;
    color: #fff;
  }

  .pin-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 55vh;
    gap: 1rem;
  }
  .pin-screen h2 {
    font-size: 1.3rem;
    font-weight: 800;
    color: #d4a8f0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .pin-screen input {
    max-width: 220px;
    text-align: center;
    letter-spacing: 0.3em;
    font-size: 1.5rem;
  }

  .error { color: #ff8ab0; font-size: 0.82rem; margin-bottom: 0.5rem; font-weight: 600; }
  .success { color: #6dfcb0; font-size: 0.82rem; margin-bottom: 0.5rem; font-weight: 600; }

  .row-actions { display: flex; gap: 6px; flex-wrap: wrap; }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .stat-box {
    background: #120818;
    border-radius: 10px;
    padding: 0.85rem;
    text-align: center;
    border: 1px solid #3d1a52;
  }
  .stat-num { font-size: 1.8rem; font-weight: 800; color: #c87af0; }
  .stat-label { font-size: 0.68rem; color: #7a5a9a; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }

  .divider { border: none; border-top: 1px solid #3d1a52; margin: 1rem 0; }

  .empty { color: #4a2a5a; text-align: center; padding: 2rem; font-size: 0.88rem; font-weight: 600; }

  .confirm-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10,0,18,0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
  }
  .confirm-box {
    background: #1f0d2a;
    border: 1.5px solid #7B2D8B;
    border-radius: 16px;
    padding: 2rem;
    max-width: 340px;
    width: 90%;
    text-align: center;
  }
  .confirm-box h3 {
    font-size: 1.1rem;
    font-weight: 800;
    color: #d4a8f0;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }
  .confirm-box p {
    color: #7a5a9a;
    font-size: 0.88rem;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  .confirm-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  label { font-family: 'Montserrat', sans-serif; }
`;

export default function App() {
  const [tab, setTab] = useState("participant");
  const [adminAuth, setAdminAuth] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [partName, setPartName] = useState("");
  const [partStatus, setPartStatus] = useState("klātienē");
  const [partComment, setPartComment] = useState("");
  const [partMsg, setPartMsg] = useState("");
  const [partLoading, setPartLoading] = useState(false);

  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [adminMsg, setAdminMsg] = useState("");
  const [responses, setResponses] = useState([]);
  const [viewSession, setViewSession] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    try {
      const data = await db.getSessions();
      setSessions(data || []);
    } catch (e) { console.error(e); }
  }

  async function submitResponse() {
    if (!selectedSession) return;
    if (!partName.trim()) { setPartMsg("Lūdzu ievadi vārdu!"); return; }
    setPartLoading(true);
    setPartMsg("");
    try {
      await db.addResponse(selectedSession.id, partName.trim(), partStatus, partComment.trim());
      setPartMsg("✓ Reģistrācija veiksmīga!");
      setPartName("");
      setPartComment("");
      setPartStatus("klātienē");
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
    } catch (e) { setAdminMsg("Kļūda: " + e.message); }
  }

  async function toggleSession(session) {
    try {
      await db.toggleSession(session.id, !session.active);
      loadSessions();
    } catch (e) { setAdminMsg("Kļūda: " + e.message); }
  }

  async function deleteSession(id) {
    try {
      await db.deleteSession(id);
      setConfirmDelete(null);
      if (viewSession?.id === id) setViewSession(null);
      loadSessions();
    } catch (e) { setAdminMsg("Kļūda: " + e.message); }
  }

  async function viewResponses(session) {
    setViewSession(session);
    try {
      const data = await db.getResponses(session.id);
      setResponses(data || []);
    } catch (e) { setAdminMsg("Kļūda: " + e.message); }
  }

  function handlePinSubmit() {
    if (pin === ADMIN_PIN) { setAdminAuth(true); setPinError(""); }
    else { setPinError("Nepareizs PIN!"); }
    setPin("");
  }

  function statusLabel(status) {
    if (status === "klātienē") return "✅ Klātienē";
    if (status === "attālināti") return "💻 Attālināti";
    return "❌ Nebūs";
  }

  function statusClass(status) {
    if (status === "klātienē") return "status-klatiene";
    if (status === "attālināti") return "status-attaLinati";
    return "status-nebūs";
  }

  const activeSessions = sessions.filter((s) => s.active);

  return (
    <>
      <style>{styles}</style>

      {/* HEADER */}
      <div className="header">
        <div className="header-logo">MJ</div>
        <div className="header-text">
          <h1>Mārupes Jaunieši</h1>
          <p>Sēžu apmeklējumu reģistrs</p>
        </div>
      </div>

      <div className="app">
        <div className="tabs">
          <div className={`tab ${tab === "participant" ? "active-tab" : ""}`} onClick={() => setTab("participant")}>
            👤 Dalībnieks
          </div>
          <div className={`tab ${tab === "admin" ? "active-tab" : ""}`} onClick={() => setTab("admin")}>
            🔐 Vadītājs
          </div>
        </div>

        {/* DALĪBNIEKS */}
        {tab === "participant" && (
          <div className="card">
            <h2>Reģistrēties sēdei</h2>
            <p style={{ color: "#7a5a9a", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: 500 }}>
              Izvēlies aktīvo sēdi un ievadi savu vārdu.
            </p>
            {activeSessions.length === 0 ? (
              <p className="empty">Nav aktīvu sēžu. Lūdzu, uzgaidi vadītāju.</p>
            ) : (
              <>
                <label style={{ fontSize: "0.75rem", color: "#7a5a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Izvēlies sēdi
                </label>
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
                        <span style={{ color: "#c87af0", fontSize: "1.3rem" }}>✓</span>
                      )}
                    </div>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Tavs vārds un uzvārds"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                />

                <label style={{ fontSize: "0.75rem", color: "#7a5a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem", display: "block" }}>
                  Dalības veids
                </label>
                <div className="status-options">
                  {["klātienē", "attālināti", "nebūs"].map((s) => (
                    <button
                      key={s}
                      className={`status-btn ${partStatus === s ? `selected-${s}` : ""}`}
                      onClick={() => setPartStatus(s)}
                    >
                      {s === "klātienē" ? "✅ Klātienē" : s === "attālināti" ? "💻 Attālināti" : "❌ Nebūs"}
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Komentārs (neobligāts) — piem. 'Būšu līdz 18:00'"
                  value={partComment}
                  onChange={(e) => setPartComment(e.target.value)}
                />

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

        {/* ADMIN — PIN */}
        {tab === "admin" && !adminAuth && (
          <div className="pin-screen">
            <div style={{ fontSize: "3rem" }}>🔐</div>
            <h2>Vadītāja pieejas</h2>
            <input
              type="password"
              placeholder="PIN kods"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
              maxLength={8}
              style={{ maxWidth: "220px", textAlign: "center", letterSpacing: "0.3em", fontSize: "1.5rem" }}
            />
            {pinError && <p className="error">{pinError}</p>}
            <button className="btn btn-primary" onClick={handlePinSubmit}>Ieiet</button>
          </div>
        )}

        {/* ADMIN — PANELIS */}
        {tab === "admin" && adminAuth && (
          <>
            <div className="card">
              <h2>Izveidot sēdi</h2>
              <input
                type="text"
                placeholder="Sēdes nosaukums (piem. 'Sēde Nr. 3')"
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
              <button className="btn btn-primary" onClick={createSession}>+ Izveidot</button>
            </div>

            <div className="card">
              <h2>Visas sēdes</h2>
              {sessions.length === 0 && <p className="empty">Nav sēžu.</p>}
              {sessions.map((s) => (
                <div key={s.id} className="session-row" style={{ cursor: "default" }}>
                  <div>
                    <div className="session-name">{s.name}</div>
                    <div className="session-date">{s.date}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span className={`badge ${s.active ? "badge-active" : "badge-closed"}`}>
                      {s.active ? "Aktīva" : "Slēgta"}
                    </span>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => viewResponses(s)}>👁 Skatīt</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleSession(s)}>
                        {s.active ? "Slēgt" : "Atvērt"}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(s)}>🗑 Dzēst</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {viewSession && (
              <div className="card">
                <h2>📊 {viewSession.name}</h2>
                <div className="stat-grid">
                  <div className="stat-box">
                    <div className="stat-num" style={{ color: "#6dfcb0" }}>
                      {responses.filter((r) => r.status === "klātienē").length}
                    </div>
                    <div className="stat-label">Klātienē</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-num" style={{ color: "#a8c8ff" }}>
                      {responses.filter((r) => r.status === "attālināti").length}
                    </div>
                    <div className="stat-label">Attālināti</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-num" style={{ color: "#ff8ab0" }}>
                      {responses.filter((r) => r.status === "nebūs").length}
                    </div>
                    <div className="stat-label">Nebūs</div>
                  </div>
                </div>
                <hr className="divider" />
                {responses.length === 0 && <p className="empty">Nav reģistrāciju.</p>}
                {responses.map((r) => (
                  <div key={r.id} className="response-row">
                    <div className="response-top">
                      <span style={{ fontWeight: 700 }}>{r.name}</span>
                      <span className={statusClass(r.status)}>{statusLabel(r.status)}</span>
                    </div>
                    {r.comment && <div className="response-comment">💬 {r.comment}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>Dzēst sēdi?</h3>
            <p>"{confirmDelete.name}" tiks dzēsta kopā ar visiem reģistrētajiem dalībniekiem. To nevar atcelt!</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Atcelt</button>
              <button className="btn btn-danger" onClick={() => deleteSession(confirmDelete.id)}>Dzēst</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
