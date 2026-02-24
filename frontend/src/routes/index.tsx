import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Portal Page
import DepartmentPortal from '../pages/portal/DepartmentPortal';

// Dashboard Pages
import Dashboard from '../pages/dashboard/Dashboard';

// Department Dashboards
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import NurseDashboard from '../pages/dashboard/NurseDashboard';
import NurseShifts from '../pages/nurse/NurseShifts';
import NurseChat from '../pages/nurse/NurseChat';
import NurseCarePlans from '../pages/nurse/NurseCarePlans';
import NurseGCSAssessment from '../pages/nurse/NurseGCSAssessment';
import NurseReports from '../pages/nurse/NurseReports';
import ReceptionDashboard from '../pages/dashboard/ReceptionDashboard';
import PharmacyDashboard from '../pages/dashboard/PharmacyDashboard';
import PatientPortalDashboard from '../pages/dashboard/PatientPortalDashboard';

// Appointment Pages
import Appointments from '../pages/appointments/Appointments';
import BookAppointment from '../pages/appointments/BookAppointment';
import AppointmentDetails from '../pages/appointments/AppointmentDetails';

// Doctor Pages
import Doctors from '../pages/doctors/Doctors';
import DoctorProfile from '../pages/doctors/DoctorProfile';
import MyPatients from '../pages/doctors/MyPatients';

// Patient Pages
import MedicalHistory from '../pages/patients/MedicalHistory';
import Prescriptions from '../pages/patients/Prescriptions';

// Bed Management
import BedManagement from '../pages/beds/BedManagement';

// Medicine Pages
import Medicines from '../pages/medicines/Medicines';
import MedicineInventory from '../pages/medicines/MedicineInventory';

// Admin Pages
import UserManagement from '../pages/admin/UserManagement';
import RevenueAnalytics from '../pages/admin/RevenueAnalytics';

// Profile
import Profile from '../pages/profile/Profile';

// Settings
import ThemeSettings from '../pages/settings/ThemeSettings';

// Video Call
import VideoCall from '../pages/video/VideoCall';

// Not Found
import NotFound from '../pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/portal" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/portal" element={<DepartmentPortal />} />
      
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Doctor Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Admin Dashboard */}
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
        
        {/* Nurse Dashboard */}
        <Route path="/nurse-dashboard" element={<ProtectedRoute allowedRoles={['nurse', 'admin', 'super_admin']}><NurseDashboard /></ProtectedRoute>} />
        <Route path="/nurse/shifts" element={<ProtectedRoute allowedRoles={['nurse', 'admin', 'super_admin']}><NurseShifts /></ProtectedRoute>} />
        <Route path="/nurse/chat" element={<ProtectedRoute allowedRoles={['nurse', 'admin', 'super_admin']}><NurseChat /></ProtectedRoute>} />
        <Route path="/nurse/care-plans/new" element={<ProtectedRoute allowedRoles={['nurse', 'admin', 'super_admin']}><NurseCarePlans /></ProtectedRoute>} />
        <Route path="/nurse/gcs-assessment" element={<ProtectedRoute allowedRoles={['nurse', 'admin', 'super_admin']}><NurseGCSAssessment /></ProtectedRoute>} />
        <Route path="/nurse/daily-report" element={<ProtectedRoute allowedRoles={['nurse', 'admin', 'super_admin']}><NurseReports /></ProtectedRoute>} />
        <Route path="/nurse/performance" element={<ProtectedRoute allowedRoles={['nurse', 'admin', 'super_admin']}><NurseReports /></ProtectedRoute>} />
        <Route path="/nurse/shifts/handovers" element={<ProtectedRoute allowedRoles={['nurse', 'admin', 'super_admin']}><NurseShifts /></ProtectedRoute>} />
        
        {/* Reception Dashboard */}
        <Route path="/reception-dashboard" element={<ProtectedRoute allowedRoles={['receptionist', 'admin', 'super_admin']}><ReceptionDashboard /></ProtectedRoute>} />
        
        {/* Pharmacy Dashboard */}
        <Route path="/pharmacy-dashboard" element={<ProtectedRoute allowedRoles={['pharmacist', 'admin', 'super_admin']}><PharmacyDashboard /></ProtectedRoute>} />
        
        {/* Patient Portal Dashboard */}
        <Route path="/patient-portal" element={<ProtectedRoute allowedRoles={['patient']}><PatientPortalDashboard /></ProtectedRoute>} />
        
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/book" element={<BookAppointment />} />
        <Route path="/appointments/:id" element={<AppointmentDetails />} />
        
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorProfile />} />
        
        <Route path="/patients" element={<ProtectedRoute allowedRoles={['doctor', 'admin', 'nurse']}><MyPatients /></ProtectedRoute>} />
        
        <Route path="/medical-history" element={<MedicalHistory />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        
        <Route path="/beds" element={<ProtectedRoute allowedRoles={['admin', 'receptionist', 'nurse', 'doctor']}><BedManagement /></ProtectedRoute>} />
        
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/medicines/inventory" element={<ProtectedRoute allowedRoles={['admin', 'pharmacist']}><MedicineInventory /></ProtectedRoute>} />
        
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><RevenueAnalytics /></ProtectedRoute>} />
        
        <Route path="/profile" element={<Profile />} />
        
        <Route path="/settings/theme" element={<ThemeSettings />} />
        
        <Route path="/video-call/:roomId" element={<VideoCall />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
