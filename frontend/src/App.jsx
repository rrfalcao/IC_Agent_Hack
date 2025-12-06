/**
 * Main App Component
 * Chimera - AI Agent for Smart Contract Deployment
 */

import { useState, useEffect } from 'react';
import { Waves } from './components/Waves';
import { LandingPage } from './components/LandingPage';
import { WalletStatus } from './components/WalletStatus';
// Credit badges removed from navigation - only shown in Credits page
import { ChatInterface } from './components/ChatInterface';
import { ContractGenerator } from './components/ContractGenerator';
import { ContractIngestor } from './components/ContractIngestor';
import { ContractAuditor } from './components/ContractAuditor';
import { SwapInterface } from './components/SwapInterface';
import { TransferInterface } from './components/TransferInterface';
import CreditsPage from './components/CreditsPage';
import { CartoonButton } from './components/CartoonButton';
import AgentIdentityBadge from './components/AgentIdentityBadge';
import { AgentBrain } from './components/AgentBrain';
import { NetworkToggle } from './components/NetworkToggle';
import { TransactionHistory } from './components/TransactionHistory';
import { getAgentInfo } from './services/api';
import './App.css';

function App() {
  const [agentInfo, setAgentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'chat', 'generate', 'audit', 'ingest', 'swap', 'transfer', 'credits'
  const [transactions, setTransactions] = useState([]); // Transaction history log

  useEffect(() => {
    // Fetch agent info on mount
    getAgentInfo()
      .then(setAgentInfo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  // Add transaction to history log
  const addTransaction = (tx) => {
    setTransactions(prev => [...prev, {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }]);
  };

  // Landing Page
  if (currentPage === 'landing') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  // Main App Pages
  return (
    <div style={{ 
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden'
    }}>
      {/* Global Agent Brain Drawer */}
      <AgentBrain />

      {/* Wave Background */}
      <Waves strokeColor="#4a5568" backgroundColor="#0a0a0a" />

      {/* Content */}
      <div style={{ 
        position: 'relative',
        zIndex: 1,
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '2rem',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <header style={{ 
          marginBottom: '2rem',
          background: 'rgba(250, 250, 250, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '1.5rem 2rem',
          border: '2px solid rgba(212, 212, 212, 0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              onClick={() => handleNavigate('landing')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#f5f5f5',
                fontSize: '2rem',
                fontWeight: '900',
                letterSpacing: '-0.02em',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.textShadow = '0 0 20px rgba(245, 245, 245, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.textShadow = 'none';
              }}
            >
              CHIMERA
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Network Toggle - Testnet/Mainnet (Required for Bounty #2) */}
              <NetworkToggle compact />
              
              {/* Wallet Status with CHIM Balance */}
              <WalletStatus onNavigate={handleNavigate} />
              
              {/* Agent Identity Badge - ERC-8004 Verified */}
              <AgentIdentityBadge 
                agentId="1581"
                explorerUrl="https://sepolia.basescan.org/token/0x8004AA63c570c570eBF15376c0dB199918BFe9Fb?a=1581"
              />
              
              {agentInfo && (
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#a3a3a3',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '10px',
                  display: 'flex',
                  gap: '0.75rem',
                  border: '1px solid rgba(212, 212, 212, 0.1)'
                }}>
                  <span>Block: {agentInfo.blockchain?.currentBlock}</span>
                  <span style={{ opacity: 0.4 }}>|</span>
                  <span>Gas: {agentInfo.blockchain?.gasPrice} Gwei</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div style={{ 
          marginBottom: '2rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <CartoonButton
            label="← Home"
            color="bg-neutral-600"
            onClick={() => handleNavigate('landing')}
          />
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)', margin: '0 0.5rem' }} />
          <CartoonButton
            label="💬 Chat"
            color={currentPage === 'chat' ? 'bg-blue-400' : 'bg-gray-500'}
            onClick={() => handleNavigate('chat')}
          />
          <CartoonButton
            label="🏗️ Generate"
            color={currentPage === 'generate' ? 'bg-green-400' : 'bg-gray-500'}
            onClick={() => handleNavigate('generate')}
          />
          <CartoonButton
            label="🛡️ Audit"
            color={currentPage === 'audit' ? 'bg-amber-400' : 'bg-gray-500'}
            onClick={() => handleNavigate('audit')}
          />
          <CartoonButton
            label="🔍 Analyze"
            color={currentPage === 'ingest' ? 'bg-cyan-400' : 'bg-gray-500'}
            onClick={() => handleNavigate('ingest')}
          />
          <CartoonButton
            label="🔄 Swap"
            color={currentPage === 'swap' ? 'bg-purple-400' : 'bg-gray-500'}
            onClick={() => handleNavigate('swap')}
          />
          <CartoonButton
            label="💸 Transfer"
            color={currentPage === 'transfer' ? 'bg-pink-400' : 'bg-gray-500'}
            onClick={() => handleNavigate('transfer')}
          />
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)', margin: '0 0.5rem' }} />
          <CartoonButton
            label="🪙 Credits"
            color={currentPage === 'credits' ? 'bg-amber-400' : 'bg-gray-500'}
            onClick={() => handleNavigate('credits')}
          />
        </div>

        {/* Main Content */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '24px',
          padding: '2.5rem',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          minHeight: '500px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                animation: 'spin 2s linear infinite'
              }}>
                ⚙️
              </div>
              <p style={{ fontSize: '1.2rem', color: '#525252' }}>Loading agent...</p>
            </div>
          ) : (
            <>
              {/* Page Content */}
              {currentPage === 'chat' && (
                <>
                  {agentInfo && (
                    <div style={{ 
                      marginBottom: '1.5rem', 
                      padding: '1.5rem', 
                      background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.1) 0%, rgba(196, 181, 253, 0.1) 100%)',
                      borderRadius: '16px',
                      border: '2px solid rgba(147, 197, 253, 0.2)'
                    }}>
                      <h3 style={{ marginTop: 0, color: '#3b82f6', fontWeight: '700' }}>Agent Capabilities</h3>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#404040' }}>
                        {agentInfo.capabilities?.map((cap, idx) => (
                          <li key={idx} style={{ marginBottom: '0.5rem' }}>{cap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <ChatInterface />
                </>
              )}

              {currentPage === 'generate' && (
                <ContractGenerator />
              )}

              {currentPage === 'audit' && (
                <ContractAuditor />
              )}

              {currentPage === 'ingest' && (
                <ContractIngestor />
              )}

              {currentPage === 'swap' && (
                <SwapInterface />
              )}

              {currentPage === 'transfer' && (
                <TransferInterface />
              )}

              {currentPage === 'credits' && (
                <CreditsPage />
              )}
            </>
          )}
        </div>

        {/* Transaction History Log (Required for Bounty #2) */}
        <TransactionHistory transactions={transactions} />

        {/* Footer */}
        <footer style={{ 
          marginTop: '2rem', 
          textAlign: 'center', 
          color: '#d4d4d4',
          fontSize: '0.9rem',
          padding: '2rem'
        }}>
          <p style={{ marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
            Powered by ChainGPT • Q402 • AWE Network
          </p>
          <p style={{ opacity: 0.7 }}>
            Version {agentInfo?.version || '0.1.0'} • BSC Testnet
          </p>
        </footer>
      </div>

      {/* Global Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        button {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}

export default App;
