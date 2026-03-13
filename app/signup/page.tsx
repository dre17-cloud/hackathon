"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSignup() {
    setErrorMessage("");

    if (!email || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      alert("Account created successfully!");
      router.push("/login");
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-sm shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-center">Sign Up</h1>

        <p className="text-gray-400 text-sm text-center mb-6">
          Create your account to start studying smarter
        </p>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded bg-gray-800 outline-none border border-gray-700 focus:border-green-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded bg-gray-800 outline-none border border-gray-700 focus:border-green-500"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="p-3 rounded bg-gray-800 outline-none border border-gray-700 focus:border-green-500"
          />

          {errorMessage && (
            <p className="text-red-400 text-sm">{errorMessage}</p>
          )}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="bg-green-600 p-3 rounded hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-sm text-center text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-green-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
