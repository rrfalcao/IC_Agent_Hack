/**
 * Agent Brain Visualization
 * Shows real-time "thought process" of the AI agent
 * 
 * Visualizes:
 * - ERC-8004 Identity verification
 * - Q402 payment flow
 * - Policy checks
 * - AI task execution
 * - Results
 */

import React, { useState, useEffect, useRef } from 'react';

// Step status types
const STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUCCESS: 'success',
  ERROR: 'error',
  SKIPPED: 'skipped'
};

// Step icons by type
const STEP_ICONS = {
  identity: '🪪',
  payment: '💰',
  policy: '📋',
  network: '🔗',
  ai: '🤖',
  security: '🛡️',
  result: '✨',
  deploy: '🚀',
  compile: '⚙️',
  verify: '✓'
};

// Animated connector line between nodes
const ConnectorLine = ({ active, success, error }) => {
  const color = error ? '#ef4444' : success ? '#22c55e' : active ? '#60a5fa' : '#374151';
  
  return (
    <div style={{
      position: 'relative',
      width: '2px',
      height: '32px',
      marginLeft: '19px',
      overflow: 'hidden'
    }}>
      {/* Base line */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: '#374151'
      }} />
      
      {/* Animated fill */}
      {(active || success) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: success ? '100%' : '50%',
          background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
          transition: 'height 0.5s ease-out',
          boxShadow: `0 0 8px ${color}66`
        }} />
      )}
      
      {/* Pulse animation when active */}
      {active && !success && (
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '-3px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          animation: 'pulse-down 1s ease-in-out infinite',
          boxShadow: `0 0 12px ${color}`
        }} />
      )}
    </div>
  );
};

// Individual brain node
const BrainNode = ({ step, isLast }) => {
  const { id, type, label, detail, status, timestamp, value } = step;
  
  const getStatusColor = () => {
    switch (status) {
      case STATUS.SUCCESS: return { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#4ade80' };
      case STATUS.ERROR: return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171' };
      case STATUS.ACTIVE: return { bg: 'rgba(96, 165, 250, 0.15)', border: '#60a5fa', text: '#93c5fd' };
      case STATUS.SKIPPED: return { bg: 'rgba(107, 114, 128, 0.15)', border: '#6b7280', text: '#9ca3af' };
      default: return { bg: 'rgba(55, 65, 81, 0.5)', border: '#374151', text: '#6b7280' };
    }
  };
  
  const colors = getStatusColor();
  const icon = STEP_ICONS[type] || '●';
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow effect for active */}
        {status === STATUS.ACTIVE && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, ${colors.border}22 0%, transparent 70%)`,
            animation: 'glow-pulse 2s ease-in-out infinite'
          }} />
        )}
        
        {/* Icon circle */}
        <div style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: status === STATUS.ACTIVE 
            ? `linear-gradient(135deg, ${colors.border}44 0%, ${colors.border}22 100%)`
            : colors.bg,
          border: `2px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          flexShrink: 0,
          boxShadow: status === STATUS.ACTIVE ? `0 0 20px ${colors.border}44` : 'none'
        }}>
          {status === STATUS.ACTIVE ? (
            <div style={{ animation: 'spin 2s linear infinite' }}>{icon}</div>
          ) : status === STATUS.SUCCESS ? (
            <span style={{ color: colors.text }}>✓</span>
          ) : status === STATUS.ERROR ? (
            <span style={{ color: colors.text }}>✗</span>
          ) : (
            icon
          )}
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '4px'
          }}>
            <span style={{
              fontWeight: '600',
              color: colors.text,
              fontSize: '0.9rem'
            }}>
              {label}
            </span>
            {timestamp && (
              <span style={{
                fontSize: '0.7rem',
                color: '#6b7280',
                fontFamily: 'monospace'
              }}>
                {new Date(timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {detail && (
            <div style={{
              fontSize: '0.8rem',
              color: '#9ca3af',
              lineHeight: 1.4
            }}>
              {detail}
            </div>
          )}
          
          {value && (
            <div style={{
              marginTop: '6px',
              padding: '6px 10px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: '#d1d5db',
              wordBreak: 'break-all'
            }}>
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            </div>
          )}
        </div>
      </div>
      
      {/* Connector to next node */}
      {!isLast && (
        <ConnectorLine 
          active={status === STATUS.ACTIVE || status === STATUS.SUCCESS}
          success={status === STATUS.SUCCESS}
          error={status === STATUS.ERROR}
        />
      )}
    </div>
  );
};

// Main Brain Visualization Component
export function AgentBrainVisualization({ 
  steps = [], 
  title = "Agent Brain",
  subtitle = "Real-time thought process",
  isProcessing = false,
  onStepClick
}) {
  const containerRef = useRef(null);
  
  // Auto-scroll to active step
  useEffect(() => {
    if (containerRef.current) {
      const activeStep = containerRef.current.querySelector('[data-active="true"]');
      if (activeStep) {
        activeStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [steps]);
  
  const activeStep = steps.find(s => s.status === STATUS.ACTIVE);
  const completedCount = steps.filter(s => s.status === STATUS.SUCCESS).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: '700',
              color: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '1.25rem' }}>🧠</span>
              {title}
              {isProcessing && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  animation: 'pulse 1s ease-in-out infinite',
                  boxShadow: '0 0 8px #22c55e'
                }} />
              )}
            </h3>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              {subtitle}
            </p>
          </div>
          
          {/* Progress indicator */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              marginBottom: '4px'
            }}>
              {completedCount}/{totalSteps} steps
            </div>
            <div style={{
              width: '80px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)',
                transition: 'width 0.5s ease-out',
                boxShadow: '0 0 8px #22c55e66'
              }} />
            </div>
          </div>
        </div>
        
        {/* Active step highlight */}
        {activeStep && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(96, 165, 250, 0.1)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ animation: 'spin 2s linear infinite' }}>
              {STEP_ICONS[activeStep.type] || '⚡'}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>
              {activeStep.label}
            </span>
          </div>
        )}
      </div>
      
      {/* Steps container */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0'
        }}
      >
        {steps.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>🧠</div>
            <div style={{ fontSize: '0.9rem' }}>Waiting for task...</div>
            <div style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.7 }}>
              Start an action to see the agent's thought process
            </div>
          </div>
        ) : (
          steps.map((step, idx) => (
            <div 
              key={step.id} 
              data-active={step.status === STATUS.ACTIVE}
              onClick={() => onStepClick?.(step)}
              style={{ cursor: onStepClick ? 'pointer' : 'default' }}
            >
              <BrainNode 
                step={step} 
                isLast={idx === steps.length - 1} 
              />
            </div>
          ))
        )}
      </div>
      
      {/* Footer with legend */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {[
          { status: 'Pending', color: '#6b7280' },
          { status: 'Active', color: '#60a5fa' },
          { status: 'Success', color: '#22c55e' },
          { status: 'Error', color: '#ef4444' }
        ].map(({ status, color }) => (
          <div key={status} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.7rem',
            color: '#9ca3af'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: color
            }} />
            {status}
          </div>
        ))}
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        
        @keyframes pulse-down {
          0% { top: 0; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Hook to manage brain steps
export function useBrainSteps() {
  const [steps, setSteps] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const addStep = (step) => {
    const newStep = {
      ...step,
      id: step.id || `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: step.status || STATUS.PENDING,
      timestamp: Date.now()
    };
    setSteps(prev => [...prev, newStep]);
    return newStep.id;
  };
  
  const updateStep = (id, updates) => {
    setSteps(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates, timestamp: Date.now() } : s
    ));
  };
  
  const activateStep = (id) => {
    updateStep(id, { status: STATUS.ACTIVE });
  };
  
  const completeStep = (id, detail, value) => {
    updateStep(id, { 
      status: STATUS.SUCCESS, 
      detail: detail || undefined,
      value: value || undefined
    });
  };
  
  const failStep = (id, error) => {
    updateStep(id, { 
      status: STATUS.ERROR, 
      detail: error 
    });
  };
  
  const skipStep = (id, reason) => {
    updateStep(id, { 
      status: STATUS.SKIPPED, 
      detail: reason 
    });
  };
  
  const reset = () => {
    setSteps([]);
    setIsProcessing(false);
  };
  
  const startProcessing = () => setIsProcessing(true);
  const stopProcessing = () => setIsProcessing(false);
  
  return {
    steps,
    isProcessing,
    addStep,
    updateStep,
    activateStep,
    completeStep,
    failStep,
    skipStep,
    reset,
    startProcessing,
    stopProcessing,
    STATUS
  };
}

export { STATUS };
export default AgentBrainVisualization;

