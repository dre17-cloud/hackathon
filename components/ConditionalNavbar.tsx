

"use client";
 
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
 
// Add any routes where the navbar should be hidden
const HIDDEN_ON = ["/onboarding", "/login", "/signup"];
 
export default function ConditionalNavbar() {
  const pathname = usePathname();
  const hide = HIDDEN_ON.some((path) => pathname.startsWith(path));
  if (hide) return null;
  return <Navbar />;
}
 