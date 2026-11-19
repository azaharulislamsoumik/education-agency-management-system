
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess("Login successful! Redirecting to Dashboard...");

      router.replace("/dashboard");
      router.refresh();

    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-6xl min-h-[650px] bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* LEFT SIDE - LOGIN FORM */}
        <div className="flex flex-col justify-center px-8 py-12 sm:px-14">

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900">
                Edunex<span className="text-blue-600">io</span>
            </h1>

            <p className="text-sm text-gray-500 mt-2">
              Education Agency Management System
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome Back!
            </h2>

            <p className="text-gray-500 mt-2">
              Sign in to access your account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-400 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setError("Please contact your administrator to reset your password.")
                  }
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </button>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-400 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* REMEMBER ME */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              <label
                htmlFor="remember"
                className="ml-2 text-sm text-gray-600"
              >
                Remember me
              </label>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                {success}
              </p>
            )}

            {/* SIGN IN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

          </form>

          <p className="text-xs text-gray-400 text-center mt-10">
            © 2026 Edunexio. All rights reserved.
          </p>
        </div>

        {/* RIGHT SIDE - INFORMATION PANEL */}
        <div className="hidden md:flex flex-col justify-center items-center bg-blue-700 text-white px-12 py-16">

          <div className="max-w-md">
            <div className="mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-3xl font-bold">
                E
              </div>
            </div>

            <h2 className="text-4xl font-bold leading-tight">
              Manage Your Education Agency in One Place.
            </h2>

            <p className="text-blue-100 mt-6 leading-7">
              Manage student applications, universities, documents,
              employees, and daily agency operations through one
              centralized platform.
            </p>

            <div className="mt-10 space-y-5">

              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  ✓
                </span>
                <span className="text-blue-50">
                  Student Application Management
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  ✓
                </span>
                <span className="text-blue-50">
                  University and Document Tracking
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  ✓
                </span>
                <span className="text-blue-50">
                  Employee and Office Management
                </span>
              </div>

            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
