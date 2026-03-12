export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center text-center px-6">

      <h1 className="text-5xl font-bold mb-6">
        AI Study Assistant
      </h1>

      <p className="text-gray-400 text-lg mb-10 max-w-xl">
        Upload study materials and get personalized learning resources.
        Our AI finds the best notes, videos, and tutorials for your learning style.
      </p>

      <div className="flex gap-6">

        <a href="/login">
          <button className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition">
            Login
          </button>
        </a>

        <a href="/signup">
          <button className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-500 transition">
            Signup
          </button>
        </a>

      </div>

    </main>
  );
}