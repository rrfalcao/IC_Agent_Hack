/**
 * Swap Interface Component
 * PancakeSwap integration for token swaps
 * Integrated with x402 micropayments
 * Glass morphism design
 */

import { useState, useEffect } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { PaymentModal } from './PaymentModal';
import { GlassPanel } from './GlassPanel';

const DEFAULT_TOKENS = {
  native: { symbol: 'tBNB', name: 'Test BNB', decimals: 18, address: null },
  WBNB: { symbol: 'WBNB', name: 'Wrapped BNB', decimals: 18, address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' },
  BUSD: { symbol: 'BUSD', name: 'Binance USD', decimals: 18, address: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee' },
  USDT: { symbol: 'USDT', name: 'Tether', decimals: 18, address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' },
};

export function SwapInterface() {
  const { address: userAddress, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  
  const [tokenIn, setTokenIn] = useState('native');
  const [tokenOut, setTokenOut] = useState('BUSD');
  const [amountIn, setAmountIn] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [slippage, setSlippage] = useState(0.5);
  
  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Fetch quote when inputs change
  useEffect(() => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        const tokenInAddr = tokenIn === 'native' ? null : DEFAULT_TOKENS[tokenIn]?.address;
        const tokenOutAddr = tokenOut === 'native' ? null : DEFAULT_TOKENS[tokenOut]?.address;

        const response = await fetch('http://localhost:3000/api/swap/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenIn: tokenInAddr,
            tokenOut: tokenOutAddr,
            amountIn
          }),
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          setQuote(data);
          setError(null);
        } else {
          setQuote(null);
        }
      } catch (err) {
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [tokenIn, tokenOut, amountIn]);

  // Step 1: Request payment before swap
  const handleRequestSwap = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!quote) {
      setError('No quote available');
      return;
    }

    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'swap',
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

  // Step 2: After payment, sign and execute swap
  const handlePaymentComplete = async (paymentId, signature) => {
    setShowPayment(false);
    setPaymentComplete(true);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const domain = {
        name: 'Chimera',
        version: '1',
        chainId: 97
      };

      const types = {
        Intent: [
          { name: 'type', type: 'string' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'dataHash', type: 'bytes32' }
        ]
      };

      const nonce = BigInt(Date.now());
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      
      const dataString = JSON.stringify({ tokenIn, tokenOut, amountIn });
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const dataHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const message = {
        type: 'swap',
        nonce,
        deadline,
        dataHash
      };

      const intentSignature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Intent',
        message
      });

      console.log('Swap intent signed');

      const tokenInAddr = tokenIn === 'native' ? null : DEFAULT_TOKENS[tokenIn]?.address;
      const tokenOutAddr = tokenOut === 'native' ? null : DEFAULT_TOKENS[tokenOut]?.address;

      const response = await fetch('http://localhost:3000/api/swap/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `x402 paymentId=${paymentId}`
        },
        body: JSON.stringify({
          tokenIn: tokenInAddr,
          tokenOut: tokenOutAddr,
          amountIn,
          recipient: userAddress,
          slippageTolerance: slippage,
          signature: intentSignature
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Swap failed');
      }

      setSuccess({
        message: 'Swap transaction prepared!',
        ...responseData
      });
    } catch (err) {
      if (!err.message?.includes('User rejected')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setPaymentComplete(false);
    }
  };

  const switchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setQuote(null);
  };

  const selectStyle = {
    padding: '0.875rem 1rem',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#f5f5f5',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    minWidth: '130px',
    outline: 'none',
  };

  const inputStyle = {
    flex: 1,
    padding: '0.875rem 1rem',
    borderRadius: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#f5f5f5',
    fontSize: '1.25rem',
    fontFamily: 'monospace',
    textAlign: 'right',
    outline: 'none',
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
        <span style={{ fontSize: '2rem' }}>🔄</span>
        Token Swap
      </h2>
      <p style={{ color: '#a3a3a3', marginBottom: '1.5rem' }}>
        Swap tokens via PancakeSwap (Gasless!)
      </p>

      {/* Swap Card */}
      <GlassPanel variant="surface" hover={false} style={{ padding: '1.5rem' }}>
        {/* From Token */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>From</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select
              value={tokenIn}
              onChange={(e) => setTokenIn(e.target.value)}
              style={selectStyle}
            >
              {Object.entries(DEFAULT_TOKENS).map(([key, token]) => (
                <option key={key} value={key} style={{ background: '#1a1a2e' }}>{token.symbol}</option>
              ))}
            </select>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Switch Button */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-0.5rem 0', position: 'relative', zIndex: 10 }}>
          <button
            onClick={switchTokens}
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'rotate(180deg)';
              e.target.style.background = 'linear-gradient(135deg, rgba(251, 191, 36, 0.5) 0%, rgba(245, 158, 11, 0.5) 100%)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'rotate(0deg)';
              e.target.style.background = 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)';
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>⇅</span>
          </button>
        </div>

        {/* To Token */}
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>To</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select
              value={tokenOut}
              onChange={(e) => setTokenOut(e.target.value)}
              style={selectStyle}
            >
              {Object.entries(DEFAULT_TOKENS).map(([key, token]) => (
                <option key={key} value={key} style={{ background: '#1a1a2e' }}>{token.symbol}</option>
              ))}
            </select>
            <div style={{
              ...inputStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              color: quoteLoading ? '#737373' : quote ? '#86efac' : '#737373'
            }}>
              {quoteLoading ? 'Loading...' : quote ? parseFloat(quote.amountOut).toFixed(6) : '0.0'}
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            borderRadius: '12px',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a3a3a3' }}>Route</span>
              <span style={{ color: '#fbbf24' }}>{quote.route}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a3a3a3' }}>Price Impact</span>
              <span style={{ color: parseFloat(quote.priceImpact) > 3 ? '#fca5a5' : '#86efac' }}>
                {quote.priceImpact}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a3a3a3' }}>Gas Cost</span>
              <span style={{ color: '#86efac' }}>$0.00 (Sponsored)</span>
            </div>
          </div>
        )}

        {/* Slippage */}
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>Slippage:</span>
          {[0.1, 0.5, 1.0].map((s) => (
            <button
              key={s}
              onClick={() => setSlippage(s)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: slippage === s 
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
                border: slippage === s
                  ? '1px solid rgba(251, 191, 36, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                color: slippage === s ? '#fbbf24' : '#a3a3a3',
              }}
            >
              {s}%
            </button>
          ))}
        </div>

        {/* Swap Button */}
        <div style={{ marginTop: '1.5rem' }}>
          <CartoonButton
            label={loading ? 'Swapping...' : !isConnected ? 'Connect Wallet' : '🔄 Sign & Swap'}
            color="bg-amber-400"
            onClick={handleRequestSwap}
            disabled={loading || !quote || !isConnected}
          />
        </div>
      </GlassPanel>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        paymentRequest={paymentRequest}
        onPaymentComplete={handlePaymentComplete}
        onSkip={(paymentId) => handlePaymentComplete(paymentId, null)}
        onCancel={() => setShowPayment(false)}
        demoMode={true}
      />

      {/* Error */}
      {error && (
        <GlassPanel 
          variant="surface" 
          hover={false}
          style={{
            marginTop: '1rem',
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ color: '#fca5a5', fontWeight: '600' }}>Error</div>
          <div style={{ color: '#fca5a5', fontSize: '0.9rem', opacity: 0.9 }}>{error}</div>
        </GlassPanel>
      )}

      {/* Success */}
      {success && (
        <GlassPanel 
          variant="surface" 
          hover={false}
          style={{
            marginTop: '1rem',
            padding: '1rem 1.25rem',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          <div style={{ color: '#86efac', fontWeight: '600' }}>✅ {success.message}</div>
          <div style={{ color: '#86efac', fontSize: '0.9rem', opacity: 0.9, marginTop: '0.25rem' }}>
            Transaction is ready for signing via facilitator
          </div>
        </GlassPanel>
      )}

      {/* Info */}
      <GlassPanel variant="surface" hover={false} style={{ marginTop: '1rem', padding: '1rem 1.25rem' }}>
        <div style={{ fontWeight: '600', color: '#d4d4d4', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          ℹ️ How it works
        </div>
        <ul style={{ 
          margin: 0, 
          padding: 0, 
          paddingLeft: '1.25rem',
          color: '#a3a3a3', 
          fontSize: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <li>Swaps are executed through PancakeSwap V2</li>
          <li>Gas fees are sponsored by Chimera</li>
          <li>You only sign an EIP-712 authorization</li>
          <li>The facilitator executes the swap on your behalf</li>
        </ul>
      </GlassPanel>
    </div>
  );
}
