BNB Chain Testnet Resources (PRIORITY 3)
A. BSC Testnet Configuration
❓ RPC Endpoints:

Primary: https://data-seed-prebsc-1-s1.binance.org:8545

Backup (Redundancy):

https://bsc-testnet.publicnode.com

https://bsc-testnet.drpc.org

https://data-seed-prebsc-2-s1.binance.org:8545

WebSocket Endpoints (Real-time):

wss://bsc-testnet.publicnode.com

wss://bsc-testnet.drpc.org

B. Test Tokens
❓ Faucet Links:

BNB (Gas): BNB Chain Official Faucet https://www.bnbchain.org/en/testnet-faucet

Alternative: QuickNode BNB Faucet https://faucet.quicknode.com/binance-smart-chain/bnb-testnet

❓ Token Contract Addresses (Testnet):

USDT (Binance-Pegged): 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd (Commonly used in x402/b402 implementations)

USDC (Binance-Pegged): 0x6454813231ebac20998e3b9264f8d3885d53d9e8

C. Contract Addresses
❓ Core Contracts on BSC Testnet:

ERC-8004 Identity Registry: 0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD

(Note: This is the BNB Attestation Service (BAS) contract, which is the native implementation of ERC-8004 on BSC.)

ERC-8004 Reputation Registry: 0xeced1af52a0446275e9e6e4f6f26c99977400a6a

(Note: This is from the ChaosChain deployment, which separates the registries. If using BAS, reputation is handled via attestations on the main BAS contract.)

Q402 Implementation Contract:

Action Required: Since Q402 refers to your specific codebase (q402-snapshot/), you must deploy this yourself.

Reference Facilitator (x402/b402): 0xd67eF16fa445101Ef1e1c6A9FB9F3014f1d60DE6

(Use this address if your Q402 code needs to interact with an existing x402 Payment Facilitator/Relayer on BSC Testnet.)