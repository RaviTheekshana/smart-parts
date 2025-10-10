"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { API, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, Send } from "lucide-react";

type VehicleTags = { make?: string; model?: string; yearFrom?: number; yearTo?: number; trim?: string; engine?: string };

type Post = {
  _id: string;
  title: string;
  body?: string;
  votes: number;
  myVote?: -1 | 0 | 1;
  commentsCount?: number;
  createdAt?: string;
  authorName?: string;
  imageUrl?: string;
  vehicleTags?: VehicleTags;
  partTags?: string[];
};

type Answer = {
  _id: string;
  body: string;
  votes?: number;
  authorId?: string;
  createdAt?: string;
};

type PostAndAnswers = { post: Post; answers: Answer[] };

type CommentsResponse = {
  comments: Array<{ _id: string; authorName: string; text: string; createdAt: string }>;
};

export default function CommunityPostPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { id } = useParams() as { id: string };

  const { data, error, mutate } = useSWR<PostAndAnswers>(`/api/posts/${id}`, api);
  const { data: comments, mutate: mutateComments } = useSWR<CommentsResponse>(
    `/api/posts/${id}/comments`,
    api
  );

  const [answerText, setAnswerText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [busyVote, setBusyVote] = useState(false);
  const [busyAnswer, setBusyAnswer] = useState(false);
  const [busyComment, setBusyComment] = useState(false);

  if (error) return <div className="p-6">Error loading.</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  const { post, answers } = data;

  async function vote(delta: 1 | -1) {
    if (!token) return router.push("/login");
    setBusyVote(true);
    try {
      const res = await api<{ votes: number; myVote?: -1 | 0 | 1 }>(`/api/posts/${id}/vote`, {
        method: "POST",
        body: JSON.stringify({ delta }),
      });
      mutate(
        (prev) =>
          prev
            ? {
                ...prev,
                post: {
                  ...prev.post,
                  votes: typeof res.votes === "number" ? res.votes : prev.post.votes,
                  ...(typeof res.myVote !== "undefined" ? { myVote: res.myVote } : {}),
                },
              }
            : prev,
        { revalidate: false }
      );
    } finally {
      setBusyVote(false);
    }
  }

  async function addAnswer() {
    if (!token) return router.push("/login");
    const body = answerText.trim();
    if (!body) return;
    setBusyAnswer(true);
    try {
      await api(`/api/posts/${id}/answers`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setAnswerText("");
      mutate(); // refresh answers & post (commentsCount might be separate)
    } finally {
      setBusyAnswer(false);
    }
  }

  async function addComment() {
    if (!token) return router.push("/login");
    const text = commentText.trim();
    if (!text) return;
    setBusyComment(true);
    try {
      await api(`/api/posts/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setCommentText("");
      mutateComments(); // refresh comments
      mutate(); // refresh post (commentsCount)
    } finally {
      setBusyComment(false);
    }
  }

  const vehicleLine = (() => {
    const v = post.vehicleTags || {};
    const parts = [
      v.make,
      v.model,
      v.yearFrom ? `${v.yearFrom}${v.yearTo ? "–" + v.yearTo : ""}` : undefined,
      v.trim,
      v.engine,
    ].filter(Boolean);
    return parts.join(" • ");
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero */}
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
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Post card */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex gap-4">
            {/* votes */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => vote(1)}
                disabled={busyVote}
                className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border transition
                  ${post.myVote === 1 ? "border-blue-500 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                aria-label="Upvote"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div className="text-sm font-semibold text-slate-700">{post.votes ?? 0}</div>
              <button
                onClick={() => vote(-1)}
                disabled={busyVote}
                className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border transition
                  ${post.myVote === -1 ? "border-rose-500 text-rose-600 bg-rose-50" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                aria-label="Downvote"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* content */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900">{post.title}</h1>

              {/* Image */}
              {post.imageUrl && (
                <img
                  src={`${API}${post.imageUrl}`}
                  alt=""
                  className="mt-3 max-h-96 w-60 h-50 object-cover rounded-xl border"
                />
              )}

              {/* Body */}
              {post.body && (
                <p className="mt-3 text-slate-700 whitespace-pre-wrap">{post.body}</p>
              )}

              {/* Tags */}
              {(vehicleLine || (post.partTags?.length ?? 0) > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {vehicleLine && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-50 text-slate-700">
                      {vehicleLine}
                    </span>
                  )}
                  {(post.partTags ?? []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-50 text-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta */}
              <div className="mt-3 text-xs text-slate-500">
                {post.authorName ? <>By {post.authorName} • </> : null}
                {post.createdAt ? new Date(post.createdAt).toLocaleString() : null}
                {typeof post.commentsCount === "number" ? <> • {post.commentsCount} comments</> : null}
              </div>
            </div>
          </div>
        </article>

        {/* Answer composer */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Your answer</h2>
          <textarea
            rows={5}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder={token ? "Write your answer…" : "Login to answer"}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!token}
          />
          <button
            onClick={addAnswer}
            disabled={!token || !answerText.trim() || busyAnswer}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {busyAnswer ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Post answer
          </button>
        </section>

        {/* Answers */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Answers</h2>
          {answers.length === 0 ? (
            <p className="text-slate-600">No answers yet.</p>
          ) : (
            <ul className="space-y-4">
              {answers.map((a) => (
                <li key={a._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : null}
                  </div>
                  <p className="mt-1 text-slate-800 whitespace-pre-wrap">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Comments */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Comments</h2>

          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={token ? "Write a comment…" : "Login to comment"}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!token}
            />
            <button
              onClick={addComment}
              disabled={!token || !commentText.trim() || busyComment}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 hover:opacity-90 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {!comments ? (
              <div className="text-slate-600">Loading comments…</div>
            ) : comments.comments.length === 0 ? (
              <div className="text-slate-600">No comments yet.</div>
            ) : (
              comments.comments.map((c) => (
                <div key={c._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{c.authorName}</span> •{" "}
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                  <p className="mt-1 text-slate-800">{c.text}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
