/**
 * Contract Auditor Component
 * Audit contracts by source code or address
 * Integrated with x402 micropayments
 * Glass morphism design
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { PaymentModal } from './PaymentModal';
import { GlassPanel, glassInputStyle } from './GlassPanel';

export function ContractAuditor() {
  const { address: userAddress, isConnected } = useAccount();
  
  const [mode, setMode] = useState('code'); // 'code' or 'address'
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);

  // Step 1: Request payment before audit
  const handleRequestAudit = async () => {
    if (mode === 'code' && !code) return;
    if (mode === 'address' && !address) return;
    
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    setError(null);

    try {
      // Request payment from backend
      const response = await fetch('http://localhost:3000/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'contract_audit',
          userAddress
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentRequest(data.payment);
        setShowPayment(true);
      } else {
        throw new Error(data.error || 'Failed to create payment request');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Step 2: After payment, run the audit
  const handlePaymentComplete = async (paymentId) => {
    setShowPayment(false);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body = mode === 'code' 
        ? { code } 
        : { address };

      const response = await fetch('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `x402 paymentId=${paymentId}`
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Audit failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ 
        fontSize: '1.75rem', 
        fontWeight: '700', 
        color: '#f5f5f5', 
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <span style={{ fontSize: '2rem' }}>🛡️</span>
        Security Auditor
      </h2>
      <p style={{ color: '#a3a3a3', marginBottom: '1.5rem' }}>
        AI-powered smart contract security analysis
      </p>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setMode('code')}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
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
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
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
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#d4d4d4', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Solidity Source Code
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`pragma solidity ^0.8.0;

contract MyContract {
    // Your code here...
}`}
            rows={12}
            style={{
              ...glassInputStyle,
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              resize: 'vertical',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#d4d4d4', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Contract Address (must be verified on BSCScan)
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            style={{
              ...glassInputStyle,
              fontSize: '1rem',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      )}

      <CartoonButton
        label={loading ? 'Auditing...' : !isConnected ? 'Connect Wallet' : '🔍 Sign & Audit'}
        color="bg-green-400"
        onClick={handleRequestAudit}
        disabled={loading || !isConnected || (mode === 'code' ? !code : !address)}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        paymentRequest={paymentRequest}
        onPaymentComplete={handlePaymentComplete}
        onSkip={(paymentId) => handlePaymentComplete(paymentId)}
        onCancel={() => setShowPayment(false)}
        demoMode={true}
      />

      {/* Error */}
      {error && (
        <GlassPanel 
          variant="surface" 
          hover={false}
          style={{
            marginTop: '1.5rem',
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ color: '#fca5a5', fontWeight: '600' }}>Error</div>
          <div style={{ color: '#fca5a5', fontSize: '0.9rem', opacity: 0.9 }}>{error}</div>
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
                <div style={{ 
                  textAlign: 'center', 
                  padding: '0.75rem', 
                  borderRadius: '12px', 
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fca5a5' }}>{result.summary.criticalIssues || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: '#fca5a5', opacity: 0.8 }}>Critical</div>
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '0.75rem', 
                  borderRadius: '12px', 
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fbbf24' }}>{result.summary.highIssues || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: '#fbbf24', opacity: 0.8 }}>High</div>
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '0.75rem', 
                  borderRadius: '12px', 
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.2)'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#facc15' }}>{result.summary.mediumIssues || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: '#facc15', opacity: 0.8 }}>Medium</div>
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '0.75rem', 
                  borderRadius: '12px', 
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#86efac' }}>{result.summary.lowIssues || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: '#86efac', opacity: 0.8 }}>Low</div>
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '0.75rem', 
                  borderRadius: '12px', 
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#93c5fd' }}>{result.summary.informational || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: '#93c5fd', opacity: 0.8 }}>Info</div>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <GlassPanel variant="surface" hover={false} style={{ padding: '1.25rem' }}>
              <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '1rem' }}>Recommendations</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result.recommendations.map((rec, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: '#d4d4d4' }}>
                    <span style={{ color: '#fbbf24' }}>•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </GlassPanel>
          )}

          {/* Full Report */}
          {result.report && (
            <details style={{ 
              borderRadius: '16px', 
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
                View Full Report
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
    </div>
  );
}
