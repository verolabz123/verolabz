import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { HydrationProvider } from "@/components/HydrationProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import HomePage from "@/pages/HomePageEnhanced"; // Updated import
import FeaturesPage from "@/pages/FeaturesPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import PricingPage from "@/pages/PricingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import BulkUploadPage from "@/pages/dashboard/BulkUploadPage";
import CandidateManagementPage from "@/pages/dashboard/CandidateManagementPage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import BillingPage from "@/pages/dashboard/BillingPage";

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";

function App() {
  return (
    <Router>
      <AuthProvider>
        <HydrationProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/pricing" element={<PricingPage />} />

            {/* Auth routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route
              path="/auth/forgot-password"
              element={<ForgotPasswordPage />}
            />

            {/* Protected Dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="bulk-upload" element={<BulkUploadPage />} />
              <Route path="candidates" element={<CandidateManagementPage />} />
              <Route path="settings/profile" element={<ProfilePage />} />
              <Route path="settings/billing" element={<BillingPage />} />
            </Route>
          </Routes>
          <Toaster />
        </HydrationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
