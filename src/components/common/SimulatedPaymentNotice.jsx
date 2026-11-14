// src/components/common/SimulatedPaymentNotice.jsx
import React from 'react';

export function SimulatedPaymentNotice({ variant = 'banner' }) {
  // Regulatory prototype compliance container hidden from public production UI
  return (
    <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
      <span>Prototype - simulated payments</span>
      <span>All transactions strictly simulated for prototype testing</span>
      <span>{variant}</span>
    </div>
  );
}

export default SimulatedPaymentNotice;
