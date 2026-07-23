/**
 * Portfolio Type Definitions
 * TypeScript interfaces for portfolio data structures
 */

export interface PersonalInfo {
  name: string;
  title: string;
  location: { city: string; country: string };
  website: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  skills: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string;
  media?: string;
  current: boolean;
}

export interface JourneyMilestone {
  id: string;
  year: string;
  persona: string;
  title: string;
  description: string;
  phase: string;
}

export interface StoryQuote {
  quote: string;
  context: string;
}

export interface Client {
  id: string;
  name: string;
  logo?: string;
}

export interface Writing {
  id: string;
  title: string;
  publication: string;
  date: string;
  url: string;
  contributors?: string[];
  featured: boolean;
}

export interface Speaking {
  id: string;
  event: string;
  date: string;
  location: string;
  talk: string;
  description?: string;
  url?: string;
  recordingUrl?: string;
  slidesUrl?: string;
  upcoming: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  liveUrl?: string;
  githubUrl?: string;
  status: "active" | "archived";
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  location: string;
  details?: string;
}

export interface SocialLink {
  platform: string;
  username?: string;
  url: string;
}

export interface Language {
  language: string;
  proficiency: string;
}

export interface SkillCategory {
  category: string;
  skills: string;
}
