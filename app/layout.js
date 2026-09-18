import "./globals.css";

export const metadata = {
  title: "Pipeline — Spatialytics",
  description:
    "Lean CRM + jobs + map for Greater Minnesota small businesses. Contacts, deals, and field work without Salesforce complexity.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px 16px",
            padding: "8px 12px",
            background: "rgba(7, 11, 18, 0.95)",
            borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
            fontSize: "0.75rem",
            color: "#94a3b8",
          }}
        >
          <span style={{ fontWeight: 600, color: "#e8eef7" }}>Spatialytics family</span>
          <a href="https://spatialytics-astro.vercel.app" style={{ color: "#38bdf8" }}>
            Spatialytics
          </a>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ color: "#38bdf8", fontWeight: 600 }}>Pipeline</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <a href="https://shiftsprout.vercel.app" style={{ color: "#38bdf8" }}>
            ShiftSprout
          </a>
          <span style={{ opacity: 0.4 }}>·</span>
          <a href="https://spatialytics-astro.vercel.app/subscriptions" style={{ color: "#94a3b8" }}>
            All tools
          </a>
        </div>
        {children}
      </body>
    </html>
  );
}
