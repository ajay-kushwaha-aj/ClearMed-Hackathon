"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

interface TeamMember {
    name: string;
    role: string;
    bio: string;
    image: string;
    linkedin: string;
}

const TeamCard = ({ member, index }: { member: TeamMember; index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.12 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative"
        >
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-teal-500/15 to-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

            <div className="relative bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-500 overflow-hidden shadow-sm hover:shadow-lg hover:border-teal-100">
                <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-teal-50 blur-2xl group-hover:bg-teal-100 transition-all duration-700" />

                <div className="relative mb-5">
                    <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-teal-100 group-hover:ring-teal-300 transition-all duration-500 relative bg-gray-50">
                        <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-all duration-300">
                    {member.name}
                </h3>

                <p className="text-brand-600 text-sm font-semibold mt-1 tracking-wide uppercase">
                    {member.role}
                </p>

                <p className="text-gray-500 text-sm mt-3 leading-relaxed line-clamp-3">
                    {member.bio}
                </p>

                <motion.a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-50 text-teal-700 text-sm font-medium hover:bg-teal-600 hover:text-white transition-all duration-300 shadow-sm"
                >
                    View Profile
                    <ExternalLink className="w-3.5 h-3.5" />
                </motion.a>
            </div>
        </motion.div>
    );
};

export default TeamCard; "use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

interface TeamMember {
    name: string;
    role: string;
    bio: string;
    image: string;
    linkedin: string;
}

const TeamCard = ({ member, index }: { member: TeamMember; index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.12 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative"
        >
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-teal-500/15 to-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

            <div className="relative bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-500 overflow-hidden shadow-sm hover:shadow-lg hover:border-teal-100">
                <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-teal-50 blur-2xl group-hover:bg-teal-100 transition-all duration-700" />

                <div className="relative mb-5">
                    <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-teal-100 group-hover:ring-teal-300 transition-all duration-500 relative bg-gray-50">
                        <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-all duration-300">
                    {member.name}
                </h3>

                <p className="text-brand-600 text-sm font-semibold mt-1 tracking-wide uppercase">
                    {member.role}
                </p>

                <p className="text-gray-500 text-sm mt-3 leading-relaxed line-clamp-3">
                    {member.bio}
                </p>

                <motion.a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-50 text-teal-700 text-sm font-medium hover:bg-teal-600 hover:text-white transition-all duration-300 shadow-sm"
                >
                    View Profile
                    <ExternalLink className="w-3.5 h-3.5" />
                </motion.a>
            </div>
        </motion.div>
    );
};

export default TeamCard;