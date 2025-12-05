/**
 * API Client Service
 * Handles all backend API communication
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Get agent information
 */
export async function getAgentInfo() {
  const response = await fetch(`${API_URL}/agent`);
  if (!response.ok) throw new Error('Failed to fetch agent info');
  return response.json();
}

/**
 * Get blockchain status
 */
export async function getBlockchainStatus() {
  const response = await fetch(`${API_URL}/api/blockchain`);
  if (!response.ok) throw new Error('Failed to fetch blockchain status');
  return response.json();
}

/**
 * Get wallet balance
 * @param {string} address - Wallet address
 */
export async function getBalance(address) {
  const response = await fetch(`${API_URL}/api/balance/${address}`);
  if (!response.ok) throw new Error('Failed to fetch balance');
  return response.json();
}

/**
 * Send chat message (non-streaming)
 * @param {string} message - User message
 * @param {Array} history - Chat history
 */
export async function sendChatMessage(message, history = []) {
  const response = await fetch(`${API_URL}/api/chat/blob`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
  });
  
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
}

/**
 * Create streaming chat connection
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @returns {EventSource} SSE connection
 */
export function createChatStream(message, history = []) {
  // Note: EventSource doesn't support POST, so we'll use fetch with streaming
  return fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
  });
}

/**
 * Generate smart contract
 * @param {string} prompt - Generation prompt
 * @param {string} paymentHeader - Optional x402 payment header
 */
export async function generateContract(prompt, paymentHeader = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (paymentHeader) {
    headers['x-payment'] = paymentHeader;
  }
  
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt }),
  });
  
  // Return the response for streaming handling
  return response;
}

/**
 * Audit smart contract
 * @param {string} code - Solidity code
 * @param {string} paymentHeader - Optional x402 payment header
 */
export async function auditContract(code, paymentHeader = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (paymentHeader) {
    headers['x-payment'] = paymentHeader;
  }
  
  const response = await fetch(`${API_URL}/api/audit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code }),
  });
  
  if (!response.ok) {
    if (response.status === 402) {
      // Payment required
      const paymentInfo = await response.json();
      throw { requiresPayment: true, paymentInfo };
    }
    throw new Error('Failed to audit contract');
  }
  
  return response.json();
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

// =====================================================
// CHIM Credits API
// =====================================================

/**
 * Get CHIM credit pricing and packages
 */
export async function getCreditPricing() {
  const response = await fetch(`${API_URL}/api/credits/pricing`);
  if (!response.ok) throw new Error('Failed to fetch pricing');
  return response.json();
}

/**
 * Get user's CHIM balance
 * @param {string} address - Wallet address
 */
export async function getCreditBalance(address) {
  const response = await fetch(`${API_URL}/api/credits/balance/${address}`);
  if (!response.ok) throw new Error('Failed to fetch credit balance');
  return response.json();
}

/**
 * Check if user has enough credits for a service
 * @param {string} address - Wallet address
 * @param {string} service - Service name (generate, audit, swap, transfer, analyze)
 */
export async function checkCredits(address, service) {
  const response = await fetch(`${API_URL}/api/credits/check/${address}/${service}`);
  if (!response.ok) throw new Error('Failed to check credits');
  return response.json();
}

/**
 * Buy credits with USDC payment
 * @param {string} userAddress - User's wallet address
 * @param {string} packageId - Package ID (starter, builder, pro)
 * @param {string} paymentHeader - x402 payment header (optional in demo mode)
 */
export async function buyCredits(userAddress, packageId, paymentHeader = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Demo-Skip': 'true' // Demo mode
  };
  
  if (paymentHeader) {
    headers['x-payment'] = paymentHeader;
  }
  
  const response = await fetch(`${API_URL}/api/credits/buy`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userAddress, packageId })
  });
  
  if (!response.ok) {
    if (response.status === 402) {
      const paymentInfo = await response.json();
      throw { requiresPayment: true, paymentInfo };
    }
    throw new Error('Failed to purchase credits');
  }
  
  return response.json();
}

/**
 * Spend credits for a service
 * @param {string} userAddress - User's wallet address
 * @param {string} service - Service name
 * @param {Object} permitSignature - Optional permit signature for gasless spending
 */
export async function spendCredits(userAddress, service, permitSignature = null) {
  const response = await fetch(`${API_URL}/api/credits/spend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userAddress, service, permitSignature })
  });
  
  if (!response.ok) {
    if (response.status === 402) {
      const insufficientInfo = await response.json();
      throw { insufficientCredits: true, ...insufficientInfo };
    }
    throw new Error('Failed to spend credits');
  }
  
  return response.json();
}

/**
 * Award bonus credits (demo mode)
 * @param {string} userAddress - User's wallet address
 * @param {string} amount - Amount of CHIM to award
 * @param {string} reason - Reason for award
 */
export async function awardCredits(userAddress, amount, reason = 'demo_bonus') {
  const response = await fetch(`${API_URL}/api/credits/award`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userAddress, amount, reason })
  });
  
  if (!response.ok) throw new Error('Failed to award credits');
  return response.json();
}

// =====================================================
// CHIM-Protected Services (v2 API)
// =====================================================

/**
 * Generate contract using CHIM credits
 * @param {string} prompt - Generation prompt
 * @param {string} userAddress - User's wallet address (for credit payment)
 */
export async function generateContractV2(prompt, userAddress) {
  const response = await fetch(`${API_URL}/api/v2/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, userAddress })
  });
  
  return response;
}

/**
 * Audit contract using CHIM credits
 * @param {string} code - Solidity code
 * @param {string} userAddress - User's wallet address (for credit payment)
 */
export async function auditContractV2(code, userAddress) {
  const response = await fetch(`${API_URL}/api/v2/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, userAddress })
  });
  
  if (!response.ok) {
    if (response.status === 402) {
      const paymentInfo = await response.json();
      throw { requiresCredits: true, paymentInfo };
    }
    throw new Error('Failed to audit contract');
  }
  
  return response.json();
}

/**
 * Execute swap using CHIM credits
 * @param {Object} swapParams - Swap parameters
 * @param {string} userAddress - User's wallet address (for credit payment)
 */
export async function executeSwapV2(swapParams, userAddress) {
  const response = await fetch(`${API_URL}/api/v2/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...swapParams, userAddress })
  });
  
  if (!response.ok) {
    if (response.status === 402) {
      const paymentInfo = await response.json();
      throw { requiresCredits: true, paymentInfo };
    }
    throw new Error('Failed to execute swap');
  }
  
  return response.json();
}

/**
 * Transfer tokens using CHIM credits (gas sponsored)
 * @param {Object} transferParams - Transfer parameters
 * @param {string} userAddress - User's wallet address (for credit payment)
 */
export async function transferV2(transferParams, userAddress) {
  const response = await fetch(`${API_URL}/api/v2/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...transferParams, userAddress })
  });
  
  if (!response.ok) {
    if (response.status === 402) {
      const paymentInfo = await response.json();
      throw { requiresCredits: true, paymentInfo };
    }
    throw new Error('Failed to transfer');
  }
  
  return response.json();
}

