import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Accent Colors
export const accentColors = [
  { name: 'Blue', value: '#3b82f6', rgb: '59, 130, 246' },
  { name: 'Purple', value: '#8b5cf6', rgb: '139, 92, 246' },
  { name: 'Pink', value: '#ec4899', rgb: '236, 72, 153' },
  { name: 'Red', value: '#ef4444', rgb: '239, 68, 68' },
  { name: 'Orange', value: '#f97316', rgb: '249, 115, 22' },
  { name: 'Yellow', value: '#eab308', rgb: '234, 179, 8' },
  { name: 'Green', value: '#22c55e', rgb: '34, 197, 94' },
  { name: 'Teal', value: '#14b8a6', rgb: '20, 184, 166' },
  { name: 'Cyan', value: '#06b6d4', rgb: '6, 182, 212' },
  { name: 'Indigo', value: '#6366f1', rgb: '99, 102, 241' },
  { name: 'Violet', value: '#a855f7', rgb: '168, 85, 247' },
  { name: 'Rose', value: '#f43f5e', rgb: '244, 63, 94' },
] as const;

// Gradient Themes with card colors that match the theme
export const gradientThemes = [
  {
    id: 'purple-dream',
    name: 'Purple Dream',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    isDark: true,
    cardBg: 'bg-indigo-950',
    cardBorder: 'border-indigo-800/50',
    cardHover: 'hover:bg-indigo-900',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    isDark: true,
    cardBg: 'bg-rose-950',
    cardBorder: 'border-rose-800/50',
    cardHover: 'hover:bg-rose-900',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    isDark: false,
    cardBg: 'bg-cyan-950',
    cardBorder: 'border-cyan-800/50',
    cardHover: 'hover:bg-cyan-900',
  },
  {
    id: 'mint',
    name: 'Mint',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    isDark: false,
    cardBg: 'bg-emerald-950',
    cardBorder: 'border-emerald-800/50',
    cardHover: 'hover:bg-emerald-900',
  },
  {
    id: 'peach',
    name: 'Peach',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    isDark: false,
    cardBg: 'bg-orange-950',
    cardBorder: 'border-orange-800/50',
    cardHover: 'hover:bg-orange-900',
  },
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    isDark: false,
    cardBg: 'bg-pink-950',
    cardBorder: 'border-pink-800/50',
    cardHover: 'hover:bg-pink-900',
  },
  {
    id: 'neon',
    name: 'Neon',
    gradient: 'linear-gradient(135deg, #b721ff 0%, #21d4fd 100%)',
    isDark: true,
    cardBg: 'bg-purple-950',
    cardBorder: 'border-purple-800/50',
    cardHover: 'hover:bg-purple-900',
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    isDark: false,
    cardBg: 'bg-pink-950',
    cardBorder: 'border-pink-800/50',
    cardHover: 'hover:bg-pink-900',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    gradient: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)',
    isDark: true,
    cardBg: 'bg-blue-950',
    cardBorder: 'border-blue-800/50',
    cardHover: 'hover:bg-blue-900',
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: 'linear-gradient(135deg, #42e695 0%, #3bb2b8 100%)',
    isDark: false,
    cardBg: 'bg-teal-950',
    cardBorder: 'border-teal-800/50',
    cardHover: 'hover:bg-teal-900',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f43f5e 100%)',
    isDark: true,
    cardBg: 'bg-purple-950',
    cardBorder: 'border-purple-800/50',
    cardHover: 'hover:bg-purple-900',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    gradient: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
    isDark: true,
    cardBg: 'bg-slate-950',
    cardBorder: 'border-slate-800/50',
    cardHover: 'hover:bg-slate-900',
  },
] as const;

// Wallpaper Types
export type Wallpaper = 'none' | 'grid' | 'dots' | 'medical' | 'gradient-mesh';

// Wallpaper Styles
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

// Highlight Colors for Notes
export const highlightColors = [
  { name: 'Yellow', value: '#fef08a', textColor: '#854d0e' },
  { name: 'Green', value: '#86efac', textColor: '#166534' },
  { name: 'Blue', value: '#93c5fd', textColor: '#1e40af' },
  { name: 'Pink', value: '#f9a8d4', textColor: '#9d174d' },
  { name: 'Orange', value: '#fdba74', textColor: '#9a3412' },
  { name: 'Purple', value: '#d8b4fe', textColor: '#6b21a8' },
  { name: 'Red', value: '#fca5a5', textColor: '#991b1b' },
  { name: 'Cyan', value: '#67e8f9', textColor: '#155e75' },
] as const;

// Theme Mode Type
type ThemeMode = 'light' | 'dark' | 'system';

// Wallpaper Mode Type
type WallpaperMode = 'cover' | 'contain' | 'repeat';

// Wallpaper Pattern Type (for backward compatibility)
export type WallpaperPattern = 'none' | 'grid' | 'dots' | 'medical' | 'gradient-mesh';

// Theme Context Interface
interface ThemeContextType {
  // Mode
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  
  // Accent Color
  accentColor: string;
  accentColorRgb: string;
  setAccentColor: (color: string) => void;
  
  // Gradient Theme
  gradientTheme: string;
  setGradientTheme: (gradient: string) => void;
  
  // Backward compatibility - alias for gradientTheme
  theme: string;
  setTheme: (theme: string) => void;
  
  // Wallpaper Pattern (for backward compatibility)
  wallpaperPattern: WallpaperPattern;
  setWallpaperPattern: (pattern: WallpaperPattern) => void;
  
  // Wallpaper (custom image)
  wallpaper: string | null;
  setWallpaper: (wallpaper: string | null) => void;
  wallpaperMode: WallpaperMode;
  setWallpaperMode: (mode: WallpaperMode) => void;
  wallpaperBlur: number;
  setWallpaperBlur: (blur: number) => void;
  wallpaperOpacity: number;
  setWallpaperOpacity: (opacity: number) => void;
  
  // Utility Functions
  getEffectiveBackground: () => string;
  getGlassStyles: () => React.CSSProperties;
  
  // Theme-aware card colors
  cardColors: {
    bg: string;
    border: string;
    hover: string;
    inputBg: string;
    inputBorder: string;
    inputBgClass: string;
    tableBorder: string;
    tableDivide: string;
    rowHover: string;
  };
}

// Storage Keys
const STORAGE_KEYS = {
  THEME_MODE: 'hms-theme-mode',
  ACCENT_COLOR: 'hms-accent-color',
  GRADIENT_THEME: 'hms-gradient-theme',
  WALLPAPER_PATTERN: 'hms-wallpaper-pattern',
  WALLPAPER: 'hms-wallpaper',
  WALLPAPER_MODE: 'hms-wallpaper-mode',
  WALLPAPER_BLUR: 'hms-wallpaper-blur',
  WALLPAPER_OPACITY: 'hms-wallpaper-opacity',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme Mode State
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);
  
  // Accent Color State
  const [accentColor, setAccentColorState] = useState(accentColors[0].value);
  const [accentColorRgb, setAccentColorRgb] = useState(accentColors[0].rgb);
  
  // Gradient Theme State
  const [gradientTheme, setGradientThemeState] = useState(gradientThemes[0].id);
  
  // Wallpaper Pattern State (backward compatibility)
  const [wallpaperPattern, setWallpaperPatternState] = useState<WallpaperPattern>('none');
  
  // Wallpaper State (custom image)
  const [wallpaper, setWallpaperState] = useState<string | null>(null);
  const [wallpaperMode, setWallpaperModeState] = useState<WallpaperMode>('cover');
  const [wallpaperBlur, setWallpaperBlurState] = useState(0);
  const [wallpaperOpacity, setWallpaperOpacityState] = useState(8);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        // Theme Mode
        const savedThemeMode = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode;
        if (savedThemeMode && ['light', 'dark', 'system'].includes(savedThemeMode)) {
          setThemeModeState(savedThemeMode);
        }
        
        // Accent Color
        const savedAccentColor = localStorage.getItem(STORAGE_KEYS.ACCENT_COLOR);
        if (savedAccentColor) {
          const colorObj = accentColors.find(c => c.value === savedAccentColor);
          if (colorObj) {
            setAccentColorState(colorObj.value);
            setAccentColorRgb(colorObj.rgb);
          }
        }
        
        // Gradient Theme
        const savedGradient = localStorage.getItem(STORAGE_KEYS.GRADIENT_THEME);
        if (savedGradient) {
          setGradientThemeState(savedGradient);
        }
        
        // Wallpaper Pattern (backward compatibility)
        const savedWallpaperPattern = localStorage.getItem(STORAGE_KEYS.WALLPAPER_PATTERN) as WallpaperPattern;
        if (savedWallpaperPattern && ['none', 'grid', 'dots', 'medical', 'gradient-mesh'].includes(savedWallpaperPattern)) {
          setWallpaperPatternState(savedWallpaperPattern);
        }
        
        // Wallpaper (custom image)
        const savedWallpaper = localStorage.getItem(STORAGE_KEYS.WALLPAPER);
        if (savedWallpaper) {
          setWallpaperState(savedWallpaper);
        }
        
        // Wallpaper Settings
        const savedWallpaperMode = localStorage.getItem(STORAGE_KEYS.WALLPAPER_MODE) as WallpaperMode;
        if (savedWallpaperMode) {
          setWallpaperModeState(savedWallpaperMode);
        }
        
        const savedWallpaperBlur = localStorage.getItem(STORAGE_KEYS.WALLPAPER_BLUR);
        if (savedWallpaperBlur) {
          setWallpaperBlurState(parseInt(savedWallpaperBlur));
        }
        
        const savedWallpaperOpacity = localStorage.getItem(STORAGE_KEYS.WALLPAPER_OPACITY);
        if (savedWallpaperOpacity) {
          setWallpaperOpacityState(parseInt(savedWallpaperOpacity));
        }
      } catch (error) {
        console.error('Error loading theme preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  // Handle system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (themeMode === 'system') {
        setIsDark(mediaQuery.matches);
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      }
    };
    
    if (themeMode === 'system') {
      setIsDark(mediaQuery.matches);
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
    } else {
      setIsDark(themeMode === 'dark');
      document.documentElement.classList.toggle('dark', themeMode === 'dark');
    }
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Update CSS Variables when accent color changes
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor);
    document.documentElement.style.setProperty('--accent-color-rgb', accentColorRgb);
  }, [accentColor, accentColorRgb]);

  // Save functions
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  };

  const setAccentColor = (color: string) => {
    const colorObj = accentColors.find(c => c.value === color);
    if (colorObj) {
      setAccentColorState(colorObj.value);
      setAccentColorRgb(colorObj.rgb);
      localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, colorObj.value);
    }
  };

  const setGradientTheme = (gradient: string) => {
    setGradientThemeState(gradient);
    localStorage.setItem(STORAGE_KEYS.GRADIENT_THEME, gradient);
  };

  // Backward compatibility alias
  const setTheme = setGradientTheme;

  const setWallpaperPattern = (pattern: WallpaperPattern) => {
    setWallpaperPatternState(pattern);
    localStorage.setItem(STORAGE_KEYS.WALLPAPER_PATTERN, pattern);
  };

  const setWallpaper = (wallpaper: string | null) => {
    setWallpaperState(wallpaper);
    if (wallpaper) {
      localStorage.setItem(STORAGE_KEYS.WALLPAPER, wallpaper);
    } else {
      localStorage.removeItem(STORAGE_KEYS.WALLPAPER);
    }
  };

  const setWallpaperMode = (mode: WallpaperMode) => {
    setWallpaperModeState(mode);
    localStorage.setItem(STORAGE_KEYS.WALLPAPER_MODE, mode);
  };

  const setWallpaperBlur = (blur: number) => {
    setWallpaperBlurState(blur);
    localStorage.setItem(STORAGE_KEYS.WALLPAPER_BLUR, blur.toString());
  };

  const setWallpaperOpacity = (opacity: number) => {
    setWallpaperOpacityState(opacity);
    localStorage.setItem(STORAGE_KEYS.WALLPAPER_OPACITY, opacity.toString());
  };

  // Get effective background style
  const getEffectiveBackground = () => {
    const theme = gradientThemes.find(t => t.id === gradientTheme);
    if (theme) {
      return theme.gradient;
    }
    return isDark 
      ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
  };

  // Get glassmorphism styles
  const getGlassStyles = (): React.CSSProperties => {
    const baseOpacity = isDark ? 0.75 : 0.7;
    return {
      background: isDark 
        ? `rgba(20, 20, 25, ${baseOpacity})`
        : `rgba(255, 255, 255, ${baseOpacity})`,
      backdropFilter: `blur(${20}px) saturate(180%)`,
      WebkitBackdropFilter: `blur(${20}px) saturate(180%)`,
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
      boxShadow: isDark 
        ? '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
        : '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    };
  };

  // Get theme-aware card colors
  const cardColors = React.useMemo(() => {
    const currentTheme = gradientThemes.find(t => t.id === gradientTheme);
    if (!currentTheme) {
      return {
        bg: 'bg-slate-950',
        border: 'border-slate-800/60',
        hover: 'hover:bg-slate-900',
        inputBg: 'bg-slate-900/60',
        inputBorder: 'border-slate-800/60',
        inputBgClass: 'bg-slate-900',
        tableBorder: 'border-slate-800/60',
        tableDivide: 'divide-slate-800/30',
        rowHover: 'hover:bg-slate-900/40',
      };
    }
    
    // Extract color name from cardBg (e.g., 'bg-emerald-950' -> 'emerald')
    const colorMatch = currentTheme.cardBg.match(/bg-(\w+)-950/);
    const colorName = colorMatch ? colorMatch[1] : 'slate';
    
    return {
      bg: currentTheme.cardBg,
      border: currentTheme.cardBorder,
      hover: currentTheme.cardHover,
      inputBg: `bg-${colorName}-900/60`,
      inputBorder: `border-${colorName}-800/60`,
      inputBgClass: `bg-${colorName}-900`,
      tableBorder: `border-${colorName}-800/60`,
      tableDivide: `divide-${colorName}-800/30`,
      rowHover: `hover:bg-${colorName}-900/40`,
    };
  }, [gradientTheme]);

  const value: ThemeContextType = {
    themeMode,
    setThemeMode,
    isDark,
    accentColor,
    accentColorRgb,
    setAccentColor,
    gradientTheme,
    setGradientTheme,
    // Backward compatibility aliases
    theme: gradientTheme,
    setTheme,
    // Wallpaper Pattern (backward compatibility)
    wallpaperPattern,
    setWallpaperPattern,
    // Wallpaper (custom image)
    wallpaper,
    setWallpaper,
    wallpaperMode,
    setWallpaperMode,
    wallpaperBlur,
    setWallpaperBlur,
    wallpaperOpacity,
    setWallpaperOpacity,
    getEffectiveBackground,
    getGlassStyles,
    cardColors,
  };

  return (
    <ThemeContext.Provider value={value}>
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

// Helper function to get theme colors (for backward compatibility)
export const getThemeColors = (theme: string) => {
  const currentTheme = gradientThemes.find(t => t.id === theme);
  const isDarkTheme = currentTheme?.isDark ?? false;
  
  return {
    // Background
    bodyBg: currentTheme?.gradient || (isDarkTheme 
      ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'),
    
    // Glassmorphism
    glassBg: isDarkTheme ? 'bg-slate-900/75' : 'bg-white/70',
    glassBorder: isDarkTheme ? 'border-white/10' : 'border-black/5',
    glassHover: isDarkTheme ? 'bg-slate-800/60' : 'bg-white/80',
    
    // Text
    textPrimary: isDarkTheme ? 'text-white' : 'text-slate-900',
    textSecondary: isDarkTheme ? 'text-slate-400' : 'text-slate-600',
    
    // Gradient for headers
    gradient: currentTheme?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    
    // Other properties for compatibility
    borderColor: isDarkTheme ? 'border-slate-700' : 'border-slate-200',
    cardBg: isDarkTheme ? 'bg-slate-800/50' : 'bg-white/80',
  };
};

// Helper function to get wallpaper styles (for backward compatibility)
export const getWallpaperStyle = (wallpaper: string | null): React.CSSProperties => {
  if (!wallpaper) return {};
  
  return {
    backgroundImage: `url(${wallpaper})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: 0.08,
  };
};

export default ThemeContext;
