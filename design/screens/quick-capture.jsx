// QuickCapture.jsx — Screen B: Minimal capture sheet (Midnight Garden)

const fSerif2 = "'DM Serif Display', Georgia, serif";
const fSerifBody2 = "'Spectral', Georgia, serif";
const fBody2 = "'Work Sans', -apple-system, system-ui, sans-serif";
const fMono2 = "'IBM Plex Mono', ui-monospace, monospace";

function PersonSuggestion({ initial, name, relation, days, selected }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px 8px 8px',
      background: selected ? 'rgba(200,164,90,0.15)' : MG.surface,
      border: `1px solid ${selected ? 'rgba(200,164,90,0.5)' : MG.border}`,
      borderRadius: 999, flexShrink: 0,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 999,
        background: 'linear-gradient(140deg, #2a3d33, #16241e)',
        border: `1px solid ${selected ? MG.brass : MG.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: fSerif2, fontSize: 14,
        color: selected ? MG.brass : MG.text2,
      }}>{initial}</div>
      <div>
        <div style={{
          fontFamily: fBody2, fontSize: 14, fontWeight: 500,
          color: selected ? MG.text : MG.text, lineHeight: 1.1,
        }}>{name}</div>
        <div style={{
          fontFamily: fMono2, fontSize: 9.5, letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: selected ? MG.brass : MG.text3, marginTop: 2,
        }}>{relation} · {days}d</div>
      </div>
    </div>
  );
}

function QuickCaptureScreen() {
  return (
    <div style={{
      background: MG.bg, color: MG.text, minHeight: '100%',
      display: 'flex', flexDirection: 'column',
      paddingTop: 54,
    }}>
      {/* Sheet handle / cancel */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px 0',
      }}>
        <button style={{
          background: 'none', border: 'none', padding: 0,
          fontFamily: fBody2, fontSize: 15, color: MG.text3,
          cursor: 'pointer',
        }}>Cancel</button>
        <Eyebrow color={MG.text3}>Quick capture</Eyebrow>
        <div style={{ width: 50 }} />
      </div>

      {/* Headline */}
      <div style={{ padding: '24px 22px 6px' }}>
        <div style={{
          fontFamily: fSerif2, fontSize: 30, lineHeight: 1.05,
          color: MG.text, letterSpacing: -0.4,
        }}>What did you<br/>think of?</div>
        <div style={{
          fontFamily: fSerifBody2, fontSize: 14.5, fontStyle: 'italic',
          color: MG.text3, marginTop: 8,
        }}>One sentence is plenty. We'll fill in the rest later.</div>
      </div>

      {/* Idea field — autofocused */}
      <div style={{ padding: '20px 22px 8px' }}>
        <div style={{
          minHeight: 88, padding: '0 0 14px',
          borderBottom: `1.5px solid ${MG.brass}`,
          fontFamily: fSerif2, fontSize: 26, lineHeight: 1.25,
          color: MG.text, fontStyle: 'italic',
          position: 'relative',
        }}>
          Hand-thrown ceramic mug,<br/>cobalt blue
          <span style={{
            display: 'inline-block', width: 2, height: 28,
            background: MG.brass, marginLeft: 3, verticalAlign: 'middle',
            animation: 'mgblink 1s steps(2) infinite',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 6,
        }}>
          <Eyebrow color={MG.text3}>The idea</Eyebrow>
          <span style={{
            fontFamily: fMono2, fontSize: 10, color: MG.text3,
          }}>32 / 200</span>
        </div>
      </div>

      {/* URL preview card (auto-detected from clipboard) */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          background: MG.surface, border: `1px dashed ${MG.borderHi}`,
          borderRadius: 14, padding: 12,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8, flexShrink: 0,
            background: '#5a4a3a',
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 4px, transparent 4px 8px)',
            border: `1px solid ${MG.border}`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: fMono2, fontSize: 9.5, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: MG.brass,
            }}>From clipboard</div>
            <div style={{
              fontFamily: fBody2, fontSize: 13.5, fontWeight: 500,
              color: MG.text, marginTop: 2, lineHeight: 1.25,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>eastforkpottery.com/cobalt-mug</div>
          </div>
          <button style={{
            background: 'rgba(200,164,90,0.1)',
            border: `1px solid rgba(200,164,90,0.3)`,
            borderRadius: 999,
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: MG.brass, fontFamily: fBody2, fontSize: 18, fontWeight: 400,
            lineHeight: 1, padding: 0, cursor: 'pointer',
          }}>+</button>
        </div>
      </div>

      {/* For whom */}
      <div style={{ padding: '24px 22px 0' }}>
        <Eyebrow style={{ marginBottom: 10 }}>For —</Eyebrow>
      </div>
      <div style={{
        display: 'flex', gap: 8, padding: '0 16px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        <PersonSuggestion initial="E" name="Mom" relation="Eleanor" days={18} selected />
        <PersonSuggestion initial="J" name="Jamie" relation="Sister" days={42} />
        <PersonSuggestion initial="K" name="Kira" relation="Best friend" days={6} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          background: 'transparent', border: `1px dashed ${MG.borderHi}`,
          borderRadius: 999, color: MG.text3, flexShrink: 0,
        }}>
          <span style={{ fontFamily: fBody2, fontSize: 13 }}>+ Someone else</span>
        </div>
      </div>

      {/* Price + Occasion — secondary, optional */}
      <div style={{
        padding: '24px 22px 0', display: 'grid',
        gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        <div>
          <Eyebrow style={{ marginBottom: 6 }}>Est. price</Eyebrow>
          <div style={{
            background: MG.surface, border: `1px solid ${MG.border}`,
            borderRadius: 12, padding: '10px 12px',
            fontFamily: fSerif2, fontSize: 18, color: MG.text,
          }}>$58<span style={{
            fontFamily: fMono2, fontSize: 10, color: MG.text3,
            marginLeft: 6, letterSpacing: '0.1em',
          }}>USD</span></div>
        </div>
        <div>
          <Eyebrow style={{ marginBottom: 6 }}>Occasion</Eyebrow>
          <div style={{
            background: MG.surface, border: `1px solid ${MG.border}`,
            borderRadius: 12, padding: '10px 12px',
            fontFamily: fBody2, fontSize: 14, color: MG.brass,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            Birthday
            <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
              <path d="M1 1l3.5 3.5L8 1" stroke={MG.brass} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Spacer pushes save to bottom */}
      <div style={{ flex: 1 }} />

      {/* Save bar */}
      <div style={{
        padding: '14px 16px 18px',
        background: MG.bg,
        borderTop: `1px solid ${MG.border}`,
      }}>
        <button style={{
          width: '100%', padding: '15px 18px',
          background: MG.brass, color: MG.bg,
          border: 'none', borderRadius: 14,
          fontFamily: fBody2, fontSize: 16, fontWeight: 600,
          letterSpacing: 0.1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 6px 20px -8px rgba(200,164,90,0.5)',
        }}>
          Save for Mom
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 4" stroke={MG.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{
          fontFamily: fMono2, fontSize: 10, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: MG.text3,
          textAlign: 'center', marginTop: 12,
        }}>
          ⌘ + Enter <span style={{ opacity: 0.5 }}>·</span> swipe down to dismiss
        </div>
      </div>

      <style>{`@keyframes mgblink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}

window.QuickCaptureScreen = QuickCaptureScreen;
