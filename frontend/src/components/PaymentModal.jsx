/**
 * Payment Modal
 * x402 payment flow for premium features
 * Themed for Chimera with skip option for demo
 * Glass morphism design
 */

import { useState } from 'react';
import { useSignTypedData, useAccount } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { GlassPanel } from './GlassPanel';

// Generate EIP-712 typed data for payment
function generateTypedData(paymentRequest) {
  const domain = {
    name: 'Chimera',
    version: '1',
    chainId: paymentRequest.chainId || 97
  };

  const types = {
    Payment: [
      { name: 'paymentId', type: 'string' },
      { name: 'amount', type: 'string' },
      { name: 'token', type: 'string' },
      { name: 'recipient', type: 'address' },
      { name: 'endpoint', type: 'string' },
      { name: 'deadline', type: 'uint256' }
    ]
  };

  const deadline = Math.floor(new Date(paymentRequest.expiresAt).getTime() / 1000);

  const message = {
    paymentId: paymentRequest.id,
    amount: paymentRequest.amount,
    token: paymentRequest.token,
    recipient: paymentRequest.recipient,
    endpoint: paymentRequest.endpoint,
    deadline: BigInt(deadline)
  };

  return { domain, types, message };
}

export function PaymentModal({ 
  paymentRequest, 
  onPaymentComplete, 
  onSkip,
  onCancel,
  isOpen,
  demoMode = true
}) {
  const [isPaying, setIsPaying] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const { signTypedDataAsync } = useSignTypedData();
  const { address } = useAccount();

  if (!isOpen || !paymentRequest) return null;

  const handlePay = async () => {
    setIsPaying(true);
    try {
      const typedData = generateTypedData(paymentRequest);
      
      console.log('Signing payment with typed data:', typedData);
      
      const signature = await signTypedDataAsync({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: 'Payment',
        message: typedData.message
      });

      console.log('Payment signed:', signature.slice(0, 20) + '...');

      const response = await fetch('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentRequest.id,
          signature,
          userAddress: address
        })
      });

      const result = await response.json();

      if (result.success) {
        onPaymentComplete(paymentRequest.id, signature);
      } else {
        throw new Error(result.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      if (!error.message?.includes('User rejected') && !error.message?.includes('user rejected')) {
        alert('Payment failed: ' + error.message);
      }
    } finally {
      setIsPaying(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      const response = await fetch('http://localhost:3000/api/payments/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: paymentRequest.id })
      });

      const result = await response.json();

      if (result.success) {
        onSkip?.(paymentRequest.id);
        onPaymentComplete?.(paymentRequest.id, null);
      } else {
        throw new Error(result.error || 'Skip failed');
      }
    } catch (error) {
      console.error('Skip error:', error);
      alert('Failed to skip: ' + error.message);
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <GlassPanel 
        variant="modal"
        hover={false}
        style={{
          maxWidth: '420px',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '1.5rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💰</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f5f5f5', margin: 0 }}>
            Payment Required
          </h2>
          <p style={{ color: '#a3a3a3', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: 0 }}>
            {paymentRequest.description || 'Premium Feature'}
          </p>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Amount Display */}
          <GlassPanel 
            variant="surface" 
            hover={false}
            style={{ padding: '1.25rem', textAlign: 'center' }}
          >
            <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Amount</div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              color: '#fbbf24',
              textShadow: '0 0 30px rgba(251, 191, 36, 0.3)'
            }}>
              {paymentRequest.amount} {paymentRequest.token}
            </div>
            <div style={{ color: '#737373', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              ~${(parseFloat(paymentRequest.amount || 0) * 300).toFixed(2)} USD
            </div>
          </GlassPanel>

          {/* Payment Details */}
          <GlassPanel 
            variant="surface" 
            hover={false}
            style={{ padding: '1rem 1.25rem', fontSize: '0.9rem' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a3a3a3' }}>Network</span>
                <span style={{ color: '#f5f5f5' }}>BSC Testnet</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a3a3a3' }}>Recipient</span>
                <span style={{ color: '#f5f5f5', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {paymentRequest.recipient?.slice(0, 8)}...{paymentRequest.recipient?.slice(-6)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a3a3a3' }}>Expires</span>
                <span style={{ color: '#fbbf24' }}>
                  {paymentRequest.expiresAt ? new Date(paymentRequest.expiresAt).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </GlassPanel>

          {/* Info Box */}
          <GlassPanel 
            variant="surface" 
            hover={false}
            style={{ 
              padding: '1rem 1.25rem', 
              fontSize: '0.85rem',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}
          >
            <div style={{ color: '#86efac', fontWeight: '600', marginBottom: '0.25rem' }}>
              🔒 Secure Payment
            </div>
            <div style={{ color: '#86efac', opacity: 0.9, fontSize: '0.8rem' }}>
              You'll sign an EIP-712 message to authorize. No tokens are transferred until service is delivered.
            </div>
          </GlassPanel>

          {/* Demo Mode Banner */}
          {demoMode && paymentRequest.demoSkipAllowed && (
            <GlassPanel 
              variant="surface" 
              hover={false}
              style={{ 
                padding: '1rem 1.25rem', 
                textAlign: 'center',
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.2)'
              }}
            >
              <div style={{ color: '#c4b5fd', fontWeight: '600', fontSize: '0.9rem' }}>
                ✨ Demo Mode Active
              </div>
              <div style={{ color: '#c4b5fd', opacity: 0.9, fontSize: '0.8rem', marginTop: '0.25rem' }}>
                You can skip payment for testing purposes
              </div>
            </GlassPanel>
          )}
        </div>

        {/* Actions */}
        <div style={{ 
          padding: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <CartoonButton
            label={isPaying ? 'Signing...' : '✍️ Sign & Pay'}
            color="bg-amber-400"
            onClick={handlePay}
            disabled={isPaying || isSkipping}
          />
          
          {demoMode && paymentRequest.demoSkipAllowed && (
            <CartoonButton
              label={isSkipping ? 'Skipping...' : '⏭️ Skip (Demo)'}
              color="bg-purple-400"
              onClick={handleSkip}
              disabled={isPaying || isSkipping}
            />
          )}
          
          <button
            onClick={onCancel}
            disabled={isPaying || isSkipping}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a3a3a3',
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '0.5rem',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#f5f5f5'}
            onMouseLeave={(e) => e.target.style.color = '#a3a3a3'}
          >
            Cancel
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
