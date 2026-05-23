"use client";
import { useState } from "react";
import Link from "next/link";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="text-xl font-bold text-[#1B4332] tracking-tight">toxome</span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-[#1B4332] transition-colors">Features</a>
          <a href="#testimonials" className="hover:text-[#1B4332] transition-colors">Testimonials</a>
          <a href="#howitworks" className="hover:text-[#1B4332] transition-colors">How it works</a>
          <a href="#contact" className="hover:text-[#1B4332] transition-colors">Contact</a>
        </nav>

        <a
          href="https://apps.apple.com"
          className="hidden md:inline-flex items-center gap-2 bg-[#1B4332] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#2D6A4F] transition-colors"
        >
          Get the App
        </a>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg">
          <div className={`w-5 h-0.5 bg-gray-800 transition-all ${open ? "rotate-45 translate-y-1.5" : ""}`} />
          <div className={`w-5 h-0.5 bg-gray-800 mt-1.5 transition-all ${open ? "opacity-0" : ""}`} />
          <div className={`w-5 h-0.5 bg-gray-800 mt-1.5 transition-all ${open ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4 text-sm font-medium text-gray-700">
          <a href="#features" onClick={() => setOpen(false)}>Features</a>
          <a href="#testimonials" onClick={() => setOpen(false)}>Testimonials</a>
          <a href="#howitworks" onClick={() => setOpen(false)}>How it works</a>
          <a href="#contact" onClick={() => setOpen(false)}>Contact</a>
          <a href="https://apps.apple.com" className="bg-[#1B4332] text-white text-center py-2.5 rounded-full font-semibold">
            Get the App
          </a>
        </div>
      )}
    </header>
  );
}
