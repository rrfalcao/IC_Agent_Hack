/**
 * Contract Auditor Component
 * Integrated with global Agent Brain visualization
 * Shows real-time thought process in the slide-out drawer
 */

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { PaymentModal } from './PaymentModal';
import { GlassPanel, glassInputStyle } from './GlassPanel';
import AgentIdentityBadge from './AgentIdentityBadge';
import { useAgentBrain } from '../hooks/useAgentBrain';
import { logActivity, ACTIVITY_TYPES } from './WalletStatus';

// In production (served from same origin), use empty string for relative URLs
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

export function ContractAuditor() {
  const { address: userAddress, isConnected } = useAccount();
  const brain = useAgentBrain();
  
  const [mode, setMode] = useState('code'); // 'code' or 'address'
  const [code, setCode] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentRequired, setPaymentRequired] = useState(null);

  // Run the audit with global brain visualization
  const runAuditWithBrain = useCallback(async (paymentData) => {
    setShowPayment(false);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const auditResult = await brain.runAudit(async () => {
        // Build headers
        const headers = { 'Content-Type': 'application/json' };
        
        // Add payment header or demo skip
        if (paymentData?.paymentHeader) {
          headers['X-PAYMENT'] = paymentData.paymentHeader;
        }
        // CHIM credits are checked server-side based on userAddress

        const body = mode === 'code' 
          ? { code } 
          : { address: contractAddress };

        const response = await fetch('${API_URL}/api/audit', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Audit failed');
        }

        return data;
      });

      // Log the audit activity
      if (auditResult && userAddress) {
        logActivity(userAddress, ACTIVITY_TYPES.CONTRACT_AUDIT, {
          status: 'success',
          details: mode === 'code' 
            ? `Audited code snippet (${code.length} chars)` 
            : `Audited contract: ${contractAddress}`,
          contractAddress: mode === 'address' ? contractAddress : null
        });
      }

      setResult(auditResult);

    } catch (err) {
      console.error('Audit error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [brain, mode, code, contractAddress]);

  // Step 1: Request payment (triggers 402)
  const handleRequestAudit = async () => {
    if (mode === 'code' && !code) return;
    if (mode === 'address' && !contractAddress) return;
    
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    setError(null);

    try {
      // Call the protected endpoint to get 402 response
      const response = await fetch('${API_URL}/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'code' ? { code } : { address: contractAddress })
      });

      // Should return 402 with payment details
      if (response.status === 402) {
        const paymentData = await response.json();
        setPaymentRequired(paymentData);
        setShowPayment(true);
      } else {
        // Unexpected response
        const data = await response.json();
        throw new Error(data.message || 'Unexpected response');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle payment completion
  const handlePaymentComplete = (paymentData) => {
    runAuditWithBrain(paymentData);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getRiskBadge = (score) => {
    if (score >= 90) return { text: 'Low Risk', color: '#86efac' };
    if (score >= 70) return { text: 'Medium Risk', color: '#fbbf24' };
    return { text: 'High Risk', color: '#fca5a5' };
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#f5f5f5', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🛡️</span>
            Security Auditor
          </h2>
          <AgentIdentityBadge compact agentId="1581" />
        </div>
        <p style={{ color: '#737373', margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
          AI-powered vulnerability detection • Watch the Agent Brain while processing
        </p>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setMode('code')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: mode === 'code' 
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)'
              : 'rgba(255, 255, 255, 0.08)',
            border: mode === 'code'
              ? '1px solid rgba(251, 191, 36, 0.4)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            color: mode === 'code' ? '#fbbf24' : '#a3a3a3',
          }}
        >
          📝 Source Code
        </button>
        <button
          onClick={() => setMode('address')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: mode === 'address' 
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)'
              : 'rgba(255, 255, 255, 0.08)',
            border: mode === 'address'
              ? '1px solid rgba(251, 191, 36, 0.4)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            color: mode === 'address' ? '#fbbf24' : '#a3a3a3',
          }}
        >
          🔗 Contract Address
        </button>
      </div>

      {/* Input */}
      {mode === 'code' ? (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: '#a3a3a3', marginBottom: '0.375rem', fontSize: '0.8rem' }}>
            Solidity Source Code
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyContract {
    // Paste your code here...
}`}
            rows={result ? 8 : 12}
            style={{
              ...glassInputStyle,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(251, 191, 36, 0.4)';
              e.target.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: '#a3a3a3', marginBottom: '0.375rem', fontSize: '0.8rem' }}>
            Contract Address (must be verified on BSCScan)
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            style={{
              ...glassInputStyle,
              fontSize: '0.95rem',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(251, 191, 36, 0.4)';
              e.target.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      )}

      <CartoonButton
        label={loading ? '🔄 Auditing... (Watch Brain →)' : !isConnected ? '🔗 Connect Wallet' : '🛡️ Run Security Audit'}
        color="bg-amber-400"
        onClick={handleRequestAudit}
        disabled={loading || !isConnected || (mode === 'code' ? !code : !contractAddress)}
      />

      {/* Error */}
      {error && (
        <GlassPanel 
          variant="surface" 
          hover={false}
          style={{
            marginTop: '1rem',
            padding: '0.875rem 1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ color: '#fca5a5', fontWeight: '600', fontSize: '0.85rem' }}>❌ Error</div>
          <div style={{ color: '#fca5a5', fontSize: '0.8rem', opacity: 0.9 }}>{error}</div>
        </GlassPanel>
      )}

      {/* Results */}
      {result && (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Score Card */}
          <GlassPanel 
            variant="surface"
            hover={false}
            style={{ 
              padding: '1.5rem',
              background: result.passed 
                ? 'rgba(34, 197, 94, 0.12)' 
                : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${result.passed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#a3a3a3', marginBottom: '0.25rem' }}>Security Score</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: getRiskBadge(result.score).color }}>
                  {getRiskBadge(result.score).text}
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  marginTop: '0.5rem', 
                  color: result.passed ? '#86efac' : '#fca5a5' 
                }}>
                  {result.passed ? '✅ Passed Threshold' : '⚠️ Below Threshold'}
                </div>
              </div>
              <div style={{ 
                fontSize: '3.5rem', 
                fontWeight: '700',
                color: getScoreColor(result.score),
                textShadow: `0 0 30px ${getScoreColor(result.score)}40`
              }}>
                {result.score}
                <span style={{ fontSize: '1.5rem' }}>%</span>
              </div>
            </div>
          </GlassPanel>

          {/* Issue Summary */}
          {result.summary && (
            <GlassPanel variant="surface" hover={false} style={{ padding: '1.25rem' }}>
              <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '1rem' }}>Issue Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {[
                  { label: 'Critical', value: result.summary.criticalIssues || 0, color: '#fca5a5', bg: 'rgba(239, 68, 68, 0.15)' },
                  { label: 'High', value: result.summary.highIssues || 0, color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
                  { label: 'Medium', value: result.summary.mediumIssues || 0, color: '#facc15', bg: 'rgba(234, 179, 8, 0.15)' },
                  { label: 'Low', value: result.summary.lowIssues || 0, color: '#86efac', bg: 'rgba(34, 197, 94, 0.15)' },
                  { label: 'Info', value: result.summary.informational || 0, color: '#93c5fd', bg: 'rgba(59, 130, 246, 0.15)' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ 
                    textAlign: 'center', 
                    padding: '0.75rem 0.5rem', 
                    borderRadius: '10px', 
                    background: bg,
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color }}>{value}</div>
                    <div style={{ fontSize: '0.7rem', color, opacity: 0.8 }}>{label}</div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <details style={{ 
              borderRadius: '14px', 
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <summary style={{ 
                padding: '1rem 1.25rem', 
                color: '#a3a3a3', 
                fontSize: '0.9rem', 
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.03)'
              }}>
                💡 {result.recommendations.length} Recommendations
              </summary>
              <ul style={{ margin: 0, padding: '1rem 1.25rem', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result.recommendations.slice(0, 5).map((rec, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: '#d4d4d4' }}>
                    <span style={{ color: '#fbbf24' }}>•</span>
                    {rec.slice(0, 150)}...
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Full Report */}
          {result.report && (
            <details style={{ 
              borderRadius: '14px', 
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <summary style={{ 
                padding: '1rem 1.25rem', 
                color: '#a3a3a3', 
                fontSize: '0.9rem', 
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.03)'
              }}>
                📄 View Full Report
              </summary>
              <pre style={{
                margin: 0,
                padding: '1rem 1.25rem',
                fontSize: '0.8rem',
                overflow: 'auto',
                maxHeight: '300px',
                color: '#d4d4d4',
                whiteSpace: 'pre-wrap',
                background: 'rgba(0, 0, 0, 0.2)'
              }}>
                {result.report}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        paymentRequired={paymentRequired}
        onPaymentComplete={handlePaymentComplete}
        onCancel={() => setShowPayment(false)}
      />
    </div>
  );
}
