/**
 * CreditBalance Component
 * Displays user's CHIM credit balance and purchase options
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getCreditBalance, getCreditPricing, buyCredits, awardCredits } from '../services/api';

// CHIM token icon
const ChimIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" className="stroke-amber-400" />
    <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" className="stroke-amber-400" />
  </svg>
);

// Service icons
const serviceIcons = {
  generate: '⚙️',
  audit: '🔍',
  analyze: '📊',
  swap: '🔄',
  transfer: '💸',
  chat: '💬'
};

export default function CreditBalance({ compact = false, onPurchase }) {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [error, setError] = useState(null);

  // Fetch balance and pricing on mount
  useEffect(() => {
    if (isConnected && address) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [balanceData, pricingData] = await Promise.all([
        getCreditBalance(address),
        getCreditPricing()
      ]);
      
      setBalance(balanceData);
      setPricing(pricingData.pricing);
      setPackages(pricingData.packages || []);
    } catch (err) {
      console.error('Failed to fetch credit data:', err);
      setError('Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (packageId) => {
    setPurchasing(true);
    setError(null);
    
    try {
      const result = await buyCredits(address, packageId);
      
      if (result.success) {
        // Refresh balance
        await fetchData();
        setShowPackages(false);
        
        if (onPurchase) {
          onPurchase(result);
        }
      }
    } catch (err) {
      if (err.requiresPayment) {
        setError('USDC payment required. Please ensure your wallet is connected.');
      } else {
        setError('Failed to purchase credits');
      }
      console.error('Purchase error:', err);
    } finally {
      setPurchasing(false);
    }
  };

  const handleGetFreeCredits = async () => {
    setPurchasing(true);
    setError(null);
    
    try {
      const result = await awardCredits(address, '50', 'demo_welcome_bonus');
      
      if (result.success) {
        await fetchData();
        setShowPackages(false);
      }
    } catch (err) {
      setError('Failed to award credits');
      console.error('Award error:', err);
    } finally {
      setPurchasing(false);
    }
  };

  // Compact display for header
  if (compact) {
    if (!isConnected) return null;
    
    return (
      <button
        onClick={() => setShowPackages(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 
                   border border-amber-500/30 rounded-lg hover:border-amber-400/50 transition-all"
      >
        <ChimIcon />
        <span className="font-mono text-amber-400">
          {loading ? '...' : balance?.formatted || '0'}
        </span>
        <span className="text-amber-400/60 text-sm">CHIM</span>
      </button>
    );
  }

  // Full display
  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-xl border border-amber-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChimIcon />
            <h3 className="font-semibold text-amber-400">CHIM Credits</h3>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-amber-400/60 hover:text-amber-400 transition-colors"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!isConnected ? (
          <div className="text-center py-4">
            <p className="text-slate-400 mb-2">Connect your wallet to view credits</p>
            <p className="text-xs text-slate-500">CHIM credits are used for AI services</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-400 mb-2">{error}</p>
            <button
              onClick={fetchData}
              className="text-sm text-amber-400 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Balance Display */}
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-amber-400 font-mono">
                {balance?.formatted || '0'}
              </div>
              <div className="text-amber-400/60 text-sm">CHIM Credits</div>
              {balance?.demoMode && (
                <div className="text-xs text-slate-500 mt-1">Demo Mode</div>
              )}
            </div>

            {/* Service Pricing */}
            {pricing && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Service Costs</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(pricing).map(([service, info]) => (
                    <div
                      key={service}
                      className="flex items-center justify-between px-2 py-1.5 bg-slate-800/50 rounded"
                    >
                      <span className="flex items-center gap-1 text-sm">
                        <span>{serviceIcons[service] || '•'}</span>
                        <span className="capitalize text-slate-300">{service}</span>
                      </span>
                      <span className="text-amber-400 font-mono text-sm">{info.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Section */}
            {showPackages ? (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase">Buy Credits</h4>
                
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => handleBuyCredits(pkg.id)}
                    disabled={purchasing}
                    className={`w-full p-3 rounded-lg border transition-all text-left
                      ${pkg.popular 
                        ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-400' 
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }
                      ${purchasing ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{pkg.name}</span>
                      {pkg.popular && (
                        <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded">Popular</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{pkg.usdcPrice} USDC</span>
                      <span className="text-amber-400 font-mono">{pkg.chimAmount} CHIM</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{pkg.description}</p>
                  </button>
                ))}

                {/* Demo: Free credits button */}
                <button
                  onClick={handleGetFreeCredits}
                  disabled={purchasing}
                  className="w-full p-2 rounded-lg border border-dashed border-green-500/30 
                             bg-green-500/5 hover:bg-green-500/10 transition-all text-center"
                >
                  <span className="text-green-400 text-sm">🎁 Get 50 Free Credits (Demo)</span>
                </button>

                <button
                  onClick={() => setShowPackages(false)}
                  className="w-full text-center text-sm text-slate-500 hover:text-slate-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPackages(true)}
                className="w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 
                           text-black font-semibold rounded-lg hover:from-amber-400 hover:to-orange-400 
                           transition-all"
              >
                Buy More Credits
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * CreditCostBadge - Shows the cost of an action in CHIM
 */
export function CreditCostBadge({ service, className = '' }) {
  const costs = {
    generate: '10',
    audit: '5',
    analyze: '3',
    swap: '2',
    transfer: '1',
    chat: '0.1'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 
                      text-amber-400 text-xs rounded-full ${className}`}>
      <ChimIcon />
      <span>{costs[service] || '?'} CHIM</span>
    </span>
  );
}

/**
 * CreditGate - Wrapper component that checks credits before rendering children
 */
export function CreditGate({ service, children, onInsufficientCredits }) {
  const { address, isConnected } = useAccount();
  const [hasCredits, setHasCredits] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      checkUserCredits();
    } else {
      setChecking(false);
    }
  }, [address, isConnected]);

  const checkUserCredits = async () => {
    try {
      const result = await getCreditBalance(address);
      const balance = parseFloat(result.formatted || '0');
      
      const costs = {
        generate: 10,
        audit: 5,
        analyze: 3,
        swap: 2,
        transfer: 1,
        chat: 0.1
      };
      
      setHasCredits(balance >= (costs[service] || 0));
    } catch (err) {
      console.error('Credit check failed:', err);
      setHasCredits(false);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center p-4 bg-slate-800/50 rounded-lg">
        <p className="text-slate-400">Connect your wallet to continue</p>
      </div>
    );
  }

  if (!hasCredits) {
    return (
      <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-red-400 mb-2">Insufficient CHIM credits</p>
        <p className="text-sm text-slate-400 mb-3">
          This action requires <CreditCostBadge service={service} />
        </p>
        <button
          onClick={onInsufficientCredits}
          className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400"
        >
          Buy Credits
        </button>
      </div>
    );
  }

  return children;
}

