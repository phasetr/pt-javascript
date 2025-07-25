import { jsxRenderer } from "hono/jsx-renderer";

export default jsxRenderer(({ children }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Numbers CRUD Sample</title>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "sans-serif" }}>
        <header
          style={{
            backgroundColor: "#333",
            color: "white",
            padding: "1rem",
          }}
        >
          <h1 style={{ margin: 0 }}>
            <a href="/" style={{ color: "white", textDecoration: "none" }}>
              Numbers Management
            </a>
          </h1>

        </header>
        <main style={{ padding: "2rem", minHeight: "calc(100vh - 120px)" }}>
          {children}
        </main>
        <footer
          style={{
            backgroundColor: "#333",
            color: "white",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0 }}>© 2025 Numbers CRUD Sample</p>
        </footer>
      </body>
    </html>
  );
});
