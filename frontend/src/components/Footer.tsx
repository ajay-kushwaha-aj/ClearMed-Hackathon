"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Github, Linkedin, Twitter, MapPin, Mail, Phone, ArrowRight, Shield, Award, TrendingUp } from "lucide-react";
import Image from "next/image";

const links = {
  product: [
    { label: "Find Hospitals", href: "/hospitals" },
    { label: "Symptom Analyzer", href: "/symptoms" },
    { label: "Cost Trends", href: "/costs" },
    { label: "Reports", href: "/reports" },
    { label: "Reviews", href: "/reviews" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Insurance", href: "/insurance" },
    { label: "Admin Portal", href: "/admin" },
  ],
  trust: [
    { label: "NABH Certified Network", icon: <Shield className="w-3.5 h-3.5" /> },
    { label: "Verified Bill Data", icon: <Award className="w-3.5 h-3.5" /> },
    { label: "AI-Powered Insights", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ],
};

const socials = [
  { href: "https://github.com/", icon: <Github className="w-4 h-4" />, label: "GitHub" },
  { href: "https://linkedin.com/", icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn" },
  { href: "https://twitter.com/", icon: <Twitter className="w-4 h-4" />, label: "Twitter" },
];

export default function Footer() {
  return (
    <footer className="relative bg-gray-900 text-gray-300 overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-brand-700/10 blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-teal-700/10 blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="relative w-8 h-8">
                  <Image src="/logo.png" alt="ClearMed" fill className="object-contain" />
                </div>
                <span className="text-white font-extrabold text-xl tracking-tight">ClearMed</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-400 mb-5">
                Smarter Choices. Better Care. Empowering patients with transparent healthcare data across India.
              </p>

              {/* Trust badges */}
              <div className="space-y-2">
                {links.trust.map((t) => (
                  <div key={t.label} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-teal-400">{t.icon}</span>
                    {t.label}
                  </div>
                ))}
              </div>

              {/* Socials */}
              <div className="flex gap-2 mt-6">
                {socials.map((s) => (
                  <motion.a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -2, scale: 1.1 }}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-brand-600 text-gray-400 hover:text-white flex items-center justify-center transition-colors duration-300"
                    aria-label={s.label}
                  >
                    {s.icon}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Product links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Product</h3>
            <ul className="space-y-2.5">
              {links.product.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 group transition-colors duration-200"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-teal-400" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Company</h3>
            <ul className="space-y-2.5">
              {links.company.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 group transition-colors duration-200"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-teal-400" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>India Innovate 2026 Hackathon, New Delhi, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <a href="mailto:hello@clearmed.in" className="hover:text-white transition-colors duration-200">hello@clearmed.in</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
            </ul>

            {/* Hackathon badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              🏆 India Innovate 2026 Hackathon
            </div>
          </motion.div>
        </div>

        {/* Bottom strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-gray-500">
          <p className="flex items-center gap-1.5">
            © {new Date().getFullYear()} ClearMed. Made with{" "}
            <Heart className="w-3 h-3 text-red-400 fill-red-400 animate-pulse" /> in India.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-gray-300 transition-colors duration-200">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors duration-200">Terms of Service</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors duration-200">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
