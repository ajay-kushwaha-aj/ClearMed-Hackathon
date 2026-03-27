"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Users, Sparkles, Heart, Target, Lightbulb, Shield } from "lucide-react";
import TeamCard from "@/components/TeamCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRef } from "react";

const team = [
    {
        name: "Ajay Kushwaha",
        role: "Biomedical Sciences",
        bio: "Passionate about building scalable healthcare platforms. Leads the technical architecture and ensures seamless user experiences.",
        image: "/team/member1.png",
        linkedin: "https://www.linkedin.com/in/ajay-kushwaha-aj",
    },
    {
        name: "Subhra Jyoti Dey",
        role: "Instrumentation",
        bio: "Transforms raw patient data into actionable insights. Specializes in healthcare analytics and machine learning models.",
        image: "/team/member2.png",
        linkedin: "https://www.linkedin.com/in/subhra-jyoti-dey-455b03292",
    },
    {
        name: "Bisman Kaur",
        role: "Biomedical Sciences",
        bio: "Architects robust APIs and database systems. Ensures data privacy and HIPAA-compliant infrastructure.",
        image: "/team/member3.png",
        linkedin: "https://www.linkedin.com/in/bisman-kaur-90177927b",
    },
    {
        name: "Sudipta Paul",
        role: "Biomedical Sciences",
        bio: "Crafts intuitive interfaces that make healthcare data accessible. Advocates for patient-first design thinking.",
        image: "/team/member4.png",
        linkedin: "https://www.linkedin.com/in/sudipta-paul-ba9273318",
    },
    {
        name: "Wishesh Joshi",
        role: "Biomedical Science",
        bio: "Bridges the gap between technology and healthcare needs. Drives product strategy and stakeholder alignment.",
        image: "/team/member5.png",
        linkedin: "https://www.linkedin.com/in/wishesh-joshi-24075b280",
    },
];

const values = [
    {
        icon: <Shield className="w-6 h-6" />,
        title: "Transparency",
        description: "We believe every patient deserves to know the true cost of their healthcare, before they step into the hospital.",
        color: "from-brand-400 to-blue-500",
        bg: "from-brand-50 to-blue-50",
    },
    {
        icon: <Heart className="w-6 h-6" />,
        title: "Patient First",
        description: "Every feature we build is designed around the patient's journey — from symptom to recovery.",
        color: "from-rose-400 to-pink-500",
        bg: "from-rose-50 to-pink-50",
    },
    {
        icon: <Lightbulb className="w-6 h-6" />,
        title: "Data-Driven",
        description: "We harness real patient bills and outcomes to give you insights that go beyond star ratings.",
        color: "from-amber-400 to-orange-500",
        bg: "from-amber-50 to-orange-50",
    },
    {
        icon: <Target className="w-6 h-6" />,
        title: "Accuracy",
        description: "Our scores are backed by verified bills, expert feedback, and our proprietary ClearMed Score algorithm.",
        color: "from-teal-400 to-emerald-500",
        bg: "from-teal-50 to-emerald-50",
    },
];

const stats = [
    { value: "10+", label: "Hospitals Listed" },
    { value: "5", label: "Team Members" },
    { value: "🏆", label: "Hackathon Project" },
    { value: "Real", label: "Verified Data" },
];

const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

export default function AboutPage() {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -80]);
    const parallaxOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1">
                {/* ── Hero ───────────────────────────────────────── */}
                <section
                    ref={heroRef}
                    className="relative overflow-hidden bg-gradient-to-br from-white via-brand-50/40 to-teal-50/30 pt-32 pb-24"
                >
                    {/* Decorative floating blobs */}
                    <motion.div
                        animate={{ scale: [1, 1.08, 1], rotate: [0, 5, 0] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-brand-200/30 to-teal-200/20 blur-3xl pointer-events-none"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.12, 1], rotate: [0, -6, 0] }}
                        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-200/20 to-pink-200/20 blur-3xl pointer-events-none"
                    />

                    {/* Floating illustration pills */}
                    {[
                        { label: "₹4.8L avg cost", delay: 0, x: "15%", y: "20%" },
                        { label: "4.8 ★ Rating", delay: 0.3, x: "75%", y: "15%" },
                        { label: "NABH Verified", delay: 0.6, x: "80%", y: "70%" },
                        { label: "AI-Powered", delay: 0.9, x: "10%", y: "72%" },
                    ].map((pill) => (
                        <motion.div
                            key={pill.label}
                            style={{ left: pill.x, top: pill.y }}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 0.7, scale: 1, y: [0, -8, 0] }}
                            transition={{
                                opacity: { delay: pill.delay + 0.4, duration: 0.5 },
                                scale: { delay: pill.delay + 0.4, duration: 0.5 },
                                y: { duration: 4 + pill.delay, repeat: Infinity, ease: "easeInOut", delay: pill.delay },
                            }}
                            className="absolute hidden lg:flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 shadow-sm text-xs font-semibold text-gray-600 px-3 py-1.5 rounded-full pointer-events-none"
                        >
                            <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                            {pill.label}
                        </motion.div>
                    ))}

                    <motion.div
                        style={{ y: parallaxY, opacity: parallaxOpacity }}
                        className="relative z-10 container mx-auto px-6 text-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-4 py-1.5 mb-8 shadow-sm"
                        >
                            <Sparkles className="w-4 h-4 text-teal-600" />
                            <span className="text-sm font-semibold text-teal-700">India Innovate 2026</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight"
                        >
                            The people
                            <br />
                            <span className="bg-gradient-to-r from-brand-600 via-teal-500 to-brand-600 bg-clip-text text-transparent">
                                behind ClearMed
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.25 }}
                            className="text-gray-500 text-lg max-w-2xl mx-auto mt-6 leading-relaxed"
                        >
                            We're a team of passionate builders, designers, and healthcare enthusiasts committed to making healthcare decisions transparent and data-driven.
                        </motion.p>

                        {/* Stats pills */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            transition={{ delayChildren: 0.4 }}
                            className="flex flex-wrap justify-center gap-4 mt-12"
                        >
                            {stats.map((stat) => (
                                <motion.div
                                    key={stat.label}
                                    variants={itemVariants}
                                    whileHover={{ y: -3, scale: 1.05 }}
                                    className="bg-white border border-gray-100 shadow-md rounded-2xl px-6 py-4 min-w-[110px] text-center cursor-default"
                                >
                                    <div className="text-2xl font-black text-brand-700">{stat.value}</div>
                                    <div className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </section>

                {/* ── Values ─────────────────────────────────────── */}
                <section className="py-20 bg-white">
                    <div className="container max-w-6xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-14"
                        >
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">What drives us</h2>
                            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                                Our core values shape every decision, from the algorithm to the interface.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {values.map((v, i) => (
                                <motion.div
                                    key={v.title}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-400 overflow-hidden"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${v.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                    <div className="relative z-10">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${v.color} text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                            {v.icon}
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2 text-lg">{v.title}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Team ───────────────────────────────────────── */}
                <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
                    <div className="container max-w-6xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col items-center text-center mb-14"
                        >
                            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-4 py-1.5 mb-4">
                                <Users className="w-4 h-4 text-brand-600" />
                                <span className="text-sm font-semibold text-brand-700">Our Team</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Meet the builders</h2>
                            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                                Five students from VIT Bhopal with one mission — making healthcare costs transparent for every Indian.
                            </p>
                        </motion.div>

                        {/* First row: 3 cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            {team.slice(0, 3).map((member, i) => (
                                <TeamCard key={member.name} member={member} index={i} />
                            ))}
                        </div>

                        {/* Second row: 2 cards centered */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            {team.slice(3).map((member, i) => (
                                <TeamCard key={member.name} member={member} index={i + 3} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Mission CTA banner ─────────────────────────── */}
                <section className="py-16 bg-gradient-to-r from-brand-600 via-brand-700 to-teal-600 relative overflow-hidden">
                    <motion.div
                        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-10 -left-10 w-60 h-60 rounded-full bg-white/5 blur-3xl pointer-events-none"
                    />
                    <motion.div
                        animate={{ x: [0, -15, 0], y: [0, 12, 0] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                        className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none"
                    />
                    <div className="container max-w-4xl mx-auto px-6 text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                                Healthcare transparency is our mission
                            </h2>
                            <p className="text-brand-100 text-lg max-w-2xl mx-auto leading-relaxed">
                                Built for India Innovate 2026, ClearMed is a step toward a future where no patient is surprised by a hospital bill.
                            </p>
                            <div className="mt-8 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 text-white text-sm font-semibold backdrop-blur-sm">
                                <Heart className="w-4 h-4 fill-rose-300 text-rose-300 animate-pulse" />
                                Made with love in India 🇮🇳
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}