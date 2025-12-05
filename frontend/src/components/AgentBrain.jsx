/**
 * Global Agent Brain Component
 * Slide-out drawer showing real-time AI agent thought process
 * 
 * Features:
 * - Glassmorphism design with electric blue accent
 * - Slide-in animation from right
 * - Live terminal-style logs
 * - Visual step progression
 * - ERC-8004 identity display
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentStore, STAGES, LOG_TYPES } from '../store/useAgentStore';

// Step indicator component
const StepItem = ({ icon, label, active, done, error, detail }) => {
  const getStatusColor = () => {
    if (error) return { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', text: '#fca5a5' };
    if (done) return { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', text: '#86efac' };
    if (active) return { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', text: '#93c5fd' };
    return { border: '#374151', bg: 'rgba(55, 65, 81, 0.3)', text: '#6b7280' };
  };

  const colors = getStatusColor();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px',
      background: colors.bg,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Glow effect when active */}
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, ${colors.border}33 0%, transparent 70%)`,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Icon */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        flexShrink: 0,
        position: 'relative'
      }}>
        {active ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            {icon}
          </motion.span>
        ) : done ? (
          <span style={{ color: colors.text }}>✓</span>
        ) : error ? (
          <span style={{ color: colors.text }}>✗</span>
        ) : (
          <span style={{ opacity: 0.5 }}>{icon}</span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: '600',
          fontSize: '0.85rem',
          color: colors.text,
          marginBottom: detail ? '4px' : 0
        }}>
          {label}
        </div>
        {detail && (
          <div style={{
            fontSize: '0.75rem',
            color: '#9ca3af',
            lineHeight: 1.4
          }}>
            {detail}
          </div>
        )}
      </div>

      {/* Active indicator */}
      {active && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: colors.border,
            boxShadow: `0 0 10px ${colors.border}`
          }}
        />
      )}
    </div>
  );
};

// Log line component
const LogLine = ({ log, isLatest }) => {
  const getColor = () => {
    switch (log.type) {
      case LOG_TYPES.SUCCESS: return '#4ade80';
      case LOG_TYPES.ERROR: return '#f87171';
      case LOG_TYPES.WARNING: return '#fbbf24';
      case LOG_TYPES.THINKING: return '#60a5fa';
      case LOG_TYPES.PAYMENT: return '#c084fc';
      case LOG_TYPES.IDENTITY: return '#22d3ee';
      default: return '#9ca3af';
    }
  };

  const getPrefix = () => {
    switch (log.type) {
      case LOG_TYPES.SUCCESS: return '✓';
      case LOG_TYPES.ERROR: return '✗';
      case LOG_TYPES.WARNING: return '⚠';
      case LOG_TYPES.THINKING: return '◉';
      case LOG_TYPES.PAYMENT: return '$';
      case LOG_TYPES.IDENTITY: return '⬡';
      default: return '>';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: '0.7rem',
        color: getColor(),
        display: 'flex',
        gap: '6px',
        lineHeight: 1.5
      }}
    >
      <span style={{ opacity: 0.6 }}>{getPrefix()}</span>
      <span>{log.message}</span>
      {isLatest && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          █
        </motion.span>
      )}
    </motion.div>
  );
};

// Task title mapping
const TASK_TITLES = {
  audit: { title: 'Security Audit', icon: '🛡️', color: '#fbbf24' },
  generate: { title: 'Contract Generation', icon: '🏗️', color: '#22c55e' },
  swap: { title: 'Token Swap', icon: '🔄', color: '#a855f7' },
  transfer: { title: 'Token Transfer', icon: '💸', color: '#ec4899' },
  chat: { title: 'AI Chat', icon: '💬', color: '#3b82f6' },
  deploy: { title: 'Contract Deploy', icon: '🚀', color: '#06b6d4' }
};

// Main Agent Brain Component
export function AgentBrain() {
  const {
    isOpen,
    stage,
    currentTask,
    logs,
    metadata,
    steps,
    closeBrain
  } = useAgentStore();

  const logsEndRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const taskInfo = TASK_TITLES[currentTask] || { title: 'Processing', icon: '⚡', color: '#3b82f6' };
  const isComplete = stage === STAGES.DONE;
  const hasError = stage === STAGES.ERROR;

  // Calculate progress
  const completedSteps = steps.filter(s => s.status === 'success').length;
  const totalSteps = steps.length || 1;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeBrain}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 40
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              height: '100vh',
              width: '360px',
              maxWidth: '90vw',
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              borderLeft: `2px solid ${taskInfo.color}40`,
              boxShadow: `-10px 0 40px rgba(0, 0, 0, 0.5), 0 0 60px ${taskInfo.color}15`,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: `1px solid ${taskInfo.color}30`,
              background: `linear-gradient(135deg, ${taskInfo.color}10 0%, transparent 100%)`
            }}>
              {/* Close button */}
              <button
                onClick={closeBrain}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.color = '#9ca3af';
                }}
              >
                ✕
              </button>

              {/* Agent Identity */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: isComplete ? '#22c55e' : hasError ? '#ef4444' : '#22c55e',
                  boxShadow: `0 0 12px ${isComplete ? '#22c55e' : hasError ? '#ef4444' : '#22c55e'}`,
                  animation: !isComplete && !hasError ? 'pulse 2s infinite' : 'none'
                }} />
                <div>
                  <div style={{
                    fontWeight: '700',
                    color: '#fff',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🧠 Agent Brain
                    <a
                      href="https://sepolia.basescan.org/token/0x8004AA63c570c570eBF15376c0dB199918BFe9Fb?a=1581"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.7rem',
                        color: '#60a5fa',
                        textDecoration: 'none',
                        padding: '2px 8px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        borderRadius: '4px',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      #1581
                    </a>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    ERC-8004 Verified • Chimera
                  </div>
                </div>
              </div>

              {/* Current Task */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: `${taskInfo.color}15`,
                borderRadius: '10px',
                border: `1px solid ${taskInfo.color}30`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{taskInfo.icon}</span>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: taskInfo.color,
                      fontSize: '0.9rem'
                    }}>
                      {taskInfo.title}
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#6b7280'
                    }}>
                      {isComplete ? 'Complete' : hasError ? 'Failed' : 'Processing...'}
                    </div>
                  </div>
                </div>
                
                {/* Progress ring */}
                <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke={isComplete ? '#22c55e' : hasError ? '#ef4444' : taskInfo.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={113}
                    initial={{ strokeDashoffset: 113 }}
                    animate={{ strokeDashoffset: 113 - (113 * progress / 100) }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
              </div>
            </div>

            {/* Steps */}
            <div style={{
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              {steps.length > 0 ? (
                steps.map((step, idx) => (
                  <StepItem
                    key={step.id || idx}
                    icon={step.icon || '⚡'}
                    label={step.label}
                    detail={step.detail}
                    active={step.status === 'active'}
                    done={step.status === 'success'}
                    error={step.status === 'error'}
                  />
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#6b7280',
                  fontSize: '0.85rem'
                }}>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Initializing...
                  </motion.div>
                </div>
              )}
            </div>

            {/* Live Terminal */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '16px 20px',
              minHeight: 0
            }}>
              <div style={{
                fontSize: '0.7rem',
                color: '#6b7280',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>LIVE TERMINAL</span>
                <span style={{ color: '#4ade80' }}>● STREAMING</span>
              </div>

              <div style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '12px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {logs.length > 0 ? (
                  <>
                    {logs.map((log, idx) => (
                      <LogLine
                        key={idx}
                        log={log}
                        isLatest={idx === logs.length - 1 && !isComplete && !hasError}
                      />
                    ))}
                    <div ref={logsEndRef} />
                  </>
                ) : (
                  <div style={{
                    color: '#4b5563',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem'
                  }}>
                    Waiting for input...
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(0, 0, 0, 0.2)'
            }}>
              {isComplete ? (
                <button
                  onClick={closeBrain}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ✓ Task Complete
                </button>
              ) : hasError ? (
                <button
                  onClick={closeBrain}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  ✗ Task Failed - Close
                </button>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#9ca3af',
                  fontSize: '0.8rem'
                }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⚙️
                  </motion.div>
                  Processing...
                </div>
              )}
            </div>

            {/* Pulse animation */}
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AgentBrain;

