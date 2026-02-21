import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme, getThemeColors, getWallpaperStyle } from '../../contexts/ThemeContext';
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
  const { theme, wallpaper } = useTheme();
  const colors = getThemeColors(theme);
  const wallpaperStyle = getWallpaperStyle(wallpaper);
  
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

  return (
    <div className={`min-h-screen ${colors.bodyBg} relative`}>
      {/* Wallpaper Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={wallpaperStyle}
      />

      {/* Gradient Mesh for Special Themes */}
      {(theme === 'midnight-gradient' || theme === 'neon-dreams' || theme === 'berry-smoothie') && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-t from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`fixed inset-0 bg-black/60 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />
        
        <div className={`relative flex w-full max-w-xs flex-1 flex-col bg-white transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className={`flex h-16 flex-shrink-0 items-center justify-between px-4 bg-gradient-to-r ${colors.gradient}`}>
            <span className="text-xl font-bold text-white">HMS</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-2 px-2 py-4 bg-white">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-4 text-base font-semibold rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-4 h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-20">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className={`flex h-16 flex-shrink-0 items-center px-4 bg-gradient-to-r ${colors.gradient}`}>
            <span className="text-xl font-bold text-white">Hospital MS</span>
          </div>
          
          <div className="flex flex-1 flex-col overflow-y-auto bg-white">
            <nav className="flex-1 space-y-2 px-2 py-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-4 text-base font-semibold rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`mr-4 h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
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
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset md:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center">
              {/* Breadcrumb or page title could go here */}
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 gap-3">
              <button className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" />
              </button>

              {/* Profile dropdown */}
              <div className="relative ml-3">
                <div>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex max-w-xs items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white hover:bg-gray-50 transition-all"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center space-x-3 px-2 py-1">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br ${colors.gradient}`}>
                        <span className="text-white font-medium text-sm">
                          {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </span>
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="text-base font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                        <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                </div>

                {profileMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-xl py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none bg-white border border-gray-100"
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <UserCircle className="mr-3 h-5 w-5" />
                        Your Profile
                      </div>
                    </Link>
                    <Link
                      to="/settings/theme"
                      className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <Palette className="mr-3 h-5 w-5" />
                        Theme Settings
                      </div>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <LogOut className="mr-3 h-5 w-5" />
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
