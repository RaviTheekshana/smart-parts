"use client";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function CommunityPage() {
  const { token } = useAuth();
  const { data, error } = useSWR("/api/posts", api);
  if (error) return <div>Error</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h1>Community</h1>
      <p>{token ? "Logged in" : "Not logged in (login to post/answer/vote)"}</p>
      <ul>
        {data.posts.map((p:any)=>
          <li key={p._id}>{p.title} (votes {p.votes})</li>
        )}
      </ul>
    </div>
  );
}
