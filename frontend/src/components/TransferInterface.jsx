/**
 * Transfer Interface Component
 * Send tokens to any address (gasless!)
 * Integrated with x402 micropayments
 * Glass morphism design
 */

import { useState } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { PaymentModal } from './PaymentModal';
import { GlassPanel, glassInputStyle } from './GlassPanel';

const TOKENS = [
  { symbol: 'tBNB', name: 'Test BNB', address: null },
  { symbol: 'BUSD', name: 'Binance USD', address: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee' },
  { symbol: 'USDT', name: 'Tether', address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' },
];

export function TransferInterface() {
  const { address: userAddress, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  
  const [token, setToken] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);

  const handlePreview = async () => {
    if (!recipient || !amount) return;

    setPreviewLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/transfer/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, to: recipient, amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Preview failed');
      }

      setPreview(data.preview);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Step 1: Request payment before transfer
  const handleRequestTransfer = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!preview) {
      setError('Please preview the transaction first');
      return;
    }

    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'contract_deploy',
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

  // Step 2: After payment, sign and execute transfer
  const handlePaymentComplete = async (paymentId, signature) => {
    setShowPayment(false);
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
      
      const dataString = JSON.stringify({ token, to: recipient, amount });
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const dataHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const message = {
        type: 'transfer',
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

      console.log('Transfer intent signed');

      const response = await fetch('http://localhost:3000/api/transfer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `x402 paymentId=${paymentId}`
        },
        body: JSON.stringify({ 
          token, 
          to: recipient, 
          amount,
          signature: intentSignature
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Transfer failed');
      }

      setSuccess({
        txHash: responseData.txHash,
        bscScanUrl: responseData.bscScanUrl
      });
      
      setRecipient('');
      setAmount('');
      setPreview(null);
    } catch (err) {
      if (!err.message?.includes('User rejected')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);

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
        <span style={{ fontSize: '2rem' }}>💸</span>
        Send Tokens
      </h2>
      <p style={{ color: '#a3a3a3', marginBottom: '1.5rem' }}>
        Transfer tokens to any address (Gasless!)
      </p>

      {/* Transfer Card */}
      <GlassPanel variant="surface" hover={false} style={{ padding: '1.5rem' }}>
        {/* Token Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Token</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {TOKENS.map((t) => (
              <button
                key={t.symbol}
                onClick={() => setToken(t.address)}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: token === t.address 
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  border: token === t.address
                    ? '1px solid rgba(251, 191, 36, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  color: token === t.address ? '#fbbf24' : '#d4d4d4',
                }}
              >
                <div style={{ fontWeight: '700' }}>{t.symbol}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>{t.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recipient */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              setPreview(null);
            }}
            placeholder="0x..."
            style={{
              ...glassInputStyle,
              borderColor: isValidAddress(recipient) || !recipient 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(239, 68, 68, 0.5)',
            }}
            onFocus={(e) => {
              if (isValidAddress(recipient) || !recipient) {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }
              e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = isValidAddress(recipient) || !recipient 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(239, 68, 68, 0.5)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {recipient && !isValidAddress(recipient) && (
            <div style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Invalid address format
            </div>
          )}
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setPreview(null);
            }}
            placeholder="0.0"
            style={{
              ...glassInputStyle,
              fontSize: '1.25rem',
              fontFamily: 'monospace',
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

        {/* Preview Button */}
        {!preview && (
          <button
            onClick={handlePreview}
            disabled={previewLoading || !recipient || !amount || !isValidAddress(recipient)}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: previewLoading || !recipient || !amount || !isValidAddress(recipient) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '1rem',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#d4d4d4',
              opacity: previewLoading || !recipient || !amount || !isValidAddress(recipient) ? 0.5 : 1,
            }}
          >
            {previewLoading ? 'Loading...' : '👁️ Preview Transaction'}
          </button>
        )}

        {/* Preview Details */}
        {preview && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '1rem', 
            borderRadius: '12px',
            background: 'rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Transaction Preview
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a3a3a3' }}>Token</span>
                <span style={{ color: '#f5f5f5', fontWeight: '600' }}>{preview.token}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a3a3a3' }}>Amount</span>
                <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{preview.amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a3a3a3' }}>To</span>
                <span style={{ color: '#f5f5f5', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {preview.to.slice(0, 8)}...{preview.to.slice(-6)}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '0.5rem',
                marginTop: '0.25rem'
              }}>
                <span style={{ color: '#a3a3a3' }}>Gas Cost</span>
                <span style={{ color: '#86efac', fontWeight: '600' }}>
                  {preview.sponsored ? '$0.00 (Sponsored)' : `~${preview.estimatedGas} tBNB`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Button */}
        <CartoonButton
          label={loading ? 'Sending...' : !isConnected ? 'Connect Wallet' : '💸 Sign & Send'}
          color="bg-green-400"
          onClick={handleRequestTransfer}
          disabled={loading || !preview || !isConnected}
        />
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
          <div style={{ color: '#86efac', fontWeight: '600', marginBottom: '0.5rem' }}>✅ Transfer Sent!</div>
          <a 
            href={success.bscScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#fbbf24', fontSize: '0.9rem', textDecoration: 'none' }}
          >
            View on BSCScan →
          </a>
        </GlassPanel>
      )}

      {/* Info */}
      <GlassPanel variant="surface" hover={false} style={{ marginTop: '1rem', padding: '1rem 1.25rem' }}>
        <div style={{ fontWeight: '600', color: '#d4d4d4', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          ℹ️ Gasless Transfers
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
          <li>Gas fees are sponsored by Chimera's facilitator</li>
          <li>You sign an EIP-712 message to authorize</li>
          <li>The facilitator executes the transfer for you</li>
          <li>Your tokens never leave your control until confirmed</li>
        </ul>
      </GlassPanel>
    </div>
  );
}
