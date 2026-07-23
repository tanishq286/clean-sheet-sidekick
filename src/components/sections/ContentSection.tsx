import { experience, education, languages, skillCategories } from "@/data/portfolio-data";
import { motion } from "framer-motion";

/**
 * ContentSection Component
 * Two-column layout with Work Experience (left) and Education/Languages/Skills (right)
 */

function formatDateRange(start: string, end: string | null): string {
  const startYear = start.split('-')[0];
  const endDisplay = end ? end.split('-')[0] : 'Present';
  return `${startYear} - ${endDisplay}`;
}

export default function ContentSection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-8 md:px-12 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left Column: Work Experience */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2 className="text-orange uppercase tracking-wide mb-8 font-['Rubik'] text-lg font-medium">
            WORK EXPERIENCE
          </h2>
          {experience.map((job) => (
            <div key={job.id} className="grid grid-cols-[150px_1fr] gap-6 mb-8 last:mb-0">
              {/* Left: Date Period */}
              <div className="text-orange font-['Rubik'] text-base font-medium uppercase">
                {formatDateRange(job.startDate, job.endDate)}
              </div>

              {/* Right: Title + Description */}
              <div>
                <div className="italic mb-2 font-['Rubik'] text-base font-medium uppercase">
                  {job.role}, {job.company}
                </div>
                <p className="text-sm leading-relaxed font-['Rubik'] text-foreground">
                  {job.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Right Column: Education, Languages, Skills */}
        <motion.div
          className="space-y-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Education */}
          <div>
            <h3 className="text-orange uppercase tracking-wide mb-8 font-['Rubik'] text-lg font-medium">
              EDUCATION
            </h3>
            {education.map((edu) => (
              <div key={edu.id} className="grid grid-cols-[150px_1fr] gap-6 mb-8 last:mb-0">
                {/* Left: Date Period */}
                <div className="text-orange font-['Rubik'] text-base font-medium uppercase">
                  {edu.startYear} - {edu.endYear}
                </div>

                {/* Right: Institution + Degree */}
                <div>
                  <div className="font-['Rubik'] text-base text-foreground">
                    {edu.institution}, {edu.degree} in {edu.field}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Languages */}
          <div>
            <h3 className="text-orange uppercase tracking-wide mb-8 font-['Rubik'] text-lg font-medium">
              LANGUAGES
            </h3>
            {languages.map((lang) => (
              <div key={lang.language} className="grid grid-cols-[150px_1fr] gap-6 mb-8 last:mb-0">
                {/* Left: Language */}
                <div className="text-orange font-['Rubik'] text-base font-medium uppercase">
                  {lang.language}
                </div>

                {/* Right: Proficiency */}
                <div className="font-['Rubik'] text-base text-foreground">
                  {lang.proficiency}
                </div>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-orange uppercase tracking-wide mb-8 font-['Rubik'] text-lg font-medium">
              SKILLS
            </h3>
            {skillCategories.map((category) => (
              <div key={category.category} className="grid grid-cols-[150px_1fr] gap-6 mb-8 last:mb-0">
                {/* Left: Category */}
                <div className="text-orange font-['Rubik'] text-base font-medium uppercase">
                  {category.category}
                </div>

                {/* Right: Skills */}
                <p className="font-['Rubik'] text-base text-foreground leading-relaxed">
                  {category.skills}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
