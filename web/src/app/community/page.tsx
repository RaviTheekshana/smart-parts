"use client";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function CommunityPage() {
  const { token } = useAuth();
  type Post = {
    _id: string;
    title: string;
    votes: number;
    // add other fields if needed
  };

  type PostsResponse = {
    posts: Post[];
  };

  const { data, error } = useSWR<PostsResponse>("/api/posts", api);
  if (error) return <div>Error</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div className="min-h-screen mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:items-center lg:gap-12 lg:px-8 lg:py-28">
      <h1>Community</h1>
      <p>{token ? "Logged in" : "Not logged in (login to post/answer/vote)"}</p>
      <ul>
        {data.posts.map((p: Post) =>
          <li key={p._id}>{p.title} (votes {p.votes})</li>
        )}
      </ul>
    </div>
  );
}
