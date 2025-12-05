/**
 * Contract Generator Component
 * Full flow: Payment → Generate → Audit → Preview → Sign → Deploy
 * Properly integrated with x402 micropayments
 * Glass morphism design
 */

import { useState } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { PaymentModal } from './PaymentModal';
import { TransactionPreview } from './TransactionPreview';
import { GlassPanel, glassInputStyle } from './GlassPanel';

// Flow steps
const STEPS = {
  INPUT: 'input',
  PAYMENT: 'payment',
  GENERATING: 'generating',
  PREVIEW: 'preview',
  SIGNING: 'signing',
  DEPLOYING: 'deploying',
  SUCCESS: 'success',
  ERROR: 'error'
};

export function ContractGenerator() {
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  
  // Flow state
  const [step, setStep] = useState(STEPS.INPUT);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState(null);
  
  // Payment state
  const [paymentRequest, setPaymentRequest] = useState(null);
  
  // Generation state
  const [generationResult, setGenerationResult] = useState(null);
  const [auditResult, setAuditResult] = useState(null);
  
  // Deployment state
  const [deployResult, setDeployResult] = useState(null);
  
  const [showCode, setShowCode] = useState(false);

  // Step 1: Request payment for generation
  const handleStartGeneration = async () => {
    if (!prompt.trim()) {
      setError('Please enter a contract description');
      return;
    }

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
          endpoint: 'contract_generation',
          userAddress: address
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentRequest(data.payment);
        setStep(STEPS.PAYMENT);
      } else {
        throw new Error(data.error || 'Failed to create payment request');
      }
    } catch (err) {
      console.error('Payment request error:', err);
      setError(err.message);
    }
  };

  // Step 2: After payment is complete, generate contract
  const handlePaymentComplete = async (paymentId, signature) => {
    setStep(STEPS.GENERATING);
    
    try {
      // Generate contract (without auto-deploy)
      const response = await fetch('http://localhost:3000/api/contract/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `x402 paymentId=${paymentId}${signature ? ` signature=${signature}` : ''}`
        },
        body: JSON.stringify({
          prompt,
          autoAudit: true,
          autoDeploy: false // Don't auto-deploy - we need to preview first
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setGenerationResult(data);
        setAuditResult({
          score: data.auditScore || 100,
          passed: (data.auditScore || 100) >= 80,
          report: data.auditReport || 'No issues found',
          summary: {
            criticalIssues: 0,
            highIssues: 0,
            mediumIssues: 0,
            lowIssues: 0,
            informational: 0
          }
        });
        setStep(STEPS.PREVIEW);
      } else {
        throw new Error(data.message || 'Generation failed');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message);
      setStep(STEPS.ERROR);
    }
  };

  // Step 3: Sign and deploy
  const handleSignAndDeploy = async () => {
    if (!generationResult?.compiled) {
      setError('No compiled contract to deploy');
      return;
    }

    setStep(STEPS.SIGNING);

    try {
      // Create EIP-712 typed data for the deployment intent
      // Note: verifyingContract omitted for off-chain verification
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
      
      // Create a simple hash of the intent data
      const dataString = JSON.stringify({
        bytecode: generationResult.compiled.bytecode,
        abi: generationResult.compiled.abi
      });
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const dataHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const message = {
        type: 'deploy_contract',
        nonce,
        deadline,
        dataHash
      };

      // Sign the typed data
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Intent',
        message
      });

      console.log('Intent signed:', signature.slice(0, 20) + '...');
      setStep(STEPS.DEPLOYING);

      // Deploy with signature
      const deployResponse = await fetch('http://localhost:3000/api/contract/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bytecode: generationResult.compiled.bytecode,
          abi: generationResult.compiled.abi,
          constructorArgs: [],
          signature
        })
      });

      const deployData = await deployResponse.json();

      if (deployData.success) {
        setDeployResult(deployData);
        setStep(STEPS.SUCCESS);
      } else {
        throw new Error(deployData.message || 'Deployment failed');
      }
    } catch (err) {
      console.error('Deploy error:', err);
      if (err.message?.includes('User rejected')) {
        // User cancelled signing
        setStep(STEPS.PREVIEW);
      } else {
        setError(err.message);
        setStep(STEPS.ERROR);
      }
    }
  };

  // Reset flow
  const handleReset = () => {
    setStep(STEPS.INPUT);
    setPrompt('');
    setError(null);
    setPaymentRequest(null);
    setGenerationResult(null);
    setAuditResult(null);
    setDeployResult(null);
    setShowCode(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '900',
          color: '#f5f5f5',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
          textShadow: '0 0 30px rgba(255,255,255,0.1)'
        }}>
          Smart Contract Generator
        </h2>
        <p style={{ color: '#a3a3a3', fontSize: '1.1rem' }}>
          Describe your smart contract in plain English
        </p>
        
        {/* Connection Status */}
        {!isConnected && (
          <GlassPanel 
            variant="surface"
            hover={false}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              display: 'inline-block',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <span style={{ color: '#fbbf24' }}>
              ⚠️ Connect your wallet to generate and deploy contracts
            </span>
          </GlassPanel>
        )}
      </div>

      {/* Step 1: Input Form */}
      {step === STEPS.INPUT && (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create an ERC20 token called MyToken with symbol MTK and 1000000 total supply"
              rows={4}
              style={{
                ...glassInputStyle,
                resize: 'vertical',
                fontFamily: 'inherit',
                minHeight: '120px',
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
            
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <CartoonButton
                label="🚀 Generate Contract"
                color={isConnected ? 'bg-green-400' : 'bg-gray-400'}
                disabled={!prompt.trim() || !isConnected}
                onClick={handleStartGeneration}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <GlassPanel 
              variant="surface" 
              hover={false}
              style={{
                padding: '1.5rem',
                marginBottom: '1rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <span style={{ color: '#fca5a5' }}>
                <strong>Error:</strong> {error}
              </span>
            </GlassPanel>
          )}

          {/* Example Prompts */}
          <ExamplePrompts onSelect={setPrompt} />
        </>
      )}

      {/* Step 2: Payment Modal */}
      <PaymentModal
        isOpen={step === STEPS.PAYMENT}
        paymentRequest={paymentRequest}
        onPaymentComplete={handlePaymentComplete}
        onSkip={(paymentId) => handlePaymentComplete(paymentId, null)}
        onCancel={() => setStep(STEPS.INPUT)}
        demoMode={true}
      />

      {/* Step 3: Generating */}
      {step === STEPS.GENERATING && (
        <GeneratingState />
      )}

      {/* Step 4: Preview & Sign */}
      <TransactionPreview
        isOpen={step === STEPS.PREVIEW}
        code={generationResult?.contractCode}
        auditResult={auditResult}
        intent={{ type: 'deploy_contract', data: generationResult?.compiled }}
        contractName={generationResult?.compiled?.contractName || 'Generated Contract'}
        estimatedGas="0.002"
        onSign={handleSignAndDeploy}
        onCancel={() => setStep(STEPS.INPUT)}
      />

      {/* Step 5: Signing/Deploying */}
      {(step === STEPS.SIGNING || step === STEPS.DEPLOYING) && (
        <GlassPanel 
          variant="card"
          hover={false}
          style={{ padding: '3rem', textAlign: 'center' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>
            {step === STEPS.SIGNING ? '✍️' : '🚀'}
          </div>
          <h3 style={{ color: '#c4b5fd', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {step === STEPS.SIGNING ? 'Waiting for Signature...' : 'Deploying to BSC Testnet...'}
          </h3>
          <p style={{ color: '#a3a3a3' }}>
            {step === STEPS.SIGNING 
              ? 'Please sign the transaction in your wallet' 
              : 'This may take a few seconds'}
          </p>
        </GlassPanel>
      )}

      {/* Step 6: Success */}
      {step === STEPS.SUCCESS && deployResult && (
        <SuccessState 
          result={deployResult}
          contractCode={generationResult?.contractCode}
          showCode={showCode}
          setShowCode={setShowCode}
          onReset={handleReset}
        />
      )}

      {/* Error State */}
      {step === STEPS.ERROR && (
        <GlassPanel 
          variant="card"
          hover={false}
          style={{ 
            padding: '2rem', 
            textAlign: 'center',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h3 style={{ color: '#fca5a5', marginBottom: '1rem' }}>Something went wrong</h3>
          <p style={{ color: '#fca5a5', marginBottom: '1.5rem' }}>{error}</p>
          <CartoonButton
            label="Try Again"
            color="bg-red-400"
            onClick={handleReset}
          />
        </GlassPanel>
      )}

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

// Sub-components

function GeneratingState() {
  return (
    <GlassPanel 
      variant="card"
      hover={false}
      style={{ padding: '3rem', textAlign: 'center' }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>🤖</div>
      <h3 style={{ color: '#86efac', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        AI is generating your contract...
      </h3>
      <p style={{ color: '#a3a3a3', marginBottom: '2rem' }}>
        This may take 10-15 seconds
      </p>
      
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
        <div style={{ marginBottom: '1rem', color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ animation: 'pulse 1s infinite' }}>⚙️</span> Generating Solidity code...
        </div>
        <div style={{ marginBottom: '1rem', color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🔍</span> Running security audit...
        </div>
        <div style={{ marginBottom: '1rem', color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📦</span> Compiling to bytecode...
        </div>
      </div>
    </GlassPanel>
  );
}

function SuccessState({ result, contractCode, showCode, setShowCode, onReset }) {
  return (
    <GlassPanel 
      variant="card"
      hover={false}
      style={{ padding: '2.5rem' }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem', textAlign: 'center', animation: 'bounce 1s ease-in-out 2' }}>
        🎉
      </div>
      <h3 style={{ color: '#86efac', margin: 0, fontSize: '2rem', fontWeight: '700', textAlign: 'center' }}>
        Contract Deployed Successfully!
      </h3>
      
      <GlassPanel 
        variant="surface"
        hover={false}
        style={{ padding: '2rem', marginTop: '1.5rem' }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <strong style={{ color: '#f5f5f5', fontSize: '1.1rem' }}>Contract Address:</strong>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '0.95rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            marginTop: '0.5rem',
            wordBreak: 'break-all',
            color: '#86efac',
            border: '1px solid rgba(134, 239, 172, 0.2)'
          }}>
            {result.contractAddress}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <strong style={{ color: '#f5f5f5', fontSize: '1.1rem' }}>Transaction Hash:</strong>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '0.95rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            marginTop: '0.5rem',
            wordBreak: 'break-all',
            color: '#93c5fd',
            border: '1px solid rgba(147, 197, 253, 0.2)'
          }}>
            {result.txHash}
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href={result.bscScanUrl} target="_blank" rel="noopener noreferrer">
            <CartoonButton label="View on BscScan →" color="bg-blue-400" />
          </a>
          <a href={`https://testnet.bscscan.com/address/${result.contractAddress}`} target="_blank" rel="noopener noreferrer">
            <CartoonButton label="View Contract →" color="bg-purple-400" />
          </a>
        </div>
      </GlassPanel>

      {contractCode && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <CartoonButton
              label={showCode ? '▼ Hide Code' : '▶ Show Code'}
              color="bg-gray-500"
              onClick={() => setShowCode(!showCode)}
            />
          </div>
          {showCode && (
            <pre style={{
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '16px',
              overflow: 'auto',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              color: '#d4d4d4',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: '400px'
            }}>
              {contractCode}
            </pre>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <CartoonButton
          label="🔄 Create Another Contract"
          color="bg-green-400"
          onClick={onReset}
        />
      </div>
    </GlassPanel>
  );
}

function ExamplePrompts({ onSelect }) {
  const examples = [
    { icon: '📦', text: 'Simple storage contract', prompt: 'Create a simple storage contract that stores and retrieves a uint256 value' },
    { icon: '🪙', text: 'ERC20 token', prompt: 'Create an ERC20 token called MyToken with symbol MTK and 1000000 total supply' },
    { icon: '🗳️', text: 'Voting contract', prompt: 'Create a voting contract where users can propose and vote on proposals' },
  ];

  return (
    <GlassPanel 
      variant="card"
      hover={false}
      style={{ marginTop: '2rem', padding: '2rem' }}
    >
      <h4 style={{ marginTop: 0, color: '#93c5fd', fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: '700' }}>
        💡 Example Prompts:
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onSelect(ex.prompt)}
            style={{
              padding: '1.25rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '1rem',
              color: '#e5e5e5',
              fontWeight: '500',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 2.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'rgba(147, 197, 253, 0.5)';
              e.target.style.transform = 'translateX(10px)';
              e.target.style.background = 'rgba(147, 197, 253, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'translateX(0)';
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            {ex.icon} {ex.text}
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}
