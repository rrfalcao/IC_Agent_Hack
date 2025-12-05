/**
 * GlassPanel Component
 * Unified glassmorphism effect for all panels
 * Based on liquid glass design system
 */

export function GlassPanel({ 
  children, 
  className = '',
  style = {},
  variant = 'default', // 'default', 'card', 'input', 'modal', 'button'
  hover = true,
  onClick,
  as: Component = 'div'
}) {
  const baseStyles = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '24px',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 2.2)',
  };

  const variants = {
    default: {
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    },
    card: {
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    },
    input: {
      background: 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.15)',
      borderRadius: '16px',
    },
    modal: {
      background: 'rgba(20, 20, 35, 0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    },
    surface: {
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      borderRadius: '16px',
    },
    button: {
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
    }
  };

  const handleMouseEnter = (e) => {
    if (!hover) return;
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = variants[variant].boxShadow.replace('0 8px', '0 12px').replace('0 4px', '0 8px');
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
  };

  const handleMouseLeave = (e) => {
    if (!hover) return;
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = variants[variant].boxShadow;
    e.currentTarget.style.borderColor = variants[variant].border.split(' ').pop();
  };

  return (
    <Component
      className={className}
      style={{
        ...baseStyles,
        ...variants[variant],
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={hover ? handleMouseEnter : undefined}
      onMouseLeave={hover ? handleMouseLeave : undefined}
    >
      {/* Glass highlight layer */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </Component>
  );
}

/**
 * Glass input field styling helper
 */
export const glassInputStyle = {
  width: '100%',
  padding: '1rem 1.25rem',
  background: 'rgba(0, 0, 0, 0.15)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.3s ease',
};

export const glassInputFocusStyle = {
  borderColor: 'rgba(255, 255, 255, 0.3)',
  boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
};

/**
 * SVG Glass Filter (optional, for advanced effects)
 */
export function GlassFilter() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.001 0.005"
            numOctaves="1"
            seed="17"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="100"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
        </filter>
      </defs>
    </svg>
  );
}

