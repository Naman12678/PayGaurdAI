import React from 'react';

function OutcomeBadge({ outcome }) {
  const map = {
    success:  'badge-success',
    blocked:  'badge-blocked',
    failed:   'badge-failed',
    no_match: 'badge-no_match',
  };
  return (
    <span className={map[outcome] || 'badge-no_match'}>
      {outcome}
    </span>
  );
}

function VerdictBadge({ verdict }) {
  if (!verdict || verdict === 'n/a') return <span className="text-gray-500 text-xs">—</span>;
  return (
    <span className={verdict === 'pass' ? 'badge-success' : 'badge-blocked'}>
      {verdict}
    </span>
  );
}

export default function AuditRow({ entry }) {
  const {
    requestId, sessionId, intentText, matchedSku,
    policyVerdict, reason, razorpayOrderId, outcome, createdAt, product,
  } = entry;

  const ts = new Date(createdAt).toLocaleString();

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
      <td className="py-3 px-4 text-xs text-gray-500 font-mono">{ts}</td>
      <td className="py-3 px-4 text-sm max-w-xs truncate" title={intentText}>{intentText}</td>
      <td className="py-3 px-4 text-xs font-mono text-gray-300">
        {matchedSku || <span className="text-gray-600">—</span>}
        {product && <div className="text-gray-500 text-xs">{product.name}</div>}
      </td>
      <td className="py-3 px-4"><VerdictBadge verdict={policyVerdict} /></td>
      <td className="py-3 px-4 text-xs text-gray-400 max-w-xs truncate" title={reason}>{reason || '—'}</td>
      <td className="py-3 px-4 text-xs font-mono text-gray-400 truncate">
        {razorpayOrderId || <span className="text-gray-600">—</span>}
      </td>
      <td className="py-3 px-4"><OutcomeBadge outcome={outcome} /></td>
      <td className="py-3 px-4 text-xs font-mono text-gray-600 truncate"
          title={requestId}>{requestId?.slice(0, 8)}…</td>
    </tr>
  );
}
