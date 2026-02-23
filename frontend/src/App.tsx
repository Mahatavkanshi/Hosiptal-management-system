import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

function App() {
  const { isLoading } = useAuth();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Catch any render errors
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setErrorMessage(event.message);
      console.error('App Error:', event);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="text-center max-w-lg">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
          <p className="text-white mb-4">{errorMessage || 'An error occurred while loading the application.'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Loading Hospital Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
