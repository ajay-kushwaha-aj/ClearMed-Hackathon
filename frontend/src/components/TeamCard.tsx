"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Linkedin, ExternalLink } from "lucide-react";

interface TeamMember {
    name: string;
    role: string;
    bio: string;
    image: string;
    linkedin: string;
}

const gradients = [
    "from-brand-400/20 to-teal-400/20",
    "from-purple-400/20 to-pink-400/20",
    "from-amber-400/20 to-orange-400/20",
    "from-teal-400/20 to-cyan-400/20",
    "from-rose-400/20 to-brand-400/20",
];

const TeamCard = ({ member, index }: { member: TeamMember; index: number }) => {
    const grad = gradients[index % gradients.length];
    const [imageError, setImageError] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -10, scale: 1.025 }}
            className="group relative"
        >
            {/* Glow halo */}
            <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg`} />

            <div className="relative bg-white border border-gray-100 rounded-2xl p-7 flex flex-col items-center text-center transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl hover:border-transparent">
                {/* Ambient background shape */}
                <div className={`absolute -top-20 -right-20 w-44 h-44 rounded-full bg-gradient-to-br ${grad} blur-3xl opacity-50 group-hover:opacity-80 transition-all duration-700`} />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 blur-2xl" />

                {/* Avatar Wrapper */}
                <div className="relative mb-5 z-10">
                    {/* Circle Image / Initials */}
                    <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg ring-4 ring-white group-hover:ring-teal-100 transition-all duration-500 bg-gray-50 flex items-center justify-center relative">
                        {/* Initials fallback - shown when image fails */}
                        {imageError && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${grad} flex items-center justify-center text-2xl font-black text-gray-800/60 select-none`}>
                                {member.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                            </div>
                        )}

                        {!imageError && (
                            <img
                                src={member.image}
                                alt={member.name}
                                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-700 ease-out"
                                onError={() => {
                                    setImageError(true);
                                }}
                                onLoad={(e) => {
                                    const img = e.currentTarget;
                                    if (img.naturalWidth === 0) setImageError(true);
                                }}
                            />
                        )}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white shadow-sm z-20" />
                </div>

                <div className="relative z-10 flex flex-col items-center flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors duration-300">
                        {member.name}
                    </h3>

                    <span className={`mt-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r ${grad} text-gray-700 shadow-sm`}>
                        {member.role}
                    </span>

                    <p className="text-gray-500 text-sm mt-3 leading-relaxed line-clamp-3 flex-1">
                        {member.bio}
                    </p>

                    <motion.a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0077B5]/10 text-[#0077B5] text-sm font-semibold hover:bg-[#0077B5] hover:text-white transition-all duration-300 shadow-sm border border-[#0077B5]/20"
                    >
                        <Linkedin className="w-3.5 h-3.5" />
                        Connect
                        <ExternalLink className="w-3 h-3" />
                    </motion.a>
                </div>
            </div>
        </motion.div>
    );
};

export default TeamCard;