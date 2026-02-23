import React from 'react';
import { useTheme, getThemeColors, getWallpaperStyle } from '../../contexts/ThemeContext';

interface ThemeWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children, className = '' }) => {
  const { theme, wallpaper, getEffectiveBackground } = useTheme();
  const colors = getThemeColors(theme);
  const wallpaperStyle = getWallpaperStyle(wallpaper);

  return (
    <div 
      className={`min-h-screen transition-all duration-500 ${className}`}
      style={{ background: getEffectiveBackground() }}
    >
      {/* Wallpaper Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-500"
        style={wallpaperStyle}
      />

      {/* Gradient Mesh Overlay for special themes (Dark Mode Only) */}
      {colors.isDark && (theme === 'midnight-gradient' || theme === 'neon-dreams' || theme === 'berry-smoothie') && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-t from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Hook to get theme-based classes
export const useThemeClasses = () => {
  const { theme, isDark } = useTheme();
  const colors = getThemeColors(theme);

  return {
    // Container classes
    pageContainer: `min-h-screen ${colors.bodyBg} transition-colors duration-500`,
    card: `${colors.cardBg} ${colors.borderColor} border rounded-2xl shadow-lg backdrop-blur-sm`,
    
    // Text classes
    heading: `text-3xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`,
    title: `text-xl font-semibold ${colors.textPrimary}`,
    subtitle: `text-sm ${colors.textSecondary}`,
    text: colors.textPrimary,
    textMuted: colors.textSecondary,
    
    // Button classes
    buttonPrimary: `bg-gradient-to-r ${colors.gradient} text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`,
    buttonSecondary: `${colors.cardBg} ${colors.textPrimary} ${colors.borderColor} border px-4 py-2 rounded-xl font-medium hover:bg-white/10 transition-all`,
    
    // Input classes
    input: `w-full px-4 py-2.5 ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-800'} border rounded-xl focus:ring-2 focus:ring-${colors.accentColor}-500 focus:border-transparent transition-all`,
    
    // Stats card
    statCard: (color: string) => `${
      isDark 
        ? `bg-gradient-to-br from-${color}-500 to-${color}-600 text-white` 
        : `bg-white/90 backdrop-blur-sm border border-${color}-100 shadow-lg shadow-${color}-100/30`
    } rounded-xl p-4`,
    
    // Accent color
    accent: colors.accentColor,
    isDark,
    colors,
  };
};

export default ThemeWrapper;
