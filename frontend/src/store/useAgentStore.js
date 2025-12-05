/**
 * Global Agent Brain Store (Zustand)
 * Manages the AI agent's "thought process" visualization across all features
 * 
 * Features:
 * - Global state accessible from any component
 * - Step-by-step task logging
 * - Stage management for visual flow
 * - Metadata storage for context
 */

import { create } from 'zustand';

// Agent stages
export const STAGES = {
  IDLE: 'IDLE',
  IDENTITY_CHECK: 'IDENTITY_CHECK',
  PAYMENT_CHECK: 'PAYMENT_CHECK',
  POLICY_CHECK: 'POLICY_CHECK',
  THINKING: 'THINKING',
  SIGNING: 'SIGNING',
  EXECUTING: 'EXECUTING',
  DONE: 'DONE',
  ERROR: 'ERROR'
};

// Log types for styling
export const LOG_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  THINKING: 'thinking',
  PAYMENT: 'payment',
  IDENTITY: 'identity'
};

// Create the store
export const useAgentStore = create((set, get) => ({
  // State
  isOpen: false,
  stage: STAGES.IDLE,
  currentTask: null, // 'audit', 'generate', 'swap', 'transfer', 'chat'
  logs: [], // Array of { message, type, timestamp }
  metadata: {}, // Extra context (price, contract address, etc.)
  steps: [], // Visual step indicators
  
  // Actions
  
  /**
   * Start a new task - opens the brain drawer
   */
  startTask: (taskName, initialMetadata = {}) => set({
    isOpen: true,
    stage: STAGES.IDENTITY_CHECK,
    currentTask: taskName,
    logs: [],
    metadata: {
      startTime: Date.now(),
      ...initialMetadata
    },
    steps: []
  }),
  
  /**
   * Add a log entry
   */
  addLog: (message, type = LOG_TYPES.INFO) => set((state) => ({
    logs: [...state.logs, {
      message,
      type,
      timestamp: Date.now()
    }]
  })),
  
  /**
   * Set the current stage
   */
  setStage: (stage) => set({ stage }),
  
  /**
   * Add a step to the visual flow
   */
  addStep: (step) => set((state) => ({
    steps: [...state.steps, {
      id: `step-${Date.now()}`,
      status: 'active',
      timestamp: Date.now(),
      ...step
    }]
  })),
  
  /**
   * Update a step's status
   */
  updateStep: (stepId, updates) => set((state) => ({
    steps: state.steps.map(s => 
      s.id === stepId ? { ...s, ...updates } : s
    )
  })),
  
  /**
   * Complete the current step and move to next
   */
  completeCurrentStep: (detail) => set((state) => {
    const currentStepIndex = state.steps.findIndex(s => s.status === 'active');
    if (currentStepIndex === -1) return state;
    
    return {
      steps: state.steps.map((s, i) => 
        i === currentStepIndex 
          ? { ...s, status: 'success', detail, timestamp: Date.now() }
          : s
      )
    };
  }),
  
  /**
   * Fail the current step
   */
  failCurrentStep: (error) => set((state) => {
    const currentStepIndex = state.steps.findIndex(s => s.status === 'active');
    if (currentStepIndex === -1) return state;
    
    return {
      stage: STAGES.ERROR,
      steps: state.steps.map((s, i) => 
        i === currentStepIndex 
          ? { ...s, status: 'error', detail: error, timestamp: Date.now() }
          : s
      )
    };
  }),
  
  /**
   * Update metadata
   */
  setMetadata: (newMetadata) => set((state) => ({
    metadata: { ...state.metadata, ...newMetadata }
  })),
  
  /**
   * Complete the task
   */
  completeTask: (result) => set((state) => ({
    stage: STAGES.DONE,
    metadata: { ...state.metadata, result, endTime: Date.now() }
  })),
  
  /**
   * Close the brain drawer
   */
  closeBrain: () => set({
    isOpen: false
  }),
  
  /**
   * Reset everything
   */
  reset: () => set({
    isOpen: false,
    stage: STAGES.IDLE,
    currentTask: null,
    logs: [],
    metadata: {},
    steps: []
  }),
  
  /**
   * Toggle the drawer open/closed
   */
  toggle: () => set((state) => ({
    isOpen: !state.isOpen
  })),
  
  // Computed helpers
  
  /**
   * Get elapsed time since task start
   */
  getElapsedTime: () => {
    const { metadata } = get();
    if (!metadata.startTime) return 0;
    return Date.now() - metadata.startTime;
  },
  
  /**
   * Check if a stage is complete
   */
  isStageComplete: (stage) => {
    const { stage: currentStage } = get();
    const stageOrder = Object.values(STAGES);
    return stageOrder.indexOf(currentStage) > stageOrder.indexOf(stage);
  }
}));

// Selector hooks for common patterns
export const useAgentBrainOpen = () => useAgentStore((state) => state.isOpen);
export const useAgentStage = () => useAgentStore((state) => state.stage);
export const useAgentLogs = () => useAgentStore((state) => state.logs);
export const useAgentSteps = () => useAgentStore((state) => state.steps);

export default useAgentStore;

