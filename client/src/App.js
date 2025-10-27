import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import Login from "./pages/Login";
import Logout from './pages/Logout';
import Register from "./pages/Register";
import DonorDashboard from "./pages/donor/DonorDashboard";
import CreateDonation from "./pages/donor/CreateDonation";
import DonorNotifications from "./pages/donor/DonorNotifications";
import NGODashboard from "./pages/ngo/NGODashboard";

const theme = createTheme({
  palette: {
    primary: { main: "#2e7d32" },
    secondary: { main: "#ff6f00" },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />

          {/* Donor */}
          <Route path="/donor/dashboard" element={<DonorDashboard />} />
          <Route path="/donor/create" element={<CreateDonation />} />
          <Route path="/donor/notifications" element={<DonorNotifications />} />

          {/* NGO */}
          <Route path="/ngo/dashboard" element={<NGODashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
