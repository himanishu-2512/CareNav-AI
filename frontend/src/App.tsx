import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PatientProvider } from './contexts/PatientContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PatientRegistration from './components/PatientRegistration';
import DoctorRegistration from './components/DoctorRegistration';
import SymptomInput from './components/SymptomInput';
import SymptomChat from './components/SymptomChat';
import SymptomDetail from './components/SymptomDetail';
import EditProfile from './components/EditProfile';
import FollowUpQuestions from './components/FollowUpQuestions';
import CareNavigation from './components/CareNavigation';
import DepartmentFinder from './components/DepartmentFinder';
import DepartmentPredictor from './components/DepartmentPredictor';
import DoctorList from './components/DoctorList';
import Messages from './components/Messages';
import PatientList from './components/PatientList';
import PrescribeMedicine from './components/PrescribeMedicine';
import PatientTreatmentPlans from './components/PatientTreatmentPlans';
import PatientAdherence from './components/PatientAdherence';
import CreateTreatmentPlan from './components/CreateTreatmentPlan';
import { ReportUpload } from './components/ReportUpload';
import { TreatmentSchedule } from './components/TreatmentSchedule';
import { TreatmentPlanner } from './components/TreatmentPlanner';
import { PatientSummary } from './components/PatientSummary';
import { AdherenceDashboard } from './components/AdherenceDashboard';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { QRScannerPage } from './pages/QRScannerPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { TreatmentChatPage } from './pages/TreatmentChatPage';
import { PrescriptionFormPage } from './pages/PrescriptionFormPage';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Determine default dashboard based on role
  const defaultDashboard = user?.role === 'doctor' ? '/doctor/dashboard' : '/dashboard';

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={defaultDashboard} replace /> : <Login />} />
      <Route path="/register/patient" element={isAuthenticated ? <Navigate to={defaultDashboard} replace /> : <PatientRegistration />} />
      <Route path="/register/doctor" element={isAuthenticated ? <Navigate to={defaultDashboard} replace /> : <DoctorRegistration />} />
      <Route path="/register" element={<Navigate to="/register/patient" replace />} />
      
      {/* Patient Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/symptoms/chat" element={<ProtectedRoute><SymptomChat /></ProtectedRoute>} />
      <Route path="/symptoms/:symptomId" element={<ProtectedRoute><SymptomDetail /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/department/finder" element={<ProtectedRoute><DepartmentPredictor /></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute><DepartmentFinder /></ProtectedRoute>} />
      <Route path="/doctors" element={<ProtectedRoute><DoctorList /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/symptoms/input" element={<ProtectedRoute><SymptomInput /></ProtectedRoute>} />
      <Route path="/symptoms/followup/:symptomId" element={<ProtectedRoute><FollowUpQuestions /></ProtectedRoute>} />
      <Route path="/symptoms/navigation/:symptomId" element={<ProtectedRoute><CareNavigation /></ProtectedRoute>} />
      <Route path="/reports/upload" element={<ProtectedRoute><ReportUpload /></ProtectedRoute>} />
      <Route path="/treatment/schedule" element={<ProtectedRoute><TreatmentSchedule /></ProtectedRoute>} />
      <Route path="/treatment/planner" element={<ProtectedRoute><TreatmentPlanner /></ProtectedRoute>} />
      <Route path="/patients/summary" element={<ProtectedRoute><PatientSummary /></ProtectedRoute>} />
      <Route path="/adherence/dashboard" element={<ProtectedRoute><AdherenceDashboard /></ProtectedRoute>} />
      
      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={<ProtectedRoute><DoctorDashboardPage /></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute><PatientList /></ProtectedRoute>} />
      <Route path="/doctor/prescribe" element={<ProtectedRoute><PrescribeMedicine /></ProtectedRoute>} />
      <Route path="/doctor/patient/:patientId/prescribe" element={<ProtectedRoute><PrescribeMedicine /></ProtectedRoute>} />
      <Route path="/doctor/patient/:patientId/treatments" element={<ProtectedRoute><PatientTreatmentPlans /></ProtectedRoute>} />
      <Route path="/doctor/patient/:patientId/adherence" element={<ProtectedRoute><PatientAdherence /></ProtectedRoute>} />
      <Route path="/doctor/qr-scanner" element={<ProtectedRoute><QRScannerPage /></ProtectedRoute>} />
      <Route path="/doctor/patient/:patientId" element={<ProtectedRoute><PatientProfilePage /></ProtectedRoute>} />
      <Route path="/doctor/treatment/:episodeId" element={<ProtectedRoute><TreatmentChatPage /></ProtectedRoute>} />
      <Route path="/doctor/prescription/:episodeId" element={<ProtectedRoute><PrescriptionFormPage /></ProtectedRoute>} />
      
      {/* Treatment Plan Routes (New Workflow) */}
      <Route path="/doctor/create-treatment-plan" element={<ProtectedRoute><CreateTreatmentPlan /></ProtectedRoute>} />
      <Route path="/doctor/treatment-plan/:planId" element={<ProtectedRoute><TreatmentPlanner /></ProtectedRoute>} />
      
      <Route path="/" element={<Navigate to={isAuthenticated ? defaultDashboard : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <PatientProvider>
          <AppRoutes />
        </PatientProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
