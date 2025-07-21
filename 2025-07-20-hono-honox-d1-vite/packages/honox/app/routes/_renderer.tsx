import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/app/style.css" />
        <title>{title || 'HonoX App'}</title>
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
})
