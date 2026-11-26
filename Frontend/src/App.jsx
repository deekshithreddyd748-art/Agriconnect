import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { PROVIDER_ROLES } from './utils/constants';

import LandingPage from './pages/public/LandingPage';
import AboutPage from './pages/public/AboutPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import ServicesPage from './pages/public/ServicesPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import RoleSelectionPage from './pages/public/RoleSelectionPage';
import LabourDemoPage from './pages/public/LabourDemoPage';

import FarmerDashboard from './pages/farmer/FarmerDashboard';
import RequestLabourPage from './pages/farmer/RequestLabourPage';
import MachineryMarketplace from './pages/farmer/MachineryMarketplace';
import EquipmentDetailsPage from './pages/farmer/EquipmentDetailsPage';
import LabourDiscoveryPage from './pages/farmer/LabourDiscoveryPage';
import LabourDetailsPage from './pages/farmer/LabourDetailsPage';
import FacilityDiscoveryPage from './pages/farmer/FacilityDiscoveryPage';
import FacilityDetailsPage from './pages/farmer/FacilityDetailsPage';
import NearbyMapPage from './pages/farmer/NearbyMapPage';
import MyBookingsPage from './pages/farmer/MyBookingsPage';

import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderListingsPage from './pages/provider/ProviderListingsPage';
import ListingFormPage from './pages/provider/ListingFormPage';
import ProviderBookingsPage from './pages/provider/ProviderBookingsPage';
import AvailabilityManagementPage from './pages/provider/AvailabilityManagementPage';
import OpenLabourRequestsPage from './pages/provider/OpenLabourRequestsPage';

import BookingDetailsPage from './pages/shared/BookingDetailsPage';
import ProfileSettingsPage from './pages/shared/ProfileSettingsPage';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-earth-50">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/select-role" element={<RoleSelectionPage />} />
                <Route path="/labour-demo" element={<LabourDemoPage />} />

                {/* Discovery Routes */}
                <Route path="/machinery" element={<MachineryMarketplace />} />
                <Route path="/machinery/:id" element={<EquipmentDetailsPage />} />
                <Route path="/labour" element={<LabourDiscoveryPage />} />
                <Route path="/labour/:id" element={<LabourDetailsPage />} />
                <Route path="/facilities" element={<FacilityDiscoveryPage />} />
                <Route path="/facilities/:id" element={<FacilityDetailsPage />} />
                <Route path="/nearby-map" element={<NearbyMapPage />} />

                {/* Farmer Protected Routes */}
                <Route
                  path="/farmer/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                      <FarmerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/farmer/request-labour"
                  element={
                    <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                      <RequestLabourPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/farmer/bookings"
                  element={
                    <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                      <MyBookingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Provider Protected Routes */}
                <Route
                  path="/provider/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={[...PROVIDER_ROLES, 'admin']}>
                      <ProviderDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/open-requests"
                  element={
                    <ProtectedRoute allowedRoles={['labour_provider', 'admin']}>
                      <OpenLabourRequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/listings"
                  element={
                    <ProtectedRoute allowedRoles={[...PROVIDER_ROLES, 'admin']}>
                      <ProviderListingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/listings/new"
                  element={
                    <ProtectedRoute allowedRoles={[...PROVIDER_ROLES, 'admin']}>
                      <ListingFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/listings/:type/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={[...PROVIDER_ROLES, 'admin']}>
                      <ListingFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/requests"
                  element={
                    <ProtectedRoute allowedRoles={[...PROVIDER_ROLES, 'admin']}>
                      <ProviderBookingsPage initialStatus="Pending" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/bookings"
                  element={
                    <ProtectedRoute allowedRoles={[...PROVIDER_ROLES, 'admin']}>
                      <ProviderBookingsPage initialStatus="All" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/availability"
                  element={
                    <ProtectedRoute allowedRoles={[...PROVIDER_ROLES, 'admin']}>
                      <AvailabilityManagementPage />
                    </ProtectedRoute>
                  }
                />

                {/* Shared Authenticated Routes */}
                <Route
                  path="/bookings/:id"
                  element={
                    <ProtectedRoute>
                      <BookingDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfileSettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Route */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <Toaster position="top-right" />
          </div>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  );
}
