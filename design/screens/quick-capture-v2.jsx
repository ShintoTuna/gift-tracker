// QuickCapture v2 — single voice, typeahead, optional everything, aligned heights

const fSerif3 = "'DM Serif Display', Georgia, serif";
const fBody3 = "'Work Sans', -apple-system, system-ui, sans-serif";
const fMono3 = "'IBM Plex Mono', ui-monospace, monospace";

function PersonPill({ initial, name, days, removable }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '5px 10px 5px 5px', borderRadius: 999,
      background: 'rgba(200,164,90,0.14)',
      border: `1px solid rgba(200,164,90,0.4)`,
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 999,
        background: 'linear-gradient(140deg, #2a3d33, #16241e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: fSerif3, fontSize: 11, color: window.MG.brass,
      }}>{initial}</span>
      <span style={{
        fontFamily: fBody3, fontSize: 13, color: window.MG.text, fontWeight: 500,
      }}>{name}</span>
      {days != null && (
        <span style={{
          fontFamily: fMono3, fontSize: 9.5, color: window.MG.brass,
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>{days}d</span>
      )}
      {removable && (
        <span style={{
          color: window.MG.text3, fontSize: 14, lineHeight: 1, marginLeft: 2,
        }}>×</span>
      )}
    </span>
  );
}

function SuggestionRow({ initial, name, relation, days, last }) {
  const M = window.MG;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      borderBottom: last ? 'none' : `1px solid ${M.border}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 999, flexShrink: 0,
        background: 'linear-gradient(140deg, #2a3d33, #16241e)',
        border: `1px solid ${M.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: fSerif3, fontSize: 14, color: M.text2,
      }}>{initial}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: fBody3, fontSize: 14.5, color: M.text, fontWeight: 500,
          lineHeight: 1.2,
        }}>{name}</div>
        <div style={{
          fontFamily: fBody3, fontSize: 12, color: M.text3, marginTop: 2,
        }}>{relation}</div>
      </div>
      <div style={{
        fontFamily: fMono3, fontSize: 10, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: M.text3,
      }}>{days}d</div>
    </div>
  );
}

function QuickCaptureScreenV2() {
  const M = window.MG;
  return (
    <div style={{
      background: M.bg, color: M.text, minHeight: '100%',
      display: 'flex', flexDirection: 'column',
      paddingTop: 54, boxSizing: 'border-box',
    }}>
      {/* Sheet header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px 0',
      }}>
        <button style={{
          background: 'none', border: 'none', padding: 0,
          fontFamily: fBody3, fontSize: 15, color: M.text3,
        }}>Cancel</button>
        <div style={{
          fontFamily: fMono3, fontSize: 10.5, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: M.text3,
        }}>New idea</div>
        <div style={{ width: 50 }} />
      </div>

      {/* Single field — no competing headline. Just a generous serif input. */}
      <div style={{ padding: '24px 22px 16px' }}>
        <div style={{
          minHeight: 84, paddingBottom: 12,
          borderBottom: `1.5px solid ${M.brass}`,
          fontFamily: fSerif3, fontSize: 28, lineHeight: 1.25,
          color: M.text, position: 'relative',
        }}>
          Hand-thrown ceramic mug,<br/>cobalt blue
          <span style={{
            display: 'inline-block', width: 2, height: 30,
            background: M.brass, marginLeft: 3, verticalAlign: 'middle',
            animation: 'mgblink2 1s steps(2) infinite',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 8,
        }}>
          <span style={{
            fontFamily: fBody3, fontSize: 12, color: M.text3,
          }}>What did you think of?</span>
          <span style={{
            fontFamily: fMono3, fontSize: 10, color: M.text3,
          }}>32 / 200</span>
        </div>
      </div>

      {/* Clipboard preview */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{
          background: M.surface, border: `1px dashed ${M.borderHi}`,
          borderRadius: 12, padding: 12,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8, flexShrink: 0,
            background: '#5a4a3a',
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 4px, transparent 4px 8px)',
            border: `1px solid ${M.border}`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: fMono3, fontSize: 9.5, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: M.brass,
            }}>From clipboard</div>
            <div style={{
              fontFamily: fBody3, fontSize: 13, fontWeight: 500,
              color: M.text, marginTop: 2, lineHeight: 1.25,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>eastforkpottery.com/cobalt-mug</div>
          </div>
          <button style={{
            background: 'rgba(200,164,90,0.1)',
            border: `1px solid rgba(200,164,90,0.3)`,
            borderRadius: 999,
            padding: '5px 12px',
            color: M.brass, fontFamily: fMono3, fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>Attach</button>
        </div>
      </div>

      {/* For — typeahead w/ multi-select, current selection chips inline */}
      <div style={{ padding: '0 22px 0' }}>
        <div style={{
          fontFamily: fMono3, fontSize: 10.5, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: M.text3, marginBottom: 6,
        }}>For</div>
      </div>
      <div style={{ padding: '0 16px' }}>
        <div style={{
          background: M.surface, border: `1px solid ${M.border}`,
          borderRadius: 12, padding: '10px 12px',
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          minHeight: 44, boxSizing: 'border-box',
        }}>
          <PersonPill initial="E" name="Mom" days={18} removable />
          <span style={{
            flex: 1, minWidth: 80,
            fontFamily: fBody3, fontSize: 14, color: M.text3,
          }}>
            <span style={{
              display: 'inline-block', width: 1.5, height: 16,
              background: M.brass, marginLeft: 1, verticalAlign: 'middle',
              animation: 'mgblink2 1s steps(2) infinite',
            }} />
            <span style={{ marginLeft: 6, opacity: 0.7 }}>add another…</span>
          </span>
        </div>
      </div>

      {/* Optional row — Price + Occasion, equal heights, occasion defaults to Anytime */}
      <div style={{
        padding: '18px 16px 0',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
      }}>
        <div>
          <div style={{
            fontFamily: fMono3, fontSize: 9.5, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: M.text3, marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>Price <span style={{ color: M.text3, opacity: 0.5 }}>· optional</span></div>
          <div style={{
            background: M.surface, border: `1px solid ${M.border}`,
            borderRadius: 10, padding: '10px 12px', height: 42, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center',
            fontFamily: fBody3, fontSize: 14, color: M.text3,
          }}>$ —</div>
        </div>
        <div>
          <div style={{
            fontFamily: fMono3, fontSize: 9.5, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: M.text3, marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>Occasion <span style={{ color: M.text3, opacity: 0.5 }}>· optional</span></div>
          <div style={{
            background: M.surface, border: `1px solid ${M.border}`,
            borderRadius: 10, padding: '10px 12px', height: 42, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: fBody3, fontSize: 14, color: M.text3,
          }}>
            Anytime
            <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
              <path d="M1 1l3.5 3.5L8 1" stroke={M.text3} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 16 }} />

      {/* Save bar */}
      <div style={{
        padding: '12px 16px 16px',
        background: M.bg, borderTop: `1px solid ${M.border}`,
      }}>
        <button style={{
          width: '100%', padding: '15px 18px',
          background: M.brass, color: M.bg,
          border: 'none', borderRadius: 14,
          fontFamily: fBody3, fontSize: 16, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 6px 20px -8px rgba(200,164,90,0.5)',
        }}>
          Save for Mom
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 4" stroke={M.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <style>{`@keyframes mgblink2 { 50% { opacity: 0; } }`}</style>
    </div>
  );
}

window.QuickCaptureScreenV2 = QuickCaptureScreenV2;
