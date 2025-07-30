import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cloudflare D1 + Next.js App',
  description: 'A simple app using Cloudflare D1 and Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>Numbers App</h1>
          {children}
        </div>
      </body>
    </html>
  )
}