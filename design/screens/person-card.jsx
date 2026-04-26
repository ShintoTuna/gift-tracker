// PersonCard.jsx — Screen A: Person Profile (Midnight Garden, dark)

const MG = {
  bg: '#0F1A16',
  surface: '#16241E',
  surfaceHi: '#1c2d26',
  border: '#213830',
  borderHi: '#2a4338',
  text: '#E8E1CF',
  text2: '#a8b5a8',
  text3: '#8a9a8f',
  brass: '#C8A45A',
  brassDim: '#a08735',
  claret: '#A04545',
  fern: '#5a8a6a',
};

const fSerif = "'DM Serif Display', Georgia, serif";
const fSerifBody = "'Spectral', Georgia, serif";
const fBody = "'Work Sans', -apple-system, system-ui, sans-serif";
const fMono = "'IBM Plex Mono', ui-monospace, monospace";

function Eyebrow({ children, color = MG.text3, style = {} }) {
  return (
    <div style={{
      fontFamily: fMono, fontSize: 10, letterSpacing: '0.18em',
      textTransform: 'uppercase', color, ...style,
    }}>{children}</div>
  );
}

function Chip({ label, brass = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 10px', borderRadius: 999,
      background: brass ? 'rgba(200,164,90,0.12)' : MG.surfaceHi,
      border: `1px solid ${brass ? 'rgba(200,164,90,0.3)' : MG.border}`,
      color: brass ? MG.brass : MG.text,
      fontFamily: fBody, fontSize: 12.5, fontWeight: 500,
      letterSpacing: 0.1,
    }}>{label}</span>
  );
}

function GiftCard({ thumb, title, price, status, source }) {
  const statusColors = {
    'idea':     { bg: 'rgba(168,181,168,0.12)', fg: MG.text2, dot: MG.text3, label: 'Idea' },
    'shortlist':{ bg: 'rgba(200,164,90,0.14)',  fg: MG.brass, dot: MG.brass,  label: 'Shortlist' },
    'ordered':  { bg: 'rgba(90,138,106,0.18)',  fg: MG.fern,  dot: MG.fern,   label: 'Ordered' },
  };
  const s = statusColors[status];
  return (
    <div style={{
      display: 'flex', gap: 12, padding: 12,
      background: MG.surface, border: `1px solid ${MG.border}`,
      borderRadius: 16,
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 10, flexShrink: 0,
        background: thumb,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 4px, transparent 4px 8px)',
        border: `1px solid ${MG.border}`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: fBody, fontSize: 14.5, fontWeight: 500,
          color: MG.text, lineHeight: 1.25,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</div>
        <div style={{
          fontFamily: fMono, fontSize: 11, color: MG.text3, marginTop: 2,
        }}>{source}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <span style={{
            fontFamily: fBody, fontSize: 13, fontWeight: 600, color: MG.text,
          }}>{price}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 8px', borderRadius: 999,
            background: s.bg, color: s.fg,
            fontFamily: fMono, fontSize: 9.5, letterSpacing: '0.14em',
            textTransform: 'uppercase', fontWeight: 500,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: s.dot }} />
            {s.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ year, gift, occasion, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 14,
      padding: '12px 0',
      borderBottom: last ? 'none' : `1px solid ${MG.border}`,
    }}>
      <div style={{
        fontFamily: fSerif, fontSize: 18, fontStyle: 'italic',
        color: MG.brass, width: 44, flexShrink: 0,
      }}>{year}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: fBody, fontSize: 14, fontWeight: 500, color: MG.text,
          lineHeight: 1.3,
        }}>{gift}</div>
        <div style={{
          fontFamily: fMono, fontSize: 10.5, color: MG.text3, marginTop: 2,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>{occasion}</div>
      </div>
    </div>
  );
}

function PersonProfileScreen() {
  return (
    <div style={{
      background: MG.bg, color: MG.text, minHeight: '100%',
      paddingBottom: 40,
    }}>
      {/* Top inset under status bar */}
      <div style={{ height: 54 }} />

      {/* Nav row — pills */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '0 16px', marginBottom: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 999,
          background: MG.surface, border: `1px solid ${MG.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="9" height="14" viewBox="0 0 9 14" fill="none">
            <path d="M7.5 1.5L1.5 7l6 5.5" stroke={MG.text2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 999,
            background: MG.surface, border: `1px solid ${MG.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8z" stroke={MG.text2} strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 999,
            background: MG.surface, border: `1px solid ${MG.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="4" viewBox="0 0 18 4">
              <circle cx="2" cy="2" r="1.6" fill={MG.text2}/>
              <circle cx="9" cy="2" r="1.6" fill={MG.text2}/>
              <circle cx="16" cy="2" r="1.6" fill={MG.text2}/>
            </svg>
          </div>
        </div>
      </div>

      {/* Header — avatar + name */}
      <div style={{ padding: '0 22px', marginBottom: 22 }}>
        <div style={{
          width: 84, height: 84, borderRadius: 999,
          background: 'linear-gradient(140deg, #2a3d33, #16241e)',
          border: `1.5px solid ${MG.brass}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: fSerif, fontSize: 36, color: MG.brass,
          marginBottom: 16,
        }}>E</div>

        <Eyebrow color={MG.brass} style={{ marginBottom: 4 }}>Mom</Eyebrow>
        <h1 style={{
          fontFamily: fSerif, fontSize: 40, lineHeight: 1.0,
          color: MG.text, margin: 0, letterSpacing: -0.5,
        }}>Eleanor</h1>
        <div style={{
          fontFamily: fSerifBody, fontSize: 15, fontStyle: 'italic',
          color: MG.text3, marginTop: 6,
        }}>67 · Portland, OR · added Jan 2024</div>
      </div>

      {/* Upcoming occasion — featured banner */}
      <div style={{
        margin: '0 16px 22px',
        background: `linear-gradient(135deg, ${MG.surfaceHi} 0%, ${MG.surface} 100%)`,
        border: `1px solid ${MG.borderHi}`,
        borderRadius: 18,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 90, height: '100%',
          background: 'radial-gradient(circle at top right, rgba(200,164,90,0.18), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <Eyebrow color={MG.brass}>Next occasion</Eyebrow>
            <div style={{
              fontFamily: fSerif, fontSize: 24, color: MG.text,
              marginTop: 4, lineHeight: 1.1,
            }}>Birthday</div>
            <div style={{
              fontFamily: fBody, fontSize: 13, color: MG.text2, marginTop: 4,
            }}>May 14 · Wednesday</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: fSerif, fontSize: 44, color: MG.brass,
              lineHeight: 1, fontStyle: 'italic',
            }}>18</div>
            <Eyebrow color={MG.text3} style={{ marginTop: 2 }}>days away</Eyebrow>
          </div>
        </div>
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: `1px solid ${MG.border}`,
          display: 'flex', gap: 14, fontFamily: fMono, fontSize: 10.5,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: MG.text3,
        }}>
          <span>+ Anniversary · Aug 22</span>
          <span style={{ color: MG.borderHi }}>·</span>
          <span>+ Christmas</span>
        </div>
      </div>

      {/* Help me find a gift — primary CTA */}
      <div style={{ padding: '0 16px', marginBottom: 28 }}>
        <button style={{
          width: '100%', padding: '16px 18px',
          background: MG.brass, color: MG.bg,
          border: 'none', borderRadius: 16,
          fontFamily: fBody, fontSize: 16, fontWeight: 600,
          letterSpacing: 0.1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 6px 20px -8px rgba(200,164,90,0.5)',
          cursor: 'pointer',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5l2 4.5 4.5 1L12 10.5l1 4.5L9 12.5l-4 2.5 1-4.5L2.5 7l4.5-1z" fill={MG.bg} fillOpacity="0.85"/>
            </svg>
            Help me find a gift
          </span>
          <span style={{
            fontFamily: fMono, fontSize: 10, letterSpacing: '0.16em',
            textTransform: 'uppercase', opacity: 0.6,
          }}>AI</span>
        </button>
        <div style={{
          fontFamily: fSerifBody, fontSize: 12.5, fontStyle: 'italic',
          color: MG.text3, marginTop: 10, textAlign: 'center',
        }}>Suggests 5 ideas based on her interests &amp; past gifts</div>
      </div>

      {/* Interests */}
      <div style={{ padding: '0 22px', marginBottom: 28 }}>
        <Eyebrow style={{ marginBottom: 12 }}>Interests</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Chip label="gardening" />
          <Chip label="Italian wine" />
          <Chip label="true crime podcasts" />
          <Chip label="hand pottery" />
          <Chip label="baking sourdough" />
          <Chip label="hiking" />
          <Chip label="Sunday crosswords" />
        </div>
      </div>

      {/* Notes */}
      <div style={{ padding: '0 22px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Eyebrow>Notes <span style={{ color: MG.text3, opacity: 0.6 }}>· private</span></Eyebrow>
          <span style={{
            fontFamily: fMono, fontSize: 10, color: MG.brass,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>Edit</span>
        </div>
        <div style={{
          background: MG.surface, border: `1px solid ${MG.border}`,
          borderRadius: 14, padding: 14,
          fontFamily: fSerifBody, fontSize: 14.5, lineHeight: 1.55,
          color: MG.text2, fontStyle: 'italic',
        }}>
          "Mentioned wanting a sourdough starter at Christmas dinner. Already has too many mugs (her words) — focus on cookbooks, garden tools, or experiences. Allergic to lavender."
        </div>
      </div>

      {/* Saved gift ideas */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          padding: '0 22px', marginBottom: 12,
        }}>
          <Eyebrow>Saved ideas <span style={{ color: MG.text3, opacity: 0.6 }}>· 4</span></Eyebrow>
          <span style={{
            fontFamily: fMono, fontSize: 10, color: MG.brass,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>+ Add</span>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <GiftCard thumb="#3a4a4a" title="Tartine Bread cookbook" price="$40" status="ordered" source="Powell's Books" />
          <GiftCard thumb="#5a4a3a" title="Hand-thrown ceramic mug, cobalt" price="$58" status="shortlist" source="East Fork Pottery" />
          <GiftCard thumb="#3a4a3a" title="Felco pruning shears (F-2)" price="$62" status="shortlist" source="Garden Tool Co." />
          <GiftCard thumb="#4a3a4a" title="Italian wine club, 3-month" price="$120/mo" status="idea" source="link saved · Apr 14" />
        </div>
      </div>

      {/* Gift history */}
      <div style={{ padding: '0 22px' }}>
        <Eyebrow style={{ marginBottom: 4 }}>Already given</Eyebrow>
        <div style={{
          fontFamily: fSerifBody, fontSize: 13, fontStyle: 'italic',
          color: MG.text3, marginBottom: 8,
        }}>So you don't repeat yourself.</div>

        <div>
          <HistoryRow year="2025" gift="Linen apron, dyed indigo" occasion="Mother's Day" />
          <HistoryRow year="2024" gift="Le Creuset dutch oven, sage" occasion="Birthday · 66th" />
          <HistoryRow year="2024" gift="Two tickets — opera in the park" occasion="Anniversary" />
          <HistoryRow year="2023" gift="Hardcover — Italian Garden Almanac" occasion="Christmas" last />
        </div>

        <div style={{
          marginTop: 14,
          fontFamily: fMono, fontSize: 10, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: MG.brass, textAlign: 'center',
          padding: '12px 0',
          borderTop: `1px solid ${MG.border}`,
        }}>See all 11 →</div>
      </div>
    </div>
  );
}

window.PersonProfileScreen = PersonProfileScreen;
window.MG = MG;
