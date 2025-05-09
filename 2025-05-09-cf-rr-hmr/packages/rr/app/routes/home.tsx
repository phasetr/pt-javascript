import type { Route } from "./+types/home";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <main className="flex items-center justify-center pt-16 pb-4">
    <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
      <div className="max-w-[500px] w-full space-y-6 px-4">
        <h2 className="leading-6 text-gray-700 dark:text-gray-200 text-center text-8xl font-bold">
          TEST
        </h2>

        <div className="flex justify-center gap-4 mt-8">
          <a
            href="/users"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            ユーザー一覧
          </a>
          <a
            href="/products"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            商品一覧
          </a>
        </div>
      </div>
    </div>
  </main>
}
