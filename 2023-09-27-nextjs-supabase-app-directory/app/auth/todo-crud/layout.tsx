import EditTask from "@/app/components/todo-edit";
import { Suspense } from "react";
import Spinner from "@/app/components/spinner";
import TodoList from "@/app/components/todo-list";

export default async function TodoLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex">
      <aside className={`h-[calc(100vh-56px)] w-1/4 bg-gray-200`}>
        <EditTask/>
        <Suspense fallback={<Spinner/>}>
          <TodoList/>
        </Suspense>
      </aside>
      <main className="flex flex-1 justify-center">
        {children}
      </main>
    </section>);
}
