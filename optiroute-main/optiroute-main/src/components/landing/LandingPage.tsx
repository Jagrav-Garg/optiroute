import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Compass, Sparkles, Navigation, Globe, Send } from 'lucide-react';
import { useTrip } from '../../context/TripContext';

export const LandingPage: React.FC = () => {
  const { setCurrentView, loadScenario, sendMessage, createNewTrip } = useTrip();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Mouse parallax state
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const SUGGESTED_CHIPS = [
    {
      label: 'Tokyo · Pure Veg & Architecture',
      prompt: 'Plan a 3-day Tokyo trip for 2 with 100% pure vegetarian dining, hotel basecamp at Tokyo Station, and zero city zigzagging.'
    },
    {
      label: 'Swiss Alps · Scenic Rail & Glaciers',
      prompt: 'Design a 4-day scenic rail journey across Swiss Alps with panoramic train passes, mountain hotels, and alpine hikes.'
    },
    {
      label: 'Kyoto · Zen Temples & Tea Gardens',
      prompt: '3 days in Kyoto focused on serene early-morning temples, bamboo groves, matcha ceremonies, and ryokan lodging.'
    },
    {
      label: 'Manhattan · High Line & Modern Art',
      prompt: '24-hour ultra-efficient art sprint through Chelsea galleries, MoMA, High Line, and plant-forward dining.'
    }
  ];

  // Canvas animation loop with slow Ken Burns breathing drift and mouse parallax
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current.targetX = normX * 18;
      mouseRef.current.targetY = normY * 14;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Load single minimalist aesthetic image
    const bgImg = new Image();
    bgImg.src = '/assets/landing/hero_minimalist.jpg';
    let imgLoaded = false;
    bgImg.onload = () => {
      imgLoaded = true;
    };

    let startTime = performance.now();

    const render = () => {
      const now = performance.now();
      const elapsed = now - startTime;

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      ctx.clearRect(0, 0, width, height);

      if (imgLoaded && bgImg.width > 0) {
        // Subtle organic breathing oscillation (1.02 to 1.07 scale over 28s)
        const scale = 1.035 + Math.sin(elapsed * 0.00022) * 0.025;
        const driftX = Math.cos(elapsed * 0.00015) * 12 + mouseRef.current.x;
        const driftY = Math.sin(elapsed * 0.00018) * 8 + mouseRef.current.y;

        const imgAspect = bgImg.width / bgImg.height;
        const canvasAspect = width / height;

        let drawW = width;
        let drawH = height;
        if (canvasAspect > imgAspect) {
          drawW = width;
          drawH = width / imgAspect;
        } else {
          drawH = height;
          drawW = height * imgAspect;
        }

        drawW *= scale;
        drawH *= scale;

        const offsetX = (width - drawW) / 2 + driftX;
        const offsetY = (height - drawH) / 2 + driftY;

        ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
      } else {
        // Fallback atmospheric dark green gradient if image is loading
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0B1110');
        grad.addColorStop(0.5, '#10231D');
        grad.addColorStop(1, '#0B1110');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Minimalist cartographic grid overlay
      ctx.strokeStyle = 'rgba(216, 213, 203, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 140;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Subtle expedition coordinate tick crosses at intersections
      ctx.strokeStyle = 'rgba(199, 243, 107, 0.18)';
      ctx.lineWidth = 1.2;
      for (let x = gridSize; x < width; x += gridSize * 2) {
        for (let y = gridSize; y < height; y += gridSize * 2) {
          ctx.beginPath();
          ctx.moveTo(x - 4, y);
          ctx.lineTo(x + 4, y);
          ctx.moveTo(x, y - 4);
          ctx.lineTo(x, y + 4);
          ctx.stroke();
        }
      }

      // Moody luxury vignette & dark ink falloff
      const radial = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        Math.min(width, height) * 0.25,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      radial.addColorStop(0, 'rgba(11, 17, 16, 0.35)');
      radial.addColorStop(0.65, 'rgba(11, 17, 16, 0.72)');
      radial.addColorStop(1, 'rgba(11, 17, 16, 0.96)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      // Deep bottom gradient for perfect text legibility
      const bottomGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
      bottomGrad.addColorStop(0, 'rgba(11, 17, 16, 0)');
      bottomGrad.addColorStop(1, 'rgba(11, 17, 16, 0.95)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, height * 0.6, width, height * 0.4);

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleStartPlanning = (customQuery?: string) => {
    setIsTransitioning(true);
    const query = customQuery || promptInput.trim();
    const lower = (query || '').toLowerCase();

    setTimeout(() => {
      if (!query || (lower.includes('tokyo') && !lower.includes('custom'))) {
        loadScenario('tokyo-veg');
        if (query) sendMessage(query);
      } else if (lower.includes('swiss') || lower.includes('alps')) {
        loadScenario('swiss-rail');
        if (query) sendMessage(query);
      } else if (lower.includes('kyoto')) {
        loadScenario('kyoto-culture');
        if (query) sendMessage(query);
      } else if (lower.includes('manhattan') || lower.includes('new york') || lower.includes('nyc')) {
        loadScenario('manhattan-art');
        if (query) sendMessage(query);
      } else {
        // Extract destination name from prompt: e.g. "Paris", "Trip to Rome", "3 days in Barcelona"
        let dest = query
          .replace(/^(plan\s+(a\s+)?(\d+-day\s+)?|trip\s+to\s+|visit\s+|explore\s+)/i, '')
          .split(/(\s+for\s+|\s+with\s+|\s+in\s+|\s*,\s*)/i)[0]
          .trim();
        if (!dest || dest.length < 2) dest = query;
        dest = dest.charAt(0).toUpperCase() + dest.slice(1);

        createNewTrip({
          destination: dest,
          title: `${dest}: Multi-Agent Validated Journey`,
          dates: {
            startDate: '2026-11-10',
            endDate: '2026-11-13',
            totalDays: 3,
          },
          preferences: {
            diet: lower.includes('jain') ? 'pure_veg_jain' : lower.includes('vegan') ? 'vegan' : 'pure_veg',
            pace: 'moderate',
            mobility: 'public_transit',
            interests: ['Culture', 'Landmarks', 'Dining'],
          },
        });
      }
      setCurrentView('workspace');
    }, 400);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#0B1110',
        color: '#FAF9F5',
        fontFamily: 'var(--font-sans, "Inter", sans-serif)'
      }}
    >
      {/* Background Animated Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: isTransitioning ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
          opacity: isTransitioning ? 0.35 : 1
        }}
      />

      {/* Top Editorial Navigation Bar */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          padding: '28px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 35, 29, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(199, 243, 107, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--route-lime, #C7F36B)',
              boxShadow: '0 0 16px rgba(199, 243, 107, 0.2)'
            }}
          >
            <Compass size={18} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.14em',
              color: '#FAF9F5'
            }}
          >
            OPTIROUTE
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(199, 243, 107, 0.1)',
              color: 'var(--route-lime, #C7F36B)',
              border: '1px solid rgba(199, 243, 107, 0.25)'
            }}
          >
            INSTRUMENT v2.4
          </span>
        </div>

        {/* Minimalist Live Status HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(11, 17, 16, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(216, 213, 203, 0.15)',
              borderRadius: '999px',
              padding: '6px 16px'
            }}
          >
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--route-lime, #C7F36B)' }}>
              ? ROUTE ENGINE ONLINE
            </span>
            <span style={{ color: 'rgba(216, 213, 203, 0.3)' }}>·</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#8B918C' }}>
              LAT 35.6823° N · LNG 139.7702· E
            </span>
          </div>

          <button
            onClick={() => handleStartPlanning()}
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              border: '1px solid rgba(199, 243, 107, 0.4)',
              backgroundColor: 'rgba(16, 35, 29, 0.65)',
              color: 'var(--route-lime, #C7F36B)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(8px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--route-lime, #C7F36B)';
              e.currentTarget.style.color = '#0B1110';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(16, 35, 29, 0.65)';
              e.currentTarget.style.color = 'var(--route-lime, #C7F36B)';
            }}
          >
            ENTER WORKSPACE ?
          </button>
        </div>
      </header>

      {/* Centerpiece Minimalist Hero */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 15,
          textAlign: 'center',
          width: '100%',
          maxWidth: '860px',
          padding: '0 24px',
          pointerEvents: 'auto'
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            letterSpacing: '0.24em',
            color: 'var(--route-lime, #C7F36B)',
            marginBottom: '18px',
            textTransform: 'uppercase'
          }}
        >
          AUTONOMOUS MULTI-AGENT TRAVEL ORCHESTRATION
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.8rem, 6vw, 4.8rem)',
            fontWeight: 400,
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            margin: '0 0 18px 0',
            fontFamily: 'var(--font-serif, "Instrument Serif", Georgia, serif)',
            color: '#FAF9F5',
            textShadow: '0 6px 30px rgba(0,0,0,0.7)'
          }}
        >
          Plan the journey.
          <br />
          <span style={{ fontStyle: 'italic', color: 'var(--route-lime, #C7F36B)' }}>
            We'll solve the route.
          </span>
        </h1>

        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.65,
            color: '#D8D5CB',
            maxWidth: '600px',
            margin: '0 auto 38px auto',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)'
          }}
        >
          High-level intent transformed into zero-conflict itineraries. Complete hotel-to-hotel circuits, verified dietary constraints, and deterministic street pathfinding.
        </p>

        {/* Minimalist Command Prompt Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartPlanning();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(16, 35, 29, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(216, 213, 203, 0.25)',
            borderRadius: '999px',
            padding: '6px 8px 6px 22px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(199, 243, 107, 0.15)',
            maxWidth: '720px',
            margin: '0 auto 24px auto',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--route-lime, #C7F36B)';
            e.currentTarget.style.boxShadow = '0 16px 50px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(199, 243, 107, 0.3)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(216, 213, 203, 0.25)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(199, 243, 107, 0.15)';
          }}
        >
          <input
            id="landing-prompt-input"
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Where to? (e.g. 3 days in Tokyo, pure vegetarian, hotel at Tokyo Station...)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FAF9F5',
              fontSize: '14px',
              fontFamily: 'var(--font-sans, "Inter", sans-serif)'
            }}
          />
          <button
            id="start-planning-btn"
            type="submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--route-lime, #C7F36B)',
              color: '#0B1110',
              fontWeight: 700,
              fontSize: '13px',
              padding: '12px 24px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(199, 243, 107, 0.35)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 6px 28px rgba(199, 243, 107, 0.55)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(199, 243, 107, 0.35)';
            }}
          >
            <span>Solve Route</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Minimalist Curated Query Chips */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {SUGGESTED_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPromptInput(chip.prompt);
                handleStartPlanning(chip.prompt);
              }}
              style={{
                backgroundColor: 'rgba(11, 17, 16, 0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(216, 213, 203, 0.18)',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#D8D5CB',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--route-lime, #C7F36B)';
                e.currentTarget.style.color = '#FAF9F5';
                e.currentTarget.style.backgroundColor = 'rgba(16, 35, 29, 0.85)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(216, 213, 203, 0.18)';
                e.currentTarget.style.color = '#D8D5CB';
                e.currentTarget.style.backgroundColor = 'rgba(11, 17, 16, 0.6)';
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Editorial HUD Footer */}
      <footer
        style={{
          position: 'absolute',
          bottom: '22px',
          left: '48px',
          right: '48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          fontFamily: 'var(--font-mono, monospace)',
          color: '#8B918C',
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span>DETERMINISTIC ROUTE ENGINE</span>
          <span>·</span>
          <span>MAPBOX STREET PATHFINDING</span>
          <span>·</span>
          <span>CLOSED HOTEL CIRCUITS</span>
        </div>
        <div>CINEMATIC PARALLAX · 60 FPS</div>
      </footer>
    </div>
  );
};

