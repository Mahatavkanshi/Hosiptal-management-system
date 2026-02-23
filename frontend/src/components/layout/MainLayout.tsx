import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme, gradientThemes } from '../../contexts/ThemeContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BedDouble,
  Pill,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Stethoscope,
  FileText,
  CreditCard,
  Settings,
  Bell,
  Palette
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    isDark, 
    accentColor,
    gradientTheme,
    wallpaper,
    wallpaperMode,
    wallpaperBlur,
    wallpaperOpacity,
    getEffectiveBackground,
    getGlassStyles
  } = useTheme();
  
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Appointments', href: '/appointments', icon: Calendar },
    ];

    switch (user?.role) {
      case 'patient':
        return [
          ...baseNavigation,
          { name: 'Find Doctors', href: '/doctors', icon: Stethoscope },
          { name: 'Medical History', href: '/medical-history', icon: FileText },
          { name: 'Prescriptions', href: '/prescriptions', icon: Pill },
        ];
      
      case 'doctor':
        return [
          ...baseNavigation,
          { name: 'My Patients', href: '/patients', icon: Users },
          { name: 'Medical Records', href: '/medical-history', icon: FileText },
          { name: 'Prescriptions', href: '/prescriptions', icon: Pill },
        ];
      
      case 'admin':
      case 'super_admin':
        return [
          ...baseNavigation,
          { name: 'Doctors', href: '/doctors', icon: Stethoscope },
          { name: 'Bed Management', href: '/beds', icon: BedDouble },
          { name: 'Medicines', href: '/medicines', icon: Pill },
          { name: 'User Management', href: '/admin/users', icon: Users },
          { name: 'Analytics', href: '/admin/analytics', icon: CreditCard },
        ];
      
      case 'receptionist':
        return [
          ...baseNavigation,
          { name: 'Patients', href: '/patients', icon: Users },
          { name: 'Bed Management', href: '/beds', icon: BedDouble },
        ];
      
      case 'nurse':
        return [
          ...baseNavigation,
          { name: 'Bed Management', href: '/beds', icon: BedDouble },
          { name: 'Medical Records', href: '/medical-history', icon: FileText },
        ];
      
      case 'pharmacist':
        return [
          ...baseNavigation,
          { name: 'Medicines', href: '/medicines', icon: Pill },
          { name: 'Inventory', href: '/medicines/inventory', icon: Settings },
        ];
      
      default:
        return baseNavigation;
    }
  };

  const navigation = getNavigation();

  // Get current gradient theme
  const currentTheme = gradientThemes.find(t => t.id === gradientTheme) || gradientThemes[0];
  
  // Wallpaper style
  const wallpaperStyle: React.CSSProperties = wallpaper ? {
    backgroundImage: `url(${wallpaper})`,
    backgroundSize: wallpaperMode,
    backgroundPosition: 'center',
    backgroundRepeat: wallpaperMode === 'repeat' ? 'repeat' : 'no-repeat',
    opacity: wallpaperOpacity / 100,
    filter: `blur(${wallpaperBlur}px)`,
  } : {};

  // Glass styles
  const glassStyles = getGlassStyles();

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        background: getEffectiveBackground() || 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        minHeight: '100vh',
        transition: 'background 0.5s ease'
      }}
    >
      {/* Wallpaper Layer */}
      {wallpaper && (
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={wallpaperStyle}
        />
      )}

      {/* Animated Gradient Mesh for Special Themes */}
      {(currentTheme.id === 'purple-dream' || currentTheme.id === 'neon' || currentTheme.id === 'rainbow') && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div 
            className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl animate-pulse-slow"
            style={{ 
              background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
            }} 
          />
          <div 
            className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full blur-3xl animate-pulse-slow"
            style={{ 
              background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
              animationDelay: '2s'
            }} 
          />
        </div>
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`fixed inset-0 bg-black/60 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />
        
        <div 
          className="relative flex w-full max-w-xs flex-1 flex-col transition-transform"
          style={{
            ...glassStyles,
            borderRight: '1px solid var(--glass-border)',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
          }}
        >
          <div 
            className="flex h-16 flex-shrink-0 items-center justify-between px-4"
            style={{ background: currentTheme.gradient }}
          >
            <span className="text-xl font-bold text-white">HMS</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-white/80 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'sidebar-item active' 
                      : 'sidebar-item'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'opacity-60'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-20">
        <div 
          className="flex min-h-0 flex-1 flex-col"
          style={{
            ...glassStyles,
            borderRight: '1px solid var(--glass-border)'
          }}
        >
          <div 
            className="flex h-16 flex-shrink-0 items-center px-6"
            style={{ background: currentTheme.gradient }}
          >
            <span className="text-xl font-bold text-white">Hospital MS</span>
          </div>
          
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-3 py-6">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'sidebar-item active' 
                        : 'sidebar-item'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'opacity-60'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64 relative z-10">
        <div 
          className="sticky top-0 z-10 flex h-16 flex-shrink-0"
          style={{
            ...glassStyles,
            borderBottom: '1px solid var(--glass-border)'
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="border-r border-white/10 px-4 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset md:hidden transition-colors"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center">
              {/* Breadcrumb or page title could go here */}
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 gap-3">
              <button className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" />
              </button>

              {/* Profile dropdown */}
              <div className="relative ml-3">
                <div>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex max-w-xs items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 hover:bg-white/5 transition-all"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center"
                        style={{ background: currentTheme.gradient }}
                      >
                        <span className="text-white font-medium text-sm">
                          {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </span>
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="text-base font-semibold text-foreground">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {user?.role}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                </div>

                {profileMenuOpen && (
                  <div 
                    className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-2xl py-2 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none"
                    style={glassStyles}
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-3 text-base font-medium text-foreground hover:bg-white/5 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <UserCircle className="mr-3 h-5 w-5 text-muted-foreground" />
                        Your Profile
                      </div>
                    </Link>
                    <Link
                      to="/settings/theme"
                      className="block px-4 py-3 text-base font-medium text-foreground hover:bg-white/5 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <Palette className="mr-3 h-5 w-5 text-muted-foreground" />
                        Theme Settings
                      </div>
                    </Link>
                    <div className="border-t border-white/10 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-base font-medium text-foreground hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center">
                        <LogOut className="mr-3 h-5 w-5 text-muted-foreground" />
                        Sign out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 relative">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
