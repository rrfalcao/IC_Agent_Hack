/**
 * Deploy ChimeraCredit (CHIM) Token
 * 
 * This script deploys the CHIM ERC-20 token on Base Sepolia testnet.
 * 
 * Prerequisites:
 * 1. Solidity contract compiled (contracts/ChimeraCredit.sol)
 * 2. FACILITATOR_PRIVATE_KEY set in .env
 * 3. Sufficient ETH for deployment gas
 * 
 * Usage:
 *   node scripts/deploy-chim.js
 * 
 * Or with hardhat:
 *   npx hardhat run scripts/deploy-chim.js --network baseSepolia
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Configuration
const CONFIG = {
  // Base Sepolia (recommended for AWE compatibility)
  baseSepolia: {
    rpcUrl: 'https://sepolia.base.org',
    chainId: 84532,
    explorerUrl: 'https://sepolia.basescan.org'
  },
  // BSC Testnet (current main network)
  bscTestnet: {
    rpcUrl: process.env.BNB_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
    chainId: 97,
    explorerUrl: 'https://testnet.bscscan.com'
  }
};

// Select network (default to BSC Testnet)
const NETWORK = process.env.CHIM_NETWORK || 'bscTestnet';
const networkConfig = CONFIG[NETWORK];

// ChimeraCredit ABI (compiled from contracts/ChimeraCredit.sol)
// Note: You need to compile the contract first and paste the bytecode
const CHIM_BYTECODE = '0x'; // PASTE COMPILED BYTECODE HERE

const CHIM_ABI = [
  'constructor()',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function distributeCredits(address to, uint256 amount)',
  'function spendCredits(address from, uint256 amount, string service)',
  'function PRICE_GENERATE() view returns (uint256)',
  'function PRICE_AUDIT() view returns (uint256)',
  'function EXCHANGE_RATE() view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event CreditsDistributed(address indexed to, uint256 amount, string reason)',
  'event CreditsSpent(address indexed user, uint256 amount, string service)'
];

async function deployChim() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║               CHIM Token Deployment                       ║
║           Chimera Credit - Service Token                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

  console.log(`📡 Network: ${NETWORK}`);
  console.log(`🔗 RPC: ${networkConfig.rpcUrl}`);
  console.log(`⛓️  Chain ID: ${networkConfig.chainId}`);
  console.log('');

  // Validate private key
  const privateKey = process.env.FACILITATOR_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ FACILITATOR_PRIVATE_KEY not found in .env');
    console.log('\nSet it with: export FACILITATOR_PRIVATE_KEY=0x...');
    process.exit(1);
  }

  // Check bytecode
  if (CHIM_BYTECODE === '0x' || CHIM_BYTECODE.length < 100) {
    console.log('⚠️  No bytecode found. Using Remix for deployment instead.\n');
    console.log('📝 To deploy the CHIM contract:');
    console.log('');
    console.log('   1. Go to https://remix.ethereum.org');
    console.log('   2. Create new file: contracts/ChimeraCredit.sol');
    console.log('   3. Paste the contract from contracts/ChimeraCredit.sol');
    console.log('   4. Compile with Solidity 0.8.20+');
    console.log('   5. Deploy to Base Sepolia or BSC Testnet');
    console.log('   6. Copy the contract address');
    console.log('   7. Update .env: CHIM_CONTRACT_ADDRESS=0x...');
    console.log('');
    
    // Print contract for easy copy-paste
    try {
      const contractPath = path.join(process.cwd(), 'contracts', 'ChimeraCredit.sol');
      const contractCode = fs.readFileSync(contractPath, 'utf8');
      console.log('📋 Contract code to deploy:\n');
      console.log('─'.repeat(60));
      console.log(contractCode);
      console.log('─'.repeat(60));
    } catch (e) {
      console.log('Contract file not found at contracts/ChimeraCredit.sol');
    }
    
    return;
  }

  try {
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`📬 Deployer: ${wallet.address}`);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    const balanceFormatted = ethers.formatEther(balance);
    console.log(`💰 Balance: ${balanceFormatted} ${NETWORK === 'baseSepolia' ? 'ETH' : 'BNB'}`);
    
    if (balance === 0n) {
      console.error('\n❌ Insufficient balance for deployment');
      console.log(`Get testnet funds from a faucet for ${NETWORK}`);
      process.exit(1);
    }

    // Create contract factory
    const factory = new ethers.ContractFactory(CHIM_ABI, CHIM_BYTECODE, wallet);
    
    console.log('\n🚀 Deploying CHIM Token...');
    
    // Deploy
    const contract = await factory.deploy();
    console.log(`📝 Transaction: ${contract.deploymentTransaction().hash}`);
    
    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    
    console.log(`\n✅ CHIM Token Deployed!`);
    console.log(`📍 Address: ${address}`);
    console.log(`🔍 Explorer: ${networkConfig.explorerUrl}/address/${address}`);
    
    // Verify deployment
    console.log('\n📊 Verifying deployment...');
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    const ownerBalance = await contract.balanceOf(wallet.address);
    
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} CHIM`);
    console.log(`   Owner Balance: ${ethers.formatEther(ownerBalance)} CHIM`);
    
    // Update .env instructions
    console.log('\n📝 Next Steps:');
    console.log('─'.repeat(60));
    console.log(`1. Add to your .env file:`);
    console.log(`   CHIM_CONTRACT_ADDRESS=${address}`);
    console.log(`   CHIM_DEMO_MODE=false`);
    console.log('');
    console.log(`2. Restart the backend server`);
    console.log('');
    console.log(`3. Test the credit system:`);
    console.log(`   curl http://localhost:3000/api/credits/pricing`);
    console.log('─'.repeat(60));
    
    // Save deployment info
    const deploymentInfo = {
      network: NETWORK,
      chainId: networkConfig.chainId,
      address: address,
      deployer: wallet.address,
      txHash: contract.deploymentTransaction().hash,
      timestamp: new Date().toISOString(),
      explorerUrl: `${networkConfig.explorerUrl}/address/${address}`
    };
    
    fs.writeFileSync(
      'chim-deployment.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log('\n💾 Deployment info saved to chim-deployment.json');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployChim().catch(console.error);

