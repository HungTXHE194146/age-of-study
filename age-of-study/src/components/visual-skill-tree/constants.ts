import { BookOpen, Star, Trophy, Video } from "lucide-react";

export const TEACHER_STICKY_COLORS: Record<string, string> = {
  grade: "#fef08a",
  subject: "#bbf7d0",
  chapter: "#bfdbfe",
  lesson: "#fbcfe8",
};

export const NODE_ICONS: Record<string, any> = {
  grade: Trophy,
  subject: BookOpen,
  chapter: Star,
  lesson: Video,
};

export const EMPTY_NODE_IDS: number[] = [];
