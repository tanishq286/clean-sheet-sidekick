import { personalInfo } from "@/data/portfolio-data";
import { motion } from "framer-motion";

/**
 * BioSection Component
 * Large text bio section
 */
export default function BioSection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-8 md:px-12 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <p className="text-2xl md:text-4xl leading-tight font-['Rubik'] text-foreground">
          {personalInfo.bio}
        </p>
      </motion.div>
    </section>
  );
}
