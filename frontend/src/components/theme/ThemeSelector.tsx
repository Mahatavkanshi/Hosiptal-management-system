import React from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, getThemeColors, gradientThemes } from '../../contexts/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();
  const colors = getThemeColors(theme);

  // Get current theme name
  const currentThemeName = colors.name;

  return (
    <div className="relative group">
      <button 
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
          isDark
            ? 'bg-white/10 border border-white/20 hover:bg-white/15'
            : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
        }`}
      >
        <Palette className={`h-4 w-4 ${isDark ? 'text-white' : 'text-slate-600'}`} />
        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>
          {currentThemeName}
        </span>
        <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${colors.gradient}`}></div>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className={`rounded-2xl shadow-xl border overflow-hidden max-h-80 overflow-y-auto ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'
        }`}>
          <div className={`text-xs font-semibold uppercase tracking-wider px-3 py-3 border-b ${
            isDark ? 'text-slate-400 border-slate-700' : 'text-slate-400 border-slate-100'
          }`}>
            Select Theme
          </div>
          
          {/* Basic Modes */}
          <div className="p-2">
            <div className={`text-xs font-medium mb-2 px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Basic Modes</div>
            
            {['light', 'dark'].map((t) => {
              const themeColors = getThemeColors(t as 'light' | 'dark');
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t as 'light' | 'dark')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mb-1 ${
                    theme === t 
                      ? isDark ? 'bg-white/10 ring-1 ring-white/20' : 'bg-slate-50 ring-1 ring-slate-200'
                      : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${themeColors.gradient} flex items-center justify-center text-white shadow-sm`}>
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                  <span className={`text-sm font-medium ${
                    theme === t 
                      ? isDark ? 'text-white' : 'text-slate-900'
                      : isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {themeColors.name}
                  </span>
                  {theme === t && (
                    <div className="ml-auto">
                      <Check className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}></div>
          
          {/* Gradient Themes */}
          <div className="p-2">
            <div className={`text-xs font-medium mb-2 px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Special Gradients</div>
            
            {gradientThemes.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mb-1 ${
                    isActive
                      ? isDark ? 'bg-white/10 ring-1 ring-white/20' : 'bg-slate-50 ring-1 ring-slate-200'
                      : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.colors} flex items-center justify-center shadow-sm`}></div>
                  <span className={`text-sm font-medium ${
                    isActive
                      ? isDark ? 'text-white' : 'text-slate-900'
                      : isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {t.name}
                  </span>
                  {isActive && (
                    <div className="ml-auto">
                      <Check className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
