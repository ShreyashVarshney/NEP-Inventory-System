import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import Root from './utils/Root';
import Login from './pages/Login';
import ProtectedRoutes from './utils/ProtectedRoutes';
import Dashboard from './pages/Dashboard';
import EquipmentSummary from './components/EquipmentSummary';
import Equipment from './components/Equipment';
import Cables from './components/Cables';
import Users from './components/Users';
import Profile from './components/Profile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoutes requiredRole={["admin", "customer", "staff"]}>
              <Dashboard />
            </ProtectedRoutes>
          }
        >
          <Route index element={<EquipmentSummary />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="products" element={<Equipment />} />
          <Route path="cables" element={<Cables />} />
          <Route
            path="users"
            element={
              <ProtectedRoutes requiredRole={["admin"]}>
                <Users />
              </ProtectedRoutes>
            }
          />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<p className='font-bold text-3xl mt-20 ml-20 text-red-600'>Unauthorized</p>} />
        <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
