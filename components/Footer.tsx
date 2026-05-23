export default function Footer() {
  return (
    <footer id="contact" className="bg-white border-t border-gray-100 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="text-xl font-bold text-[#1B4332] tracking-tight">toxome</span>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <a href="#features" className="hover:text-[#1B4332] transition-colors">Features</a>
          <a href="#testimonials" className="hover:text-[#1B4332] transition-colors">Testimonials</a>
          <a href="#howitworks" className="hover:text-[#1B4332] transition-colors">How it works</a>
          <a href="mailto:hello@toxome.app" className="hover:text-[#1B4332] transition-colors">Contact</a>
          <a href="/privacypolicy" className="hover:text-[#1B4332] transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-[#1B4332] transition-colors">Terms & Conditions</a>
        </nav>

        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Toxome. All rights reserved.</p>
      </div>
    </footer>
  );
}
