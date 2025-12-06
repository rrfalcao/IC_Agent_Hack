/**
 * Payment Modal - CHIM Credits
 * Shows when user doesn't have enough CHIM credits for a service
 * Directs user to buy more credits
 */

import { useAccount } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { GlassPanel } from './GlassPanel';

// Agent identity configuration (from ERC-8004 registration)
const AGENT_CONFIG = {
  agentId: '1581',
  explorerUrl: 'https://sepolia.basescan.org/token/0x8004AA63c570c570eBF15376c0dB199918BFe9Fb?a=1581',
  registryNetwork: 'Base Sepolia'
};

export function PaymentModal({ 
  paymentRequired,
  onCancel,
  isOpen,
  onNavigateToCredits
}) {
  const { address } = useAccount();

  if (!isOpen || !paymentRequired) return null;

  // Extract CHIM pricing info
  const pricing = paymentRequired?.pricing || {};
  const required = pricing.amount || paymentRequired?.required || '10 CHIM';
  const currentBalance = paymentRequired?.balance || '0';
  const serviceName = pricing.service || 'Service';
  const serviceDescription = pricing.description || paymentRequired?.message || 'This service requires CHIM credits';

  /**
   * Handle navigation to credits page
   */
  const handleBuyCredits = () => {
    onCancel?.();
    if (onNavigateToCredits) {
      onNavigateToCredits();
    } else {
      window.location.hash = '#credits';
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
          maxWidth: '500px',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ 
            fontSize: '3rem',
            filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.4))'
          }}>
            ⚠️
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#f87171', margin: 0 }}>
              Insufficient CHIM Credits
            </h2>
            <p style={{ color: '#a3a3a3', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
              You need more credits for {serviceName}
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Credit Info Box */}
          <GlassPanel 
            variant="surface" 
            hover={false}
            style={{ padding: '1.25rem', marginBottom: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ color: '#a3a3a3', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Required
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: '#fbbf24',
                  textShadow: '0 0 20px rgba(251, 191, 36, 0.3)'
                }}>
                  {required}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#a3a3a3', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Balance
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: '#ef4444',
                }}>
                  {currentBalance} CHIM
                </div>
              </div>
            </div>
            
            <div style={{ 
              padding: '0.75rem',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '8px',
              color: '#fbbf24',
              fontSize: '0.85rem',
              textAlign: 'center'
            }}>
              💡 Buy CHIM credits with USDC to use this service
            </div>
          </GlassPanel>

          {/* Service Description */}
          <p style={{ color: '#d4d4d4', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {serviceDescription}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <CartoonButton
              label="🪙 Buy CHIM Credits with USDC"
              color="bg-amber-400"
              onClick={handleBuyCredits}
            />
            
            <button
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a3a3a3',
                fontSize: '0.9rem',
                cursor: 'pointer',
                padding: '0.75rem',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.color = '#a3a3a3'}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '1rem 1.5rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ color: '#737373', fontSize: '0.75rem' }}>
            1 USDC = 10 CHIM
          </div>
          
          {/* Agent Badge */}
          <a 
            href={AGENT_CONFIG.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              textDecoration: 'none'
            }}
          >
            <span style={{ color: '#4ade80', fontSize: '0.7rem' }}>✓</span>
            <span style={{ color: '#60a5fa', fontSize: '0.8rem', fontWeight: '600' }}>
              Agent #{AGENT_CONFIG.agentId}
            </span>
          </a>
        </div>
      </GlassPanel>
    </div>
  );
}
