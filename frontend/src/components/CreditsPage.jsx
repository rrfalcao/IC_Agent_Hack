/**
 * CreditsPage Component
 * Full page for managing CHIM credits - view balance, buy, and track usage
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  getCreditBalance, 
  getCreditPricing, 
  buyCredits, 
  awardCredits 
} from '../services/api';

// CHIM token icon
const ChimIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" className="stroke-amber-400" />
    <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" className="stroke-amber-400" />
  </svg>
);

// Service configuration with colors and icons
const SERVICES = {
  generate: {
    icon: '⚙️',
    name: 'Contract Generation',
    description: 'Generate smart contracts from natural language',
    color: 'emerald'
  },
  audit: {
    icon: '🔍',
    name: 'Security Audit',
    description: 'Analyze contracts for vulnerabilities',
    color: 'amber'
  },
  analyze: {
    icon: '📊',
    name: 'Contract Analysis',
    description: 'Deep-dive into deployed contracts',
    color: 'cyan'
  },
  swap: {
    icon: '🔄',
    name: 'Token Swap',
    description: 'Execute swaps via PancakeSwap',
    color: 'purple'
  },
  transfer: {
    icon: '💸',
    name: 'Gas-Sponsored Transfer',
    description: 'Transfer tokens without paying gas',
    color: 'pink'
  },
  chat: {
    icon: '💬',
    name: 'AI Chat',
    description: 'Get Web3 advice from AI',
    color: 'blue'
  }
};

export default function CreditsPage() {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [address, isConnected]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const pricingData = await getCreditPricing();
      setPricing(pricingData.pricing);
      setPackages(pricingData.packages || []);

      if (isConnected && address) {
        const balanceData = await getCreditBalance(address);
        setBalance(balanceData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load credit information');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (packageId) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setPurchasing(true);
    setPurchaseResult(null);
    setError(null);

    try {
      const result = await buyCredits(address, packageId);
      
      if (result.success) {
        setPurchaseResult({
          type: 'success',
          message: `Successfully purchased ${result.amount || result.chimAmount} CHIM!`,
          details: result
        });
        await fetchData(); // Refresh balance
      }
    } catch (err) {
      console.error('Purchase failed:', err);
      setError(err.requiresPayment 
        ? 'Payment required - connect wallet to pay with USDC'
        : 'Failed to purchase credits');
    } finally {
      setPurchasing(false);
    }
  };

  const handleClaimFreeCredits = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setPurchasing(true);
    setPurchaseResult(null);

    try {
      const result = await awardCredits(address, '100', 'welcome_bonus');
      
      if (result.success) {
        setPurchaseResult({
          type: 'success',
          message: '🎉 100 CHIM credits claimed! Welcome to Chimera!',
          details: result
        });
        await fetchData();
      }
    } catch (err) {
      console.error('Claim failed:', err);
      setError('Failed to claim free credits');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Loading credits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <ChimIcon className="w-10 h-10" />
          <h1 className="text-3xl font-bold text-amber-400">CHIM Credits</h1>
        </div>
        <p className="text-slate-400">
          The currency powering Chimera AI services
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
          {error}
        </div>
      )}
      
      {purchaseResult && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-center">
          {purchaseResult.message}
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-amber-400/80 uppercase tracking-wider mb-1">
              Your Balance
            </h2>
            {isConnected ? (
              <>
                <div className="text-5xl font-bold text-white font-mono">
                  {balance?.formatted || '0'}
                </div>
                <div className="text-amber-400/60 mt-1">CHIM Credits</div>
                {balance?.demoMode && (
                  <span className="inline-block mt-2 px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">
                    Demo Mode
                  </span>
                )}
              </>
            ) : (
              <div className="text-2xl text-slate-500">Connect wallet to view</div>
            )}
          </div>
          
          {isConnected && (
            <button
              onClick={handleClaimFreeCredits}
              disabled={purchasing}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white 
                         rounded-lg hover:from-green-400 hover:to-emerald-400 
                         disabled:opacity-50 transition-all"
            >
              🎁 Claim Free Credits
            </button>
          )}
        </div>
      </div>

      {/* Service Pricing Grid */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Service Costs</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {pricing && Object.entries(pricing).map(([service, info]) => {
            const serviceConfig = SERVICES[service] || { icon: '•', name: service, color: 'slate' };
            
            return (
              <div
                key={service}
                className={`p-4 rounded-xl border bg-slate-800/50
                           border-${serviceConfig.color}-500/30 hover:border-${serviceConfig.color}-500/50
                           transition-all`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{serviceConfig.icon}</span>
                  <span className="font-medium text-white">{serviceConfig.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChimIcon className="w-4 h-4" />
                  <span className="text-2xl font-bold text-amber-400 font-mono">
                    {info.amount}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{serviceConfig.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchase Packages */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Buy Credits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative p-6 rounded-xl border-2 transition-all
                ${pkg.popular 
                  ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/50' 
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                    POPULAR
                  </span>
                </div>
              )}
              
              <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
              <p className="text-sm text-slate-400 mb-4">{pkg.description}</p>
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-white">${pkg.usdcPrice}</span>
                <span className="text-slate-500">USDC</span>
              </div>
              
              <div className="flex items-center gap-2 text-amber-400 mb-4">
                <ChimIcon className="w-5 h-5" />
                <span className="text-xl font-mono">{pkg.chimAmount} CHIM</span>
              </div>
              
              <p className="text-xs text-slate-500 mb-4">{pkg.services}</p>
              
              {pkg.bonus && (
                <div className="mb-4 px-2 py-1 bg-green-500/20 rounded text-green-400 text-xs inline-block">
                  ✨ {pkg.bonus}
                </div>
              )}
              
              <button
                onClick={() => handleBuyCredits(pkg.id)}
                disabled={purchasing || !isConnected}
                className={`w-full py-3 rounded-lg font-semibold transition-all
                  ${pkg.popular
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {purchasing ? 'Processing...' : `Buy for $${pkg.usdcPrice}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">How CHIM Credits Work</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">1️⃣</span>
            </div>
            <h3 className="font-medium text-white mb-1">Buy Credits</h3>
            <p className="text-sm text-slate-400">
              Purchase CHIM with USDC via x402 payment protocol
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">2️⃣</span>
            </div>
            <h3 className="font-medium text-white mb-1">Use Services</h3>
            <p className="text-sm text-slate-400">
              Spend credits on AI-powered blockchain services
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">3️⃣</span>
            </div>
            <h3 className="font-medium text-white mb-1">Gasless Spending</h3>
            <p className="text-sm text-slate-400">
              Sign with ERC20Permit - no gas fees for you!
            </p>
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="text-center text-sm text-slate-500">
        <p>Exchange Rate: 1 USDC = 10 CHIM</p>
        <p className="mt-1">
          CHIM is a fungible service token issued on the x402 Market
        </p>
      </div>
    </div>
  );
}

