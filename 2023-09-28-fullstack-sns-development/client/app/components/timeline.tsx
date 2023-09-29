"use client";
import Post from "@/app/components/post";
import apiClient from "@/app/lib/api-client";
import { PostType } from "@/types";
import React from "react";

export default function Timeline() {
  const [postText, setPostText] = React.useState("");
  const [latestPosts, setLatestPosts] = React.useState<PostType[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const newPost = await apiClient.post("/posts/post", {
        content: postText
      });
      setLatestPosts((prevPosts) => [newPost.data, ...prevPosts]);
      setPostText("");
    } catch (err) {
      alert("You should login first!");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto py-4">
        <div className="bg-white shadow-md rounded p-4 mb-4">
          <form onSubmit={handleSubmit}>
        <textarea
          className="w-full h-24 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="What's on your mind?"
          onChange={(e) => setPostText(e.target.value)}
          value={postText}
        ></textarea>
            <button
              type="submit"
              className="mt-2 bg-gray-700 hover:bg-green-700 duration-200 text-white font-semibold py-2 px-4 rounded"
            >
              post
            </button>
          </form>
        </div>
        {latestPosts.map((post) => (<Post key={post.id} post={post}/>))}
      </main>
    </div>
  );
}
