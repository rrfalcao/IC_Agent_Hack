/**
 * Configuration Management
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

dotenv.config({ path: join(rootDir, '.env') });

/**
 * Validate required environment variables
 * @param {Array<string>} required - Required variable names
 * @throws {Error} If any required variables are missing
 */
function validateEnv(required) {
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate critical variables
validateEnv([
  'CHAINGPT_API_KEY',
  'BNB_RPC_URL',
  'BNB_CHAIN_ID',
  'FACILITATOR_WALLET_ADDRESS'
]);

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // ChainGPT
  chaingpt: {
    apiKey: process.env.CHAINGPT_API_KEY
  },
  
  // Blockchain
  blockchain: {
    rpcUrl: process.env.BNB_RPC_URL,
    chainId: parseInt(process.env.BNB_CHAIN_ID),
    facilitatorAddress: process.env.FACILITATOR_WALLET_ADDRESS,
    facilitatorPrivateKey: process.env.FACILITATOR_PRIVATE_KEY
  },
  
  // AWE Network / ERC-8004 Identity
  awe: {
    registryAddress: process.env.ERC8004_REGISTRY_ADDRESS || '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb',
    agentId: process.env.AGENT_ID || '1581',
    ipfsHash: process.env.AGENT_IPFS_HASH,
    chainId: parseInt(process.env.ERC8004_CHAIN_ID || '84532'), // Base Sepolia
    explorerUrl: 'https://sepolia.basescan.org'
  },
  
  // CHIM Token (Chimera Credit) Configuration
  chim: {
    // Contract address (set after deployment via CHIM_CONTRACT_ADDRESS env)
    contractAddress: process.env.CHIM_CONTRACT_ADDRESS || null,
    // Exchange rate: 1 USDC = 10 CHIM
    exchangeRate: parseInt(process.env.CHIM_EXCHANGE_RATE || '10'),
    // Demo mode: if true, credits are tracked in-memory (no contract needed)
    demoMode: process.env.CHIM_DEMO_MODE !== 'false',
    // Service pricing in CHIM tokens
    pricing: {
      generate: process.env.CHIM_PRICE_GENERATE || '10',    // 10 CHIM
      audit: process.env.CHIM_PRICE_AUDIT || '5',           // 5 CHIM
      analyze: process.env.CHIM_PRICE_ANALYZE || '3',       // 3 CHIM
      swap: process.env.CHIM_PRICE_SWAP || '2',             // 2 CHIM
      transfer: process.env.CHIM_PRICE_TRANSFER || '1',     // 1 CHIM
      chat: process.env.CHIM_PRICE_CHAT || '0.1'            // 0.1 CHIM
    },
    // Credit packages for purchase
    packages: {
      starter: { usdc: '5', chim: '50' },
      builder: { usdc: '20', chim: '200' },
      pro: { usdc: '50', chim: '550' } // 10% bonus
    }
  },
  
  // Features
  features: {
    enablePayments: process.env.ENABLE_PAYMENTS === 'true',
    enableAuditLoop: process.env.ENABLE_AUDIT_LOOP !== 'false', // Default true
    auditScoreThreshold: parseInt(process.env.AUDIT_SCORE_THRESHOLD || '80')
  },
  
  // Q402 Payment Configuration
  payment: {
    // Token addresses per network
    tokens: {
      56: '0x55d398326f99059fF775485246999027B3197955',  // BSC Mainnet USDT
      97: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'   // BSC Testnet USDT
    },
    // Get token for current network
    get token() {
      return this.tokens[config.blockchain.chainId] || this.tokens[97];
    },
    // Pricing in smallest unit (6 decimals for USDT)
    prices: {
      generate: process.env.PRICE_GENERATE || '1000000', // 1 USDT
      audit: process.env.PRICE_AUDIT || '500000',        // 0.5 USDT
      chat: process.env.PRICE_CHAT || '100000',          // 0.1 USDT
      deploy: process.env.PRICE_DEPLOY || '2000000'      // 2 USDT
    },
    recipient: process.env.FACILITATOR_WALLET_ADDRESS,
    // Q402 protocol configuration
    scheme: 'evm/eip7702-delegated-payment',
    facilitatorUrl: process.env.Q402_FACILITATOR_URL || 'https://facilitator.world.fun/'
  }
};

// Log configuration (without sensitive data)
console.log('[Config] Loaded configuration:', {
  port: config.port,
  environment: config.nodeEnv,
  chainId: config.blockchain.chainId,
  facilitatorAddress: config.blockchain.facilitatorAddress,
  features: config.features
});

export default config;

