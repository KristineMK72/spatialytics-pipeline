/** Minimal CSV helpers (no dependency) */

export function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(val) {
  const s = String(val ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Parse CSV text into array of objects using header row */
export function parseCsv(text) {
  const rows = parseCsvRows(text);
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).filter((r) => r.some((c) => c.trim())).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (row[i] ?? "").trim();
    });
    return obj;
  });
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && next === "\n") i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else {
      cur += c;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

export async function geocodeAddress(query) {
  if (!query || !String(query).trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.length) return null;
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    display: data[0].display_name,
  };
}
