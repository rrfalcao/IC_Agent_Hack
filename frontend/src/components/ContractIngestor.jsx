/**
 * Contract Ingestor Component
 * Analyzes existing deployed contracts
 * Glass morphism design
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { GlassPanel, glassInputStyle } from './GlassPanel';
import { logActivity, ACTIVITY_TYPES } from './WalletStatus';

export function ContractIngestor() {
  const { address: userAddress } = useAccount();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3000/api/contract/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Analysis failed');
      }

      // Log the analysis activity
      if (userAddress) {
        logActivity(userAddress, ACTIVITY_TYPES.CONTRACT_ANALYZE, {
          status: 'success',
          details: `Analyzed contract: ${address}`,
          contractAddress: address
        });
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <span style={{ fontSize: '2rem' }}>🔍</span>
        Contract Analyzer
      </h2>
      <p style={{ color: '#a3a3a3', marginBottom: '1.5rem' }}>
        Analyze any deployed contract on BSC Testnet
      </p>

      {/* Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', color: '#d4d4d4', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          Contract Address
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

      <CartoonButton
        label={loading ? 'Analyzing...' : '🔍 Analyze Contract'}
        color="bg-cyan-400"
        onClick={handleAnalyze}
        disabled={loading || !address}
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
          {/* Basic Info Card */}
          <GlassPanel variant="surface" hover={false} style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>Contract Type</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f5f5f5' }}>
                  {result.contractType || 'Unknown'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>Bytecode Size</div>
                <div style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{result.bytecodeSize} bytes</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {result.isContract ? (
                <span style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '999px', 
                  fontSize: '0.8rem',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#86efac'
                }}>
                  ✓ Smart Contract
                </span>
              ) : (
                <span style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '999px', 
                  fontSize: '0.8rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5'
                }}>
                  EOA (Not Contract)
                </span>
              )}
              {result.verified && (
                <span style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '999px', 
                  fontSize: '0.8rem',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#93c5fd'
                }}>
                  ✓ Verified on BSCScan
                </span>
              )}
              {result.interfaces?.map(iface => (
                <span key={iface} style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '999px', 
                  fontSize: '0.8rem',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#c4b5fd'
                }}>
                  {iface}
                </span>
              ))}
            </div>
          </GlassPanel>

          {/* Token Info */}
          {result.tokenInfo && (
            <GlassPanel variant="surface" hover={false} style={{ padding: '1.25rem' }}>
              <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Token Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#737373' }}>Name</div>
                  <div style={{ color: '#f5f5f5', fontWeight: '600' }}>{result.tokenInfo.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#737373' }}>Symbol</div>
                  <div style={{ color: '#fbbf24', fontWeight: '600' }}>{result.tokenInfo.symbol}</div>
                </div>
                {result.tokenInfo.totalSupply && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.75rem', color: '#737373' }}>Total Supply</div>
                    <div style={{ color: '#f5f5f5', fontFamily: 'monospace', fontSize: '0.9rem' }}>{result.tokenInfo.totalSupply}</div>
                  </div>
                )}
              </div>
            </GlassPanel>
          )}

          {/* Functions */}
          {result.functions && result.functions.length > 0 && (
            <GlassPanel variant="surface" hover={false} style={{ padding: '1.25rem' }}>
              <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Functions ({result.functions.length})
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.5rem', 
                maxHeight: '200px', 
                overflowY: 'auto',
                paddingRight: '0.5rem'
              }}>
                {result.functions.map((fn, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '6px', 
                      fontSize: '0.7rem',
                      background: fn.stateMutability === 'view' || fn.stateMutability === 'pure' 
                        ? 'rgba(34, 197, 94, 0.15)' 
                        : 'rgba(245, 158, 11, 0.15)',
                      border: fn.stateMutability === 'view' || fn.stateMutability === 'pure'
                        ? '1px solid rgba(34, 197, 94, 0.3)'
                        : '1px solid rgba(245, 158, 11, 0.3)',
                      color: fn.stateMutability === 'view' || fn.stateMutability === 'pure' 
                        ? '#86efac' 
                        : '#fbbf24'
                    }}>
                      {fn.stateMutability}
                    </span>
                    <code style={{ color: '#d4d4d4', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {fn.signature}
                    </code>
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}

          {/* Source Code */}
          {result.sourceCode && (
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
                View Source Code
              </summary>
              <pre style={{
                margin: 0,
                padding: '1rem 1.25rem',
                fontSize: '0.8rem',
                overflow: 'auto',
                maxHeight: '300px',
                color: '#d4d4d4',
                background: 'rgba(0, 0, 0, 0.2)'
              }}>
                {result.sourceCode}
              </pre>
            </details>
          )}

          {/* Links */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a 
              href={result.links?.bscScan}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#fbbf24', fontSize: '0.9rem', textDecoration: 'none' }}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              View on BSCScan →
            </a>
            {result.verified && (
              <a 
                href={result.links?.bscScanCode}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#67e8f9', fontSize: '0.9rem', textDecoration: 'none' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                View Code →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
