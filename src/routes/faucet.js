/**
 * Super Faucet Route
 * Provides judges/demo users with test funds in one click:
 * - 0.02 tBNB for gas
 * - 1,000 MockUSDC for testing payments
 */

import { Hono } from 'hono';
import { ethers } from 'ethers';
import config from '../config/index.js';

const faucet = new Hono();

// In-memory rate limit - tracks addresses that have claimed
const claimedAddresses = new Set();

// MockUSDC ABI (minimal - just mint function)
const MOCK_USDC_ABI = [
  'function mint(address to, uint256 amount) public',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// Faucet configuration
const FAUCET_CONFIG = {
  bnbAmount: '0.02',           // 0.02 tBNB for gas
  usdcAmount: '1000000000',    // 1,000 USDC (6 decimals: 1000 * 10^6)
  rateLimitEnabled: true       // Can disable for testing
};

/**
 * GET /api/faucet/status
 * Check faucet status and remaining balance
 */
faucet.get('/status', async (c) => {
  try {
    const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    const privateKey = config.blockchain.facilitatorPrivateKey;
    
    if (!privateKey) {
      return c.json({ 
        error: 'Faucet not configured',
        message: 'FACILITATOR_PRIVATE_KEY not set'
      }, 503);
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    
    // Get USDC contract info
    const usdcAddress = config.payment.token;
    let usdcBalance = '0';
    
    if (usdcAddress) {
      try {
        const usdcContract = new ethers.Contract(usdcAddress, MOCK_USDC_ABI, provider);
        const bal = await usdcContract.balanceOf(wallet.address);
        usdcBalance = ethers.formatUnits(bal, 6);
      } catch (e) {
        console.warn('[Faucet] Could not fetch USDC balance:', e.message);
      }
    }
    
    return c.json({
      success: true,
      faucetAddress: wallet.address,
      bnbBalance: ethers.formatEther(balance),
      usdcBalance,
      usdcContractAddress: usdcAddress,
      dripAmounts: {
        bnb: FAUCET_CONFIG.bnbAmount,
        usdc: '1000'
      },
      claimedCount: claimedAddresses.size,
      rateLimitEnabled: FAUCET_CONFIG.rateLimitEnabled
    });
  } catch (error) {
    console.error('[Faucet] Status error:', error);
    return c.json({ error: 'Failed to get faucet status' }, 500);
  }
});

/**
 * POST /api/faucet/drip
 * Send test funds to a user address
 * Body: { userAddress: string }
 */
faucet.post('/drip', async (c) => {
  try {
    const body = await c.req.json();
    const { userAddress } = body;
    
    // Validate address
    if (!userAddress || !ethers.isAddress(userAddress)) {
      return c.json({ 
        error: 'Invalid address',
        message: 'Please provide a valid Ethereum address'
      }, 400);
    }
    
    const normalizedAddress = userAddress.toLowerCase();
    
    // Check rate limit
    if (FAUCET_CONFIG.rateLimitEnabled && claimedAddresses.has(normalizedAddress)) {
      return c.json({ 
        error: 'Already claimed',
        message: 'This address has already received funds. Each address can only claim once.'
      }, 429);
    }
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    const privateKey = config.blockchain.facilitatorPrivateKey;
    
    if (!privateKey) {
      return c.json({ 
        error: 'Faucet not configured',
        message: 'Agent wallet not configured'
      }, 503);
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Check faucet has enough BNB
    const faucetBalance = await provider.getBalance(wallet.address);
    const requiredBnb = ethers.parseEther(FAUCET_CONFIG.bnbAmount);
    
    if (faucetBalance < requiredBnb) {
      return c.json({ 
        error: 'Faucet empty',
        message: 'The faucet is out of tBNB. Please contact the team.'
      }, 503);
    }
    
    console.log(`[Faucet] Dripping to ${userAddress}...`);
    
    // Action A: Send tBNB for gas
    console.log('[Faucet] Sending 0.02 tBNB...');
    const bnbTx = await wallet.sendTransaction({
      to: userAddress,
      value: requiredBnb
    });
    const bnbReceipt = await bnbTx.wait();
    console.log('[Faucet] tBNB sent:', bnbReceipt.hash);
    
    // Action B: Mint MockUSDC
    let usdcTxHash = null;
    const usdcAddress = config.payment.token;
    
    if (usdcAddress) {
      try {
        console.log('[Faucet] Minting 1,000 MockUSDC...');
        const usdcContract = new ethers.Contract(usdcAddress, MOCK_USDC_ABI, wallet);
        const usdcTx = await usdcContract.mint(userAddress, FAUCET_CONFIG.usdcAmount);
        const usdcReceipt = await usdcTx.wait();
        usdcTxHash = usdcReceipt.hash;
        console.log('[Faucet] MockUSDC minted:', usdcTxHash);
      } catch (mintError) {
        console.error('[Faucet] USDC mint error:', mintError.message);
        // Continue even if USDC mint fails - user still gets BNB
      }
    } else {
      console.warn('[Faucet] No USDC contract address configured');
    }
    
    // Add to rate limit set
    claimedAddresses.add(normalizedAddress);
    
    console.log(`[Faucet] Successfully funded ${userAddress}`);
    
    return c.json({
      success: true,
      message: 'Funds sent successfully! 🎉',
      recipient: userAddress,
      transactions: {
        bnb: {
          hash: bnbReceipt.hash,
          amount: FAUCET_CONFIG.bnbAmount,
          explorerUrl: `https://testnet.bscscan.com/tx/${bnbReceipt.hash}`
        },
        usdc: usdcTxHash ? {
          hash: usdcTxHash,
          amount: '1000',
          explorerUrl: `https://testnet.bscscan.com/tx/${usdcTxHash}`
        } : null
      }
    });
    
  } catch (error) {
    console.error('[Faucet] Drip error:', error);
    return c.json({ 
      error: 'Transaction failed',
      message: error.message || 'Failed to send funds'
    }, 500);
  }
});

/**
 * POST /api/faucet/reset
 * Reset rate limit (admin only - for testing)
 */
faucet.post('/reset', async (c) => {
  // In production, add authentication here
  const previousCount = claimedAddresses.size;
  claimedAddresses.clear();
  
  return c.json({
    success: true,
    message: 'Rate limit reset',
    previousClaimCount: previousCount
  });
});

/**
 * GET /api/faucet/check/:address
 * Check if an address has already claimed
 */
faucet.get('/check/:address', async (c) => {
  const address = c.req.param('address');
  
  if (!address || !ethers.isAddress(address)) {
    return c.json({ error: 'Invalid address' }, 400);
  }
  
  const hasClaimed = claimedAddresses.has(address.toLowerCase());
  
  return c.json({
    address,
    hasClaimed,
    canClaim: !hasClaimed
  });
});

export default faucet;

