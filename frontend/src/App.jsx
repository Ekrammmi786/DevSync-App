import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, ProtectedRoute, GuestRoute } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Auth pages (no navbar)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import OnboardingPage from './pages/OnboardingPage';

// App pages (with navbar via AppLayout)
import HomePage from './pages/homePage';
import ChatPage from './pages/ChatPage';
import CallPage from './pages/callPage';
import NotificationPage from './pages/notificationPage';
import SearchUsersPage from './pages/SearchUsersPage';
import FriendsPage from './pages/FriendsPage';
import AdminPage from './pages/AdminPage';

const App = () => {
  return (
    <div className='h-screen' data-theme="olive">
      <AuthProvider>
        <Routes>
          {/* Public / Guest routes — no navbar */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignUpPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

          {/* Protected routes without AppLayout (custom layouts) */}
          <Route path="/verify-email" element={<ProtectedRoute><VerifyEmailPage /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

          {/* Protected routes with shared AppLayout (Navbar) */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/calls" element={<CallPage />} />
            <Route path="/notifications" element={<NotificationPage />} />
            <Route path="/find" element={<SearchUsersPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </AuthProvider>

      <Toaster position="top-center" />
    </div>
  );
};

export default App;
