import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="section-tight text-center !py-28">
      <div className="stamp-block !text-2xl !px-4 !py-2 mb-6 inline-flex">404 · Block</div>
      <h1 className="text-2xl font-display font-semibold text-text mb-3">No route matched that request.</h1>
      <p className="text-text-faint mb-8">
        Unlike an unblocked payment, this one really did go nowhere.
      </p>
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  );
}
