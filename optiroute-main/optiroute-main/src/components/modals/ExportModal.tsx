import React, { useState } from 'react';
import { X, Download, Share2, Printer } from 'lucide-react';
import { useTrip } from '../../context/TripContext';

export const ExportModal: React.FC = () => {
  const { currentTrip, isExportModalOpen, setIsExportModalOpen } = useTrip();
  const [copied, setCopied] = useState(false);

  if (!isExportModalOpen) return null;

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentTrip, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${currentTrip.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_itinerary.json`);
    dlAnchor.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        maxWidth: '460px',
        padding: '24px',
        boxShadow: 'var(--shadow-floating)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: 'var(--primary)' }}>
              Export Actionable Deliverable
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Conflict-free itinerary & offline directions.
            </p>
          </div>
          <button onClick={() => setIsExportModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '20px 0' }}>
          <button
            onClick={downloadJson}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-surface-soft)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Download Validated Trip JSON</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Structured Zod schema with coordinates & timeline</div>
            </div>
            <Download size={16} color="var(--primary)" />
          </button>

          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-surface-soft)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Print / Save as PDF</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Clean printable travel document</div>
            </div>
            <Printer size={16} color="var(--primary)" />
          </button>

          <button
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-surface-soft)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Copy Itinerary Link</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Shareable direct link to this state</div>
            </div>
            {copied ? <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 600 }}>Copied!</span> : <Share2 size={16} color="var(--primary)" />}
          </button>
        </div>
      </div>
    </div>
  );
};
