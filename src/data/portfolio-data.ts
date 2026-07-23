/**
 * Portfolio Data
 * Single source of truth for all portfolio content
 */

import type {
  PersonalInfo,
  Experience,
  Education,
  Language,
  SkillCategory,
} from "@/types/portfolio";

// ===== Portfolio Data =====

export const personalInfo: PersonalInfo = {
  name: "Maya Chen",
  title: "STRATEGIST",
  location: { city: "Brooklyn, New York", country: "USA" },
  website: "www.mayachen.co",
  email: "hello@mayachen.co",
  phone: "347-555-0192",
  avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=800",
  bio: "I help brands find their voice and audiences find connection. With over a decade of experience at the intersection of strategy and storytelling, I partner with visionary founders, cultural institutions, and creative teams to build meaningful brands that resonate deeply and drive lasting impact.",
  skills: "Brand Strategy, Creative Direction, Visual Identity, Storytelling, Campaign Development, Art Direction, Content Strategy, Workshop Facilitation, Trend Forecasting, Cultural Insights, Client Relations, Cross-functional Leadership",
};

export const experience: Experience[] = [
  {
    id: "exp-1",
    company: "Independent Practice",
    role: "Creative Consultant & Strategist",
    location: "New York, NY",
    startDate: "2020-01",
    endDate: null,
    description: "Advising startups, cultural institutions, and Fortune 500 brands on creative strategy and brand positioning. Led rebranding initiatives that increased client engagement by 200%. Facilitated strategic workshops for executive teams at Nike, Spotify, and MoMA. Developed go-to-market creative strategies for 12+ product launches.",
    current: true,
  },
  {
    id: "exp-2",
    company: "Wolff Olins",
    role: "Senior Brand Strategist",
    location: "New York, NY",
    startDate: "2016-09",
    endDate: "2019-12",
    description: "Led brand strategy for clients including Google, Uber, and The Metropolitan Museum of Art. Directed cross-functional teams of designers, writers, and researchers. Pioneered the agency's cultural insights practice, identifying emerging trends that informed campaign direction. Work recognized with D&AD and Cannes Lions awards.",
    current: false,
  },
  {
    id: "exp-3",
    company: "IDEO",
    role: "Design Researcher & Strategist",
    location: "San Francisco, CA",
    startDate: "2013-06",
    endDate: "2016-08",
    description: "Conducted human-centered design research across healthcare, education, and consumer goods sectors. Co-authored thought leadership on the future of retail experience. Developed innovation frameworks adopted by clients including Ford and Target. Mentored junior researchers and facilitated design thinking workshops globally.",
    current: false,
  },
];

export const education: Education[] = [
  {
    id: "edu-1",
    institution: "Rhode Island School of Design",
    degree: "Master of Fine Arts",
    field: "Graphic Design",
    startYear: "2011",
    endYear: "2013",
    location: "Providence, RI",
    details: "Thesis: 'The Semiotics of Digital Brand Identity'",
  },
  {
    id: "edu-2",
    institution: "New York University",
    degree: "Bachelor of Arts",
    field: "Media, Culture & Communication",
    startYear: "2007",
    endYear: "2011",
    location: "New York, NY",
  },
];

export const languages: Language[] = [
  { language: "English", proficiency: "Native" },
  { language: "Mandarin", proficiency: "Fluent" },
  { language: "French", proficiency: "Conversational" },
];

export const skillCategories: SkillCategory[] = [
  {
    category: "Strategy & Research",
    skills: "Brand Strategy, Creative Direction, Trend Forecasting, Cultural Insights, Consumer Research, Competitive Analysis",
  },
  {
    category: "Creative Execution",
    skills: "Visual Identity, Art Direction, Storytelling, Campaign Development, Content Strategy",
  },
  {
    category: "Leadership & Consulting",
    skills: "Workshop Facilitation, Client Relations, Cross-functional Leadership, Mentorship, Executive Presentations",
  },
];
