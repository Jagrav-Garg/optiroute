import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { useTrip } from '../../context/TripContext';

export const ConstraintPanel: React.FC = () => {
  const { currentTrip, toggleConstraint } = useTrip();
  const constraints = currentTrip.constraints;
  const validation = currentTrip.validation;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-app)',
      overflowY: 'auto',
      padding: '32px 40px'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border-hairline)',
        paddingBottom: '16px',
        marginBottom: '28px'
      }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-sage)', fontWeight: 700 }}>
          Verification Layer
        </span>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 500, color: 'var(--primary)', marginTop: '2px' }}>
          Constraint Satisfaction & Purity
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Unbreakable mathematical parameters validated programmatically via Zod schemas.
        </p>
      </div>

      {/* Auto-Repairs History */}
      {validation.violations.length > 0 && (
        <div style={{
          marginBottom: '28px',
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)'
        }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--accent-amber)',
            marginBottom: '10px'
          }}>
            Self-Reflection & Repair History ({validation.violations.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {validation.violations.map((v) => (
              <div key={v.id} style={{ fontSize: '12px', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v.rule}: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{v.description} </span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 500 }}>→ Repaired: {v.repairActionTaken}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraints Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden'
      }}>
        {constraints.map((c) => (
          <div
            key={c.id}
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-hairline)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{c.title}</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: c.isHardConstraint ? 'var(--accent-rose)' : 'var(--accent-sage)',
                  backgroundColor: c.isHardConstraint ? 'var(--accent-rose-soft)' : 'var(--accent-sage-soft)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-xs)'
                }}>
                  {c.isHardConstraint ? 'HARD RULE' : 'SOFT PREFERENCE'}
                </span>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 4px' }}>
                {c.description}
              </p>

              {c.extractedFromText && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Extracted from prompt: "{c.extractedFromText}"
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent-emerald)',
                backgroundColor: 'var(--accent-emerald-soft)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)'
              }}>
                100% Satisfied
              </span>

              <button
                onClick={() => toggleConstraint(c.id)}
                title="Toggle Lock"
                style={{ color: 'var(--text-muted)', padding: '4px' }}
              >
                <Lock size={14} color="var(--primary)" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
