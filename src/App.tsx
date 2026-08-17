import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MainLayout } from "./components/layout/MainLayout"
import { CitizenLayout } from "./components/layout/CitizenLayout"

import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Forbidden } from "./pages/Forbidden"

import { MapPage } from "./pages/MapPage"
import { Landing } from "./pages/Landing"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Dashboard } from "./pages/Dashboard" // Admin Dashboard
import { CitizenDashboard } from "./pages/CitizenDashboard"
import { SupervisorDashboard } from "./pages/SupervisorDashboard"
import { SupervisorComplaints } from "./pages/SupervisorComplaints"
import { SupervisorComplaintDetail } from "./pages/SupervisorComplaintDetail"
import { SupervisorTeam } from "./pages/SupervisorTeam"
import { SupervisorWorkerDetail } from "./pages/SupervisorWorkerDetail"
import { SupervisorNotifications } from "./pages/SupervisorNotifications"
import { WorkerDashboard } from "./pages/WorkerDashboard"
import { WorkerTasks } from "./pages/WorkerTasks"
import { WorkerTaskDetail } from "./pages/WorkerTaskDetail"
import { WorkerMap } from "./pages/WorkerMap"
import { WorkerNotifications } from "./pages/WorkerNotifications"

import { AdminServices } from "./pages/AdminServices"
import { AdminCitizens } from "./pages/AdminCitizens"
import { AdminMonitoring } from "./pages/AdminMonitoring"

import { ForgotPassword } from "./pages/ForgotPassword"
import { RaiseComplaint } from "./pages/RaiseComplaint"
import { ComplaintCategories } from "./pages/ComplaintCategories"
import { MyComplaints } from "./pages/MyComplaints"
import { ComplaintDetails } from "./pages/ComplaintDetails"
import { LiveTracking } from "./pages/LiveTracking"
import { TrackComplaint } from "./pages/TrackComplaint"
import { PublicStatistics } from "./pages/PublicStatistics"
import { Notifications } from "./pages/Notifications"
import { Feedback } from "./pages/Feedback"
import { ContactUs } from "./pages/ContactUs"
import { AboutUs } from "./pages/AboutUs"
import { FAQ } from "./pages/FAQ"
import { PrivacyPolicy } from "./pages/PrivacyPolicy"
import { Terms } from "./pages/Terms"
import { HelpCenter } from "./pages/HelpCenter"
import { EmergencyContacts } from "./pages/EmergencyContacts"
import { Profile } from "./pages/Profile"
import { Settings } from "./pages/Settings"
import { SearchResults } from "./pages/SearchResults"
import { NearbyIssues } from "./pages/NearbyIssues"
import { NotFound } from "./pages/NotFound"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/emergency" element={<EmergencyContacts />} />
            
            {/* 403 Forbidden */}
            <Route path="/403" element={<Forbidden />} />
            
            {/* Redirect old /dashboard to login */}
            <Route path="/dashboard" element={<Navigate to="/login" replace />} />
            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<MainLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="citizens" element={<AdminCitizens />} />
                <Route path="map" element={<MapPage />} />
                <Route path="monitoring" element={<AdminMonitoring />} />
                <Route path="settings" element={<Settings />} />
                <Route path="statistics" element={<PublicStatistics />} />
                <Route path="feedback" element={<Feedback />} />
              </Route>
            </Route>

            {/* Supervisor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
              <Route path="/supervisor" element={<MainLayout />}>
                <Route index element={<Navigate to="/supervisor/dashboard" replace />} />
                <Route path="dashboard" element={<SupervisorDashboard />} />
                <Route path="complaints" element={<SupervisorComplaints />} />
                <Route path="complaints/:id" element={<SupervisorComplaintDetail />} />
                <Route path="team" element={<SupervisorTeam />} />
                <Route path="team/:id" element={<SupervisorWorkerDetail />} />
                <Route path="notifications" element={<SupervisorNotifications />} />
              </Route>
            </Route>

            {/* Worker Routes */}
            <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
              <Route path="/worker" element={<MainLayout />}>
                <Route index element={<Navigate to="/worker/dashboard" replace />} />
                <Route path="dashboard" element={<WorkerDashboard />} />
                <Route path="tasks" element={<WorkerTasks />} />
                <Route path="tasks/:id" element={<WorkerTaskDetail />} />
                <Route path="map" element={<WorkerMap />} />
                <Route path="notifications" element={<WorkerNotifications />} />
              </Route>
            </Route>

            {/* Citizen Routes */}
            <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
              <Route path="/citizen" element={<CitizenLayout />}>
                <Route index element={<Navigate to="/citizen/dashboard" replace />} />
                <Route path="dashboard" element={<CitizenDashboard />} />
                <Route path="raise-complaint" element={<RaiseComplaint />} />
                <Route path="categories" element={<ComplaintCategories />} />
                <Route path="my-complaints" element={<MyComplaints />} />
                <Route path="complaint/:id" element={<ComplaintDetails />} />
                <Route path="live-tracking/:id" element={<LiveTracking />} />
                <Route path="track-complaint" element={<TrackComplaint />} />
                <Route path="nearby" element={<NearbyIssues />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="search" element={<SearchResults />} />
              </Route>
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
