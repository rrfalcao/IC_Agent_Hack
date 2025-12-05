/**
 * CHIM Credits Service
 * Manages the Chimera Credit (CHIM) token economy
 * 
 * Features:
 * - Check user credit balances
 * - Distribute credits after USDC payment (x402)
 * - Spend credits for services (with permit signatures for gasless)
 * - Track credit transactions
 */

import { ethers } from 'ethers';
import config from '../config/index.js';

// CHIM Token ABI (minimal interface for our needs)
const CHIM_ABI = [
  // ERC20 Standard
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  
  // ERC20Permit
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
  
  // ChimeraCredit specific
  'function distributeCredits(address to, uint256 amount)',
  'function spendCreditsWithPermit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s, string service)',
  'function spendCredits(address from, uint256 amount, string service)',
  'function hasEnoughCredits(address user, uint256 servicePrice) view returns (bool)',
  'function getServicePrice(string service) view returns (uint256)',
  'function calculateChimForUsdc(uint256 usdcAmount) view returns (uint256)',
  'function batchDistribute(address[] recipients, uint256[] amounts)',
  
  // Constants
  'function PRICE_GENERATE() view returns (uint256)',
  'function PRICE_AUDIT() view returns (uint256)',
  'function PRICE_ANALYZE() view returns (uint256)',
  'function PRICE_SWAP() view returns (uint256)',
  'function PRICE_TRANSFER() view returns (uint256)',
  'function EXCHANGE_RATE() view returns (uint256)',
  
  // Events
  'event CreditsPurchased(address indexed buyer, uint256 usdcAmount, uint256 chimAmount)',
  'event CreditsSpent(address indexed user, uint256 amount, string service)',
  'event CreditsDistributed(address indexed to, uint256 amount, string reason)'
];

// Service pricing in CHIM tokens (matching contract constants)
// Note: wei values are stored as BigInt internally
const CHIM_PRICING_INTERNAL = {
  generate: {
    amount: '10',
    display: '10 CHIM',
    description: 'Smart Contract Generation',
    wei: ethers.parseEther('10')
  },
  audit: {
    amount: '5',
    display: '5 CHIM',
    description: 'Security Audit',
    wei: ethers.parseEther('5')
  },
  analyze: {
    amount: '3',
    display: '3 CHIM',
    description: 'Contract Analysis',
    wei: ethers.parseEther('3')
  },
  swap: {
    amount: '2',
    display: '2 CHIM',
    description: 'Token Swap Execution',
    wei: ethers.parseEther('2')
  },
  transfer: {
    amount: '1',
    display: '1 CHIM',
    description: 'Gas-Sponsored Transfer',
    wei: ethers.parseEther('1')
  },
  chat: {
    amount: '0.1',
    display: '0.1 CHIM',
    description: 'AI Chat Response',
    wei: ethers.parseEther('0.1')
  }
};

// Export pricing with wei as strings for JSON serialization
export const CHIM_PRICING = Object.fromEntries(
  Object.entries(CHIM_PRICING_INTERNAL).map(([key, value]) => [
    key,
    { ...value, wei: value.wei.toString() }
  ])
);

// Helper to get wei as BigInt for internal use
export function getServiceWei(service) {
  return CHIM_PRICING_INTERNAL[service]?.wei || ethers.parseEther('1');
}

// Exchange rate: 1 USDC = 10 CHIM
export const USDC_TO_CHIM_RATE = 10;

class CreditsService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.chainId = config.blockchain?.chainId || 97;
    this.contractAddress = config.chim?.contractAddress || null;
    
    // In-memory tracking for demo mode
    this.demoBalances = new Map();
    // Demo mode can be forced via config even if contract exists
    this.demoMode = config.chim?.demoMode !== false ? true : !this.contractAddress;
    
    this.init();
  }
  
  async init() {
    try {
      // Setup provider
      this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
      
      // Setup wallet if private key available
      if (config.blockchain.facilitatorPrivateKey) {
        this.wallet = new ethers.Wallet(
          config.blockchain.facilitatorPrivateKey,
          this.provider
        );
      }
      
      // Setup contract if deployed and NOT in demo mode
      if (this.contractAddress && this.wallet && !this.demoMode) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          CHIM_ABI,
          this.wallet
        );
        console.log('[Credits] Connected to CHIM contract:', this.contractAddress);
      } else if (this.demoMode) {
        console.log('[Credits] Running in demo mode (CHIM_DEMO_MODE=true)');
      } else {
        console.log('[Credits] Running in demo mode (no contract deployed)');
      }
      
      console.log('[Credits] Service initialized:', {
        chainId: this.chainId,
        demoMode: this.demoMode,
        contractAddress: this.contractAddress || 'not deployed'
      });
    } catch (error) {
      console.error('[Credits] Initialization error:', error);
    }
  }
  
  /**
   * Get user's CHIM balance
   * @param {string} userAddress - User's wallet address
   * @returns {Object} Balance info
   */
  async getBalance(userAddress) {
    if (!userAddress) {
      throw new Error('User address required');
    }
    
    if (this.demoMode) {
      const balance = this.demoBalances.get(userAddress.toLowerCase()) || 0;
      return {
        balance: balance.toString(),
        formatted: ethers.formatEther(balance.toString()),
        symbol: 'CHIM',
        demoMode: true
      };
    }
    
    try {
      const balance = await this.contract.balanceOf(userAddress);
      return {
        balance: balance.toString(),
        formatted: ethers.formatEther(balance),
        symbol: 'CHIM',
        demoMode: false
      };
    } catch (error) {
      console.error('[Credits] Balance check error:', error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }
  
  /**
   * Check if user has enough credits for a service
   * @param {string} userAddress - User's wallet address
   * @param {string} service - Service name
   * @returns {Object} Credit check result
   */
  async checkCredits(userAddress, service) {
    const pricing = CHIM_PRICING[service];
    if (!pricing) {
      throw new Error(`Unknown service: ${service}`);
    }
    
    const balance = await this.getBalance(userAddress);
    const balanceWei = BigInt(balance.balance);
    const requiredWei = getServiceWei(service);
    const hasEnough = balanceWei >= requiredWei;
    
    return {
      hasEnough,
      balance: balance.formatted,
      required: pricing.amount,
      service,
      description: pricing.description,
      shortfall: hasEnough ? '0' : ethers.formatEther(requiredWei - balanceWei)
    };
  }
  
  /**
   * Calculate CHIM amount for USDC payment
   * @param {string} usdcAmount - USDC amount (in normal units, e.g., "5" for 5 USDC)
   * @returns {Object} Conversion details
   */
  calculateCreditsForUsdc(usdcAmount) {
    const usdcValue = parseFloat(usdcAmount);
    const chimAmount = usdcValue * USDC_TO_CHIM_RATE;
    
    return {
      usdcAmount: usdcValue.toString(),
      chimAmount: chimAmount.toString(),
      chimWei: ethers.parseEther(chimAmount.toString()).toString(),
      rate: `1 USDC = ${USDC_TO_CHIM_RATE} CHIM`
    };
  }
  
  /**
   * Distribute credits to user after USDC payment (x402)
   * @param {string} userAddress - Recipient address
   * @param {string} chimAmount - Amount of CHIM to distribute
   * @param {string} usdcPaid - USDC amount paid (for logging)
   * @returns {Object} Distribution result
   */
  async distributeCredits(userAddress, chimAmount, usdcPaid = '0') {
    if (!userAddress) {
      throw new Error('User address required');
    }
    
    // Convert to string if it's a number
    const amountStr = String(chimAmount);
    const amountWei = ethers.parseEther(amountStr);
    
    if (this.demoMode) {
      // Demo mode: track in memory
      const currentBalance = this.demoBalances.get(userAddress.toLowerCase()) || BigInt(0);
      const newBalance = currentBalance + amountWei;
      this.demoBalances.set(userAddress.toLowerCase(), newBalance);
      
      console.log('[Credits] Demo distribution:', {
        to: userAddress,
        amount: chimAmount,
        newBalance: ethers.formatEther(newBalance)
      });
      
      return {
        success: true,
        demoMode: true,
        to: userAddress,
        amount: chimAmount,
        usdcPaid,
        newBalance: ethers.formatEther(newBalance)
      };
    }
    
    try {
      // Call contract to mint tokens
      const tx = await this.contract.distributeCredits(userAddress, amountWei);
      const receipt = await tx.wait();
      
      console.log('[Credits] Distribution successful:', {
        to: userAddress,
        amount: chimAmount,
        txHash: receipt.hash
      });
      
      return {
        success: true,
        demoMode: false,
        to: userAddress,
        amount: chimAmount,
        usdcPaid,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('[Credits] Distribution error:', error);
      throw new Error(`Failed to distribute credits: ${error.message}`);
    }
  }
  
  /**
   * Spend credits for a service
   * @param {string} userAddress - User's address
   * @param {string} service - Service name
   * @param {Object} permitSignature - Optional permit signature for gasless spending
   * @returns {Object} Spend result
   */
  async spendCredits(userAddress, service, permitSignature = null) {
    if (!userAddress) {
      throw new Error('User address required');
    }
    
    const pricing = CHIM_PRICING[service];
    if (!pricing) {
      throw new Error(`Unknown service: ${service}`);
    }
    
    // Check balance first
    const creditCheck = await this.checkCredits(userAddress, service);
    if (!creditCheck.hasEnough) {
      return {
        success: false,
        error: 'Insufficient credits',
        balance: creditCheck.balance,
        required: creditCheck.required,
        shortfall: creditCheck.shortfall,
        buyCreditsUrl: '/api/credits/buy'
      };
    }
    
    const serviceWei = getServiceWei(service);
    
    if (this.demoMode) {
      // Demo mode: deduct from memory
      const currentBalance = this.demoBalances.get(userAddress.toLowerCase()) || BigInt(0);
      const newBalance = currentBalance - serviceWei;
      this.demoBalances.set(userAddress.toLowerCase(), newBalance);
      
      console.log('[Credits] Demo spend:', {
        user: userAddress,
        service,
        amount: pricing.amount,
        newBalance: ethers.formatEther(newBalance)
      });
      
      return {
        success: true,
        demoMode: true,
        user: userAddress,
        service,
        amount: pricing.amount,
        newBalance: ethers.formatEther(newBalance)
      };
    }
    
    try {
      let tx;
      
      if (permitSignature) {
        // Gasless spend using permit signature
        const { deadline, v, r, s } = permitSignature;
        tx = await this.contract.spendCreditsWithPermit(
          userAddress,
          this.wallet.address,
          serviceWei,
          deadline,
          v,
          r,
          s,
          service
        );
      } else {
        // Direct spend (requires prior approval)
        tx = await this.contract.spendCredits(userAddress, serviceWei, service);
      }
      
      const receipt = await tx.wait();
      
      console.log('[Credits] Spend successful:', {
        user: userAddress,
        service,
        amount: pricing.amount,
        txHash: receipt.hash
      });
      
      return {
        success: true,
        demoMode: false,
        user: userAddress,
        service,
        amount: pricing.amount,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('[Credits] Spend error:', error);
      throw new Error(`Failed to spend credits: ${error.message}`);
    }
  }
  
  /**
   * Generate EIP-712 typed data for permit signature
   * @param {string} userAddress - Token owner
   * @param {string} service - Service being paid for
   * @param {number} deadline - Signature deadline (Unix timestamp)
   * @returns {Object} Typed data for signing
   */
  async generatePermitTypedData(userAddress, service, deadline = null) {
    const pricing = CHIM_PRICING[service];
    if (!pricing) {
      throw new Error(`Unknown service: ${service}`);
    }
    
    const deadlineTimestamp = deadline || Math.floor(Date.now() / 1000) + 3600; // 1 hour
    
    let nonce = 0;
    if (!this.demoMode && this.contract) {
      nonce = await this.contract.nonces(userAddress);
    }
    
    const spenderAddress = this.wallet?.address || config.blockchain.facilitatorAddress;
    
    // EIP-2612 Permit typed data
    const domain = {
      name: 'Chimera Agent Credit',
      version: '1',
      chainId: this.chainId,
      verifyingContract: this.contractAddress || '0x0000000000000000000000000000000000000000'
    };
    
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };
    
    const message = {
      owner: userAddress,
      spender: spenderAddress,
      value: pricing.wei.toString(),
      nonce: nonce.toString(),
      deadline: deadlineTimestamp.toString()
    };
    
    return {
      domain,
      types,
      primaryType: 'Permit',
      message,
      service,
      pricing: {
        amount: pricing.amount,
        description: pricing.description
      }
    };
  }
  
  /**
   * Get all service pricing
   * @returns {Object} All pricing info
   */
  getAllPricing() {
    return {
      pricing: CHIM_PRICING,
      exchangeRate: {
        rate: USDC_TO_CHIM_RATE,
        description: `1 USDC = ${USDC_TO_CHIM_RATE} CHIM`
      },
      token: {
        symbol: 'CHIM',
        name: 'Chimera Agent Credit',
        decimals: 18,
        address: this.contractAddress || 'not deployed'
      },
      demoMode: this.demoMode
    };
  }
  
  /**
   * Get credit packages available for purchase
   * @returns {Array} Available packages
   */
  getCreditPackages() {
    return [
      {
        id: 'starter',
        name: 'Starter Pack',
        usdcPrice: '5',
        chimAmount: '50',
        description: 'Perfect for trying out the platform',
        services: '~5 contract generations or ~10 audits'
      },
      {
        id: 'builder',
        name: 'Builder Pack',
        usdcPrice: '20',
        chimAmount: '200',
        description: 'For active developers',
        services: '~20 contract generations or ~40 audits',
        popular: true
      },
      {
        id: 'pro',
        name: 'Pro Pack',
        usdcPrice: '50',
        chimAmount: '500',
        description: 'Best value for power users',
        services: '~50 contract generations or ~100 audits',
        bonus: '10% extra credits'
      }
    ];
  }
  
  /**
   * Award bonus credits (for promotions, referrals, etc.)
   * @param {string} userAddress - User address
   * @param {string} amount - CHIM amount
   * @param {string} reason - Reason for bonus
   */
  async awardBonus(userAddress, amount, reason = 'bonus') {
    return this.distributeCredits(userAddress, amount, '0');
  }
}

// Create singleton instance
export const creditsService = new CreditsService();

