"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {

  const router = useRouter();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [loading,setLoading] = useState(false);
  const [errorMessage,setErrorMessage] = useState("");

  async function handleLogin(){

    setErrorMessage("");

    if(!email || !password){
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if(error){
      setErrorMessage(error.message);
    }else{
      router.push("/dashboard");
    }

  }

  return (

    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">

      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-sm shadow-lg">

        <h1 className="text-2xl font-bold mb-2 text-center">
          Login
        </h1>

        <p className="text-gray-400 text-sm text-center mb-6">
          Welcome back. Continue studying smarter
        </p>

        <div className="flex flex-col gap-4">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="p-3 rounded bg-gray-800 border border-gray-700 focus:border-green-500 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="p-3 rounded bg-gray-800 border border-gray-700 focus:border-green-500 outline-none"
          />

          {errorMessage && (
            <p className="text-red-400 text-sm">
              {errorMessage}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-green-600 p-3 rounded hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-sm text-center text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-green-400 hover:underline">
              Sign Up
            </Link>
          </p>

        </div>

      </div>

    </main>

  );
}