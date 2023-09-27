import { Database } from "../../../database.types";
import { Headers } from "next/dist/compiled/@edge-runtime/primitives";
import Link from "next/link";

type Blog = Database["public"]["Tables"]["blogs"]["Row"]

async function fetchBlogs() {
  const res = await fetch(`${process.env.url}/rest/v1/blogs?select=*`, {
    headers: new Headers({ apikey: process.env.apikey as string }),
    // cache: "no-store"
    cache: "force-cache"
  });
  if (!res.ok) {
    throw new Error("Failed to fetch data in server");
  }
  const blogs: Blog[] = await res.json();
  return blogs;
}

export default async function BlogListStatic() {
  const blogs = await fetchBlogs();
  return <div className="p-4">
    {blogs?.map((blog) => (
      <li key={blog.id} className="my-1 text-base">
        <Link prefetch={false} href={`/blogs/${blog.id}`}>{blog.title}</Link>
      </li>
    ))}
  </div>;
}
