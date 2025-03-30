import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  Form,
  useLocation,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/cloudflare";

import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export default function App() {
  const location = useLocation();
  
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white shadow-sm dark:bg-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-xl font-bold text-gray-800 dark:text-white">
                CRGA
              </Link>
              <nav>
                <ul className="flex space-x-4">
                  <li>
                    <Link 
                      to="/" 
                      className={`text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white ${
                        location.pathname === '/' ? 'font-medium' : ''
                      }`}
                    >
                      ホーム
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/auth/page1" 
                      className={`text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white ${
                        location.pathname === '/auth/page1' ? 'font-medium' : ''
                      }`}
                    >
                      認証ページ1
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/auth/page2" 
                      className={`text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white ${
                        location.pathname === '/auth/page2' ? 'font-medium' : ''
                      }`}
                    >
                      認証ページ2
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/login" 
                      className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      ログイン
                    </Link>
                  </li>
                  <li>
                    <Form method="post" action="/logout">
                      <button 
                        type="submit"
                        className="ml-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                      >
                        ログアウト
                      </button>
                    </Form>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
