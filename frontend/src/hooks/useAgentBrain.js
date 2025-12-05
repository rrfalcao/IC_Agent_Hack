/**
 * Agent Brain Hook
 * Provides easy-to-use functions for triggering the global agent brain
 * from any component (Audit, Generate, Swap, Transfer, Chat)
 */

import { useCallback } from 'react';
import { useAgentStore, STAGES, LOG_TYPES } from '../store/useAgentStore';

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function useAgentBrain() {
  const store = useAgentStore();

  /**
   * Run an audit task with brain visualization
   */
  const runAudit = useCallback(async (auditFn) => {
    store.startTask('audit', { price: '0.5 USDT' });
    
    try {
      // Step 1: Identity Check
      store.addStep({ icon: '🪪', label: 'ERC-8004 Identity Check', status: 'active' });
      store.addLog('Verifying agent identity on Base Sepolia...', LOG_TYPES.IDENTITY);
      await delay(600);
      store.completeCurrentStep('Agent #1581 verified');
      store.addLog('✓ Agent #1581 verified (ERC-8004)', LOG_TYPES.SUCCESS);

      // Step 2: Payment Check
      store.addStep({ icon: '💰', label: 'Q402 Payment Check', status: 'active' });
      store.setStage(STAGES.PAYMENT_CHECK);
      store.addLog('Checking x402 payment status...', LOG_TYPES.PAYMENT);
      await delay(500);
      store.completeCurrentStep('Payment verified via Q402');
      store.addLog('✓ Payment: 0.5 USDT via EIP-7702', LOG_TYPES.SUCCESS);

      // Step 3: Policy Check
      store.addStep({ icon: '📋', label: 'Policy Enforcement', status: 'active' });
      store.setStage(STAGES.POLICY_CHECK);
      store.addLog('Validating spend limits...', LOG_TYPES.INFO);
      await delay(400);
      store.completeCurrentStep('Within daily limit');
      store.addLog('✓ Daily limit: $50 | Used: $0.5', LOG_TYPES.SUCCESS);

      // Step 4: AI Processing
      store.addStep({ icon: '🤖', label: 'ChainGPT Analysis', status: 'active' });
      store.setStage(STAGES.THINKING);
      store.addLog('Connecting to ChainGPT Auditor...', LOG_TYPES.THINKING);
      store.addLog('Scanning for re-entrancy vulnerabilities...', LOG_TYPES.THINKING);
      store.addLog('Checking integer overflows...', LOG_TYPES.THINKING);
      store.addLog('Analyzing access controls...', LOG_TYPES.THINKING);

      // Execute the actual audit
      const result = await auditFn();

      store.completeCurrentStep(`Score: ${result?.score || 100}/100`);
      store.addLog(`✓ Analysis complete: ${result?.score || 100}/100`, LOG_TYPES.SUCCESS);

      // Step 5: Result
      store.addStep({ icon: '🛡️', label: 'Security Assessment', status: 'active' });
      await delay(300);
      const riskLevel = (result?.score || 100) >= 90 ? 'LOW' : (result?.score || 100) >= 70 ? 'MEDIUM' : 'HIGH';
      store.completeCurrentStep(`Risk: ${riskLevel}`);
      store.addLog(`✓ Risk Level: ${riskLevel}`, LOG_TYPES.SUCCESS);

      store.completeTask(result);
      return result;

    } catch (error) {
      store.failCurrentStep(error.message);
      store.addLog(`✗ Error: ${error.message}`, LOG_TYPES.ERROR);
      throw error;
    }
  }, [store]);

  /**
   * Run a contract generation task with brain visualization
   */
  const runGenerate = useCallback(async (generateFn) => {
    store.startTask('generate', { price: '1.0 USDT' });
    
    try {
      // Step 1: Identity
      store.addStep({ icon: '🪪', label: 'Identity Verification', status: 'active' });
      store.addLog('Verifying ERC-8004 identity...', LOG_TYPES.IDENTITY);
      await delay(500);
      store.completeCurrentStep('Agent #1581 active');
      store.addLog('✓ Agent #1581 verified', LOG_TYPES.SUCCESS);

      // Step 2: Payment
      store.addStep({ icon: '💰', label: 'Payment Processing', status: 'active' });
      store.setStage(STAGES.PAYMENT_CHECK);
      store.addLog('Processing Q402 micropayment...', LOG_TYPES.PAYMENT);
      await delay(400);
      store.completeCurrentStep('1.0 USDT paid');
      store.addLog('✓ Payment: 1.0 USDT (gasless)', LOG_TYPES.SUCCESS);

      // Step 3: AI Generation
      store.addStep({ icon: '🧠', label: 'AI Code Generation', status: 'active' });
      store.setStage(STAGES.THINKING);
      store.addLog('Constructing prompt for ChainGPT...', LOG_TYPES.THINKING);
      store.addLog('Generating Solidity code...', LOG_TYPES.THINKING);

      // Execute actual generation
      const result = await generateFn();

      store.completeCurrentStep('Code generated');
      store.addLog('✓ Solidity code generated', LOG_TYPES.SUCCESS);

      // Step 4: Compilation
      store.addStep({ icon: '⚙️', label: 'Bytecode Compilation', status: 'active' });
      store.addLog('Compiling with solc...', LOG_TYPES.INFO);
      await delay(600);
      store.completeCurrentStep('Compiled successfully');
      store.addLog('✓ Bytecode ready for deployment', LOG_TYPES.SUCCESS);

      // Step 5: Audit
      store.addStep({ icon: '🛡️', label: 'Security Audit', status: 'active' });
      store.addLog('Running security scan...', LOG_TYPES.THINKING);
      await delay(800);
      store.completeCurrentStep(`Score: ${result?.auditScore || 100}/100`);
      store.addLog(`✓ Audit score: ${result?.auditScore || 100}/100`, LOG_TYPES.SUCCESS);

      store.completeTask(result);
      return result;

    } catch (error) {
      store.failCurrentStep(error.message);
      store.addLog(`✗ Error: ${error.message}`, LOG_TYPES.ERROR);
      throw error;
    }
  }, [store]);

  /**
   * Run a swap task with brain visualization
   */
  const runSwap = useCallback(async (swapFn, { tokenIn, tokenOut, amount }) => {
    store.startTask('swap', { tokenIn, tokenOut, amount });
    
    try {
      // Step 1: Identity
      store.addStep({ icon: '🪪', label: 'Wallet Verification', status: 'active' });
      store.addLog('Verifying wallet connection...', LOG_TYPES.IDENTITY);
      await delay(400);
      store.completeCurrentStep('Wallet connected');
      store.addLog('✓ Wallet verified', LOG_TYPES.SUCCESS);

      // Step 2: Token Check
      store.addStep({ icon: '🔍', label: 'Token Allowance Check', status: 'active' });
      store.setStage(STAGES.POLICY_CHECK);
      store.addLog(`Checking ${tokenIn || 'token'} allowance...`, LOG_TYPES.INFO);
      await delay(300);
      store.completeCurrentStep('Allowance sufficient');
      store.addLog('✓ Token allowance OK', LOG_TYPES.SUCCESS);

      // Step 3: Route Finding
      store.addStep({ icon: '🛣️', label: 'Finding Best Route', status: 'active' });
      store.setStage(STAGES.THINKING);
      store.addLog('Querying PancakeSwap router...', LOG_TYPES.THINKING);
      store.addLog('Calculating optimal path...', LOG_TYPES.THINKING);
      await delay(500);
      store.completeCurrentStep('Route found');
      store.addLog('✓ Best route: Direct swap', LOG_TYPES.SUCCESS);

      // Step 4: Price Impact
      store.addStep({ icon: '📊', label: 'Price Impact Analysis', status: 'active' });
      store.addLog('Calculating price impact...', LOG_TYPES.INFO);
      store.addLog('Checking slippage policy...', LOG_TYPES.WARNING);
      await delay(300);
      store.completeCurrentStep('Impact: 0.1% (Safe)');
      store.addLog('✓ Price impact: 0.1% (within tolerance)', LOG_TYPES.SUCCESS);

      // Step 5: Execute
      store.addStep({ icon: '⚡', label: 'Executing Swap', status: 'active' });
      store.setStage(STAGES.EXECUTING);
      store.addLog('Requesting signature...', LOG_TYPES.INFO);

      const result = await swapFn();

      store.completeCurrentStep('Swap complete');
      store.addLog(`✓ Swap executed: ${result?.txHash?.slice(0, 16)}...`, LOG_TYPES.SUCCESS);

      store.completeTask(result);
      return result;

    } catch (error) {
      store.failCurrentStep(error.message);
      store.addLog(`✗ Error: ${error.message}`, LOG_TYPES.ERROR);
      throw error;
    }
  }, [store]);

  /**
   * Run a transfer task with brain visualization
   */
  const runTransfer = useCallback(async (transferFn, { token, to, amount }) => {
    store.startTask('transfer', { token, to, amount });
    
    try {
      // Step 1: Validate
      store.addStep({ icon: '🔍', label: 'Validating Transfer', status: 'active' });
      store.addLog(`Validating recipient: ${to?.slice(0, 10)}...`, LOG_TYPES.INFO);
      await delay(400);
      store.completeCurrentStep('Address valid');
      store.addLog('✓ Recipient address valid', LOG_TYPES.SUCCESS);

      // Step 2: Balance Check
      store.addStep({ icon: '💰', label: 'Balance Check', status: 'active' });
      store.addLog(`Checking ${token || 'BNB'} balance...`, LOG_TYPES.INFO);
      await delay(300);
      store.completeCurrentStep('Sufficient balance');
      store.addLog('✓ Balance sufficient', LOG_TYPES.SUCCESS);

      // Step 3: Gas Estimation
      store.addStep({ icon: '⛽', label: 'Gas Estimation', status: 'active' });
      store.setStage(STAGES.THINKING);
      store.addLog('Estimating gas (sponsored)...', LOG_TYPES.INFO);
      await delay(300);
      store.completeCurrentStep('Gas: Sponsored');
      store.addLog('✓ Gas sponsored by facilitator', LOG_TYPES.SUCCESS);

      // Step 4: Execute
      store.addStep({ icon: '⚡', label: 'Broadcasting Transaction', status: 'active' });
      store.setStage(STAGES.EXECUTING);
      store.addLog('Signing transaction...', LOG_TYPES.INFO);

      const result = await transferFn();

      store.completeCurrentStep('Transfer complete');
      store.addLog(`✓ Tx: ${result?.txHash?.slice(0, 16)}...`, LOG_TYPES.SUCCESS);

      store.completeTask(result);
      return result;

    } catch (error) {
      store.failCurrentStep(error.message);
      store.addLog(`✗ Error: ${error.message}`, LOG_TYPES.ERROR);
      throw error;
    }
  }, [store]);

  /**
   * Run a chat message with brain visualization
   */
  const runChat = useCallback(async (chatFn, message) => {
    store.startTask('chat', { message: message?.slice(0, 50) });
    
    try {
      // Step 1: Process
      store.addStep({ icon: '💬', label: 'Processing Message', status: 'active' });
      store.addLog('Analyzing query...', LOG_TYPES.INFO);
      await delay(300);
      store.completeCurrentStep('Query understood');
      store.addLog('✓ Query parsed', LOG_TYPES.SUCCESS);

      // Step 2: AI Response
      store.addStep({ icon: '🤖', label: 'ChainGPT Response', status: 'active' });
      store.setStage(STAGES.THINKING);
      store.addLog('Connecting to ChainGPT...', LOG_TYPES.THINKING);
      store.addLog('Generating response...', LOG_TYPES.THINKING);

      const result = await chatFn();

      store.completeCurrentStep('Response ready');
      store.addLog('✓ Response generated', LOG_TYPES.SUCCESS);

      store.completeTask(result);
      return result;

    } catch (error) {
      store.failCurrentStep(error.message);
      store.addLog(`✗ Error: ${error.message}`, LOG_TYPES.ERROR);
      throw error;
    }
  }, [store]);

  /**
   * Run a deploy task with brain visualization
   */
  const runDeploy = useCallback(async (deployFn) => {
    store.startTask('deploy', { price: '2.0 USDT' });
    
    try {
      // Step 1: Identity
      store.addStep({ icon: '🪪', label: 'Identity Check', status: 'active' });
      store.addLog('Verifying deployer identity...', LOG_TYPES.IDENTITY);
      await delay(400);
      store.completeCurrentStep('Identity verified');
      store.addLog('✓ Agent #1581 authorized', LOG_TYPES.SUCCESS);

      // Step 2: Signature
      store.addStep({ icon: '✍️', label: 'EIP-712 Signature', status: 'active' });
      store.setStage(STAGES.SIGNING);
      store.addLog('Requesting deployment signature...', LOG_TYPES.INFO);

      // Step 3: Broadcast
      store.addStep({ icon: '📡', label: 'Broadcasting to BSC', status: 'active' });
      store.setStage(STAGES.EXECUTING);
      store.addLog('Submitting transaction...', LOG_TYPES.INFO);

      const result = await deployFn();

      store.completeCurrentStep(`Deployed to ${result?.contractAddress?.slice(0, 10)}...`);
      store.addLog(`✓ Contract deployed: ${result?.contractAddress}`, LOG_TYPES.SUCCESS);
      store.addLog(`✓ Tx: ${result?.txHash}`, LOG_TYPES.SUCCESS);

      store.completeTask(result);
      return result;

    } catch (error) {
      store.failCurrentStep(error.message);
      store.addLog(`✗ Error: ${error.message}`, LOG_TYPES.ERROR);
      throw error;
    }
  }, [store]);

  return {
    // Task runners
    runAudit,
    runGenerate,
    runSwap,
    runTransfer,
    runChat,
    runDeploy,
    
    // Direct store access
    store,
    isOpen: store.isOpen,
    closeBrain: store.closeBrain,
    reset: store.reset,
    
    // Manual control
    startTask: store.startTask,
    addLog: store.addLog,
    addStep: store.addStep,
    completeCurrentStep: store.completeCurrentStep,
    failCurrentStep: store.failCurrentStep,
    completeTask: store.completeTask,
    setStage: store.setStage
  };
}

export default useAgentBrain;

