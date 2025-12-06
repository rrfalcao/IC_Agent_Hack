/**
 * Audit Loop Visualizer
 * Shows each iteration of the self-correcting audit loop as stackable panels
 * Users can scroll through to see how the AI improved the contract
 */

import { useState } from 'react';
import { GlassPanel } from './GlassPanel';

// Score color based on percentage
const getScoreColor = (score) => {
  if (score >= 80) return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.5)', text: '#4ade80' };
  if (score >= 60) return { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.5)', text: '#fbbf24' };
  if (score >= 40) return { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.5)', text: '#fb923c' };
  return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', text: '#f87171' };
};

// Circular progress indicator
const CircularProgress = ({ score, size = 80 }) => {
  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r="35"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r="35"
          fill="none"
          stroke={colors.text}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <span style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.text }}>
          {score}%
        </span>
      </div>
    </div>
  );
};

// Single iteration panel
const IterationPanel = ({ iteration, isActive, isFinal, onClick, style = {} }) => {
  const [showCode, setShowCode] = useState(false);
  const colors = getScoreColor(iteration.score);
  
  const issues = iteration.issues || [];
  const isPassing = iteration.score >= 80;

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isActive ? 'scale(1)' : 'scale(0.95)',
        opacity: isActive ? 1 : 0.7,
        ...style
      }}
    >
      <GlassPanel
        variant="card"
        hover={!isActive}
        style={{
          padding: '1.5rem',
          border: isActive ? `2px solid ${colors.border}` : '1px solid rgba(255,255,255,0.1)',
          background: isActive ? colors.bg : 'rgba(20, 20, 20, 0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Iteration badge */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isFinal ? 'linear-gradient(135deg, #4ade80, #22d3ee)' : 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '1.1rem',
              color: isFinal ? '#000' : '#fff'
            }}>
              {isFinal ? '✓' : iteration.attempt}
            </div>
            
            <div>
              <h3 style={{ margin: 0, color: '#f5f5f5', fontSize: '1.1rem', fontWeight: '600' }}>
                {isFinal ? 'Final Version' : `Iteration ${iteration.attempt}`}
              </h3>
              <p style={{ margin: 0, color: '#a3a3a3', fontSize: '0.8rem' }}>
                {isPassing ? '✅ Passed security threshold' : '🔄 Below threshold, regenerating...'}
              </p>
            </div>
          </div>

          {/* Score circle */}
          <CircularProgress score={iteration.score} size={70} />
        </div>

        {/* Issues found */}
        {issues.length > 0 && !isPassing && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{ color: '#fca5a5', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              🔍 Issues Found:
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#fca5a5', fontSize: '0.8rem' }}>
              {issues.slice(0, 3).map((issue, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>{issue}</li>
              ))}
              {issues.length > 3 && (
                <li style={{ opacity: 0.7 }}>+{issues.length - 3} more...</li>
              )}
            </ul>
          </div>
        )}

        {/* Fixes applied (for subsequent iterations) */}
        {iteration.attempt > 1 && iteration.fixesApplied && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{ color: '#86efac', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              🔧 Fixes Applied:
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#86efac', fontSize: '0.8rem' }}>
              {iteration.fixesApplied.slice(0, 3).map((fix, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>{fix}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Code preview toggle */}
        {isActive && iteration.code && (
          <div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowCode(!showCode); }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                color: '#d4d4d4',
                fontSize: '0.8rem',
                cursor: 'pointer',
                width: '100%',
                marginBottom: showCode ? '0.75rem' : 0
              }}
            >
              {showCode ? '▼ Hide Code' : '▶ View Code'}
            </button>
            
            {showCode && (
              <pre style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '1rem',
                overflow: 'auto',
                maxHeight: '200px',
                fontSize: '0.75rem',
                color: '#d4d4d4',
                margin: 0
              }}>
                {iteration.code.substring(0, 1500)}
                {iteration.code.length > 1500 && '\n\n... (truncated)'}
              </pre>
            )}
          </div>
        )}
      </GlassPanel>
    </div>
  );
};

// Main visualizer component
export function AuditLoopVisualizer({ iterations = [], isComplete = false }) {
  // Track which iteration user has manually selected (-1 means show latest)
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Calculate active index: if user selected one, use that; otherwise show latest
  const activeIndex = selectedIndex >= 0 && selectedIndex < iterations.length 
    ? selectedIndex 
    : Math.max(0, iterations.length - 1);

  const setActiveIndex = (index) => {
    setSelectedIndex(index);
  };

  if (iterations.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Progress header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        padding: '0 0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            fontSize: '1.5rem',
            animation: isComplete ? 'none' : 'pulse 1s infinite'
          }}>
            {isComplete ? '✅' : '🔄'}
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#f5f5f5', fontSize: '1rem', fontWeight: '600' }}>
              {isComplete ? 'Audit Loop Complete!' : 'Self-Correcting Audit Loop'}
            </h3>
            <p style={{ margin: 0, color: '#a3a3a3', fontSize: '0.8rem' }}>
              {isComplete 
                ? `Achieved ${iterations[iterations.length - 1]?.score}% security score in ${iterations.length} iteration${iterations.length > 1 ? 's' : ''}`
                : 'AI is iteratively improving the contract...'}
            </p>
          </div>
        </div>

        {/* Iteration dots */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {iterations.map((iter, idx) => {
            const colors = getScoreColor(iter.score);
            return (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: activeIndex === idx ? `2px solid ${colors.text}` : '1px solid rgba(255,255,255,0.2)',
                  background: activeIndex === idx ? colors.bg : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.text,
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stacked panels */}
      <div 
        style={{
          position: 'relative',
          minHeight: '300px'
        }}
      >
        {iterations.map((iteration, idx) => (
          <IterationPanel
            key={idx}
            iteration={iteration}
            isActive={idx === activeIndex}
            isFinal={isComplete && idx === iterations.length - 1}
            onClick={() => setActiveIndex(idx)}
            style={{
              position: idx === activeIndex ? 'relative' : 'absolute',
              top: idx === activeIndex ? 0 : `${idx * 10}px`,
              left: idx === activeIndex ? 0 : `${idx * 5}px`,
              right: idx === activeIndex ? 0 : `${idx * 5}px`,
              zIndex: idx === activeIndex ? iterations.length : idx,
              display: idx === activeIndex || Math.abs(idx - activeIndex) <= 1 ? 'block' : 'none'
            }}
          />
        ))}
      </div>

      {/* Navigation hint */}
      {iterations.length > 1 && (
        <div style={{
          textAlign: 'center',
          marginTop: '1rem',
          color: '#737373',
          fontSize: '0.8rem'
        }}>
          Click iteration numbers above to compare versions
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default AuditLoopVisualizer;

