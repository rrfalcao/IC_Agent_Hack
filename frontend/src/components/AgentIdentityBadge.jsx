/**
 * Agent Identity Badge
 * Displays ERC-8004 verified agent identity with link to on-chain proof
 * 
 * Shows:
 * - Live status indicator
 * - Agent ID (ERC-8004 NFT)
 * - Link to blockchain explorer for verification
 */

import React from 'react';

const AgentIdentityBadge = ({ 
  agentId = "1581", 
  explorerUrl = "https://sepolia.basescan.org/token/0x8004AA63c570c570eBF15376c0dB199918BFe9Fb?a=1581",
  compact = false,
  showNetwork = true 
}) => {
  if (compact) {
    return (
      <a 
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.5rem',
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '999px',
          color: '#4ade80',
          fontSize: '0.75rem',
          fontWeight: '600',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)';
          e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
        }}
      >
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 6px #22c55e',
        }} />
        #{agentId}
      </a>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      padding: '0.5rem 0.875rem',
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(34, 197, 94, 0.08) 100%)',
      border: '1px solid rgba(59, 130, 246, 0.25)',
      borderRadius: '999px',
      width: 'fit-content',
    }}>
      {/* Pulse Animation for "Live" Status */}
      <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
        <span style={{
          position: 'absolute',
          display: 'inline-flex',
          height: '100%',
          width: '100%',
          borderRadius: '50%',
          background: '#4ade80',
          opacity: 0.75,
          animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        }} />
        <span style={{
          position: 'relative',
          display: 'inline-flex',
          borderRadius: '50%',
          height: '10px',
          width: '10px',
          background: '#22c55e',
          boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
        }} />
      </span>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ 
            fontSize: '0.65rem', 
            color: '#9ca3af', 
            fontFamily: 'monospace',
            fontWeight: '500',
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}>
            AWE VERIFIED
          </span>
          {showNetwork && (
            <span style={{
              fontSize: '0.55rem',
              color: '#6366f1',
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '0.125rem 0.375rem',
              borderRadius: '3px',
              fontWeight: '600',
            }}>
              BASE SEPOLIA
            </span>
          )}
        </div>
        <a 
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.9rem',
            fontWeight: '700',
            color: '#60a5fa',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            transition: 'color 0.2s ease',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#93c5fd'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#60a5fa'}
        >
          Agent #{agentId}
          <svg 
            width="12" 
            height="12" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ opacity: 0.7 }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AgentIdentityBadge;

