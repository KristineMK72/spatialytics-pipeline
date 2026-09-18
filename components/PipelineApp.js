"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STAGES = ["Lead", "Qualified", "Proposal", "Won", "Lost"];
const STORAGE_KEY = "spatialytics_pipeline_v1";

const SEED = {
  contacts: [
    {
      id: "c1",
      name: "Ames Print Co",
      contact: "Jordan Ames",
      email: "jordan@amesprint.example",
      phone: "(218) 555-0142",
      city: "Brainerd, MN",
      lat: 46.358,
      lon: -94.2008,
      notes: "Local print shop — interested in POD tools",
    },
    {
      id: "c2",
      name: "Lakeside HVAC",
      contact: "Sam Rivera",
      email: "sam@lakesidehvac.example",
      phone: "(218) 555-0198",
      city: "Baxter, MN",
      lat: 46.341,
      lon: -94.286,
      notes: "Service territory across Crow Wing",
    },
    {
      id: "c3",
      name: "Northwoods Nonprofit Collective",
      contact: "Priya Nair",
      email: "priya@nwnc.example",
      phone: "(218) 555-0110",
      city: "Staples, MN",
      lat: 46.355,
      lon: -94.795,
      notes: "Grant Match pilot candidate",
    },
  ],
  deals: [
    {
      id: "d1",
      title: "POD platform pilot",
      contactId: "c1",
      stage: "Proposal",
      amount: 4800,
      followUp: daysFromNow(3),
      notes: "Demo scheduled",
    },
    {
      id: "d2",
      title: "Route + CRM bundle",
      contactId: "c2",
      stage: "Qualified",
      amount: 2400,
      followUp: daysFromNow(1),
      notes: "Needs map of service area",
    },
    {
      id: "d3",
      title: "Grant Match annual",
      contactId: "c3",
      stage: "Lead",
      amount: 1200,
      followUp: daysFromNow(-1),
      notes: "Intro call done",
    },
  ],
  jobs: [
    {
      id: "j1",
      title: "On-site discovery",
      contactId: "c2",
      status: "Open",
      due: daysFromNow(2),
      lat: 46.341,
      lon: -94.286,
      notes: "Walk service routes",
    },
  ],
};

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadState() {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return SEED;
}

function money(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function PipelineApp() {
  const [tab, setTab] = useState("today");
  const [data, setData] = useState(SEED);
  const [hydrated, setHydrated] = useState(false);
  const [modal, setModal] = useState(null); // { type, payload }
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    setData(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const contactMap = useMemo(() => {
    const m = {};
    data.contacts.forEach((c) => {
      m[c.id] = c;
    });
    return m;
  }, [data.contacts]);

  const stats = useMemo(() => {
    const openDeals = data.deals.filter((d) => d.stage !== "Lost" && d.stage !== "Won");
    const pipelineValue = openDeals.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const won = data.deals
      .filter((d) => d.stage === "Won")
      .reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const dueSoon = data.deals.filter((d) => d.followUp && d.followUp <= daysFromNow(3) && d.stage !== "Won" && d.stage !== "Lost").length;
    const openJobs = data.jobs.filter((j) => j.status === "Open").length;
    return { pipelineValue, won, dueSoon, openJobs, contacts: data.contacts.length };
  }, [data]);

  const todayItems = useMemo(() => {
    const today = daysFromNow(0);
    const items = [];
    data.deals.forEach((d) => {
      if (!d.followUp || d.stage === "Won" || d.stage === "Lost") return;
      items.push({
        kind: "deal",
        id: d.id,
        title: d.title,
        when: d.followUp,
        overdue: d.followUp < today,
        sub: contactMap[d.contactId]?.name || "",
      });
    });
    data.jobs.forEach((j) => {
      if (j.status !== "Open" || !j.due) return;
      items.push({
        kind: "job",
        id: j.id,
        title: j.title,
        when: j.due,
        overdue: j.due < today,
        sub: contactMap[j.contactId]?.name || "",
      });
    });
    items.sort((a, b) => a.when.localeCompare(b.when));
    return items;
  }, [data, contactMap]);

  const saveDeal = (form) => {
    setData((prev) => {
      const deals = [...prev.deals];
      if (form.id) {
        const i = deals.findIndex((d) => d.id === form.id);
        if (i >= 0) deals[i] = { ...deals[i], ...form };
      } else {
        deals.push({
          id: uid("d"),
          title: form.title,
          contactId: form.contactId,
          stage: form.stage || "Lead",
          amount: Number(form.amount) || 0,
          followUp: form.followUp || "",
          notes: form.notes || "",
        });
      }
      return { ...prev, deals };
    });
    setModal(null);
  };

  const saveContact = (form) => {
    setData((prev) => {
      const contacts = [...prev.contacts];
      if (form.id) {
        const i = contacts.findIndex((c) => c.id === form.id);
        if (i >= 0) contacts[i] = { ...contacts[i], ...form, lat: num(form.lat), lon: num(form.lon) };
      } else {
        contacts.push({
          id: uid("c"),
          name: form.name,
          contact: form.contact || "",
          email: form.email || "",
          phone: form.phone || "",
          city: form.city || "",
          lat: num(form.lat),
          lon: num(form.lon),
          notes: form.notes || "",
        });
      }
      return { ...prev, contacts };
    });
    setModal(null);
  };

  const saveJob = (form) => {
    setData((prev) => {
      const jobs = [...prev.jobs];
      const contact = prev.contacts.find((c) => c.id === form.contactId);
      const payload = {
        title: form.title,
        contactId: form.contactId,
        status: form.status || "Open",
        due: form.due || "",
        notes: form.notes || "",
        lat: num(form.lat) ?? contact?.lat ?? null,
        lon: num(form.lon) ?? contact?.lon ?? null,
      };
      if (form.id) {
        const i = jobs.findIndex((j) => j.id === form.id);
        if (i >= 0) jobs[i] = { ...jobs[i], ...payload };
      } else {
        jobs.push({ id: uid("j"), ...payload });
      }
      return { ...prev, jobs };
    });
    setModal(null);
  };

  const moveDeal = (dealId, stage) => {
    setData((prev) => ({
      ...prev,
      deals: prev.deals.map((d) => (d.id === dealId ? { ...d, stage } : d)),
    }));
  };

  const deleteDeal = (id) => {
    setData((prev) => ({ ...prev, deals: prev.deals.filter((d) => d.id !== id) }));
  };

  const deleteContact = (id) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
      deals: prev.deals.filter((d) => d.contactId !== id),
      jobs: prev.jobs.filter((j) => j.contactId !== id),
    }));
  };

  const deleteJob = (id) => {
    setData((prev) => ({ ...prev, jobs: prev.jobs.filter((j) => j.id !== id) }));
  };

  const resetSeed = () => {
    if (confirm("Reset to sample data?")) {
      setData(SEED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    }
  };

  // Map
  useEffect(() => {
    if (tab !== "map" || typeof window === "undefined") return;

    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapRef.current).setView([46.35, -94.2], 8);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OSM &copy; CARTO",
        maxZoom: 19,
      }).addTo(map);

      markersRef.current = [];
      const bounds = [];

      data.contacts.forEach((c) => {
        if (c.lat == null || c.lon == null) return;
        const m = L.marker([c.lat, c.lon]).addTo(map);
        m.bindPopup(`<strong>${esc(c.name)}</strong><br/>${esc(c.city || "")}<br/>Account`);
        markersRef.current.push(m);
        bounds.push([c.lat, c.lon]);
      });

      data.jobs
        .filter((j) => j.status === "Open" && j.lat != null && j.lon != null)
        .forEach((j) => {
          const m = L.circleMarker([j.lat, j.lon], {
            radius: 9,
            color: "#a78bfa",
            fillColor: "#a78bfa",
            fillOpacity: 0.7,
          }).addTo(map);
          m.bindPopup(`<strong>${esc(j.title)}</strong><br/>Job · due ${esc(j.due || "—")}`);
          markersRef.current.push(m);
          bounds.push([j.lat, j.lon]);
        });

      if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
      mapInstance.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    }

    init();
    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [tab, data.contacts, data.jobs]);

  const onDragStart = (e, dealId) => {
    e.dataTransfer.setData("dealId", dealId);
  };

  const onDrop = (e, stage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    if (dealId) moveDeal(dealId, stage);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">P</div>
          <div>
            <h1>Pipeline</h1>
            <p>Spatialytics · SMB CRM</p>
          </div>
        </div>
        <nav className="nav-links">
          {[
            ["today", "Today"],
            ["board", "Board"],
            ["contacts", "Contacts"],
            ["jobs", "Jobs"],
            ["map", "Map"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          Data stays in this browser (localStorage).
          <br />
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={resetSeed}>
            Reset sample data
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="stats">
          <div className="stat">
            <div className="label">Pipeline</div>
            <div className="value cyan">{money(stats.pipelineValue)}</div>
          </div>
          <div className="stat">
            <div className="label">Won</div>
            <div className="value green">{money(stats.won)}</div>
          </div>
          <div className="stat">
            <div className="label">Follow-ups (3d)</div>
            <div className="value amber">{stats.dueSoon}</div>
          </div>
          <div className="stat">
            <div className="label">Open jobs</div>
            <div className="value violet">{stats.openJobs}</div>
          </div>
        </div>

        {tab === "today" && (
          <>
            <div className="topbar">
              <h2>Today</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal({ type: "deal" })}>
                  + Deal
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "job" })}>
                  + Job
                </button>
              </div>
            </div>
            <div className="today-list">
              {todayItems.length === 0 && (
                <div className="empty">Nothing due. Add a follow-up on a deal or schedule a job.</div>
              )}
              {todayItems.map((item) => (
                <div key={`${item.kind}-${item.id}`} className={`today-item ${item.overdue ? "overdue" : ""}`}>
                  <div>
                    <span className={`badge ${item.kind === "job" ? "job" : ""}`}>
                      {item.kind === "job" ? "Job" : "Follow-up"}
                    </span>
                    <div style={{ fontWeight: 700, marginTop: 6 }}>{item.title}</div>
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{item.sub}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.85rem", color: item.overdue ? "var(--red)" : "var(--muted)" }}>
                    {item.overdue ? "Overdue · " : ""}
                    {item.when}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "board" && (
          <>
            <div className="topbar">
              <h2>Deal board</h2>
              <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "deal" })}>
                + Deal
              </button>
            </div>
            <div className="board">
              {STAGES.map((stage) => {
                const deals = data.deals.filter((d) => d.stage === stage);
                return (
                  <div
                    key={stage}
                    className="column"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDrop(e, stage)}
                  >
                    <div className="column-header">
                      {stage}
                      <span>{deals.length}</span>
                    </div>
                    <div className="column-body">
                      {deals.map((d) => (
                        <div
                          key={d.id}
                          className="deal-card"
                          draggable
                          onDragStart={(e) => onDragStart(e, d.id)}
                          onDoubleClick={() => setModal({ type: "deal", payload: d })}
                        >
                          <h4>{d.title}</h4>
                          <div className="meta">
                            <span>{contactMap[d.contactId]?.name || "No account"}</span>
                            {d.followUp && <span>Follow-up {d.followUp}</span>}
                          </div>
                          <div className="amount">{money(d.amount)}</div>
                          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setModal({ type: "deal", payload: d })}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteDeal(d.id)}
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "contacts" && (
          <>
            <div className="topbar">
              <h2>Contacts & accounts</h2>
              <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "contact" })}>
                + Contact
              </button>
            </div>
            <div className="card table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Contact</th>
                    <th>City</th>
                    <th>Phone</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.contacts.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        {c.email && (
                          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{c.email}</div>
                        )}
                      </td>
                      <td>{c.contact}</td>
                      <td>{c.city}</td>
                      <td>{c.phone}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setModal({ type: "contact", payload: c })}
                        >
                          Edit
                        </button>{" "}
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteContact(c.id)}
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.contacts.length === 0 && <div className="empty">No contacts yet.</div>}
            </div>
          </>
        )}

        {tab === "jobs" && (
          <>
            <div className="topbar">
              <h2>Field jobs</h2>
              <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "job" })}>
                + Job
              </button>
            </div>
            <div className="card table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Account</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.jobs.map((j) => (
                    <tr key={j.id}>
                      <td>
                        <strong>{j.title}</strong>
                        {j.notes && (
                          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{j.notes}</div>
                        )}
                      </td>
                      <td>{contactMap[j.contactId]?.name || "—"}</td>
                      <td>{j.due || "—"}</td>
                      <td>
                        <span className="badge job">{j.status}</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setModal({ type: "job", payload: j })}
                        >
                          Edit
                        </button>{" "}
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteJob(j.id)}
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.jobs.length === 0 && <div className="empty">No jobs yet.</div>}
            </div>
          </>
        )}

        {tab === "map" && (
          <>
            <div className="topbar">
              <h2>Map</h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                Accounts (markers) · open jobs (purple)
              </p>
            </div>
            <div id="map" ref={mapRef} />
          </>
        )}
      </main>

      {modal && (
        <Modal
          type={modal.type}
          payload={modal.payload}
          contacts={data.contacts}
          onClose={() => setModal(null)}
          onSaveDeal={saveDeal}
          onSaveContact={saveContact}
          onSaveJob={saveJob}
        />
      )}
    </div>
  );
}

function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">");
}

function Modal({ type, payload, contacts, onClose, onSaveDeal, onSaveContact, onSaveJob }) {
  const [form, setForm] = useState(() => payload || defaultForm(type, contacts));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (type === "deal") onSaveDeal(form);
    if (type === "contact") onSaveContact(form);
    if (type === "job") onSaveJob(form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          {payload ? "Edit" : "New"}{" "}
          {type === "deal" ? "deal" : type === "contact" ? "contact" : "job"}
        </h3>
        <form onSubmit={submit}>
          {type === "deal" && (
            <>
              <div className="field">
                <label>Title</label>
                <input required value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="field">
                <label>Account</label>
                <select
                  required
                  value={form.contactId || ""}
                  onChange={(e) => set("contactId", e.target.value)}
                >
                  <option value="">Select…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Stage</label>
                <select value={form.stage || "Lead"} onChange={(e) => set("stage", e.target.value)}>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Amount ($)</label>
                <input
                  type="number"
                  value={form.amount ?? ""}
                  onChange={(e) => set("amount", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Follow-up date</label>
                <input
                  type="date"
                  value={form.followUp || ""}
                  onChange={(e) => set("followUp", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </>
          )}

          {type === "contact" && (
            <>
              <div className="field">
                <label>Account name</label>
                <input required value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="field">
                <label>Primary contact</label>
                <input value={form.contact || ""} onChange={(e) => set("contact", e.target.value)} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="field">
                <label>City</label>
                <input value={form.city || ""} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="field">
                <label>Lat</label>
                <input value={form.lat ?? ""} onChange={(e) => set("lat", e.target.value)} placeholder="46.35" />
              </div>
              <div className="field">
                <label>Lon</label>
                <input value={form.lon ?? ""} onChange={(e) => set("lon", e.target.value)} placeholder="-94.20" />
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </>
          )}

          {type === "job" && (
            <>
              <div className="field">
                <label>Title</label>
                <input required value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="field">
                <label>Account</label>
                <select
                  required
                  value={form.contactId || ""}
                  onChange={(e) => set("contactId", e.target.value)}
                >
                  <option value="">Select…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Due</label>
                <input type="date" value={form.due || ""} onChange={(e) => set("due", e.target.value)} />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={form.status || "Open"} onChange={(e) => set("status", e.target.value)}>
                  <option>Open</option>
                  <option>Done</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function defaultForm(type, contacts) {
  if (type === "deal") {
    return {
      title: "",
      contactId: contacts[0]?.id || "",
      stage: "Lead",
      amount: "",
      followUp: daysFromNow(7),
      notes: "",
    };
  }
  if (type === "contact") {
    return { name: "", contact: "", email: "", phone: "", city: "", lat: "", lon: "", notes: "" };
  }
  return {
    title: "",
    contactId: contacts[0]?.id || "",
    due: daysFromNow(7),
    status: "Open",
    notes: "",
  };
}
