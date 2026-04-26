// Midnight Garden — Design System reference doc
// Renders foundations, components, and dev API on one page

// ─────────────────────────────────────────────
// TOKENS — the source of truth
// ─────────────────────────────────────────────
const T = {
  // Color (dark mode is canonical)
  color: {
    bg:        { val: '#0F1A16', name: '--mg-bg',        role: 'App background' },
    surface:   { val: '#16241E', name: '--mg-surface',   role: 'Cards, inputs, raised surfaces' },
    surfaceHi: { val: '#1C2D26', name: '--mg-surface-2', role: 'Hover, selected, nested cards' },
    border:    { val: '#213830', name: '--mg-border',    role: 'Default border / divider' },
    borderHi:  { val: '#2A4338', name: '--mg-border-2',  role: 'Strong divider, focused borders' },
    text:      { val: '#E8E1CF', name: '--mg-text',      role: 'Primary text · serif headings, body emphasis' },
    text2:     { val: '#A8B5A8', name: '--mg-text-2',    role: 'Secondary text · meta, descriptions' },
    text3:     { val: '#8A9A8F', name: '--mg-text-3',    role: 'Tertiary · labels, placeholders, mono micro' },
    brass:     { val: '#C8A45A', name: '--mg-brass',     role: 'PRIMARY ACTION ONLY · see brass rules below' },
    brassDim:  { val: '#A08735', name: '--mg-brass-dim', role: 'Brass on hover / pressed' },
    claret:    { val: '#A04545', name: '--mg-claret',    role: 'Urgency · "this week" · time-sensitive' },
    fern:      { val: '#5A8A6A', name: '--mg-fern',      role: 'Positive state · "ideas exist", filter active, success' },
  },

  // Type scale — 6 sizes. Anything outside this is a bug.
  type: [
    { px: 11, name: '--type-mono',    family: 'IBM Plex Mono',    use: 'Labels, eyebrows, micro-meta, structural counters', tracking: '0.16em', case: 'UPPER' },
    { px: 13, name: '--type-meta',    family: 'Work Sans',        use: 'Secondary text, descriptions, captions',            tracking: 'normal',  case: 'normal' },
    { px: 15, name: '--type-body',    family: 'Work Sans',        use: 'Primary body, button labels, input text',           tracking: 'normal',  case: 'normal' },
    { px: 18, name: '--type-row',     family: 'DM Serif Display', use: 'Row titles, person names in lists, idea titles',    tracking: 'normal',  case: 'normal' },
    { px: 24, name: '--type-section', family: 'DM Serif Display', use: 'Section headers, "Birthday" on profile',            tracking: '-0.2px',  case: 'normal' },
    { px: 32, name: '--type-screen',  family: 'DM Serif Display', use: 'Screen titles ("People", "Upcoming")',              tracking: '-0.4px',  case: 'normal' },
  ],
  // The Profile hero number (large brass numeral) is allowed at 44px — single exception.

  // Space — 4px base
  space: [
    { px: 4,  name: '--sp-1',  use: 'Tight icon gaps, inline meta separators' },
    { px: 8,  name: '--sp-2',  use: 'Chip internal, small group gaps' },
    { px: 12, name: '--sp-3',  use: 'Card internal gap, row internal gap' },
    { px: 14, name: '--sp-4',  use: 'Card padding (DEFAULT for all cards)' },
    { px: 16, name: '--sp-5',  use: 'Edge inset on phone screens' },
    { px: 22, name: '--sp-6',  use: 'Generous edge inset (titles, copy blocks)' },
    { px: 32, name: '--sp-7',  use: 'Section break' },
  ],

  // Radius
  radius: [
    { px: 8,   name: '--r-sm',  use: 'Small UI · date blocks, small thumbs' },
    { px: 12,  name: '--r-md',  use: 'Inputs, search bars' },
    { px: 14,  name: '--r-lg',  use: 'Cards (DEFAULT)' },
    { px: 999, name: '--r-pill',use: 'Pills, avatars, chip filters' },
  ],

  // Avatar — three sizes only
  avatar: [
    { px: 22, name: 'avatar-stack',  use: 'Avatar stacks on idea cards (max 3 visible, then +N)' },
    { px: 40, name: 'avatar-row',    use: 'List rows (People, Calendar, Person picker)' },
    { px: 56, name: 'avatar-hero',   use: 'Profile screen header' },
  ],

  // Border — 1px solid for everything; 1px dashed for "add" placeholders
};

// ─────────────────────────────────────────────
// Page-level chrome
// ─────────────────────────────────────────────
function Hero() {
  return (
    <header style={{
      padding: '64px 64px 48px',
      borderBottom: `1px solid ${T.color.border.val}`,
      maxWidth: 1200, margin: '0 auto',
    }}>
      <div style={S.eyebrow}>Midnight Garden · v1.0 · Design System</div>
      <h1 style={{
        fontFamily: 'DM Serif Display', fontSize: 56, lineHeight: 1.0,
        color: T.color.text.val, margin: '16px 0 0', letterSpacing: -0.8,
      }}>The system, written down.</h1>
      <p style={{
        fontFamily: 'Work Sans', fontSize: 17, lineHeight: 1.55,
        color: T.color.text2.val, marginTop: 18, maxWidth: 720,
      }}>
        One palette, six type sizes, three avatar sizes, one job for brass. Everything in
        the six existing screens reduces to the components below. If something on screen
        doesn't appear here, it's drift — list it in the migration table at the bottom.
      </p>
      <div style={{
        marginTop: 24, display: 'flex', gap: 24,
        fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: T.color.text3.val,
      }}>
        <a href="#tokens" style={S.navLink}>01 Foundations</a>
        <a href="#brass" style={S.navLink}>02 Brass rules</a>
        <a href="#components" style={S.navLink}>03 Components</a>
        <a href="#patterns" style={S.navLink}>04 Patterns</a>
        <a href="#migration" style={S.navLink}>05 Migration</a>
      </div>
    </header>
  );
}

function Section({ id, num, title, sub, children }) {
  return (
    <section id={id} style={{
      maxWidth: 1200, margin: '0 auto',
      padding: '64px 64px 16px',
      borderBottom: `1px solid ${T.color.border.val}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 8,
      }}>
        <span style={{
          fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: T.color.brass.val,
        }}>{num}</span>
        <h2 style={{
          fontFamily: 'DM Serif Display', fontSize: 36, lineHeight: 1.05,
          color: T.color.text.val, margin: 0, letterSpacing: -0.4,
        }}>{title}</h2>
      </div>
      {sub && <p style={{
        fontFamily: 'Work Sans', fontSize: 15, lineHeight: 1.55,
        color: T.color.text2.val, margin: '0 0 32px', maxWidth: 680,
      }}>{sub}</p>}
      {children}
    </section>
  );
}

function SubSection({ title, children, last }) {
  return (
    <div style={{ marginBottom: last ? 32 : 56 }}>
      <h3 style={{
        fontFamily: 'DM Serif Display', fontSize: 22, color: T.color.text.val,
        margin: '0 0 18px', fontStyle: 'italic',
      }}>{title}</h3>
      {children}
    </div>
  );
}

// shared inline styles
const S = {
  eyebrow: {
    fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: T.color.text3.val,
  },
  navLink: { color: T.color.text3.val, textDecoration: 'none' },
};

// ─────────────────────────────────────────────
// 01 — Color swatches
// ─────────────────────────────────────────────
function ColorTable() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
    }}>
      {Object.entries(T.color).map(([key, c]) => (
        <div key={key} style={{
          display: 'flex', gap: 14, padding: 14,
          background: T.color.surface.val,
          border: `1px solid ${T.color.border.val}`,
          borderRadius: 14,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8, flexShrink: 0,
            background: c.val,
            border: `1px solid ${T.color.border.val}`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11,
              color: T.color.brass.val, letterSpacing: '0.1em',
            }}>{c.name}</div>
            <div style={{
              fontFamily: 'DM Serif Display', fontSize: 19,
              color: T.color.text.val, marginTop: 2,
            }}>{key}</div>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11,
              color: T.color.text3.val, marginTop: 4,
            }}>{c.val}</div>
            <div style={{
              fontFamily: 'Work Sans', fontSize: 12.5,
              color: T.color.text2.val, marginTop: 6, lineHeight: 1.4,
            }}>{c.role}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 01 — Type scale
// ─────────────────────────────────────────────
function TypeTable() {
  return (
    <div style={{
      background: T.color.surface.val,
      border: `1px solid ${T.color.border.val}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      {T.type.map((t, i) => (
        <div key={t.name} style={{
          display: 'grid', gridTemplateColumns: '120px 1fr 240px',
          gap: 24, alignItems: 'center',
          padding: '18px 22px',
          borderBottom: i === T.type.length - 1 ? 'none' : `1px solid ${T.color.border.val}`,
        }}>
          <div>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.color.brass.val,
              letterSpacing: '0.1em',
            }}>{t.name}</div>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.color.text3.val,
              marginTop: 4,
            }}>{t.px}px · {t.family.split(' ')[0]}</div>
          </div>
          <div style={{
            fontFamily: t.family + ', system-ui',
            fontSize: t.px,
            color: T.color.text.val,
            letterSpacing: t.tracking === '0.16em' ? '0.16em' : t.tracking === '-0.2px' ? '-0.2px' : t.tracking === '-0.4px' ? '-0.4px' : 0,
            textTransform: t.case === 'UPPER' ? 'uppercase' : 'none',
          }}>
            {t.case === 'UPPER' ? 'Next occasion' : 'A bouquet of basil'}
          </div>
          <div style={{
            fontFamily: 'Work Sans', fontSize: 12.5, color: T.color.text2.val,
            lineHeight: 1.4,
          }}>{t.use}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 01 — Spacing, radius, avatar
// ─────────────────────────────────────────────
function ScaleTable({ items, render }) {
  return (
    <div style={{
      background: T.color.surface.val,
      border: `1px solid ${T.color.border.val}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      {items.map((it, i) => (
        <div key={it.name} style={{
          display: 'grid', gridTemplateColumns: '160px 200px 1fr',
          gap: 24, alignItems: 'center',
          padding: '14px 22px',
          borderBottom: i === items.length - 1 ? 'none' : `1px solid ${T.color.border.val}`,
        }}>
          <div>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.color.brass.val,
              letterSpacing: '0.1em',
            }}>{it.name}</div>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.color.text3.val, marginTop: 4,
            }}>{it.px}px</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', height: 60 }}>
            {render(it)}
          </div>
          <div style={{ fontFamily: 'Work Sans', fontSize: 12.5, color: T.color.text2.val, lineHeight: 1.4 }}>
            {it.use}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 02 — Brass rules
// ─────────────────────────────────────────────
function BrassRules() {
  return (
    <div style={{
      background: T.color.surface.val,
      border: `1px solid ${T.color.border.val}`,
      borderRadius: 14, padding: 28,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 999,
          background: T.color.brass.val,
        }} />
        <div>
          <div style={{
            fontFamily: 'DM Serif Display', fontSize: 24, color: T.color.text.val,
            fontStyle: 'italic',
          }}>Brass has one job.</div>
          <div style={{
            fontFamily: 'Work Sans', fontSize: 13, color: T.color.text2.val, marginTop: 2,
          }}>"This is the next thing to do, or the next thing to look at."</div>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24,
      }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: T.color.fern.val,
            marginBottom: 12,
          }}>✓ Use brass for</div>
          {[
            'Primary CTA buttons (Save, Adjust context)',
            'The next-occasion number on Profile (44px)',
            '"+ Add" / "+ Idea" / "+ People" affordances',
            'Active filter chip background tint',
            'Hover/active state on tappable rows',
          ].map(l => (
            <div key={l} style={{
              fontFamily: 'Work Sans', fontSize: 13.5, color: T.color.text.val,
              padding: '8px 0', borderBottom: `1px solid ${T.color.border.val}`,
            }}>{l}</div>
          ))}
        </div>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: T.color.claret.val,
            marginBottom: 12,
          }}>✗ Don't use brass for</div>
          {[
            { l: 'AI-generated content', alt: '→ italic serif + dotted underline' },
            { l: '"This week" urgency', alt: '→ claret' },
            { l: '"Ideas exist" positive state', alt: '→ fern' },
            { l: 'Decoration / accents-for-feeling', alt: '→ leave it text2/text3' },
            { l: 'Multiple CTAs in one place', alt: '→ pick the one that matters' },
          ].map(o => (
            <div key={o.l} style={{
              padding: '8px 0', borderBottom: `1px solid ${T.color.border.val}`,
            }}>
              <div style={{ fontFamily: 'Work Sans', fontSize: 13.5, color: T.color.text.val }}>{o.l}</div>
              <div style={{
                fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.color.text3.val,
                marginTop: 2, letterSpacing: 0.4,
              }}>{o.alt}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 24, padding: 16,
        background: T.color.bg.val, border: `1px dashed ${T.color.brass.val}`,
        borderRadius: 12,
      }}>
        <div style={{
          fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: T.color.brass.val,
        }}>Self-check</div>
        <div style={{
          fontFamily: 'Work Sans', fontSize: 14, color: T.color.text.val,
          lineHeight: 1.55, marginTop: 6,
        }}>
          On any screen: count the brass elements. If there are more than two,
          one of them is wrong. Demote it to text, fern, or claret.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 03 — Components
// ─────────────────────────────────────────────
function Spec({ title, api, examples }) {
  return (
    <div style={{
      background: T.color.surface.val,
      border: `1px solid ${T.color.border.val}`,
      borderRadius: 14, padding: 24, marginBottom: 24,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 18, gap: 24, flexWrap: 'wrap',
      }}>
        <h3 style={{
          fontFamily: 'DM Serif Display', fontSize: 24, color: T.color.text.val,
          margin: 0,
        }}>{title}</h3>
        <div style={{
          fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.color.text3.val,
          letterSpacing: '0.1em',
        }}>{api}</div>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: examples.length > 4 ? 'repeat(4, 1fr)' : `repeat(${examples.length}, 1fr)`,
        gap: 16, alignItems: 'start',
      }}>
        {examples.map((ex, i) => (
          <div key={i}>
            <div style={{
              padding: 14,
              background: T.color.bg.val,
              border: `1px solid ${T.color.border.val}`,
              borderRadius: 10, minHeight: 64,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {ex.node}
            </div>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: T.color.text3.val,
              letterSpacing: '0.12em', marginTop: 8,
            }}>{ex.label}</div>
            {ex.note && <div style={{
              fontFamily: 'Work Sans', fontSize: 12, color: T.color.text2.val,
              marginTop: 4, lineHeight: 1.4,
            }}>{ex.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Atoms ─────────────────────────────────────
function Label({ tone = 'default', children }) {
  const colors = {
    default: T.color.text3.val,
    brass: T.color.brass.val,
    claret: T.color.claret.val,
    fern: T.color.fern.val,
  };
  return <span style={{
    fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: colors[tone],
  }}>{children}</span>;
}

function Pill({ tone = 'default', dashed, children }) {
  const tokens = {
    default: { bg: T.color.surface.val,                   bd: T.color.border.val,             fg: T.color.text2.val },
    brass:   { bg: 'rgba(200,164,90,0.14)',               bd: 'rgba(200,164,90,0.4)',         fg: T.color.brass.val },
    claret:  { bg: 'rgba(160,69,69,0.14)',                bd: 'rgba(160,69,69,0.35)',         fg: T.color.claret.val },
    fern:    { bg: 'rgba(90,138,106,0.14)',               bd: 'rgba(90,138,106,0.3)',         fg: T.color.fern.val },
  };
  const t = tokens[tone];
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 10px', borderRadius: 999,
    background: t.bg, border: `1px ${dashed ? 'dashed' : 'solid'} ${t.bd}`,
    fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: t.fg, fontWeight: 500,
  }}>{children}</span>;
}

function Avatar({ initial, size = 40, accent = 'default' }) {
  const accents = {
    default: T.color.border.val,
    brass:   T.color.brass.val,
    claret:  T.color.claret.val,
  };
  const fSize = size === 22 ? 11 : size === 40 ? 16 : 22;
  return <div style={{
    width: size, height: size, borderRadius: 999, flexShrink: 0,
    background: 'linear-gradient(140deg, #2a3d33, #16241e)',
    border: `${accent === 'default' ? 1 : 1.5}px solid ${accents[accent]}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'DM Serif Display', fontSize: fSize,
    color: accent === 'brass' ? T.color.brass.val : accent === 'claret' ? T.color.claret.val : T.color.text2.val,
  }}>{initial}</div>;
}

function AvatarStack({ initials }) {
  const visible = initials.slice(0, 3);
  const rest = initials.length - visible.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((i, idx) => (
        <div key={idx} style={{ marginLeft: idx === 0 ? 0 : -8 }}>
          <Avatar initial={i} size={22} />
        </div>
      ))}
      {rest > 0 && (
        <div style={{
          marginLeft: -8, width: 22, height: 22, borderRadius: 999,
          background: T.color.surfaceHi.val, border: `1px solid ${T.color.border.val}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'IBM Plex Mono', fontSize: 9, color: T.color.text2.val,
        }}>+{rest}</div>
      )}
    </div>
  );
}

function Card({ children, padding = 14, tone = 'default' }) {
  const bg = tone === 'nested' ? T.color.surfaceHi.val : T.color.surface.val;
  return <div style={{
    background: bg, border: `1px solid ${T.color.border.val}`,
    borderRadius: 14, padding,
  }}>{children}</div>;
}

function Btn({ tone = 'default', children, full }) {
  if (tone === 'primary') {
    return <button style={{
      width: full ? '100%' : 'auto', padding: '13px 18px',
      background: T.color.brass.val, color: T.color.bg.val,
      border: 'none', borderRadius: 14,
      fontFamily: 'Work Sans', fontSize: 15, fontWeight: 600,
      cursor: 'pointer',
    }}>{children}</button>;
  }
  return <button style={{
    width: full ? '100%' : 'auto', padding: '13px 18px',
    background: T.color.surface.val, color: T.color.text2.val,
    border: `1px solid ${T.color.border.val}`, borderRadius: 14,
    fontFamily: 'Work Sans', fontSize: 15, fontWeight: 500,
    cursor: 'pointer',
  }}>{children}</button>;
}

// ── Composed components ──────────────────────
function PersonRow({ initial, name, relation, occasion, days, ideas, urgent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
    }}>
      <Avatar initial={initial} size={40} accent={urgent ? 'claret' : 'default'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'DM Serif Display', fontSize: 18, color: T.color.text.val }}>{name}</span>
          <span style={{ fontFamily: 'Work Sans', fontSize: 13, color: T.color.text3.val }}>{relation}</span>
        </div>
        <div style={{
          fontFamily: 'Work Sans', fontSize: 13,
          color: urgent ? T.color.claret.val : T.color.text2.val,
          marginTop: 2,
        }}>{occasion} · in {days} days</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: 'DM Serif Display', fontSize: 18,
          color: ideas > 0 ? T.color.brass.val : T.color.text3.val, lineHeight: 1,
        }}>{ideas}</div>
        <Label>{ideas === 1 ? 'idea' : 'ideas'}</Label>
      </div>
    </div>
  );
}

function IdeaCard({ thumb, title, source, price, people, occasion, status }) {
  return (
    <Card>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 10, flexShrink: 0,
          background: thumb,
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 4px, transparent 4px 8px)',
          border: `1px solid ${T.color.border.val}`,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Work Sans', fontSize: 15, fontWeight: 500, color: T.color.text.val, lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontFamily: 'Work Sans', fontSize: 13, color: T.color.text3.val, marginTop: 3 }}>{source}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <AvatarStack initials={people} />
            <span style={{ fontFamily: 'Work Sans', fontSize: 13, color: T.color.text2.val }}>{occasion}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <span style={{ fontFamily: 'DM Serif Display', fontSize: 18, color: T.color.text.val }}>{price}</span>
          {status === 'open' && <Pill tone="default">Open</Pill>}
          {status === 'given' && <Pill tone="fern">Given</Pill>}
        </div>
      </div>
    </Card>
  );
}

function SuggestionCard({ n, title, why, price }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.color.brass.val, letterSpacing: '0.14em' }}>{n}</span>
        <div style={{ fontFamily: 'DM Serif Display', fontSize: 18, color: T.color.text.val, fontStyle: 'italic', lineHeight: 1.2 }}>{title}</div>
      </div>
      <div style={{ fontFamily: 'Work Sans', fontSize: 13, color: T.color.text2.val, lineHeight: 1.55, marginTop: 6 }}>{why}</div>
      <div style={{
        marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.color.border.val}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: 'DM Serif Display', fontSize: 16, color: T.color.text.val }}>{price}</div>
        <Pill tone="brass">+ Save as idea</Pill>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// 05 — Migration table
// ─────────────────────────────────────────────
function Migration() {
  const rows = [
    { screen: 'A — Person Profile', issues: 'Avatar size drift (56 ✓); GiftItem padding/typography → unify with IdeaCard. Already-given block uses bespoke type — switch to PersonRow-with-year variant.' },
    { screen: 'B — Quick Capture',  issues: '"Person picker" pills should be Pill atom (default tone). Field labels: 9.5px → 11px Label component. Save button: aligns with new Btn primary spec.' },
    { screen: 'C — People List',    issues: 'Largely compliant. Standardize "This week" header to Label tone="claret". Idea-count chevron should be 18px not 19.' },
    { screen: 'D — Calendar',       issues: 'BIG: bring 40px Avatar back into rows. Drop the date block; format date as meta line in Work Sans. Convert "N ideas" / "+ ideas" to Pill (fern / brass-dashed).' },
    { screen: 'E — Backlog',        issues: 'Filter chips → Pill (active = brass; default = default). Convert cards to IdeaCard with avatar stack capped at 3. Add status pill column on right.' },
    { screen: 'F — Brainstorm',     issues: 'Suggestion cards already structurally correct — codify as SuggestionCard. Context block: chips → Pill (default). Reasoning text 13px Work Sans is correct now.' },
  ];
  return (
    <div style={{
      background: T.color.surface.val,
      border: `1px solid ${T.color.border.val}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      {rows.map((r, i) => (
        <div key={r.screen} style={{
          display: 'grid', gridTemplateColumns: '220px 1fr',
          gap: 24, padding: '18px 22px',
          borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${T.color.border.val}`,
        }}>
          <div>
            <Label tone="brass">{r.screen}</Label>
          </div>
          <div style={{ fontFamily: 'Work Sans', fontSize: 13.5, color: T.color.text2.val, lineHeight: 1.55 }}>{r.issues}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
function App() {
  return (
    <div style={{
      background: T.color.bg.val, color: T.color.text.val,
      minHeight: '100vh', paddingBottom: 80,
    }}>
      <Hero />

      {/* 01 — Foundations */}
      <Section id="tokens" num="01" title="Foundations" sub="Color, type, spacing, radius, avatar. These are the only allowed values. Each maps to a CSS custom property for the implementation hand-off.">
        <SubSection title="Color · 12 tokens">
          <ColorTable />
        </SubSection>

        <SubSection title="Type · 6 sizes (44px hero is one allowed exception)">
          <TypeTable />
        </SubSection>

        <SubSection title="Spacing · 4px base">
          <ScaleTable items={T.space} render={(it) => (
            <div style={{ width: it.px, height: 14, background: T.color.brass.val, borderRadius: 2 }} />
          )} />
        </SubSection>

        <SubSection title="Radius">
          <ScaleTable items={T.radius} render={(it) => (
            <div style={{
              width: 60, height: 36, background: T.color.surfaceHi.val,
              border: `1px solid ${T.color.border.val}`,
              borderRadius: it.px,
            }} />
          )} />
        </SubSection>

        <SubSection title="Avatar · 3 sizes only" last>
          <ScaleTable items={T.avatar} render={(it) => (
            <Avatar initial="E" size={it.px} />
          )} />
        </SubSection>
      </Section>

      {/* 02 — Brass rules */}
      <Section id="brass" num="02" title="Brass has one job" sub="The single most important system rule. Brass means 'this is the next thing'. Other roles (urgency, success, AI) get their own colors.">
        <BrassRules />
      </Section>

      {/* 03 — Components */}
      <Section id="components" num="03" title="Components" sub="Six atoms compose every screen. Props are the dev-handoff API. Anything that doesn't compose from these belongs in a follow-up review.">
        <Spec
          title="Label"
          api='<Label tone="default | brass | claret | fern" />'
          examples={[
            { node: <Label>Next occasion</Label>, label: 'default' },
            { node: <Label tone="brass">For Eleanor</Label>, label: 'brass · context heading' },
            { node: <Label tone="claret">This week</Label>, label: 'claret · urgency' },
            { node: <Label tone="fern">Given</Label>, label: 'fern · positive' },
          ]}
        />

        <Spec
          title="Pill"
          api='<Pill tone="default | brass | claret | fern" dashed?: boolean />'
          examples={[
            { node: <Pill>Open · 18</Pill>, label: 'default · neutral filter' },
            { node: <Pill tone="brass">+ Save</Pill>, label: 'brass · action' },
            { node: <Pill tone="fern">3 ideas</Pill>, label: 'fern · positive state' },
            { node: <Pill tone="brass" dashed>+ ideas</Pill>, label: 'brass dashed · empty/add' },
          ]}
        />

        <Spec
          title="Avatar · AvatarStack"
          api='<Avatar initial size={22|40|56} accent="default | brass | claret" />'
          examples={[
            { node: <Avatar initial="E" size={22} />, label: '22 · stack' },
            { node: <Avatar initial="E" size={40} />, label: '40 · row (default)' },
            { node: <Avatar initial="E" size={40} accent="claret" />, label: '40 · urgent' },
            { node: <Avatar initial="E" size={56} accent="brass" />, label: '56 · hero' },
            { node: <AvatarStack initials={['E','A']} />, label: 'stack · 2' },
            { node: <AvatarStack initials={['E','A','J','M','K']} />, label: 'stack · 5 (caps at 3 + N)' },
          ]}
        />

        <Spec
          title="Card"
          api='<Card padding={14} tone="default | nested" />'
          examples={[
            { node: <Card><div style={{ fontFamily: 'Work Sans', fontSize: 13, color: T.color.text2.val }}>Default surface card.<br/>14px radius, 14px padding.</div></Card>, label: 'default' },
            { node: <Card tone="nested"><div style={{ fontFamily: 'Work Sans', fontSize: 13, color: T.color.text2.val }}>Nested · for cards-inside-cards (rare).</div></Card>, label: 'nested' },
          ]}
        />

        <Spec
          title="Button"
          api='<Btn tone="primary | default" full?: boolean />'
          examples={[
            { node: <Btn tone="primary">Save idea</Btn>, label: 'primary · brass' },
            { node: <Btn>Cancel</Btn>, label: 'default · neutral' },
          ]}
        />

        <Spec
          title="PersonRow"
          api='<PersonRow initial name relation occasion days ideas urgent? />'
          examples={[
            { node: (
              <div style={{ width: '100%' }}>
                <PersonRow initial="K" name="Kira" relation="Best friend" occasion="Birthday" days={6} ideas={2} urgent />
              </div>
            ), label: 'urgent', note: 'urgent → claret avatar ring + claret meta line' },
            { node: (
              <div style={{ width: '100%' }}>
                <PersonRow initial="E" name="Eleanor" relation="Mom" occasion="Birthday" days={18} ideas={4} />
              </div>
            ), label: 'default' },
          ]}
        />

        <Spec
          title="IdeaCard"
          api='<IdeaCard thumb title source price people[] occasion status="open|given" />'
          examples={[
            { node: <div style={{ width: '100%' }}>
              <IdeaCard thumb="#3a4a4a" title="Tartine Bread cookbook" source="Powell's Books" price="$40" people={['E']} occasion="Birthday" status="open" />
            </div>, label: 'open · single person' },
            { node: <div style={{ width: '100%' }}>
              <IdeaCard thumb="#5a4a3a" title="Hand-thrown ceramic mug" source="East Fork Pottery" price="$58" people={['E','A','J','M']} occasion="Anytime" status="given" />
            </div>, label: 'given · stack of 4 (caps at 3+1)' },
          ]}
        />

        <Spec
          title="SuggestionCard"
          api='<SuggestionCard n title why price />'
          examples={[
            { node: <div style={{ width: '100%' }}>
              <SuggestionCard n="01" title="Italian regional cookbook" why="Connects her sourdough baking with Italian-wine interest. A regional book feels considered, not generic." price="$45–60" />
            </div>, label: 'AI suggestion' },
          ]}
        />
      </Section>

      {/* 04 — Patterns */}
      <Section id="patterns" num="04" title="Patterns" sub="How the components compose. These are the three motifs that recur across screens.">
        <SubSection title="Urgency row · People List, Calendar">
          <Card>
            <div style={{ marginBottom: 12 }}>
              <Label tone="claret">This week</Label>
            </div>
            <PersonRow initial="K" name="Kira" relation="Best friend" occasion="Birthday" days={6} ideas={2} urgent />
            <div style={{ borderTop: `1px solid ${T.color.border.val}` }}>
              <PersonRow initial="E" name="Eleanor" relation="Mom" occasion="Birthday" days={18} ideas={4} />
            </div>
          </Card>
          <p style={{ fontFamily: 'Work Sans', fontSize: 13, color: T.color.text2.val, marginTop: 12, lineHeight: 1.5 }}>
            Group header = Label (claret/default). Rows = PersonRow with optional urgent flag.
            Same row component everywhere a person appears in a list.
          </p>
        </SubSection>

        <SubSection title="Idea card · Backlog, Profile saved-ideas">
          <div style={{ display: 'grid', gap: 10 }}>
            <IdeaCard thumb="#3a4a4a" title="Tartine Bread cookbook" source="Powell's Books · saved Apr 14" price="$40" people={['E']} occasion="Birthday" status="open" />
            <IdeaCard thumb="#4a3a4a" title="Italian wine club, 3-month sub" source="Saved from link · Mar 22" price="$120/mo" people={['E','A']} occasion="Anniversary" status="given" />
          </div>
          <p style={{ fontFamily: 'Work Sans', fontSize: 13, color: T.color.text2.val, marginTop: 12, lineHeight: 1.5 }}>
            Same component on Backlog (flat list) and Profile (filtered to one person). Status pill carries open/given.
          </p>
        </SubSection>

        <SubSection title="AI suggestion · Brainstorm" last>
          <SuggestionCard n="01" title="Italian regional cookbook" why="Connects her sourdough baking with the Italian-wine note. A focused regional book feels considered, not generic." price="$45–60" />
          <p style={{ fontFamily: 'Work Sans', fontSize: 13, color: T.color.text2.val, marginTop: 12, lineHeight: 1.5 }}>
            Mono index (brass) + italic serif title + Work Sans reasoning + footer with serif price + brass Save pill. Reusable any time the AI produces structured output.
          </p>
        </SubSection>
      </Section>

      {/* 05 — Migration */}
      <Section id="migration" num="05" title="Migration" sub="What each existing screen needs to do to comply with v1.0. Work top-to-bottom.">
        <Migration />
        <div style={{
          marginTop: 32,
          fontFamily: 'Work Sans', fontSize: 13, color: T.color.text3.val,
          lineHeight: 1.6, fontStyle: 'italic',
        }}>
          Note: "Already given" remains a first-class section on the Profile — the app must work without AI.
          It will use the same PersonRow shell with a year-column variant in v1.1.
        </div>
      </Section>

      <footer style={{
        maxWidth: 1200, margin: '0 auto', padding: '48px 64px 0',
        fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: T.color.text3.val,
      }}>
        End of v1.0 · Next: v1.1 · "already given" row variant + empty/loading states
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
