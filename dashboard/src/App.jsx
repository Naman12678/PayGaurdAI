import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import AuditTrail from './pages/AuditTrail.jsx';
import PolicyConfig from './pages/PolicyConfig.jsx';
import CatalogPreview from './pages/CatalogPreview.jsx';
import CheckoutDemo from './pages/CheckoutDemo.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/audit" replace />} />
        <Route path="audit"    element={<AuditTrail />} />
        <Route path="policy"   element={<PolicyConfig />} />
        <Route path="catalog"  element={<CatalogPreview />} />
        <Route path="checkout" element={<CheckoutDemo />} />
      </Route>
    </Routes>
  );
}
