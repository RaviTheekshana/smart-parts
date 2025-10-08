"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Send } from "lucide-react";

export default function NewPostPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">
          Please{" "}
          <a href="/login" className="text-blue-600 underline">
            login
          </a>{" "}
          to create a post.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return alert("Title is required");
    setIsSubmitting(true);
    try {
      await api("/api/posts", {
        method: "POST",
        body: JSON.stringify({ title, body }),
      });
      router.push("/community"); // back to community list
    } catch (err: any) {
      alert("Failed to create post: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-18 pb-2">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Community</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Connect with fellow auto enthusiasts and find the perfect parts for your vehicle.
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-4 bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          Create a New Post
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What do you want to ask or share?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Body
            </label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide more details here (optional)..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publish Post
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
