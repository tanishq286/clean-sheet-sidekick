import { personalInfo } from "@/data/portfolio-data";
import { motion } from "framer-motion";

/**
 * HeroSection Component
 * Resume-style header with 3 rows:
 * Row 1: Photo (left) | First name (right)
 * Row 2: Last name (left) | Contact info (right)
 * Row 3: Job title (left, orange) | Website/Social (right)
 */
export default function HeroSection() {
  // Split name into first and last
  const [firstName, lastName] = personalInfo.name.split(" ");
  const phone = personalInfo.phone;

  return (
    <div className="w-full max-w-7xl mx-auto px-8 md:px-12 py-16">
      {/* Row 1: First Name | Photo */}
      <div className="flex flex-row justify-between items-center gap-4 md:gap-8 mb-6 md:mb-8">
        {/* Left: First Name */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="text-[clamp(3rem,12vw,8rem)] font-bold leading-none tracking-tighter uppercase text-foreground font-['Rubik']">
            {firstName}
          </h1>
        </motion.div>

        {/* Right: Photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <img
            src={personalInfo.avatar}
            alt={personalInfo.name}
            className="w-24 h-16 md:w-48 md:h-32 object-cover border-2 md:border-8 border-orange rounded-full"
          />
        </motion.div>
      </div>

      {/* Divider Line 1 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="h-px bg-black origin-left mb-8"
      />

      {/* Row 2: Contact Info | Last Name */}
      <div className="flex flex-row justify-between items-center gap-4 md:gap-8 mb-6 md:mb-8">
        {/* Left: Contact Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col space-y-0.5 md:space-y-1 text-xs md:text-base text-orange text-left font-['Rubik']"
        >
          <a
            href={`tel:${phone}`}
            className="hover:opacity-80 transition-opacity"
          >
            {phone}
          </a>
          <div>{personalInfo.location.city}</div>
          <a
            href={`mailto:${personalInfo.email}`}
            className="hover:opacity-80 transition-opacity"
          >
            {personalInfo.email}
          </a>
        </motion.div>

        {/* Right: Last Name */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h1 className="text-[clamp(3rem,12vw,8rem)] font-bold leading-none tracking-tighter uppercase text-foreground font-['Rubik']">
            {lastName}
          </h1>
        </motion.div>
      </div>

      {/* Divider Line 2 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="h-px bg-black origin-left mb-8"
      />

      {/* Row 3: Job Title | Website/Social */}
      <div className="flex flex-row justify-between items-center gap-4 md:gap-8 mb-6 md:mb-8">
        {/* Left: Job Title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <h2 className="text-[clamp(3rem,12vw,8rem)] font-bold leading-none tracking-tighter uppercase text-orange font-['Rubik']">
            {personalInfo.title}
          </h2>
        </motion.div>

        {/* Right: Website & Social */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col space-y-0.5 md:space-y-1 text-xs md:text-base text-orange text-right font-['Rubik']"
        >
          <a
            href={`https://${personalInfo.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            {personalInfo.website}
          </a>
          <div>@{personalInfo.website.split(".")[0]}</div>
        </motion.div>
      </div>

      {/* Divider Line 3 (Bottom) */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="h-px bg-black origin-left"
      />
    </div>
  );
}
