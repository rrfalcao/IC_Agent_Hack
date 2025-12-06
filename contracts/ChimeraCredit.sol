// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChimeraCredit
 * @dev Fungible service token for the Chimera AI Agent platform
 * 
 * Features:
 * - ERC20Permit: Gasless approvals via signatures (EIP-2612)
 * - ERC20Burnable: Tokens burned when services are consumed
 * - Agent-controlled minting when users purchase with USDC via x402
 * 
 * Token Economics:
 * - 1 CHIM = 1 Credit for AI services
 * - Users buy CHIM with USDC (x402 payment)
 * - Services consume (burn) CHIM tokens
 * - Agent builds treasury from USDC payments
 */
contract ChimeraCredit is ERC20, ERC20Permit, ERC20Burnable, Ownable {
    
    // Service pricing in CHIM tokens (1 CHIM = 1 credit)
    uint256 public constant PRICE_GENERATE = 10 * 10**18;  // 10 CHIM for contract generation
    uint256 public constant PRICE_AUDIT = 5 * 10**18;      // 5 CHIM for security audit
    uint256 public constant PRICE_ANALYZE = 3 * 10**18;    // 3 CHIM for contract analysis
    uint256 public constant PRICE_SWAP = 2 * 10**18;       // 2 CHIM for swap execution
    uint256 public constant PRICE_TRANSFER = 1 * 10**18;   // 1 CHIM for gas-sponsored transfer
    
    // Exchange rate: USDC to CHIM (6 decimals for USDC, 18 for CHIM)
    // 1 USDC = 10 CHIM
    uint256 public constant EXCHANGE_RATE = 10;
    
    // Events
    event CreditsPurchased(address indexed buyer, uint256 usdcAmount, uint256 chimAmount);
    event CreditsSpent(address indexed user, uint256 amount, string service);
    event CreditsDistributed(address indexed to, uint256 amount, string reason);
    
    constructor() 
        ERC20("Chimera Agent Credit", "CHIM") 
        ERC20Permit("Chimera Agent Credit") 
        Ownable(msg.sender) 
    {
        // Mint initial supply to the Agent's Wallet for bootstrap liquidity
        // 1 million CHIM for initial distribution/testing
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    /**
     * @dev Distribute credits to a user (called by Agent after x402 USDC payment)
     * This acts as the "vending machine" - user pays USDC, receives CHIM
     * 
     * @param to Recipient address
     * @param amount Number of CHIM tokens to distribute
     */
    function distributeCredits(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit CreditsDistributed(to, amount, "x402_purchase");
    }
    
    /**
     * @dev Calculate CHIM amount for a given USDC amount
     * @param usdcAmount Amount of USDC (6 decimals)
     * @return chimAmount Amount of CHIM tokens (18 decimals)
     */
    function calculateChimForUsdc(uint256 usdcAmount) public pure returns (uint256) {
        // USDC has 6 decimals, CHIM has 18
        // 1 USDC (1e6) = 10 CHIM (10e18)
        return (usdcAmount * EXCHANGE_RATE * 10**12);
    }
    
    /**
     * @dev Spend credits for a service using permit (gasless for user)
     * Agent calls this with user's signature to burn tokens
     * 
     * @param owner Token owner
     * @param spender Agent address (should be this contract owner)
     * @param value Amount to spend
     * @param deadline Signature deadline
     * @param v Signature v
     * @param r Signature r
     * @param s Signature s
     * @param service Service being paid for (for event logging)
     */
    function spendCreditsWithPermit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        string calldata service
    ) public {
        // 1. Verify the user signed the permission
        permit(owner, spender, value, deadline, v, r, s);
        
        // 2. Burn the tokens to pay for the service
        burnFrom(owner, value);
        
        emit CreditsSpent(owner, value, service);
    }
    
    /**
     * @dev Direct spend credits (requires prior approval)
     * For users who already approved the agent
     * 
     * @param from User address
     * @param amount Credits to spend
     * @param service Service description
     */
    function spendCredits(address from, uint256 amount, string calldata service) public onlyOwner {
        burnFrom(from, amount);
        emit CreditsSpent(from, amount, service);
    }
    
    /**
     * @dev Check if user has enough credits for a service
     * @param user User address
     * @param servicePrice Price in CHIM
     */
    function hasEnoughCredits(address user, uint256 servicePrice) public view returns (bool) {
        return balanceOf(user) >= servicePrice;
    }
    
    /**
     * @dev Get service price
     * @param service Service name
     */
    function getServicePrice(string calldata service) public pure returns (uint256) {
        bytes32 serviceHash = keccak256(bytes(service));
        
        if (serviceHash == keccak256("generate")) return PRICE_GENERATE;
        if (serviceHash == keccak256("audit")) return PRICE_AUDIT;
        if (serviceHash == keccak256("analyze")) return PRICE_ANALYZE;
        if (serviceHash == keccak256("swap")) return PRICE_SWAP;
        if (serviceHash == keccak256("transfer")) return PRICE_TRANSFER;
        
        // Default price for unknown services
        return 1 * 10**18;
    }
    
    /**
     * @dev Batch distribute credits to multiple users
     * Useful for airdrops or promotions
     * 
     * @param recipients Array of addresses
     * @param amounts Array of amounts
     */
    function batchDistribute(address[] calldata recipients, uint256[] calldata amounts) public onlyOwner {
        require(recipients.length == amounts.length, "Length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
            emit CreditsDistributed(recipients[i], amounts[i], "batch_distribution");
        }
    }
}

