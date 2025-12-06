/**
 * Wallet Activity Store
 * Tracks all actions performed by each wallet address
 * Persists to localStorage for session continuity
 */

const STORAGE_KEY = 'chimera_wallet_activity';

// Activity types
export const ACTIVITY_TYPES = {
  FAUCET_CLAIM: 'faucet_claim',
  CREDITS_PURCHASE: 'credits_purchase',
  CONTRACT_DEPLOY: 'contract_deploy',
  CONTRACT_AUDIT: 'contract_audit',
  CONTRACT_ANALYZE: 'contract_analyze',
  TOKEN_SWAP: 'token_swap',
  TOKEN_TRANSFER: 'token_transfer',
  CHAT_MESSAGE: 'chat_message',
  WALLET_CONNECT: 'wallet_connect',
  WALLET_DISCONNECT: 'wallet_disconnect'
};

// Activity labels and icons
export const ACTIVITY_CONFIG = {
  [ACTIVITY_TYPES.FAUCET_CLAIM]: { 
    label: 'Test Funds Claimed', 
    icon: '🎁', 
    color: '#8b5cf6' 
  },
  [ACTIVITY_TYPES.CREDITS_PURCHASE]: { 
    label: 'Credits Purchased', 
    icon: '🪙', 
    color: '#fbbf24' 
  },
  [ACTIVITY_TYPES.CONTRACT_DEPLOY]: { 
    label: 'Contract Deployed', 
    icon: '🚀', 
    color: '#10b981' 
  },
  [ACTIVITY_TYPES.CONTRACT_AUDIT]: { 
    label: 'Contract Audited', 
    icon: '🛡️', 
    color: '#f59e0b' 
  },
  [ACTIVITY_TYPES.CONTRACT_ANALYZE]: { 
    label: 'Contract Analyzed', 
    icon: '🔍', 
    color: '#06b6d4' 
  },
  [ACTIVITY_TYPES.TOKEN_SWAP]: { 
    label: 'Token Swap', 
    icon: '🔄', 
    color: '#8b5cf6' 
  },
  [ACTIVITY_TYPES.TOKEN_TRANSFER]: { 
    label: 'Token Transfer', 
    icon: '💸', 
    color: '#ec4899' 
  },
  [ACTIVITY_TYPES.CHAT_MESSAGE]: { 
    label: 'Chat Message', 
    icon: '💬', 
    color: '#3b82f6' 
  },
  [ACTIVITY_TYPES.WALLET_CONNECT]: { 
    label: 'Wallet Connected', 
    icon: '🔗', 
    color: '#4ade80' 
  },
  [ACTIVITY_TYPES.WALLET_DISCONNECT]: { 
    label: 'Wallet Disconnected', 
    icon: '🔌', 
    color: '#ef4444' 
  }
};

/**
 * Get all activity from localStorage
 */
export function getAllActivity() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Failed to load wallet activity:', e);
    return {};
  }
}

/**
 * Get activity for a specific wallet address
 */
export function getWalletActivity(address) {
  if (!address) return [];
  const all = getAllActivity();
  return all[address.toLowerCase()] || [];
}

/**
 * Log a new activity for a wallet
 */
export function logActivity(address, type, data = {}) {
  if (!address) return;
  
  const normalizedAddress = address.toLowerCase();
  const all = getAllActivity();
  
  if (!all[normalizedAddress]) {
    all[normalizedAddress] = [];
  }
  
  const activity = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  // Add to beginning (most recent first)
  all[normalizedAddress].unshift(activity);
  
  // Keep only last 100 activities per wallet
  if (all[normalizedAddress].length > 100) {
    all[normalizedAddress] = all[normalizedAddress].slice(0, 100);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save wallet activity:', e);
  }
  
  return activity;
}

/**
 * Clear activity for a specific wallet
 */
export function clearWalletActivity(address) {
  if (!address) return;
  
  const all = getAllActivity();
  delete all[address.toLowerCase()];
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to clear wallet activity:', e);
  }
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get explorer URL for a transaction or contract
 */
export function getExplorerUrl(hash, type = 'tx') {
  const baseUrl = 'https://testnet.bscscan.com';
  return `${baseUrl}/${type}/${hash}`;
}

export default {
  ACTIVITY_TYPES,
  ACTIVITY_CONFIG,
  getAllActivity,
  getWalletActivity,
  logActivity,
  clearWalletActivity,
  formatTimestamp,
  getExplorerUrl
};

