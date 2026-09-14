import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PropertiesPage from './components/PropertiesPage';
import PropertyUnitsPage from './components/PropertyUnitsPage';
import UnitDetailsPage from './components/UnitDetailsPage'; 
import OwnerDetailsPage from './components/OwnerDetailsPage';
import ContractsPage from './components/ContractsPage'; 
import ContractPaymentsPage from './components/ContractPaymentsPage'; 
import InvestorsPage from './components/InvestorsPage'; // 1. استيراد صفحة إدارة المستثمرين
import InvestorDetailsPage from './components/InvestorDetailsPage'; // 2. استيراد صفحة تفاصيل المستثمرim
import Reports from './components/Reports';
function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userFullName, setUserFullName] = useState(localStorage.getItem('fullName') || '');

  const handleLoginSuccess = (newToken, newFullName) => {
    setToken(newToken);
    setUserFullName(newFullName);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setUserFullName('');
  };

  return (
    <Routes>
      {/* 1. مسار تسجيل الدخول */}
      <Route 
        path="/login" 
        element={!token ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />} 
      />

      {/* 2. مسار تفاصيل الوحدة */}
      <Route 
        path="/units/:id" 
        element={token ? <UnitDetailsPage /> : <Navigate to="/login" replace />} 
      />

      {/* 3. مسار تفاصيل المالك */}
      <Route 
        path="/owners/:id" 
        element={token ? <OwnerDetailsPage /> : <Navigate to="/login" replace />} 
      />

      {/* 4. مسار تفاصيل المستثمر (يجب أن يكون قبل المسار الشامل أو مسار القائمة لضمان قراءة الـ ID بدقة) */}
      <Route 
        path="/investors/:id" 
        element={token ? <InvestorDetailsPage /> : <Navigate to="/login" replace />} 
      />

      {/* 5. مسار إدارة المستثمرين */}
      <Route 
        path="/investors" 
        element={token ? <InvestorsPage /> : <Navigate to="/login" replace />} 
      />

      {/* 6. مسار دفعات العقد */}
      <Route 
        path="/contracts/:id/payments" 
        element={token ? <ContractPaymentsPage /> : <Navigate to="/login" replace />} 
      />

      {/* 7. مسار إدارة العقودات الرئيسي */}
      <Route 
        path="/contracts" 
        element={token ? <ContractsPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/reports" 
        element={token ? <Reports /> : <Navigate to="/login" replace />} 
      />

      {/* 8. الداشبورد والصفحات التابعة له (المسار الشامل يأتي أخيراً) */}
      <Route 
        path="/*" 
        element={token ? <Dashboard userFullName={userFullName} onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
}

export default App;