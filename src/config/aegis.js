// src/config/aegis.js
import { configure } from 'aegis-sdk-js';

/**
 * Initialize Avoro SDK with auto-instrumentation
 * IMPORTANT: Must be called BEFORE any HTTP requests or routes are defined
 */
export function initializeAegis() {
  // Validate environment variables
  if (!process.env.AEGIS_API_KEY) {
    console.warn('⚠️  [AEGIS] AEGIS_API_KEY not set - tracing disabled');
    return;
  }

  console.log('[AEGIS] Initializing auto-instrumentation...');

  configure({
    // ========================================
    // BASIC CONFIGURATION
    // ========================================
    apiKey: process.env.AEGIS_API_KEY,
    ingestUrl: process.env.AEGIS_INGEST_URL || 'http://localhost:8000/v1/ingest',
    agentId: 'chimera-bnb-agent',
    
    // ========================================
    // AUTO-INSTRUMENTATION CONFIGURATION
    // ========================================
    autoInstrument: {
      enabled: true,  // Master switch - enables all auto-instrumentation
      
      // --------------------------------------
      // 1. FETCH INTERCEPTION
      // --------------------------------------
      // This patches globalThis.fetch to trace ALL HTTP requests
      fetch: {
        captureRequestBody: true,    // Capture request payloads (prompts, etc.)
        captureResponseBody: true,   // Capture API responses
        captureHeaders: false,       // Skip headers (may contain auth tokens)
        
        // URLs to ignore (reduce noise)
        ignoreUrls: [
          /\/health$/,               // Health check endpoints
          /\/metrics$/,              // Metrics endpoints
          /telemetry/,               // Telemetry/analytics
        ],
      },
      
      // --------------------------------------
      // 2. LLM API DETECTION
      // --------------------------------------
      // Automatically detects when fetch() is calling an LLM API
      llmApis: {
        // Enable OpenAI-compatible API detection
        // Looks for patterns like /chat/completions, /v1/generate, etc.
        openaiCompatible: true,
        
        // Custom URL patterns for your specific providers
        urlPatterns: [
          /chaingpt\.org/i,          // ChainGPT API
          /api\.chaingpt/i,          // ChainGPT alternate endpoint
          /chat\/stream/i,           // Streaming endpoints
        ],
        
        // Custom cost estimation function
        estimateCost: (request, response) => {
          try {
            // Parse request body
            const reqBody = typeof request.body === 'string' 
              ? JSON.parse(request.body) 
              : request.body;
            
            // Parse response body
            const resBody = typeof response.body === 'string' 
              ? JSON.parse(response.body) 
              : response.body;
            
            // Extract model
            const model = reqBody?.model || 'unknown';
            
            // Extract tokens (ChainGPT might return in different formats)
            const tokens = resBody?.usage?.total_tokens || 
                          resBody?.data?.usage?.total_tokens ||
                          estimateTokensFromLength(resBody);
            
            // ChainGPT pricing (adjust based on actual pricing)
            const pricePerThousandTokens = {
              'smart_contract_generator': 0.03,    // $0.03 per 1K tokens
              'smart_contract_auditor': 0.02,      // $0.02 per 1K tokens
              'general_chat': 0.01,                // $0.01 per 1K tokens
            };
            
            const price = pricePerThousandTokens[model] || 0.01;
            return (tokens / 1000) * price;
          } catch (err) {
            // Fallback to default estimate
            return 0.005;  // $0.005 default
          }
        },
      },
      
      // --------------------------------------
      // 3. HONO FRAMEWORK INTEGRATION
      // --------------------------------------
      // Automatically adds middleware to trace all routes
      framework: 'hono',
      frameworkOptions: {
        ignorePaths: ['/health', '/api/auth/status'],  // Paths to skip
        trackBodies: true,      // Capture request/response bodies
        verbose: true,          // Log each trace creation
      },
      
      // --------------------------------------
      // 4. VERBOSE LOGGING (for debugging)
      // --------------------------------------
      verbose: process.env.NODE_ENV !== 'production',
    },
  });

  console.log('✅ [AEGIS] Auto-instrumentation active');
  console.log('   📡 Fetch calls: AUTO-TRACED');
  console.log('   🤖 LLM APIs: AUTO-DETECTED');
  console.log('   🛣️  Hono routes: AUTO-TRACED');
}

// Helper function to estimate tokens from response length
function estimateTokensFromLength(body) {
  try {
    const text = JSON.stringify(body);
    // Rule of thumb: ~4 characters per token
    return Math.ceil(text.length / 4);
  } catch {
    return 0;
  }
}