"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User as UserIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type LoginResp = { token: string };

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTos, setAcceptTos] = useState(true); // default true for demo; toggle as you like

  // Optional: prefill demo data in dev
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      setFormData({ name: "Admin", email: "admin@example.com", password: "admin123" });
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setAcceptTos(checked);
      return;
    }
    setFormData((s) => ({ ...s, [name]: value }));
    setErrors((s) => ({ ...s, [name]: undefined }));
  }

  function validate() {
    const next: typeof errors = {};
    if (!formData.name.trim()) next.name = "Name is required.";
    if (!formData.email) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) next.email = "Enter a valid email.";
    if (!formData.password) next.password = "Password is required.";
    else if (formData.password.length < 6) next.password = "Use at least 6 characters.";
    if (!acceptTos) next.name = (next.name ? next.name + " " : "") + "Please accept the terms.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email,
          password: formData.password,
        }),
      });

      const res = await api<LoginResp>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      // Auto-login after successful registration
      login(res.token);
      router.push("/catalog");
    } catch (err: any) {
      const msg = err?.message || "Unknown error";
      setErrors((s) => ({ ...s, password: "Registration failed. " + msg }));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:items-center lg:gap-12 lg:px-8 lg:pt-28 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4 relative">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.10),transparent)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent)]" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Create your account
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Start your journey in a few seconds
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={[
                    "w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800",
                    "border rounded-xl transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent",
                    errors.name ? "border-red-300 dark:border-red-600" : "border-slate-200 dark:border-slate-700",
                    "text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400",
                  ].join(" ")}
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={[
                    "w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800",
                    "border rounded-xl transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent",
                    errors.email ? "border-red-300 dark:border-red-600" : "border-slate-200 dark:border-slate-700",
                    "text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400",
                  ].join(" ")}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={[
                    "w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800",
                    "border rounded-xl transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent",
                    errors.password ? "border-red-300 dark:border-red-600" : "border-slate-200 dark:border-slate-700",
                    "text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400",
                  ].join(" ")}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Terms & Login link */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTos}
                  onChange={handleInputChange}
                  name="acceptTos"
                  className="w-4 h-4 text-blue-600 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span className="text-slate-600 dark:text-slate-400">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/terms")}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Terms
                  </button>{" "}
                  &{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/privacy")}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Privacy
                  </button>
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Demo hint */}
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Tip: For Dev, we prefill sample data to speed up testing.
            </p>
          </form>

          {/* Bottom note */}
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl" />
        <div className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-xl" />
      </div>
    </div>
  );
}
