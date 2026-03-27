"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Github,
  Linkedin,
  Twitter,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Shield,
  Award,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";

const NAV_COLS = [
  {
    title: "Platform",
    links: [
      { label: "Find Hospitals", href: "/search" },
      { label: "Symptom Analyzer", href: "/symptoms" },
      { label: "Report Analyzer", href: "/reports" },
      { label: "Cost Intelligence", href: "/dashboard" },
      { label: "Upload Bill", href: "/upload" },
      { label: "About Us", href: "/about" },
    ],
  },
  {
    title: "Insurance",
    links: [
      { label: "Cashless Hospitals", href: "/insurance" },
      { label: "Coverage Estimator", href: "/insurance" },
      { label: "Find Insurers", href: "/insurance" },
    ],
  },
  {
    title: "For Hospitals",
    links: [
      { label: "Partner Program", href: "/partner" },
      { label: "Pricing", href: "/pricing" },
      { label: "B2B Data API", href: "/b2b" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Insurance", href: "/insurance" },
      { label: "Admin Portal", href: "/admin" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Contact", href: "mailto:hello@clearmed.in" },
    ],
  },
];

const TRUST_BADGES = [
  { label: "NABH Certified Network", icon: <Shield className="w-3.5 h-3.5" /> },
  { label: "Verified Bill Data", icon: <Award className="w-3.5 h-3.5" /> },
  { label: "AI-Powered Insights", icon: <TrendingUp className="w-3.5 h-3.5" /> },
];

const SOCIALS = [
  { href: "https://github.com/", icon: <Github className="w-4 h-4" />, label: "GitHub" },
  { href: "https://linkedin.com/", icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn" },
  { href: "https://twitter.com/", icon: <Twitter className="w-4 h-4" />, label: "Twitter" },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#0d1117] text-gray-400 overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[400px] rounded-full bg-brand-700/8 blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-teal-700/8 blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8">

        {/* ── Top section: Brand + Nav columns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-10 pb-12 border-b border-white/[0.07]">

          {/* Brand column — wider */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            {/* Logo + Name */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative w-9 h-9 shrink-0">
                <Image src="/logo.png" alt="ClearMed" fill className="object-contain" />
              </div>
              <span className="text-white font-extrabold text-2xl tracking-tight">
                ClearMed
              </span>
            </div>

            {/* Tagline */}
            <p className="text-teal-400 font-semibold text-sm tracking-wide mb-3">
              Smarter Choices. Better Care.
            </p>

            <p className="text-sm leading-relaxed text-gray-500 mb-5">
              Empowering patients with transparent healthcare data across India. Real bills. Real costs. Smarter decisions.
            </p>

            {/* Trust badges */}
            <div className="space-y-2 mb-6">
              {TRUST_BADGES.map((t) => (
                <div key={t.label} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-teal-400">{t.icon}</span>
                  {t.label}
                </div>
              ))}
            </div>

            {/* Contact info */}
            <div className="space-y-2 mb-6 text-xs text-gray-500">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>India Innovate 2026 Hackathon, New Delhi, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <a href="mailto:hello@clearmed.in" className="hover:text-white transition-colors duration-200">
                  hello@clearmed.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>+91 98765 43210</span>
              </div>
            </div>

            {/* Socials */}
            <div className="flex gap-2">
              {SOCIALS.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2, scale: 1.1 }}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-brand-600 text-gray-500 hover:text-white flex items-center justify-center transition-all duration-300"
                  aria-label={s.label}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Nav columns */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {NAV_COLS.map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.08 * i }}
              >
                <h3 className="text-white/80 font-semibold text-xs uppercase tracking-widest mb-4">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-gray-500 hover:text-white flex items-center gap-1.5 group transition-colors duration-200"
                      >
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-teal-400 shrink-0" />
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Bottom strip ── */}
        <div className="pt-8">
          {/* Centered brand + tagline */}
          <div className="flex flex-col items-center text-center mb-6">
            <h3 className="text-xl font-extrabold text-white tracking-tight mb-1">
              ClearMed
            </h3>
            <p className="text-teal-400 font-medium text-sm tracking-wide">
              Smarter Choices. Better Care.
            </p>
          </div>

          {/* Meta row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} ClearMed Health Technologies Pvt. Ltd.</p>

            <div className="flex items-center gap-1.5">
              <span>Built by</span>
              <a
                href="https://www.linkedin.com/in/ajay-kushwaha-aj"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 font-semibold transition-colors duration-200"
              >
                Ajay Kushwaha
              </a>
              <span className="mx-1 text-gray-700">•</span>
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-400 fill-red-400 animate-pulse mx-0.5" />
              <span>for India 🇮🇳</span>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-gray-400 transition-colors duration-200">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-400 transition-colors duration-200">Terms</Link>
              <Link href="mailto:hello@clearmed.in" className="hover:text-gray-400 transition-colors duration-200">Contact</Link>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-gray-700 text-[11px] mt-4 max-w-3xl mx-auto leading-relaxed">
            Medical disclaimer: ClearMed does not provide medical diagnosis or advice. Always consult a qualified doctor.
          </p>

          {/* Hackathon badge */}
          <div className="flex justify-center mt-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/15 text-amber-400 text-xs font-semibold">
              🏆 India Innovate 2026 Hackathon
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
