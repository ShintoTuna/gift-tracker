// PersonCard v2 — compact header, inline avatar, multiple notes, simplified gift states

const MG = window.MG || {
  bg: '#0F1A16', surface: '#16241E', surfaceHi: '#1c2d26',
  border: '#213830', borderHi: '#2a4338',
  text: '#E8E1CF', text2: '#a8b5a8', text3: '#8a9a8f',
  brass: '#C8A45A', brassDim: '#a08735', claret: '#A04545', fern: '#5a8a6a',
};
window.MG = MG;

const fSerif = "'DM Serif Display', Georgia, serif";
const fBody = "'Work Sans', -apple-system, system-ui, sans-serif";
const fMono = "'IBM Plex Mono', ui-monospace, monospace";

function Eyebrow2({ children, color = MG.text3, style = {} }) {
  return (
    <div style={{
      fontFamily: fMono, fontSize: 10.5, letterSpacing: '0.16em',
      textTransform: 'uppercase', color, ...style,
    }}>{children}</div>
  );
}

function Chip2({ label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '6px 12px', borderRadius: 999,
      background: MG.surfaceHi,
      border: `1px solid ${MG.border}`,
      color: MG.text,
      fontFamily: fBody, fontSize: 13, fontWeight: 500,
    }}>{label}</span>
  );
}

function GiftCardV2({ thumb, title, source, price, given, givenWhen, occasion }) {
  return (
    <div style={{
      display: 'flex', gap: 12, padding: 12,
      background: given ? 'transparent' : MG.surface,
      border: `1px solid ${given ? MG.border : MG.border}`,
      borderRadius: 14,
      opacity: given ? 0.65 : 1,
    }}>
      <div style={{
        width: 54, height: 54, borderRadius: 10, flexShrink: 0,
        background: thumb,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 4px, transparent 4px 8px)',
        border: `1px solid ${MG.border}`,
        position: 'relative',
      }}>
        {given && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 10,
            background: 'rgba(15,26,22,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" stroke={MG.fern} strokeWidth="1.5"/>
              <path d="M6 11l3.5 3.5L16 7" stroke={MG.fern} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: fBody, fontSize: 14.5, fontWeight: 500,
          color: MG.text, lineHeight: 1.3,
          textDecoration: given ? 'line-through' : 'none',
          textDecorationColor: MG.text3,
        }}>{title}</div>
        <div style={{
          fontFamily: fBody, fontSize: 12, color: MG.text3, marginTop: 3,
        }}>{source}</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 6,
          fontFamily: fBody, fontSize: 12.5,
        }}>
          <span style={{ color: MG.text2, fontWeight: 500 }}>{price}</span>
          {given && (
            <>
              <span style={{ color: MG.borderHi }}>·</span>
              <span style={{ color: MG.fern, fontFamily: fMono, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Given {givenWhen} · {occasion}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteBlock({ date, body }) {
  return (
    <div style={{
      padding: '14px 16px', background: MG.surface,
      border: `1px solid ${MG.border}`, borderRadius: 12,
    }}>
      <div style={{
        fontFamily: fMono, fontSize: 10, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: MG.text3, marginBottom: 6,
      }}>{date}</div>
      <div style={{
        fontFamily: fBody, fontSize: 14, lineHeight: 1.55,
        color: MG.text2,
      }}>{body}</div>
    </div>
  );
}

function PersonProfileScreenV2() {
  return (
    <div style={{
      background: MG.bg, color: MG.text, minHeight: '100%',
      paddingBottom: 40,
    }}>
      <div style={{ height: 54 }} />

      {/* Nav row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '0 16px', marginBottom: 24,
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

      {/* Compact inline header — avatar + name + relation */}
      <div style={{
        padding: '0 22px', marginBottom: 28,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 999, flexShrink: 0,
          background: 'linear-gradient(140deg, #2a3d33, #16241e)',
          border: `1px solid ${MG.brass}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: fSerif, fontSize: 24, color: MG.brass,
        }}>E</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontFamily: fSerif, fontSize: 30, lineHeight: 1.0,
            color: MG.text, margin: 0, letterSpacing: -0.3,
          }}>Eleanor</h1>
          <div style={{
            fontFamily: fBody, fontSize: 13.5, color: MG.text3, marginTop: 4,
          }}>Mom · 67 · Portland</div>
        </div>
      </div>

      {/* Upcoming occasion — toned-down countdown */}
      <div style={{
        margin: '0 16px 22px',
        background: `linear-gradient(135deg, ${MG.surfaceHi} 0%, ${MG.surface} 100%)`,
        border: `1px solid ${MG.borderHi}`,
        borderRadius: 18, padding: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Eyebrow2 color={MG.brass}>Next occasion</Eyebrow2>
            <div style={{
              fontFamily: fSerif, fontSize: 22, color: MG.text,
              marginTop: 4, lineHeight: 1.1,
            }}>Birthday</div>
            <div style={{
              fontFamily: fBody, fontSize: 13, color: MG.text2, marginTop: 4,
            }}>May 14 · Wednesday</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: fSerif, fontSize: 24, color: MG.brass, lineHeight: 1,
            }}>18 days</div>
            <div style={{
              fontFamily: fBody, fontSize: 12, color: MG.text3, marginTop: 4,
            }}>away</div>
          </div>
        </div>
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: `1px solid ${MG.border}`,
          display: 'flex', gap: 14, fontFamily: fBody, fontSize: 12,
          color: MG.text3,
        }}>
          <span>+ Anniversary · Aug 22</span>
          <span style={{ color: MG.borderHi }}>·</span>
          <span>+ Christmas</span>
        </div>
      </div>

      {/* AI CTA */}
      <div style={{ padding: '0 16px', marginBottom: 32 }}>
        <button style={{
          width: '100%', padding: '15px 18px',
          background: MG.brass, color: MG.bg,
          border: 'none', borderRadius: 14,
          fontFamily: fBody, fontSize: 15.5, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 6px 20px -8px rgba(200,164,90,0.5)',
          cursor: 'pointer',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5l2 4.5 4.5 1L12 10.5l1 4.5L9 12.5l-4 2.5 1-4.5L2.5 7l4.5-1z" fill={MG.bg} fillOpacity="0.85"/>
            </svg>
            Help me find a gift
          </span>
          <span style={{
            fontFamily: fMono, fontSize: 10, letterSpacing: '0.16em',
            textTransform: 'uppercase', opacity: 0.6,
          }}>AI</span>
        </button>
      </div>

      {/* Interests */}
      <div style={{ padding: '0 22px', marginBottom: 36 }}>
        <Eyebrow2 style={{ marginBottom: 12 }}>Interests</Eyebrow2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Chip2 label="gardening" />
          <Chip2 label="Italian wine" />
          <Chip2 label="true crime podcasts" />
          <Chip2 label="hand pottery" />
          <Chip2 label="baking sourdough" />
          <Chip2 label="hiking" />
          <Chip2 label="Sunday crosswords" />
          <Chip2 label="+" />
        </div>
      </div>

      {/* Notes — multiple blocks, dated, additive */}
      <div style={{ padding: '0 16px', marginBottom: 36 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 6px', marginBottom: 12,
        }}>
          <Eyebrow2>Notes <span style={{ color: MG.text3, opacity: 0.5 }}>· private</span></Eyebrow2>
          <span style={{
            fontFamily: fMono, fontSize: 10, color: MG.brass,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>+ Add</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <NoteBlock
            date="Apr 12, 2026"
            body="She mentioned wanting a sourdough starter at Easter dinner. Already has too many mugs (her words) — focus on cookbooks, garden tools, or experiences."
          />
          <NoteBlock
            date="Feb 3, 2026"
            body="Started taking Italian classes Tuesday evenings. Talked about wanting to visit the Amalfi coast in 2027 — anniversary trip ideas?"
          />
          <NoteBlock
            date="Nov 22, 2025"
            body="Allergic to lavender. Don't gift anything scented."
          />
        </div>
      </div>

      {/* Saved gift ideas */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          padding: '0 22px', marginBottom: 12,
        }}>
          <Eyebrow2>Gift ideas <span style={{ color: MG.text3, opacity: 0.5 }}>· 5</span></Eyebrow2>
          <span style={{
            fontFamily: fMono, fontSize: 10, color: MG.brass,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>+ Add</span>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <GiftCardV2 thumb="#3a4a4a" title="Tartine Bread cookbook" source="Powell's Books" price="$40" />
          <GiftCardV2 thumb="#5a4a3a" title="Hand-thrown ceramic mug, cobalt" source="East Fork Pottery" price="$58" />
          <GiftCardV2 thumb="#3a4a3a" title="Felco pruning shears (F-2)" source="Garden Tool Co." price="$62" />
          <GiftCardV2 thumb="#4a3a4a" title="Italian wine club, 3-month" source="Saved from link" price="$120/mo" />
        </div>

        {/* Given section — same component, 'given' state */}
        <div style={{ padding: '0 22px', marginTop: 18, marginBottom: 12 }}>
          <Eyebrow2 color={MG.text3}>Given <span style={{ opacity: 0.5 }}>· 3</span></Eyebrow2>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <GiftCardV2
            thumb="#3a3a4a" title="Linen apron, dyed indigo"
            source="—" price="$48"
            given givenWhen="May 2025" occasion="Mother's Day"
          />
          <GiftCardV2
            thumb="#4a3a3a" title="Le Creuset dutch oven, sage"
            source="—" price="$280"
            given givenWhen="May 2024" occasion="Birthday · 66th"
          />
        </div>

        <div style={{
          margin: '14px 22px 0',
          fontFamily: fMono, fontSize: 10, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: MG.brass, textAlign: 'center',
          padding: '12px 0',
          borderTop: `1px solid ${MG.border}`,
        }}>See full history →</div>
      </div>
    </div>
  );
}

window.PersonProfileScreenV2 = PersonProfileScreenV2;
