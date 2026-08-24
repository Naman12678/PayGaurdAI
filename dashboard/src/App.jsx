import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './components/PublicLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import Landing from './pages/public/Landing.jsx';
import About from './pages/public/About.jsx';
import Privacy from './pages/public/Privacy.jsx';
import Resources from './pages/public/Resources.jsx';
import Login from './pages/public/Login.jsx';
import Signup from './pages/public/Signup.jsx';
import NotFound from './pages/public/NotFound.jsx';

import AuditTrail from './pages/AuditTrail.jsx';
import PolicyConfig from './pages/PolicyConfig.jsx';
import CatalogPreview from './pages/CatalogPreview.jsx';
import CheckoutDemo from './pages/CheckoutDemo.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public marketing site */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="about" element={<About />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="resources" element={<Resources />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>

      {/* Authenticated app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="audit" replace />} />
        <Route path="audit" element={<AuditTrail />} />
        <Route path="policy" element={<PolicyConfig />} />
        <Route path="catalog" element={<CatalogPreview />} />
        <Route path="checkout" element={<CheckoutDemo />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
