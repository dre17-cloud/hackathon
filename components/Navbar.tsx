import Image from "next/image";

export default function Navbar() {
  return (

    <nav className="w-full bg-gray-900 text-white p-4 flex justify-between items-center">

    <Image
    src="/iconnect.PNG"
    alt="IConnect Logo"
    width={120}
    height={40}
    className="object-contain"
    />

      <div className="flex gap-6">

        <a href="/dashboard" className="hover:text-blue-400">
          Dashboard
        </a>

        <a href="/upload" className="hover:text-blue-400">
          Upload
        </a>

        <a href="/search" className="hover:text-blue-400">
          Search
        </a>

        <a href="/login" className="hover:text-red-400">
          Logout
        </a>

      </div>

    </nav>

  )
}