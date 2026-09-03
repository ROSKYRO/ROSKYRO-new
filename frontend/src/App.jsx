import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { RequireAuth, RequireAdmin } from "./components/ProtectedRoute";
import { ADMIN_LOGIN_PATH } from "./config";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Services from "./pages/Services";
import MyBookings from "./pages/MyBookings";
import BecomePartner from "./pages/BecomePartner";
import HowItWorks from "./pages/HowItWorks";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/services" element={<Services />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/become-a-partner" element={<BecomePartner />} />
          <Route path="/my-bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
          {/* Not linked from Navbar/anywhere on purpose — reachable only if you know the URL. */}
          <Route path={ADMIN_LOGIN_PATH} element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
