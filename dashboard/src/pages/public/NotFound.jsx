import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="section-tight text-center !py-28">
      <div className="font-display text-6xl text-gray-800 mb-4">404</div>
      <h1 className="text-2xl font-semibold text-white mb-3">No route matched that request.</h1>
      <p className="text-gray-500 mb-8">
        Unlike an unblocked payment, this one really did go nowhere.
      </p>
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  );
}
