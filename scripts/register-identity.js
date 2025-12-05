#!/usr/bin/env node
/**
 * ERC-8004 Identity Registration Script
 * Mints an NFT on the AWE Network identity registry
 * 
 * NOTE: ERC-8004 registries are deployed on Base Sepolia (84532)
 * NOT on BSC Testnet. This script uses Base Sepolia for identity,
 * while Q402 payments can happen on BSC.
 * 
 * Registry addresses from: https://github.com/erc-8004/erc-8004-contracts
 */

import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// ERC-8004 Registry Addresses (Official Deployments)
const ERC8004_REGISTRIES = {
  // Base Sepolia (84532) - Primary testnet for AWE
  84532: {
    name: 'Base Sepolia',
    identity: '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb',
    reputation: '0x8004bd8daB57f14Ed299135749a5CB5c42d341BF',
    validation: '0x8004C269D0A5647E51E121FeB226200ECE932d55',
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org'
  },
  // ETH Sepolia (11155111) - Alternative
  11155111: {
    name: 'Ethereum Sepolia',
    identity: '0x8004a6090Cd10A7288092483047B097295Fb8847',
    reputation: '0x8004B8FD1A363aa02fDC07635C0c5F94f6Af5B7E',
    validation: '0x8004CB39f29c09145F24Ad9dDe2A108C1A2cdfC5',
    rpcUrl: 'https://ethereum-sepolia.publicnode.com',
    explorer: 'https://sepolia.etherscan.io'
  }
};

// Use Base Sepolia by default (recommended for AWE)
const NETWORK_ID = parseInt(process.env.ERC8004_CHAIN_ID || '84532');
const REGISTRY = ERC8004_REGISTRIES[NETWORK_ID] || ERC8004_REGISTRIES[84532];

// Load the complete ABI from AWE package
import { readFileSync } from 'fs';
let IDENTITY_ABI;
try {
  const abiPath = join(__dirname, '../AWEtoAgent-Kit/packages/identity/src/abi/IdentityRegistry.json');
  IDENTITY_ABI = JSON.parse(readFileSync(abiPath, 'utf8'));
} catch {
  // Fallback minimal ABI
  IDENTITY_ABI = parseAbi([
    'function register(string tokenUri) external returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'event Registered(uint256 indexed agentId, string tokenURI, address indexed owner)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
  ]);
}

/**
 * Generate agent metadata JSON
 */
function generateMetadata(agentAddress) {
  return {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'Chimera',
    description: 'AI Agent for autonomous smart contract deployment on BNB Chain. Powered by ChainGPT for intelligence, Q402 for gasless payments, and AWE Network for verified identity.',
    image: 'ipfs://QmYourLogoHash', // TODO: Upload logo to IPFS
    external_url: 'https://chimera-agent.xyz',
    
    // Agent capabilities
    capabilities: [
      {
        name: 'Smart Contract Generation',
        description: 'Generate Solidity smart contracts from natural language descriptions'
      },
      {
        name: 'Security Auditing', 
        description: 'Automated vulnerability detection and security analysis'
      },
      {
        name: 'Contract Deployment',
        description: 'Deploy contracts with gasless transactions via Q402'
      },
      {
        name: 'DeFi Research',
        description: 'Research and explain blockchain concepts and DeFi strategies'
      }
    ],
    
    // Service endpoints
    endpoints: [
      {
        name: 'A2A',
        endpoint: 'http://localhost:3000/api/chat',
        version: '1.0.0'
      },
      {
        name: 'Contract Generation',
        endpoint: 'http://localhost:3000/api/generate',
        version: '1.0.0'
      },
      {
        name: 'Security Audit',
        endpoint: 'http://localhost:3000/api/audit', 
        version: '1.0.0'
      }
    ],
    
    // Trust configuration
    supportedTrust: ['feedback', 'inference-validation'],
    
    // Payment configuration
    payments: {
      protocol: 'Q402 (EIP-7702)',
      networks: ['bsc-testnet', 'bsc-mainnet'],
      tokens: ['USDT'],
      pricing: {
        contract_generation: '1 USDT',
        security_audit: '0.5 USDT',
        chat: '0.1 USDT'
      }
    },
    
    // Agent wallet
    address: agentAddress,
    
    // Metadata
    version: '1.0.0',
    created: new Date().toISOString()
  };
}

/**
 * Upload metadata to IPFS via Pinata
 */
async function uploadToIPFS(metadata) {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;
  
  if (!pinataApiKey || !pinataSecretKey) {
    console.log('⚠️  Pinata API keys not configured. Using local metadata URL.');
    console.log('   Set PINATA_API_KEY and PINATA_SECRET_KEY in .env for IPFS upload.');
    return null;
  }
  
  console.log('📤 Uploading metadata to IPFS via Pinata...');
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretKey
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: 'chimera-agent-metadata.json'
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata upload failed: ${error}`);
  }
  
  const result = await response.json();
  console.log('✅ Uploaded to IPFS:', result.IpfsHash);
  
  return result.IpfsHash;
}

/**
 * Register agent on ERC-8004 registry
 */
async function registerAgent() {
  console.log('\n🚀 ERC-8004 Identity Registration\n');
  console.log('═'.repeat(50));
  
  // Get configuration
  const privateKey = process.env.FACILITATOR_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('FACILITATOR_PRIVATE_KEY not set in .env');
  }
  
  console.log(`📍 Network: ${REGISTRY.name} (Chain ID: ${NETWORK_ID})`);
  console.log(`📋 Registry: ${REGISTRY.identity}`);
  console.log(`🔗 Explorer: ${REGISTRY.explorer}`);
  
  // Create account
  const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
  console.log(`💼 Agent Wallet: ${account.address}`);
  
  // Create clients
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(REGISTRY.rpcUrl)
  });
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(REGISTRY.rpcUrl)
  });
  
  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  const balanceInETH = Number(balance) / 1e18;
  console.log(`💰 Balance: ${balanceInETH.toFixed(6)} ETH`);
  
  if (balanceInETH < 0.0001) {
    console.log('\n⚠️  Low balance! You need Base Sepolia ETH for gas.');
    console.log('   Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia');
    console.log('   Or: https://faucets.chain.link/base-sepolia');
    
    if (balanceInETH === 0) {
      throw new Error('No ETH balance. Please fund your wallet first.');
    }
  }
  
  // Check if already registered
  console.log('\n🔍 Checking existing registration...');
  try {
    const existingBalance = await publicClient.readContract({
      address: REGISTRY.identity,
      abi: IDENTITY_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    });
    
    if (existingBalance > 0n) {
      console.log('✅ Agent already registered!');
      console.log(`   Token count: ${existingBalance}`);
      return {
        alreadyRegistered: true,
        address: account.address,
        tokenCount: Number(existingBalance),
        network: REGISTRY.name,
        chainId: NETWORK_ID
      };
    }
  } catch (e) {
    console.log('   No existing registration found (or error checking)');
  }
  
  // Generate metadata
  console.log('\n📝 Generating agent metadata...');
  const metadata = generateMetadata(account.address);
  
  // Upload to IPFS or use local URL
  let tokenUri;
  const ipfsHash = await uploadToIPFS(metadata);
  
  if (ipfsHash) {
    tokenUri = `ipfs://${ipfsHash}`;
  } else {
    // Fallback to local metadata endpoint
    tokenUri = `http://localhost:3000/.well-known/agent-metadata.json`;
  }
  
  console.log(`📎 Token URI: ${tokenUri}`);
  
  // Register on-chain
  console.log('\n⛓️  Registering on-chain...');
  console.log('   This may take a moment...');
  
  const hash = await walletClient.writeContract({
    address: REGISTRY.identity,
    abi: IDENTITY_ABI,
    functionName: 'register',
    args: [tokenUri]
  });
  
  console.log(`📤 Transaction sent: ${hash}`);
  console.log(`   View on Explorer: ${REGISTRY.explorer}/tx/${hash}`);
  
  // Wait for confirmation
  console.log('\n⏳ Waiting for confirmation...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
  
  // Parse Registered event to get agent ID
  let agentId = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() === REGISTRY.identity.toLowerCase()) {
      // Look for Transfer event (ERC-721 standard)
      // topic[0] = Transfer event signature
      // topic[3] = tokenId
      if (log.topics.length >= 4) {
        agentId = BigInt(log.topics[3]).toString();
        break;
      }
    }
  }
  
  // Results
  console.log('\n' + '═'.repeat(50));
  console.log('🎉 REGISTRATION SUCCESSFUL!');
  console.log('═'.repeat(50));
  console.log(`\n📋 Agent ID: ${agentId || 'Check Explorer'}`);
  console.log(`💼 Wallet: ${account.address}`);
  console.log(`📎 Metadata: ${tokenUri}`);
  console.log(`🔗 Transaction: ${REGISTRY.explorer}/tx/${hash}`);
  if (agentId) {
    console.log(`🏷️  NFT: ${REGISTRY.explorer}/token/${REGISTRY.identity}?a=${agentId}`);
  }
  console.log(`\n📌 Registry Address: ${REGISTRY.identity}`);
  console.log(`🌐 Network: ${REGISTRY.name} (Chain ID: ${NETWORK_ID})`);
  
  // Save to file for reference
  const result = {
    success: true,
    agentId,
    transactionHash: hash,
    blockNumber: Number(receipt.blockNumber),
    tokenUri,
    address: account.address,
    registryAddress: REGISTRY.identity,
    chainId: NETWORK_ID,
    network: REGISTRY.name,
    timestamp: new Date().toISOString(),
    ipfsHash: ipfsHash || null,
    explorerTx: `${REGISTRY.explorer}/tx/${hash}`,
    explorerNft: agentId ? `${REGISTRY.explorer}/token/${REGISTRY.identity}?a=${agentId}` : null
  };
  
  fs.writeFileSync(
    join(__dirname, '../identity-registration.json'),
    JSON.stringify(result, null, 2)
  );
  
  console.log('\n💾 Results saved to identity-registration.json');
  
  // Update .env suggestion
  console.log(`\n📝 Add to your .env file:`);
  console.log(`   AGENT_ID=${agentId || 'CHECK_EXPLORER'}`);
  console.log(`   ERC8004_CHAIN_ID=${NETWORK_ID}`);
  if (ipfsHash) {
    console.log(`   AGENT_IPFS_HASH=${ipfsHash}`);
  }
  
  return result;
}

// Run registration
registerAgent()
  .then(result => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Registration failed:', error.message);
    console.error('\n💡 Tips:');
    console.error('   1. Make sure you have Base Sepolia ETH');
    console.error('   2. Get testnet ETH: https://www.alchemy.com/faucets/base-sepolia');
    console.error('   3. Check the contract address is correct');
    process.exit(1);
  });
