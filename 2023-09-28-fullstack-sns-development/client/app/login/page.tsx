"use client";
import apiClient from "@/app/lib/api-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: validate email and password
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      if (res.status !== 200) {
        console.log(res);
        // TODO: 適切なエラーメッセージを設定して画面に表示する
        return;
      }
      const token = res.data.token;
      router.push("/");
    } catch (err) {
      alert(err);
    }
  }

  return (
    <div
      style={{ height: "88vh" }}
      className="flex flex-col justify-center py-12 sm:px-6 lg:px-8"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Login
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="mt-6">
              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
