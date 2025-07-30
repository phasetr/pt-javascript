export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // D1データベースの接続
    const db = env.DB;
    
    if (!db) {
      return new Response('Database not found', { status: 500 });
    }
    
    try {
      // 簡単なAPI例
      if (url.pathname === '/api/numbers') {
        const result = await db.prepare('SELECT * FROM numbers ORDER BY created_at').all();
        return Response.json(result.results);
      }
      
      // 基本的なHTMLレスポンス
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Numbers App</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .number-item { border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Numbers App</h1>
          <div id="numbers">Loading...</div>
          <script>
            fetch('/api/numbers')
              .then(res => res.json())
              .then(data => {
                const container = document.getElementById('numbers');
                if (data.length === 0) {
                  container.innerHTML = '<p>No numbers found. Please seed the database first.</p>';
                } else {
                  container.innerHTML = data.map(item => 
                    \`<div class="number-item">
                      <h3>\${item.name}</h3>
                      <p>Number: \${item.number}</p>
                      <p>Created: \${new Date(item.created_at * 1000).toLocaleString()}</p>
                    </div>\`
                  ).join('');
                }
              })
              .catch(err => {
                document.getElementById('numbers').innerHTML = '<p>Error loading numbers: ' + err.message + '</p>';
              });
          </script>
        </body>
        </html>
      `;
      
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
      
    } catch (error) {
      return new Response('Error: ' + error.message, { status: 500 });
    }
  }
};