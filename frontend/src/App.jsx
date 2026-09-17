import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import { BookingModalProvider, useBookingModal } from "./context/BookingModalContext";
import { RequireAuth, RequireAdmin, RequireHospitalStaff } from "./components/ProtectedRoute";
import { ADMIN_LOGIN_PATH } from "./config";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Services from "./pages/Services";
import MyBookings from "./pages/MyBookings";
import BecomePartner from "./pages/BecomePartner";
import HowItWorks from "./pages/HowItWorks";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import MembershipSignup from "./pages/MembershipSignup";
import MembershipInfo from "./pages/MembershipInfo";
import MemberDashboard from "./pages/MemberDashboard";
import PriorityAccess from "./pages/PriorityAccess";
import PriorityAccessProfile from "./pages/PriorityAccessProfile";
import PriorityAccessApply from "./pages/PriorityAccessApply";
import OfficerCapture from "./pages/OfficerCapture";
import OfficerDischarge from "./pages/OfficerDischarge";
import HospitalLogin from "./pages/HospitalLogin";
import HospitalDashboard from "./pages/HospitalDashboard";
import AdminHospitalProgram from "./pages/AdminHospitalProgram";

function AppLayout() {
  const { openQuickBook } = useBookingModal();

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar onOpenQuickBook={() => openQuickBook()} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/services" element={<Services />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/become-a-partner" element={<BecomePartner />} />
          <Route path="/my-bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
          <Route path="/membership/join" element={<MembershipSignup />} />
          <Route path="/membership/info" element={<MembershipInfo />} />
          <Route path="/member" element={<RequireAuth><MemberDashboard /></RequireAuth>} />
          <Route path="/priority-access" element={<PriorityAccess />} />
          <Route path="/priority-access/apply" element={<PriorityAccessApply />} />
          <Route path="/priority-access/:id" element={<PriorityAccessProfile />} />
          <Route path={ADMIN_LOGIN_PATH} element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/officer/discharge/:token" element={<OfficerDischarge />} />
          <Route path="/officer/:token" element={<OfficerCapture />} />
          <Route path="/hospital/login" element={<HospitalLogin />} />
          <Route path="/hospital/dashboard" element={<RequireHospitalStaff><HospitalDashboard /></RequireHospitalStaff>} />
          <Route path="/admin/hospitals" element={<RequireAdmin><AdminHospitalProgram /></RequireAdmin>} />
        </Routes>
      </main>
      <Footer />
      <BottomNav onOpenQuickBook={() => openQuickBook()} />
    </div>
  );
}

export default function App() {
  return (
    <BookingModalProvider>
      <AppLayout />
    </BookingModalProvider>
  );
}
