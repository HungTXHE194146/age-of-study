export interface SubjectTheme {
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  // Default theme
  default: {
    icon: "📚",
    color: "#3b82f6", // blue-500
    bgColor: "#dbeafe", // blue-100
    borderColor: "#1d4ed8", // blue-700
  },
  // Mathematics
  "Toán": {
    icon: "🧮",
    color: "#ef4444", // red-500
    bgColor: "#fee2e2", // red-100
    borderColor: "#b91c1c", // red-700
  },
  "Toán Học": {
    icon: "🧮",
    color: "#ef4444",
    bgColor: "#fee2e2",
    borderColor: "#b91c1c",
  },
  // English
  "Tiếng Anh": {
    icon: "🇬🇧",
    color: "#8b5cf6", // violet-500
    bgColor: "#ede9fe", // violet-100
    borderColor: "#6d28d9", // violet-700
  },
  "English": {
    icon: "🇬🇧",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    borderColor: "#6d28d9",
  },
  // Science
  "Tự nhiên và Xã hội": {
    icon: "🧪",
    color: "#10b981", // emerald-500
    bgColor: "#d1fae5", // emerald-100
    borderColor: "#047857", // emerald-700
  },
  "Khoa học": {
    icon: "🧪",
    color: "#10b981",
    bgColor: "#d1fae5",
    borderColor: "#047857",
  },
  // Ethics / Morality
  "Đạo đức": {
    icon: "❤️",
    color: "#ec4899", // pink-500
    bgColor: "#fce7f3", // pink-100
    borderColor: "#be185d", // pink-700
  },
  // Art
  "Mỹ thuật": {
    icon: "🎨",
    color: "#f59e0b", // amber-500
    bgColor: "#fef3c7", // amber-100
    borderColor: "#b45309", // amber-700
  },
  // Music
  "Âm nhạc": {
    icon: "🎵",
    color: "#6366f1", // indigo-500
    bgColor: "#e0e7ff", // indigo-100
    borderColor: "#4338ca", // indigo-700
  },
  // Physical Education
  "Giáo dục thể chất": {
    icon: "⚽",
    color: "#f97316", // orange-500
    bgColor: "#ffedd5", // orange-100
    borderColor: "#c2410c", // orange-700
  },
  // IT
  "Tin học": {
    icon: "💻",
    color: "#06b6d4", // cyan-500
    bgColor: "#cffafe", // cyan-100
    borderColor: "#0e7490", // cyan-700
  },
};

export function getSubjectTheme(subjectName: string): SubjectTheme {
  // Try exact match first
  if (SUBJECT_THEMES[subjectName]) {
    return SUBJECT_THEMES[subjectName];
  }

  // Try partial match
  const sortedKeys = Object.keys(SUBJECT_THEMES)
    .filter(key => key !== 'default')
    .sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (subjectName.includes(key)) {
      return SUBJECT_THEMES[key];
    }
  }

  return SUBJECT_THEMES.default;
}
