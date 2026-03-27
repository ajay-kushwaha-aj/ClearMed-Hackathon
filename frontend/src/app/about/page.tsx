"use client";

import { motion } from "framer-motion";
import { Users, Sparkles } from "lucide-react";
import TeamCard from "@/components/TeamCard";
import Navbar from "@/components/Navbar";

// Notice how the image paths now point to the public directory
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

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* We use your existing Navbar for consistent branding */}
            <Navbar />

            <main className="flex-1 pt-24">
                {/* Hero section */}
                <section className="container mx-auto px-6 pt-12 pb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-teal-50 rounded-full px-4 py-2 mb-6 border border-teal-100">
                            <Sparkles className="w-4 h-4 text-teal-600" />
                            <span className="text-sm font-medium text-teal-700">Meet the Team</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                            The people behind
                            <br />
                            <span className="text-teal-600">ClearMed</span>
                        </h1>

                        <p className="text-gray-600 text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
                            We're a team of passionate builders, designers, and healthcare enthusiasts committed to making healthcare decisions transparent and data-driven.
                        </p>
                    </motion.div>

                    {/* Stats bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-6 mt-10"
                    >
                        {[
                            { label: "Team Members", value: "5" },
                            { label: "Hackathon Project", value: "🏆" },
                            { label: "Powered by", value: "Real Data" },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white border border-gray-100 shadow-sm rounded-xl px-6 py-3 flex items-center gap-3">
                                <span className="text-xl font-bold text-teal-600">{stat.value}</span>
                                <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </section>

                {/* Team grid */}
                <section className="container max-w-6xl mx-auto px-6 pb-24">
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <Users className="w-6 h-6 text-brand-600" />
                        <h2 className="text-3xl font-bold text-gray-900">Our Team</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {team.slice(0, 3).map((member, i) => (
                            <TeamCard key={member.name} member={member} index={i} />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {team.slice(3).map((member, i) => (
                            <TeamCard key={member.name} member={member} index={i + 3} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
} "use client";

import { motion } from "framer-motion";
import { Users, Sparkles } from "lucide-react";
import TeamCard from "@/components/TeamCard";
import Navbar from "@/components/Navbar";

// Notice how the image paths now point to the public directory
const team = [
    {
        name: "Member 1",
        role: "Full Stack Developer",
        bio: "Passionate about building scalable healthcare platforms. Leads the technical architecture and ensures seamless user experiences.",
        image: "/team/member1.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 2",
        role: "Data Scientist",
        bio: "Transforms raw patient data into actionable insights. Specializes in healthcare analytics and machine learning models.",
        image: "/team/member2.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 3",
        role: "Backend Engineer",
        bio: "Architects robust APIs and database systems. Ensures data privacy and HIPAA-compliant infrastructure.",
        image: "/team/member3.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 4",
        role: "UX Designer",
        bio: "Crafts intuitive interfaces that make healthcare data accessible. Advocates for patient-first design thinking.",
        image: "/team/member4.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 5",
        role: "Product Manager",
        bio: "Bridges the gap between technology and healthcare needs. Drives product strategy and stakeholder alignment.",
        image: "/team/member5.png",
        linkedin: "https://linkedin.com/in/",
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* We use your existing Navbar for consistent branding */}
            <Navbar />

            <main className="flex-1 pt-24">
                {/* Hero section */}
                <section className="container mx-auto px-6 pt-12 pb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-teal-50 rounded-full px-4 py-2 mb-6 border border-teal-100">
                            <Sparkles className="w-4 h-4 text-teal-600" />
                            <span className="text-sm font-medium text-teal-700">Meet the Team</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                            The people behind
                            <br />
                            <span className="text-teal-600">ClearMed</span>
                        </h1>

                        <p className="text-gray-600 text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
                            We're a team of passionate builders, designers, and healthcare enthusiasts committed to making healthcare decisions transparent and data-driven.
                        </p>
                    </motion.div>

                    {/* Stats bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-6 mt-10"
                    >
                        {[
                            { label: "Team Members", value: "5" },
                            { label: "Hackathon Project", value: "🏆" },
                            { label: "Powered by", value: "Real Data" },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white border border-gray-100 shadow-sm rounded-xl px-6 py-3 flex items-center gap-3">
                                <span className="text-xl font-bold text-teal-600">{stat.value}</span>
                                <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </section>

                {/* Team grid */}
                <section className="container max-w-6xl mx-auto px-6 pb-24">
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <Users className="w-6 h-6 text-brand-600" />
                        <h2 className="text-3xl font-bold text-gray-900">Our Team</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {team.slice(0, 3).map((member, i) => (
                            <TeamCard key={member.name} member={member} index={i} />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {team.slice(3).map((member, i) => (
                            <TeamCard key={member.name} member={member} index={i + 3} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
} "use client";

import { motion } from "framer-motion";
import { Users, Sparkles } from "lucide-react";
import TeamCard from "@/components/TeamCard";
import Navbar from "@/components/Navbar";

// Notice how the image paths now point to the public directory
const team = [
    {
        name: "Member 1",
        role: "Full Stack Developer",
        bio: "Passionate about building scalable healthcare platforms. Leads the technical architecture and ensures seamless user experiences.",
        image: "/team/member1.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 2",
        role: "Data Scientist",
        bio: "Transforms raw patient data into actionable insights. Specializes in healthcare analytics and machine learning models.",
        image: "/team/member2.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 3",
        role: "Backend Engineer",
        bio: "Architects robust APIs and database systems. Ensures data privacy and HIPAA-compliant infrastructure.",
        image: "/team/member3.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 4",
        role: "UX Designer",
        bio: "Crafts intuitive interfaces that make healthcare data accessible. Advocates for patient-first design thinking.",
        image: "/team/member4.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 5",
        role: "Product Manager",
        bio: "Bridges the gap between technology and healthcare needs. Drives product strategy and stakeholder alignment.",
        image: "/team/member5.png",
        linkedin: "https://linkedin.com/in/",
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* We use your existing Navbar for consistent branding */}
            <Navbar />

            <main className="flex-1 pt-24">
                {/* Hero section */}
                <section className="container mx-auto px-6 pt-12 pb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-teal-50 rounded-full px-4 py-2 mb-6 border border-teal-100">
                            <Sparkles className="w-4 h-4 text-teal-600" />
                            <span className="text-sm font-medium text-teal-700">Meet the Team</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                            The people behind
                            <br />
                            <span className="text-teal-600">ClearMed</span>
                        </h1>

                        <p className="text-gray-600 text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
                            We're a team of passionate builders, designers, and healthcare enthusiasts committed to making healthcare decisions transparent and data-driven.
                        </p>
                    </motion.div>

                    {/* Stats bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-6 mt-10"
                    >
                        {[
                            { label: "Team Members", value: "5" },
                            { label: "Hackathon Project", value: "🏆" },
                            { label: "Powered by", value: "Real Data" },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white border border-gray-100 shadow-sm rounded-xl px-6 py-3 flex items-center gap-3">
                                <span className="text-xl font-bold text-teal-600">{stat.value}</span>
                                <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </section>

                {/* Team grid */}
                <section className="container max-w-6xl mx-auto px-6 pb-24">
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <Users className="w-6 h-6 text-brand-600" />
                        <h2 className="text-3xl font-bold text-gray-900">Our Team</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {team.slice(0, 3).map((member, i) => (
                            <TeamCard key={member.name} member={member} index={i} />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {team.slice(3).map((member, i) => (
                            <TeamCard key={member.name} member={member} index={i + 3} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
} "use client";

import { motion } from "framer-motion";
import { Users, Sparkles } from "lucide-react";
import TeamCard from "@/components/TeamCard";
import Navbar from "@/components/Navbar";

// Notice how the image paths now point to the public directory
const team = [
    {
        name: "Member 1",
        role: "Full Stack Developer",
        bio: "Passionate about building scalable healthcare platforms. Leads the technical architecture and ensures seamless user experiences.",
        image: "/team/member1.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 2",
        role: "Data Scientist",
        bio: "Transforms raw patient data into actionable insights. Specializes in healthcare analytics and machine learning models.",
        image: "/team/member2.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 3",
        role: "Backend Engineer",
        bio: "Architects robust APIs and database systems. Ensures data privacy and HIPAA-compliant infrastructure.",
        image: "/team/member3.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 4",
        role: "UX Designer",
        bio: "Crafts intuitive interfaces that make healthcare data accessible. Advocates for patient-first design thinking.",
        image: "/team/member4.png",
        linkedin: "https://linkedin.com/in/",
    },
    {
        name: "Member 5",
        role: "Product Manager",
        bio: "Bridges the gap between technology and healthcare needs. Drives product strategy and stakeholder alignment.",
        image: "/team/member5.png",
        linkedin: "https://linkedin.com/in/",
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* We use your existing Navbar for consistent branding */}
            <Navbar />

            <main className="flex-1 pt-24">
                {/* Hero section */}
                <section className="container mx-auto px-6 pt-12 pb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-teal-50 rounded-full px-4 py-2 mb-6 border border-teal-100">
                            <Sparkles className="w-4 h-4 text-teal-600" />
                            <span className="text-sm font-medium text-teal-700">Meet the Team</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                            The people behind
                            <br />
                            <span className="text-teal-600">ClearMed</span>
                        </h1>

                        <p className="text-gray-600 text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
                            We're a team of passionate builders, designers, and healthcare enthusiasts committed to making healthcare decisions transparent and data-driven.
                        </p>
                    </motion.div>

                    {/* Stats bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-6 mt-10"
                    >
                        {[
                            { label: "Team Members", value: "5" },
                            { label: "Hackathon Project", value: "🏆" },
                            { label: "Powered by", value: "Real Data" },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white border border-gray-100 shadow-sm rounded-xl px-6 py-3 flex items-center gap-3">
                                <span className="text-xl font-bold text-teal-600">{stat.value}</span>
                                <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </section>

                {/* Team grid */}
                <section className="container max-w-6xl mx-auto px-6 pb-24">
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <Users className="w-6 h-6 text-brand-600" />
                        <h2 className="text-3xl font-bold text-gray-900">Our Team</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {team.slice(0, 3).map((member, i) => (
                            <TeamCard key={member.name} member={member} index={i} />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {team.slice(3).map((member, i) => (
                            <TeamCard key={member.name} member={member} index={i + 3} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}