import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "LRW - Local Remix WebSocket" },
    { name: "description", content: "Remix with HTTP API and WebSocket API" },
  ];
};

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-16">
        <header className="flex flex-col items-center gap-9">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            LRW - Local Remix WebSocket
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Remix with HTTP API and WebSocket API
          </p>
        </header>
        
        <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-gray-200 p-8 dark:border-gray-700">
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            API Demos
          </p>
          
          <div className="flex gap-4">
            <Link
              to="/api-demo"
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 font-medium text-white hover:bg-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
              </svg>
              HTTP API Demo
            </Link>
            
            <Link
              to="/websocket-demo"
              className="flex items-center justify-center gap-2 rounded-lg bg-purple-500 px-6 py-3 font-medium text-white hover:bg-purple-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
              WebSocket Demo
            </Link>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>This project demonstrates how to integrate HTTP API and WebSocket API with Remix.</p>
            <p className="mt-2">The API is implemented using Hono and is located in the <code className="rounded bg-gray-100 px-1 py-0.5 font-mono dark:bg-gray-800">app/api</code> directory.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
