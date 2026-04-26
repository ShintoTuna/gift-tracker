// Midnight Garden v1.0 runtime — exports tokens + atoms to window.MGS

const MGS_TOKENS = {
  bg: '#0F1A16', surface: '#16241E', surface2: '#1C2D26',
  border: '#213830', border2: '#2A4338',
  text: '#E8E1CF', text2: '#A8B5A8', text3: '#8A9A8F',
  brass: '#C8A45A', brassDim: '#A08735',
  claret: '#A04545', fern: '#5A8A6A',
  fSerif: "'DM Serif Display', Georgia, serif",
  fBody: "'Work Sans', -apple-system, system-ui, sans-serif",
  fMono: "'IBM Plex Mono', ui-monospace, monospace",
};
const K = MGS_TOKENS;

function MGSLabel({ tone = 'default', children, style = {} }) {
  const c = { default: K.text3, brass: K.brass, claret: K.claret, fern: K.fern }[tone];
  return <span style={{
    fontFamily: K.fMono, fontSize: 11, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: c, ...style,
  }}>{children}</span>;
}

function MGSPill({ tone = 'default', dashed, children, style = {} }) {
  const tk = {
    default: { bg: K.surface,                bd: K.border,                fg: K.text2 },
    brass:   { bg: 'rgba(200,164,90,0.14)',  bd: 'rgba(200,164,90,0.4)',  fg: K.brass },
    claret:  { bg: 'rgba(160,69,69,0.14)',   bd: 'rgba(160,69,69,0.35)',  fg: K.claret },
    fern:    { bg: 'rgba(90,138,106,0.14)',  bd: 'rgba(90,138,106,0.3)',  fg: K.fern },
  }[tone];
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 10px', borderRadius: 999,
    background: tk.bg, border: `1px ${dashed ? 'dashed' : 'solid'} ${tk.bd}`,
    fontFamily: K.fMono, fontSize: 10, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: tk.fg, fontWeight: 500,
    whiteSpace: 'nowrap', ...style,
  }}>{children}</span>;
}

function MGSAvatar({ initial, size = 40, accent = 'default' }) {
  const c = { default: K.border, brass: K.brass, claret: K.claret }[accent];
  const fg = accent === 'brass' ? K.brass : accent === 'claret' ? K.claret : K.text2;
  const fs = size === 22 ? 11 : size === 40 ? 16 : 22;
  return <div style={{
    width: size, height: size, borderRadius: 999, flexShrink: 0,
    background: 'linear-gradient(140deg, #2a3d33, #16241e)',
    border: `${accent === 'default' ? 1 : 1.5}px solid ${c}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: K.fSerif, fontSize: fs, color: fg,
  }}>{initial}</div>;
}

function MGSAvatarStack({ initials }) {
  const v = initials.slice(0, 3);
  const r = initials.length - v.length;
  return <div style={{ display: 'flex', alignItems: 'center' }}>
    {v.map((i, idx) => (
      <div key={idx} style={{ marginLeft: idx === 0 ? 0 : -8 }}>
        <MGSAvatar initial={i} size={22} />
      </div>
    ))}
    {r > 0 && <div style={{
      marginLeft: -8, width: 22, height: 22, borderRadius: 999,
      background: K.surface2, border: `1px solid ${K.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: K.fMono, fontSize: 9, color: K.text2,
    }}>+{r}</div>}
  </div>;
}

function MGSCard({ children, padding = 14, tone = 'default', style = {} }) {
  return <div style={{
    background: tone === 'nested' ? K.surface2 : K.surface,
    border: `1px solid ${K.border}`,
    borderRadius: 14, padding, ...style,
  }}>{children}</div>;
}

function MGSBtn({ tone = 'default', children, full, style = {} }) {
  const base = {
    width: full ? '100%' : 'auto', padding: '13px 18px',
    border: 'none', borderRadius: 14,
    fontFamily: K.fBody, fontSize: 15, fontWeight: tone === 'primary' ? 600 : 500,
    cursor: 'pointer',
  };
  if (tone === 'primary') return <button style={{
    ...base, background: K.brass, color: K.bg, ...style,
  }}>{children}</button>;
  return <button style={{
    ...base, background: K.surface, color: K.text2,
    border: `1px solid ${K.border}`, ...style,
  }}>{children}</button>;
}

function MGSPersonRow({ initial, name, relation, occasion, days, ideas, urgent, dateLine, last, hideBorder }) {
  return <div style={{
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
    borderBottom: (last || hideBorder) ? 'none' : `1px solid ${K.border}`,
  }}>
    <MGSAvatar initial={initial} size={40} accent={urgent ? 'claret' : 'default'} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: K.fSerif, fontSize: 18, color: K.text }}>{name}</span>
        {relation && <span style={{ fontFamily: K.fBody, fontSize: 13, color: K.text3 }}>{relation}</span>}
      </div>
      <div style={{
        fontFamily: K.fBody, fontSize: 13,
        color: urgent ? K.claret : K.text2, marginTop: 2,
      }}>{dateLine || `${occasion} · in ${days} days`}</div>
    </div>
    {ideas != null && <div style={{ textAlign: 'right' }}>
      <div style={{
        fontFamily: K.fSerif, fontSize: 18,
        color: ideas > 0 ? K.brass : K.text3, lineHeight: 1,
      }}>{ideas}</div>
      <MGSLabel>{ideas === 1 ? 'idea' : 'ideas'}</MGSLabel>
    </div>}
  </div>;
}

function MGSIdeaCard({ thumb, title, source, price, people, occasion, status, given }) {
  return <MGSCard>
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{
        width: 60, height: 60, borderRadius: 10, flexShrink: 0,
        background: thumb || '#3a4a4a',
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 4px, transparent 4px 8px)',
        border: `1px solid ${K.border}`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: K.fBody, fontSize: 15, fontWeight: 500, color: K.text,
          lineHeight: 1.3, textDecoration: given ? 'line-through' : 'none',
          opacity: given ? 0.6 : 1,
        }}>{title}</div>
        <div style={{ fontFamily: K.fBody, fontSize: 13, color: K.text3, marginTop: 3 }}>{source}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          {people && <MGSAvatarStack initials={people} />}
          {occasion && <span style={{ fontFamily: K.fBody, fontSize: 13, color: K.text2 }}>{occasion}</span>}
        </div>
      </div>
      <div style={{
        textAlign: 'right', flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
      }}>
        {price && <span style={{ fontFamily: K.fSerif, fontSize: 16, color: K.text }}>{price}</span>}
        {status === 'open' && <MGSPill>Open</MGSPill>}
        {status === 'given' && <MGSPill tone="fern">Given</MGSPill>}
      </div>
    </div>
  </MGSCard>;
}

function MGSSuggestionCard({ n, title, why, price }) {
  return <MGSCard>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{
        fontFamily: K.fMono, fontSize: 11, color: K.brass, letterSpacing: '0.14em',
      }}>{n}</span>
      <div style={{
        fontFamily: K.fSerif, fontSize: 18, color: K.text, fontStyle: 'italic', lineHeight: 1.2,
      }}>{title}</div>
    </div>
    <div style={{
      fontFamily: K.fBody, fontSize: 13, color: K.text2, lineHeight: 1.55, marginTop: 6,
    }}>{why}</div>
    <div style={{
      marginTop: 12, paddingTop: 10, borderTop: `1px solid ${K.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ fontFamily: K.fSerif, fontSize: 16, color: K.text }}>{price}</div>
      <MGSPill tone="brass">+ Save as idea</MGSPill>
    </div>
  </MGSCard>;
}

// Screen chrome helpers
function MGSNavBar({ title, leading = 'back', trailing }) {
  return <>
    <div style={{ height: 54 }} />
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 16px', marginBottom: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 999,
        background: K.surface, border: `1px solid ${K.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {leading === 'back' ? (
          <svg width="9" height="14" viewBox="0 0 9 14" fill="none">
            <path d="M7.5 1.5L1.5 7l6 5.5" stroke={K.text2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : leading === 'close' ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke={K.text2} strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        ) : null}
      </div>
      <MGSLabel>{title}</MGSLabel>
      {trailing || <div style={{ width: 40 }} />}
    </div>
  </>;
}

function MGSScreenTitle({ children, sub }) {
  return <div style={{ padding: '0 22px', marginBottom: 22 }}>
    <h1 style={{
      fontFamily: K.fSerif, fontSize: 32, lineHeight: 1.05,
      color: K.text, margin: 0, letterSpacing: -0.4,
    }}>{children}</h1>
    {sub && <div style={{
      fontFamily: K.fBody, fontSize: 13, color: K.text3, marginTop: 6,
    }}>{sub}</div>}
  </div>;
}

Object.assign(window, {
  MGS: MGS_TOKENS, MGSLabel, MGSPill, MGSAvatar, MGSAvatarStack,
  MGSCard, MGSBtn, MGSPersonRow, MGSIdeaCard, MGSSuggestionCard,
  MGSNavBar, MGSScreenTitle,
});
