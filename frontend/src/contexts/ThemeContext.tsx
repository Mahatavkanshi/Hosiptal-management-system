import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 
  // Basic modes
  | 'light' 
  | 'dark'
  // Special Gradient Themes
  | 'midnight-gradient'
  | 'sunset-boulevard'
  | 'ocean-breeze'
  | 'forest-mist'
  | 'golden-hour'
  | 'arctic-frost'
  | 'neon-dreams'
  | 'warm-ember'
  | 'deep-space'
  | 'tropical-paradise'
  | 'berry-smoothie'
  | 'monochrome-dark';

export type Wallpaper = 'none' | 'grid' | 'dots' | 'medical' | 'gradient-mesh';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  wallpaper: Wallpaper;
  setWallpaper: (wallpaper: Wallpaper) => void;
  isDark: boolean;
}

// Theme color definitions with beautiful gradients
export const themeColors: Record<Theme, {
  name: string;
  gradient: string;
  bgGradient: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  accentColor: string;
  bodyBg: string;
  isDark: boolean;
}> = {
  // Basic modes
  light: {
    name: 'Light Mode',
    gradient: 'from-blue-400 to-cyan-300',
    bgGradient: 'from-slate-50 via-blue-50/30 to-purple-50/20',
    cardBg: 'bg-white/90 backdrop-blur-sm',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-500',
    borderColor: 'border-white/50',
    accentColor: 'blue',
    bodyBg: 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20',
    isDark: false,
  },
  dark: {
    name: 'Dark Mode',
    gradient: 'from-slate-700 to-slate-900',
    bgGradient: 'from-slate-900 via-blue-900/50 to-slate-900',
    cardBg: 'bg-slate-800/90 backdrop-blur-sm',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-400',
    borderColor: 'border-slate-700/50',
    accentColor: 'cyan',
    bodyBg: 'bg-gradient-to-br from-slate-900 via-blue-900/50 to-slate-900',
    isDark: true,
  },
  
  // Special Gradient Themes
  'midnight-gradient': {
    name: 'Midnight Gradient',
    gradient: 'from-indigo-600 via-purple-600 to-blue-600',
    bgGradient: 'from-indigo-950 via-purple-950 to-slate-950',
    cardBg: 'bg-indigo-900/40 backdrop-blur-sm',
    textPrimary: 'text-white',
    textSecondary: 'text-indigo-200',
    borderColor: 'border-indigo-500/30',
    accentColor: 'indigo',
    bodyBg: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950',
    isDark: true,
  },
  'sunset-boulevard': {
    name: 'Sunset Boulevard',
    gradient: 'from-rose-500 via-pink-500 to-orange-400',
    bgGradient: 'from-rose-950 via-pink-950 to-orange-950',
    cardBg: 'bg-rose-900/40 backdrop-blur-sm',
    textPrimary: 'text-white',
    textSecondary: 'text-rose-200',
    borderColor: 'border-rose-500/30',
    accentColor: 'rose',
    bodyBg: 'bg-gradient-to-br from-rose-950 via-pink-950 to-orange-950',
    isDark: true,
  },
  'ocean-breeze': {
    name: 'Ocean Breeze',
    gradient: 'from-cyan-400 via-blue-400 to-teal-400',
    bgGradient: 'from-cyan-50 via-blue-50 to-teal-50',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-cyan-700',
    borderColor: 'border-cyan-200/50',
    accentColor: 'cyan',
    bodyBg: 'bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50',
    isDark: false,
  },
  'forest-mist': {
    name: 'Forest Mist',
    gradient: 'from-emerald-400 via-green-400 to-teal-400',
    bgGradient: 'from-emerald-50 via-green-50 to-teal-50',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-emerald-700',
    borderColor: 'border-emerald-200/50',
    accentColor: 'emerald',
    bodyBg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
    isDark: false,
  },
  'golden-hour': {
    name: 'Golden Hour',
    gradient: 'from-amber-400 via-orange-400 to-yellow-400',
    bgGradient: 'from-amber-50 via-orange-50 to-yellow-50',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-amber-700',
    borderColor: 'border-amber-200/50',
    accentColor: 'amber',
    bodyBg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50',
    isDark: false,
  },
  'arctic-frost': {
    name: 'Arctic Frost',
    gradient: 'from-sky-200 via-blue-100 to-white',
    bgGradient: 'from-slate-50 via-sky-50 to-white',
    cardBg: 'bg-white/90 backdrop-blur-sm',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-sky-600',
    borderColor: 'border-sky-100/50',
    accentColor: 'sky',
    bodyBg: 'bg-gradient-to-br from-slate-50 via-sky-50 to-white',
    isDark: false,
  },
  'neon-dreams': {
    name: 'Neon Dreams',
    gradient: 'from-fuchsia-500 via-purple-500 to-pink-500',
    bgGradient: 'from-fuchsia-950 via-purple-950 to-slate-950',
    cardBg: 'bg-fuchsia-900/40 backdrop-blur-sm',
    textPrimary: 'text-white',
    textSecondary: 'text-fuchsia-200',
    borderColor: 'border-fuchsia-500/30',
    accentColor: 'fuchsia',
    bodyBg: 'bg-gradient-to-br from-fuchsia-950 via-purple-950 to-slate-950',
    isDark: true,
  },
  'warm-ember': {
    name: 'Warm Ember',
    gradient: 'from-orange-500 via-red-400 to-pink-400',
    bgGradient: 'from-orange-950 via-red-950 to-pink-950',
    cardBg: 'bg-orange-900/40 backdrop-blur-sm',
    textPrimary: 'text-white',
    textSecondary: 'text-orange-200',
    borderColor: 'border-orange-500/30',
    accentColor: 'orange',
    bodyBg: 'bg-gradient-to-br from-orange-950 via-red-950 to-pink-950',
    isDark: true,
  },
  'deep-space': {
    name: 'Deep Space',
    gradient: 'from-slate-700 via-blue-800 to-indigo-900',
    bgGradient: 'from-slate-950 via-blue-950 to-indigo-950',
    cardBg: 'bg-slate-800/60 backdrop-blur-sm',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-300',
    borderColor: 'border-slate-600/50',
    accentColor: 'slate',
    bodyBg: 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950',
    isDark: true,
  },
  'tropical-paradise': {
    name: 'Tropical Paradise',
    gradient: 'from-teal-400 via-emerald-400 to-cyan-400',
    bgGradient: 'from-teal-50 via-emerald-50 to-cyan-50',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-teal-700',
    borderColor: 'border-teal-200/50',
    accentColor: 'teal',
    bodyBg: 'bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50',
    isDark: false,
  },
  'berry-smoothie': {
    name: 'Berry Smoothie',
    gradient: 'from-pink-500 via-rose-400 to-purple-500',
    bgGradient: 'from-pink-950 via-rose-950 to-purple-950',
    cardBg: 'bg-pink-900/40 backdrop-blur-sm',
    textPrimary: 'text-white',
    textSecondary: 'text-pink-200',
    borderColor: 'border-pink-500/30',
    accentColor: 'pink',
    bodyBg: 'bg-gradient-to-br from-pink-950 via-rose-950 to-purple-950',
    isDark: true,
  },
  'monochrome-dark': {
    name: 'Monochrome Dark',
    gradient: 'from-gray-600 via-gray-700 to-gray-800',
    bgGradient: 'from-gray-900 via-gray-950 to-black',
    cardBg: 'bg-gray-800/60 backdrop-blur-sm',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-400',
    borderColor: 'border-gray-600/50',
    accentColor: 'gray',
    bodyBg: 'bg-gradient-to-br from-gray-900 via-gray-950 to-black',
    isDark: true,
  },
};

// Wallpaper patterns
export const wallpaperStyles: Record<Wallpaper, React.CSSProperties> = {
  none: {},
  grid: {
    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)',
    backgroundSize: '20px 20px',
  },
  dots: {
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
    backgroundSize: '30px 30px',
  },
  medical: {
    backgroundImage: `
      linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px),
      linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
  },
  'gradient-mesh': {
    background: 'radial-gradient(at 40% 20%, rgba(59, 130, 246, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(147, 51, 234, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(236, 72, 153, 0.1) 0px, transparent 50%)',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [wallpaper, setWallpaper] = useState<Wallpaper>('none');

  useEffect(() => {
    const savedTheme = localStorage.getItem('hms-theme') as Theme;
    const savedWallpaper = localStorage.getItem('hms-wallpaper') as Wallpaper;
    
    if (savedTheme && themeColors[savedTheme]) {
      setTheme(savedTheme);
    }
    if (savedWallpaper) {
      setWallpaper(savedWallpaper);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hms-theme', theme);
    localStorage.setItem('hms-wallpaper', wallpaper);
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply theme-based classes to body
    const colors = themeColors[theme];
    document.body.className = colors.bodyBg;
  }, [theme, wallpaper]);

  const isDark = themeColors[theme].isDark;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, wallpaper, setWallpaper, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const getThemeColors = (theme: Theme) => themeColors[theme];
export const getWallpaperStyle = (wallpaper: Wallpaper) => wallpaperStyles[wallpaper];

export const gradientThemes = [
  { id: 'midnight-gradient', name: 'Midnight Gradient', colors: 'from-indigo-600 via-purple-600 to-blue-600' },
  { id: 'sunset-boulevard', name: 'Sunset Boulevard', colors: 'from-rose-500 via-pink-500 to-orange-400' },
  { id: 'ocean-breeze', name: 'Ocean Breeze', colors: 'from-cyan-400 via-blue-400 to-teal-400' },
  { id: 'forest-mist', name: 'Forest Mist', colors: 'from-emerald-400 via-green-400 to-teal-400' },
  { id: 'golden-hour', name: 'Golden Hour', colors: 'from-amber-400 via-orange-400 to-yellow-400' },
  { id: 'arctic-frost', name: 'Arctic Frost', colors: 'from-sky-200 via-blue-100 to-white' },
  { id: 'neon-dreams', name: 'Neon Dreams', colors: 'from-fuchsia-500 via-purple-500 to-pink-500' },
  { id: 'warm-ember', name: 'Warm Ember', colors: 'from-orange-500 via-red-400 to-pink-400' },
  { id: 'deep-space', name: 'Deep Space', colors: 'from-slate-700 via-blue-800 to-indigo-900' },
  { id: 'tropical-paradise', name: 'Tropical Paradise', colors: 'from-teal-400 via-emerald-400 to-cyan-400' },
  { id: 'berry-smoothie', name: 'Berry Smoothie', colors: 'from-pink-500 via-rose-400 to-purple-500' },
  { id: 'monochrome-dark', name: 'Monochrome Dark', colors: 'from-gray-600 via-gray-700 to-gray-800' },
] as const;
