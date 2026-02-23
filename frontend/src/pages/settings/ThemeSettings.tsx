import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Image as ImageIcon, 
  ArrowLeft,
  Moon,
  Sun,
  Check,
  Grid3X3,
  CircleDot,
  Stethoscope,
  Layers
} from 'lucide-react';
import { 
  useTheme, 
  getThemeColors, 
  gradientThemes,
  wallpaperStyles,
  type WallpaperPattern
} from '../../contexts/ThemeContext';

type TabType = 'color' | 'special' | 'wallpaper';

const ThemeSettings: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { theme, setTheme, wallpaperPattern, setWallpaperPattern, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('special');
  const colors = getThemeColors(theme);

  const basicThemes: { id: 'light' | 'dark'; name: string; icon: React.ReactNode; colors: string }[] = [
    { 
      id: 'light', 
      name: 'Light Mode', 
      icon: <Sun className="h-5 w-5" />,
      colors: 'from-blue-400 to-cyan-300'
    },
    { 
      id: 'dark', 
      name: 'Dark Mode', 
      icon: <Moon className="h-5 w-5" />,
      colors: 'from-slate-700 to-slate-900'
    },
  ];

  const wallpapers: { id: WallpaperPattern; name: string; icon: React.ReactNode }[] = [
    { id: 'none', name: 'None', icon: <div className="w-4 h-4 border border-current rounded" /> },
    { id: 'grid', name: 'Grid', icon: <Grid3X3 className="h-4 w-4" /> },
    { id: 'dots', name: 'Dots', icon: <CircleDot className="h-4 w-4" /> },
    { id: 'medical', name: 'Medical', icon: <Stethoscope className="h-4 w-4" /> },
    { id: 'gradient-mesh', name: 'Mesh', icon: <Layers className="h-4 w-4" /> },
  ];

  const TabButton: React.FC<{
    id: TabType;
    label: string;
    icon: React.ReactNode;
  }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
        activeTab === id
          ? isDark
            ? 'bg-white/10 text-white border border-white/20'
            : 'bg-white text-slate-700 shadow-lg border border-slate-200'
          : isDark
            ? 'text-slate-400 hover:text-white hover:bg-white/5'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className={`min-h-screen ${colors.bodyBg} transition-colors duration-500`}>
      {/* Background Pattern based on wallpaper */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-500"
        style={wallpaperStyles[wallpaperPattern]}
      />

      {/* Header */}
      <div className="relative z-10">
        <div className={`border-b ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-200/50 bg-white/50'} backdrop-blur-sm`}>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Palette className={`h-6 w-6 ${isDark ? 'text-white' : 'text-slate-700'}`} />
                <h1 className={`text-2xl font-bold ${colors.textPrimary}`}>
                  System Customization
                </h1>
              </div>
              
              {onBack && (
                <button
                  onClick={onBack}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-white hover:bg-slate-50 text-slate-700 shadow-sm border border-slate-200'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Settings
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-8">
            <TabButton 
              id="color" 
              label="Color Theme" 
              icon={<Palette className="h-4 w-4" />}
            />
            <TabButton 
              id="special" 
              label="Special Themes" 
              icon={<Sparkles className="h-4 w-4" />}
            />
            <TabButton 
              id="wallpaper" 
              label="Wallpaper" 
              icon={<ImageIcon className="h-4 w-4" />}
            />
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Color Theme Tab */}
            {activeTab === 'color' && (
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <h2 className={`text-xl font-semibold ${colors.textPrimary} mb-2`}>Basic Modes</h2>
                  <p className={`${colors.textSecondary} text-sm`}>Choose between light and dark mode</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {basicThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`relative group p-6 rounded-2xl transition-all duration-300 ${
                        theme === t.id
                          ? 'ring-4 ring-blue-500/30 scale-[1.02]'
                          : 'hover:scale-[1.01]'
                      } ${
                        isDark
                          ? 'bg-white/10 hover:bg-white/15 border border-white/10'
                          : 'bg-white hover:bg-slate-50 border border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.colors} opacity-10 group-hover:opacity-20 transition-opacity`} />
                      
                      <div className="relative flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.colors} flex items-center justify-center text-white shadow-lg`}>
                          {t.icon}
                        </div>
                        
                        <div className="text-left">
                          <h3 className={`font-semibold ${colors.textPrimary}`}>{t.name}</h3>
                          <p className={`text-sm ${colors.textSecondary}`}>
                            {t.id === 'light' ? 'Clean and bright interface' : 'Easy on the eyes'}
                          </p>
                        </div>

                        {theme === t.id && (
                          <div className="absolute top-4 right-4">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isDark ? 'bg-blue-500' : 'bg-blue-500 text-white'
                            }`}>
                              <Check className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Special Themes Tab */}
            {activeTab === 'special' && (
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                    <h2 className={`text-xl font-semibold ${colors.textPrimary}`}>Special Gradient Themes</h2>
                  </div>
                  <p className={`${colors.textSecondary} text-sm`}>Choose from our exclusive collection of classy gradient themes for a premium look</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gradientThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${
                        theme === t.id
                          ? 'ring-4 ring-white/30 scale-[1.02] shadow-2xl'
                          : 'hover:scale-[1.02] shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${t.colors}`} />
                      
                      {/* Glass Overlay */}
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                      
                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Content */}
                      <div className="relative aspect-[16/10] p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          {/* Decorative Card Element */}
                          <div className="w-20 h-12 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 shadow-inner" />
                          
                          {/* Checkmark */}
                          {theme === t.id && (
                            <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center">
                              <Check className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="mt-auto">
                          <h3 className="text-white font-semibold text-lg drop-shadow-md">
                            {t.name}
                          </h3>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wallpaper Tab */}
            {activeTab === 'wallpaper' && (
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                    <h2 className={`text-xl font-semibold ${colors.textPrimary}`}>Background Patterns</h2>
                  </div>
                  <p className={`${colors.textSecondary} text-sm`}>Add subtle background patterns to enhance the visual experience</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {wallpapers.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setWallpaperPattern(w.id)}
                      className={`relative group p-6 rounded-2xl transition-all duration-300 ${
                        wallpaperPattern === w.id
                          ? 'ring-4 ring-blue-500/30 scale-[1.02]'
                          : 'hover:scale-[1.01]'
                      } ${
                        isDark
                          ? 'bg-white/10 hover:bg-white/15 border border-white/10'
                          : 'bg-white hover:bg-slate-50 border border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                          style={w.id !== 'none' ? wallpaperStyles[w.id] : undefined}
                        >
                          {w.icon}
                        </div>
                        
                        <span className={`font-medium ${colors.textPrimary}`}>{w.name}</span>

                        {wallpaperPattern === w.id && (
                          <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${
                            isDark ? 'bg-blue-500' : 'bg-blue-500 text-white'
                          }`}>
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Preview Section */}
                <div className={`mt-8 p-8 rounded-2xl ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'
                }`}
                >
                  <h3 className={`font-semibold ${colors.textPrimary} mb-4`}>Live Preview</h3>
                  <div 
                    className="h-32 rounded-xl overflow-hidden relative"
                    style={{
                      background: isDark 
                        ? 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.8), rgba(30, 58, 138, 0.6))'
                        : 'linear-gradient(to bottom right, rgba(255,255,255,0.9), rgba(219, 234, 254, 0.8))',
                      ...wallpaperStyles[wallpaperPattern]
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-medium ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                        {wallpaperPattern === 'none' ? 'No pattern selected' : `${wallpapers.find(w => w.id === wallpaperPattern)?.name} pattern`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
