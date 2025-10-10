"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useMemo, useState } from "react";
import { MessageSquare, ArrowUp, ArrowDown, RefreshCw, Send, Plus } from "lucide-react";

type Post = {
  _id: string;
  title: string;
  body?: string;
  votes: number;
  commentsCount?: number;
  myVote?: -1 | 0 | 1;
  createdAt?: string;
  authorName?: string;
};
type PostsResponse = { posts: Post[] };

type Comment = { _id: string; authorName: string; text: string; createdAt: string };
type CommentsResponse = { comments: Comment[] };

// local helper
function sortPosts(posts: Post[], mode: "top" | "new"): Post[] {
  const arr = [...posts];
  if (mode === "top") {
    return arr.sort((a, b) => {
      const vDiff = (b.votes ?? 0) - (a.votes ?? 0);
      if (vDiff !== 0) return vDiff;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }
  // "new"
  return arr.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export default function CommunityPage() {
  const { token } = useAuth();

  // Sort mode UI state
  const [sortMode, setSortMode] = useState<"top" | "new">("top");

  // You can keep your existing endpoint; we sort client-side based on sortMode.
  // (If you later add server sorting, just pass `?sort=top|new` here.)
  const { data, error, isLoading, mutate } = useSWR<PostsResponse>("/api/posts", api);
  const posts = data?.posts ?? [];

  // Sorted view for rendering
  const sortedPosts = useMemo(() => sortPosts(posts, sortMode), [posts, sortMode]);

  // UPDATED: no toggle-to-zero, ignore duplicate same-direction click, switch adjusts by ±2
async function vote(postId: string, delta: 1 | -1) {
  if (!token) return alert("Please login to vote.");

  // Find current vote state for this post
  const cur = (data?.posts ?? []).find((p) => p._id === postId);
  const prevMy: -1 | 0 | 1 = cur?.myVote ?? 0;

  // If the user clicks the same direction again -> alert and do nothing
  if (prevMy === delta) {
    alert("You already voted this way.");
    return;
  }

  // Compute next myVote and the exact +/-1 impact on the total
  // Rules (single-step):
  // - prev  0 -> +1 on up,  -1 on down
  // - prev +1 -> clicking down => 0 (diff -1)
  // - prev -1 -> clicking up   => 0 (diff +1)
  let nextMy: -1 | 0 | 1 = prevMy;
  let diff = 0;

  if (delta === 1) {
    if (prevMy === -1) { nextMy = 0;  diff = +1; }
    else if (prevMy === 0) { nextMy = +1; diff = +1; }
  } else { // delta === -1
    if (prevMy === +1) { nextMy = 0;  diff = -1; }
    else if (prevMy === 0) { nextMy = -1; diff = -1; }
  }

  if (diff === 0) return; // should not happen because of the same-direction guard

  await mutate(
    async (prev) => {
      if (!prev) return prev;

      const next = {
        ...prev,
        posts: prev.posts.map((p) => {
          if (p._id !== postId) return p;
          return { ...p, myVote: nextMy, votes: (p.votes ?? 0) + diff };
        }) as Post[],
      };

      try {
        await api(`/api/posts/${postId}/vote`, {
          method: "POST",
          body: JSON.stringify({ delta }), // server will apply single-step logic too
        });
      } catch (e: any) {
        // If anything odd happens, let SWR revalidate and resync
        return prev;
      }

      return next;
    },
    { revalidate: true, rollbackOnError: true }
  );
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-22 pb-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Community</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Connect with fellow auto enthusiasts and find the perfect parts for your vehicle.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Community</h1>
              <p className="text-sm text-slate-600">
                {token ? "Logged in - you can vote and comment" : "Not logged in - login to vote and comment"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Sort toggle */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1">
              <button
                onClick={() => setSortMode("top")}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  sortMode === "top" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Top
              </button>
              <button
                onClick={() => setSortMode("new")}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  sortMode === "new" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                New
              </button>
            </div>

            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {/* Optional: link to a Create Post page */}
            <a
              href={token ? "/community/new" : "/login"}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              New Post
            </a>
          </div>
        </div>

        {/* List / skeleton / empty */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl border border-slate-200 bg-white animate-pulse" />
            ))
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
              Error loading posts. Please try again.
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-700">No posts yet.</p>
            </div>
          ) : (
            sortedPosts.map((p) => <PostCard key={p._id} post={p} onVote={(d) => vote(p._id, d)} />)
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post,
  onVote,
}: {
  post: Post;
  onVote: (delta: 1 | -1) => void;
}) {
  const { token } = useAuth();
  const [showComments, setShowComments] = useState(false);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Votes column */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => onVote(1)}
            className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border transition
              ${post.myVote === 1 ? "border-blue-500 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-500 hover:bg-slate-50"}
            `}
            aria-label="Upvote"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div className="text-sm font-semibold text-slate-700">{post.votes ?? 0}</div>
          <button
            onClick={() => onVote(-1)}
            className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border transition
              ${post.myVote === -1 ? "border-rose-500 text-rose-600 bg-rose-50" : "border-slate-200 text-slate-500 hover:bg-slate-50"}
            `}
            aria-label="Downvote"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">{post.title}</h2>
          {post.body && <p className="mt-1 text-slate-700">{post.body}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {post.authorName && <span className="text-xs text-slate-500">By {post.authorName}</span>}
            {post.createdAt && (
              <span className="text-xs text-slate-500">• {new Date(post.createdAt).toLocaleString()}</span>
            )}
            <span className="text-xs text-slate-400">•</span>
            <span className="text-sm text-slate-600">{post.commentsCount ?? 0} comments</span>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setShowComments((s) => !s)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <MessageSquare className="w-4 h-4" />
              {showComments ? "Hide" : "Show"} comments
            </button>
            <a
              href={`/community/${post._id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              View post
            </a>
          </div>

          {/* Comments */}
          {showComments && <CommentsThread postId={post._id} />}
        </div>
      </div>
    </article>
  );
}

function CommentsThread({ postId }: { postId: string }) {
  const { token } = useAuth();
  const key = `/api/posts/${postId}/comments`;
  const { data, error, isLoading, mutate } = useSWR<CommentsResponse>(key, api);
  const comments = data?.comments ?? [];
  const [text, setText] = useState("");

  async function addComment() {
    if (!token) return alert("Please login to comment.");
    const val = text.trim();
    if (!val) return;
    // Optimistic UI: append a temp comment
    const tempId = "tmp_" + Math.random().toString(36).slice(2);
    const temp: Comment = { _id: tempId, authorName: "You", text: val, createdAt: new Date().toISOString() };
    await mutate(
      async (prev) => {
        const next = { comments: [temp, ...(prev?.comments ?? [])] };
        await api(`/api/posts/${postId}/comments`, {
          method: "POST",
          body: JSON.stringify({ text: val }),
        });
        return next;
      },
      { revalidate: true, rollbackOnError: true }
    );
    setText("");
    // Also refresh the posts list count (optional)
    globalMutate("/api/posts");
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      {/* Composer */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={token ? "Write a comment…" : "Login to comment"}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!token}
        />
        <button
          onClick={addComment}
          disabled={!token || text.trim().length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-2 hover:opacity-90 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg border border-slate-200 bg-white animate-pulse" />
          ))
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
            Failed to load comments.
          </div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-slate-600">No comments yet. Be the first!</div>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">{c.authorName}</span> •{" "}
                {new Date(c.createdAt).toLocaleString()}
              </div>
              <p className="mt-1 text-slate-800">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
