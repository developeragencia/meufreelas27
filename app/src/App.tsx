import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FreelancerDashboard from './pages/FreelancerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewProject from './pages/NewProject';
import Projects from './pages/Projects';
import Freelancers from './pages/Freelancers';
import HowItWorks from './pages/HowItWorks';
import ProjectDetail from './pages/ProjectDetail';
import FreelancerProfile from './pages/FreelancerProfile';
import Messages from './pages/Messages';
import Proposals from './pages/Proposals';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Activate from './pages/Activate';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import MyProjects from './pages/MyProjects';
import HelpCenter from './pages/HelpCenter';
import EditProfile from './pages/EditProfile';
import MyProfile from './pages/MyProfile';
import Account from './pages/Account';
import Tools from './pages/Tools';
import Premium from './pages/Premium';
import UserProfile from './pages/UserProfile';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';
import SendProposal from './pages/SendProposal';
import Checkout from './pages/Checkout';
import AdminUsers from './pages/AdminUsers';
import AdminSanctions from './pages/AdminSanctions';
import PremiumPlans from './pages/PremiumPlans';
import FormatoTextos from './pages/FormatoTextos';
import Blog from './pages/Blog';
import ErrorBoundary from './components/ErrorBoundary';

let storageSanitized = false;

function sanitizeLocalStorageOnce(): void {
  if (storageSanitized || typeof window === 'undefined') return;
  storageSanitized = true;

  const fallbackByKey: Record<string, string> = {
    meufreelas_user: '{}',
    meufreelas_users: '[]',
    meufreelas_projects: '[]',
    meufreelas_proposals: '[]',
    meufreelas_transactions: '[]',
    meufreelas_reports: '[]',
    meufreelas_saved_projects: '[]',
    meufreelas_sanctions: '[]',
    meufreelas_user_sanctions: '{}',
  };

  const isArrayPrefix = (k: string) =>
    k.startsWith('goals_') || k.startsWith('favorites_') || k.startsWith('notifications_');
  const isObjectPrefix = (k: string) => k.startsWith('profile_');

  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      try {
        JSON.parse(raw);
      } catch {
        if (fallbackByKey[key] != null) {
          window.localStorage.setItem(key, fallbackByKey[key]);
        } else if (isArrayPrefix(key)) {
          window.localStorage.setItem(key, '[]');
        } else if (isObjectPrefix(key)) {
          window.localStorage.setItem(key, '{}');
        }
      }
    }
  } catch {
    // Ignora erros de acesso ao storage (ex.: modo restrito do navegador)
  }
}

// Protected Route Component - reconhece login; sair só ao clicar em Sair
function ProtectedRoute({ children, allowedType }: { children: React.ReactNode; allowedType?: 'freelancer' | 'client' | 'admin' }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-99blue" />
      </div>
    );
  }

  if (allowedType && user.type !== allowedType) {
    // Evita loop de redirecionamento quando storage antigo traz type inválido
    if (user.type !== 'admin' && user.type !== 'freelancer' && user.type !== 'client') {
      return <Navigate to="/login" replace />;
    }
    if (user.type === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.type === 'freelancer') return <Navigate to="/freelancer/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/ativar" element={<Activate />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/freelancers" element={<Freelancers />} />
      <Route path="/como-funciona" element={<HowItWorks />} />
      <Route path="/privacidade" element={<PrivacyPolicy />} />
      <Route path="/termos" element={<TermsOfUse />} />
      <Route path="/ajuda" element={<HelpCenter />} />
      <Route path="/formatacao-de-textos" element={<FormatoTextos />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/project/:id" element={<ProjectDetail />} />
      <Route path="/freelancer/:id" element={<FreelancerProfile />} />
      <Route path="/premium" element={<ProtectedRoute allowedType="freelancer"><Premium /></ProtectedRoute>} />
      <Route path="/plans" element={<ProtectedRoute allowedType="freelancer"><PremiumPlans /></ProtectedRoute>} />
      <Route path="/user/:username" element={<UserProfile />} />
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/project/:projectId/proposal" 
        element={
          <ProtectedRoute allowedType="freelancer">
            <SendProposal />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/project/bid/:projectId"
        element={
          <ProtectedRoute allowedType="freelancer">
            <SendProposal />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/checkout/:proposalId" 
        element={
          <ProtectedRoute allowedType="client">
            <Checkout />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - Freelancer */}
      <Route 
        path="/freelancer/dashboard" 
        element={
          <ProtectedRoute allowedType="freelancer">
            <FreelancerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/freelancer/proposals" 
        element={
          <ProtectedRoute allowedType="freelancer">
            <Proposals />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/freelancer/projects" 
        element={
          <ProtectedRoute allowedType="freelancer">
            <MyProjects />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - Client */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedType="client">
            <ClientDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/project/new" 
        element={
          <ProtectedRoute allowedType="client">
            <NewProject />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-projects" 
        element={
          <ProtectedRoute allowedType="client">
            <MyProjects />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - Admin */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedType="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute allowedType="admin">
            <AdminUsers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/sanctions" 
        element={
          <ProtectedRoute allowedType="admin">
            <AdminSanctions />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - All Users */}
      <Route 
        path="/messages" 
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payments" 
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile/edit" 
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/account" 
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tools" 
        element={
          <ProtectedRoute>
            <Tools />
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  sanitizeLocalStorageOnce();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
