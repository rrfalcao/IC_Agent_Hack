/**
 * WalletStatus Component
 * Shows wallet connection status in the top right corner
 * - When disconnected: Shows connect button matching card style
 * - When connected: Shows wallet address + CHIM balance
 */

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { getCreditBalance } from '../services/api';

// CHIM Token Icon
const ChimIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" className="stroke-amber-400" style={{ stroke: '#fbbf24' }} />
    <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" style={{ stroke: '#fbbf24' }} />
  </svg>
);

export function WalletStatus({ onNavigate, style = {} }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [chimBalance, setChimBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);

  // Fetch CHIM balance when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchChimBalance();
      // Refresh balance every 30 seconds
      const interval = setInterval(fetchChimBalance, 30000);
      return () => clearInterval(interval);
    } else {
      setChimBalance(null);
    }
  }, [address, isConnected]);

  const fetchChimBalance = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await getCreditBalance(address);
      setChimBalance(data.formatted || '0');
    } catch (err) {
      console.error('Failed to fetch CHIM balance:', err);
      setChimBalance('0');
    } finally {
      setLoading(false);
    }
  };

  const handleChimClick = () => {
    if (onNavigate) {
      onNavigate('credits');
    }
  };

  const cardStyle = {
    background: 'rgba(250, 250, 250, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(212, 212, 212, 0.1)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    ...style
  };

  const hoverStyle = {
    background: 'rgba(250, 250, 250, 0.1)',
    borderColor: 'rgba(212, 212, 212, 0.3)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
  };

  // Connected state - show address and CHIM balance
  if (isConnected && address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', ...style }}>
        {/* CHIM Balance - Clickable to go to credits page */}
        <div
          onClick={handleChimClick}
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(251, 191, 36, 0.1)',
            borderColor: 'rgba(251, 191, 36, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Click to manage credits"
        >
          <ChimIcon size={18} />
          <span style={{ 
            fontFamily: 'monospace', 
            fontWeight: '600', 
            color: '#fbbf24',
            fontSize: '0.9rem'
          }}>
            {loading ? '...' : chimBalance || '0'}
          </span>
          <span style={{ color: 'rgba(251, 191, 36, 0.7)', fontSize: '0.75rem' }}>
            CHIM
          </span>
        </div>

        {/* Wallet Address */}
        <div
          onClick={() => disconnect()}
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, hoverStyle);
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = cardStyle.background;
            e.currentTarget.style.borderColor = cardStyle.border.split(' ')[2];
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Click to disconnect"
        >
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 8px #4ade80'
          }} />
          <span style={{ 
            fontFamily: 'monospace', 
            color: '#d4d4d4',
            fontSize: '0.85rem'
          }}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
      </div>
    );
  }

  // Disconnected state - show connect button
  return (
    <div style={{ position: 'relative', ...style }}>
      <div
        onClick={() => setShowConnectors(!showConnectors)}
        style={{
          ...cardStyle,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, hoverStyle);
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = cardStyle.background;
          e.currentTarget.style.borderColor = 'rgba(212, 212, 212, 0.1)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" strokeWidth="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"/>
          <path d="M16 11h-4a2 2 0 0 0-2 2v2h8v-2a2 2 0 0 0-2-2z"/>
          <circle cx="14" cy="7" r="2"/>
        </svg>
        <span style={{ color: '#d4d4d4', fontWeight: '500', fontSize: '0.9rem' }}>
          Connect Wallet
        </span>
      </div>

      {/* Connector dropdown */}
      {showConnectors && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            background: 'rgba(20, 20, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 212, 212, 0.2)',
            borderRadius: '12px',
            padding: '0.5rem',
            minWidth: '180px',
            zIndex: 1000,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {connectors.map((connector) => (
            <div
              key={connector.id}
              onClick={() => {
                connect({ connector });
                setShowConnectors(false);
              }}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#f5f5f5',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {connector.name}
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {showConnectors && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999
          }}
          onClick={() => setShowConnectors(false)}
        />
      )}
    </div>
  );
}

export default WalletStatus;

