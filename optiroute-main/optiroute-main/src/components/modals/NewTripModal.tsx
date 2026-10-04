import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { DietConstraint, PacePreference } from '../../types';

export const NewTripModal: React.FC = () => {
  const { isNewTripModalOpen, setIsNewTripModalOpen, createNewTrip } = useTrip();

  const [destination, setDestination] = useState('Kyoto');
  const [country, setCountry] = useState('Japan');
  const [days, setDays] = useState(3);
  const [budgetCap, setBudgetCap] = useState(1600);
  const [diet, setDiet] = useState<DietConstraint>('pure_veg');
  const [pace, setPace] = useState<PacePreference>('moderate');

  if (!isNewTripModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNewTrip({
      title: `${destination}: Custom Journey`,
      destination,
      country,
      dates: {
        startDate: '2026-11-10',
        endDate: '2026-11-13',
        totalDays: days
      },
      budget: {
        currency: 'USD',
        totalCap: budgetCap,
        spentTotal: Math.round(budgetCap * 0.78),
        breakdown: {
          flights: Math.round(budgetCap * 0.35),
          hotels: Math.round(budgetCap * 0.4),
          food: Math.round(budgetCap * 0.15),
          activities: Math.round(budgetCap * 0.08),
          buffer: Math.round(budgetCap * 0.02)
        },
        status: 'under'
      },
      preferences: {
        pace,
        diet,
        mobility: 'metro_subway',
        interests: ['Cultural Heritage', 'Pure Veg Dining', 'Scenic Walkways']
      }
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(21, 28, 24, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-floating)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: 'var(--primary)' }}>
              Plan a New Journey
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Parameters will be locked into the coordinator blackboard.
            </p>
          </div>

          <button
            onClick={() => setIsNewTripModalOpen(false)}
            style={{ color: 'var(--text-muted)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-surface-soft)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '9px 12px',
                fontSize: '13px',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={14}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-surface-soft)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '9px 12px',
                  fontSize: '13px',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Hard Budget Ceiling ($)
              </label>
              <input
                type="number"
                min={200}
                step={50}
                value={budgetCap}
                onChange={(e) => setBudgetCap(Number(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-surface-soft)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '9px 12px',
                  fontSize: '13px',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Dietary Requirement (Rigid Rule)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
              {[
                { key: 'pure_veg_jain', label: 'Pure Veg (Jain)' },
                { key: 'pure_veg', label: 'Pure Vegetarian' },
                { key: 'vegan', label: '100% Vegan' },
                { key: 'none', label: 'No Restriction' }
              ].map((item) => {
                const isSelected = diet === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setDiet(item.key as DietConstraint)}
                    style={{
                      padding: '7px 8px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface-soft)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: 500,
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-hairline)'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '12px',
              padding: '11px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>Initialize & Synthesize</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
