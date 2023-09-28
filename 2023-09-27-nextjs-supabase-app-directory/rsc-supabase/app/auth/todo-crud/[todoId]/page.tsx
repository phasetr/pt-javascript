import { createServerComponentSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "../../../../../database.types";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { format } from "date-fns";

type PageProps = { params: { todoId: string } }

export default async function TodoDetailPage({ params }: PageProps) {
  const supabase = createServerComponentSupabaseClient<Database>({ headers, cookies });
  // const { data: todo, error } = await supabase
  const { data: todo } = await supabase
    .from("todos")
    .select("*")
    .eq("id", params.todoId)
    .single();
  if (!todo) return notFound();
  return (
    <div className="mt-16 border-2 p-8">
      <p>Task ID: {todo.id}</p>
      <p>Title: {todo.title}</p>
      <p>Status: {todo.completed ? "done" : "not yet"}</p>
      <p>Created At: {todo && format(new Date(todo.created_at), "yyyy-MM-dd HH:mm:ss")}</p>
    </div>
  );
}
