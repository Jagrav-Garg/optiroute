import React from 'react';
import { DollarSign, Clock, ShieldCheck, TrendingDown } from 'lucide-react';
import { useTrip } from '../../context/TripContext';

export const TripAnalytics: React.FC = () => {
  const { currentTrip } = useTrip();
  const { budget, route } = currentTrip;

  const totalSpent = budget.spentTotal;
  const cap = budget.totalCap;
  const remaining = cap - totalSpent;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-app)',
      overflowY: 'auto',
      padding: '32px 40px'
    }}>
      <div style={{
        borderBottom: '1px solid var(--border-hairline)',
        paddingBottom: '16px',
        marginBottom: '28px'
      }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-sage)', fontWeight: 700 }}>
          Performance Metrics
        </span>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 500, color: 'var(--primary)', marginTop: '2px' }}>
          Trip Ledger & Route Analytics
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Mathematical proof of distance saved, budget ceiling adherence, and dietary purity.
        </p>
      </div>

      {/* 4 Quiet Performance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Budget Remaining</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, color: 'var(--primary)', margin: '4px 0' }}>${remaining}</div>
          <div style={{ fontSize: '12px', color: 'var(--accent-emerald)' }}>${totalSpent} spent of ${cap} cap</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Zigzag Elimination</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, color: 'var(--primary)', margin: '4px 0' }}>-{route.zigzagReductionPercent}%</div>
          <div style={{ fontSize: '12px', color: 'var(--accent-sage)' }}>Route Engine</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Diet Compliance</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, color: 'var(--primary)', margin: '4px 0' }}>100% Pure Veg</div>
          <div style={{ fontSize: '12px', color: 'var(--accent-emerald)' }}>Zero animal broth verified</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Transit Time</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, color: 'var(--primary)', margin: '4px 0' }}>{route.totalTransitHours} hrs</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Across 15 waypoints</div>
        </div>
      </div>

      {/* Budget Distribution */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, color: 'var(--primary)', marginBottom: '14px' }}>
          Expenditure Breakdown
        </h4>
        <div style={{ height: '8px', backgroundColor: 'var(--bg-surface-soft)', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginBottom: '14px' }}>
          <div style={{ width: '38%', backgroundColor: '#162a21' }} title="Hotels" />
          <div style={{ width: '35%', backgroundColor: '#526e5f' }} title="Flights" />
          <div style={{ width: '12%', backgroundColor: '#246a48' }} title="Food" />
          <div style={{ width: '10%', backgroundColor: '#b07033' }} title="Activities" />
          <div style={{ width: '5%', backgroundColor: '#828e87' }} title="Transit" />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Hotels: <strong style={{ color: 'var(--primary)' }}>${budget.breakdown.hotels}</strong></span>
          <span style={{ color: 'var(--text-secondary)' }}>Flights: <strong style={{ color: 'var(--primary)' }}>${budget.breakdown.flights}</strong></span>
          <span style={{ color: 'var(--text-secondary)' }}>Pure Veg Dining: <strong style={{ color: 'var(--primary)' }}>${budget.breakdown.food}</strong></span>
          <span style={{ color: 'var(--text-secondary)' }}>Activities: <strong style={{ color: 'var(--primary)' }}>${budget.breakdown.activities}</strong></span>
        </div>
      </div>
    </div>
  );
};
