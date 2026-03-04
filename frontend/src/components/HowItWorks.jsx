// ============================================================
// components/HowItWorks.jsx — Collapsible educational panel
// ============================================================
import { useState } from 'react';

export function HowItWorks({ title, steps, mechanism }) {
    const [open, setOpen] = useState(false);

    return (
        <div style={{
            marginTop: '1.5rem',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
        }}>
            <button
                onClick={() => setOpen((o) => !o)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.9rem 1.25rem',
                    background: 'rgba(99,102,241,0.08)',
                    border: 'none', cursor: 'pointer',
                    color: '#a5b4fc', fontWeight: 600, fontSize: '0.9rem',
                    textAlign: 'left',
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>💡</span> {title || 'How this works'}
                </span>
                <span style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.7 }}>▼</span>
            </button>

            {open && (
                <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.2)', animation: 'fadeIn 0.2s ease' }}>
                    {mechanism && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.25rem 0.7rem', borderRadius: '9999px',
                            background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
                            fontSize: '0.78rem', fontWeight: 600, marginBottom: '1rem',
                            border: '1px solid rgba(99,102,241,0.3)',
                        }}>
                            🔐 {mechanism}
                        </div>
                    )}
                    <ol style={{ margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {steps.map((step, i) => (
                            <li key={i} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
