// v3 screens — composed from system-runtime atoms

const K3 = window.MGS;
const {
  MGSLabel: L, MGSPill: P, MGSAvatar: Av, MGSAvatarStack: AvS,
  MGSCard: Cd, MGSBtn: Bt, MGSPersonRow: PR, MGSIdeaCard: IC, MGSSuggestionCard: SC,
  MGSNavBar: Nv, MGSScreenTitle: ST,
} = window;

// ─── A · Profile (v2 content, system atoms) ────────────
function ScreenProfile() {
  return <div style={{ background: K3.bg, color: K3.text, minHeight: '100%' }}>
    <div style={{ height: 54 }} />
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '0 16px', marginBottom: 24,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 999,
        background: K3.surface, border: `1px solid ${K3.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="9" height="14" viewBox="0 0 9 14" fill="none">
          <path d="M7.5 1.5L1.5 7l6 5.5" stroke={K3.text2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{
        width: 40, height: 40, borderRadius: 999,
        background: K3.surface, border: `1px solid ${K3.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: K3.fBody, color: K3.text2, fontSize: 18,
      }}>⋯</div>
    </div>

    {/* Compact inline header */}
    <div style={{
      padding: '0 22px', marginBottom: 24,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <Av initial="E" size={56} accent="brass" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{
          fontFamily: K3.fSerif, fontSize: 32, lineHeight: 1, color: K3.text,
          margin: 0, letterSpacing: -0.4,
        }}>Eleanor</h1>
        <div style={{
          fontFamily: K3.fBody, fontSize: 13, color: K3.text3, marginTop: 4,
        }}>Mom · 67 · Portland</div>
      </div>
    </div>

    {/* Next occasion */}
    <div style={{ padding: '0 16px 22px' }}>
      <Cd>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <L tone="brass">Next occasion</L>
            <div style={{ fontFamily: K3.fSerif, fontSize: 24, color: K3.text, marginTop: 4, lineHeight: 1.1 }}>Birthday</div>
            <div style={{ fontFamily: K3.fBody, fontSize: 13, color: K3.text2, marginTop: 4 }}>May 14 · Wednesday</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: K3.fSerif, fontSize: 24, color: K3.brass, lineHeight: 1 }}>18 days</div>
            <div style={{ fontFamily: K3.fBody, fontSize: 12, color: K3.text3, marginTop: 4 }}>away</div>
          </div>
        </div>
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: `1px solid ${K3.border}`,
          display: 'flex', gap: 14, fontFamily: K3.fBody, fontSize: 12, color: K3.text3,
        }}>
          <span>+ Anniversary · Aug 22</span>
          <span style={{ color: K3.border2 }}>·</span>
          <span>+ Christmas</span>
        </div>
      </Cd>
    </div>

    {/* Brainstorm CTA */}
    <div style={{ padding: '0 16px 32px' }}>
      <Bt tone="primary" full>Help me find a gift</Bt>
    </div>

    {/* Interests */}
    <div style={{ padding: '0 22px 32px' }}>
      <L style={{ marginBottom: 12, display: 'block' }}>Interests</L>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {['gardening','Italian wine','true crime podcasts','hand pottery','baking sourdough','hiking','Sunday crosswords'].map(t => (
          <span key={t} style={{
            padding: '6px 12px', borderRadius: 999,
            background: K3.surface2, border: `1px solid ${K3.border}`,
            fontFamily: K3.fBody, fontSize: 13, color: K3.text, fontWeight: 500,
          }}>{t}</span>
        ))}
        <span style={{
          padding: '6px 12px', borderRadius: 999,
          background: 'transparent', border: `1px dashed ${K3.border2}`,
          fontFamily: K3.fBody, fontSize: 13, color: K3.text3,
        }}>+</span>
      </div>
    </div>

    {/* Notes */}
    <div style={{ padding: '0 22px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <L>Notes <span style={{ opacity: 0.5 }}>· private</span></L>
      <L tone="brass">+ Add</L>
    </div>
    <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <NoteRow date="Apr 12, 2026" body="She mentioned wanting a sourdough starter at Easter dinner. Already has too many mugs (her words) — focus on cookbooks, garden tools, or experiences." />
      <NoteRow date="Feb 3, 2026" body="Started taking Italian classes Tuesday evenings. Talked about wanting to visit the Amalfi coast in 2027 — anniversary trip ideas?" />
      <NoteRow date="Nov 22, 2025" body="Allergic to lavender. Don't gift anything scented." />
    </div>

    {/* Open ideas */}
    <div style={{ padding: '0 22px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <L>Gift ideas <span style={{ opacity: 0.5 }}>· 4</span></L>
      <L tone="brass">+ Add</L>
    </div>
    <div style={{ padding: '0 16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <IC thumb="#3a4a4a" title="Tartine Bread cookbook" source="Powell's Books" price="$40" people={['E']} occasion="Birthday" status="open" />
      <IC thumb="#5a4a3a" title="Hand-thrown ceramic mug, cobalt" source="East Fork Pottery" price="$58" people={['E']} occasion="Anytime" status="open" />
      <IC thumb="#3a4a3a" title="Felco pruning shears (F-2)" source="Garden Tool Co." price="$62" people={['E']} occasion="Birthday" status="open" />
      <IC thumb="#4a3a4a" title="Italian wine club, 3-month" source="Saved from link" price="$120/mo" people={['E']} occasion="Anniversary" status="open" />
    </div>

    {/* Given (two-state gifts) */}
    <div style={{ padding: '0 22px 10px' }}>
      <L>Given <span style={{ opacity: 0.5 }}>· 2</span></L>
    </div>
    <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <IC thumb="#3a3a4a" title="Linen apron, dyed indigo" source="Mother's Day · May 2025" price="$48" people={['E']} occasion="Mother's Day" status="given" given />
      <IC thumb="#4a3a3a" title="Le Creuset dutch oven, sage" source="Birthday · May 2024" price="$280" people={['E']} occasion="66th birthday" status="given" given />
    </div>

    <div style={{
      margin: '14px 22px 28px', padding: '12px 0',
      borderTop: `1px solid ${K3.border}`, textAlign: 'center',
    }}>
      <L tone="brass">See full history →</L>
    </div>
  </div>;
}

function NoteRow({ date, body }) {
  return <Cd padding={12}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        fontFamily: K3.fMono, fontSize: 10, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: K3.text3, flexShrink: 0,
        width: 48, paddingTop: 2,
      }}>{date}</div>
      <div style={{ flex: 1, fontFamily: K3.fBody, fontSize: 13.5, color: K3.text2, lineHeight: 1.5 }}>{body}</div>
    </div>
  </Cd>;
}

function GivenRow({ year, gift, occasion, last }) {
  return <div style={{
    display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0',
    borderBottom: last ? 'none' : `1px solid ${K3.border}`,
  }}>
    <div style={{
      fontFamily: K3.fSerif, fontSize: 18, fontStyle: 'italic',
      color: K3.brass, width: 44, flexShrink: 0,
    }}>{year}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: K3.fBody, fontSize: 14, fontWeight: 500, color: K3.text, lineHeight: 1.3 }}>{gift}</div>
      <div style={{
        fontFamily: K3.fMono, fontSize: 10, color: K3.text3, marginTop: 2,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>{occasion}</div>
    </div>
  </div>;
}

// ─── B · Quick Capture ─────────────────────────────────
function ScreenCapture() {
  return <div style={{ background: K3.bg, color: K3.text, minHeight: '100%' }}>
    <div style={{ height: 54 }} />
    <div style={{
      padding: '0 22px 6px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <button style={{
        background: 'none', border: 'none', padding: 0,
        fontFamily: K3.fBody, fontSize: 15, color: K3.text3, cursor: 'pointer',
      }}>Cancel</button>
      <L>New idea</L>
      <div style={{ width: 40 }} />
    </div>

    {/* The idea field — no competing headline. The field IS the screen. */}
    <div style={{ padding: '40px 22px 8px' }}>
      <div style={{
        minHeight: 92, paddingBottom: 14,
        borderBottom: `1.5px solid ${K3.brass}`,
        fontFamily: K3.fSerif, fontSize: 28, lineHeight: 1.25,
        color: K3.text,
      }}>
        Hand-thrown ceramic mug, cobalt
        <span style={{
          display: 'inline-block', width: 2, height: 26,
          background: K3.brass, marginLeft: 2, verticalAlign: 'middle',
          animation: 'blink 1s infinite',
        }} />
      </div>
      <div style={{
        marginTop: 10, display: 'flex',
        justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <span style={{ fontFamily: K3.fBody, fontSize: 12, color: K3.text3 }}>
          What did you think of?
        </span>
        <span style={{ fontFamily: K3.fMono, fontSize: 10, color: K3.text3 }}>32 / 200</span>
      </div>
    </div>

    <div style={{ height: 18 }} />

    {/* Clipboard chip */}
    <div style={{ padding: '0 22px 22px' }}>
      <Cd padding={12}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: K3.surface2, border: `1px solid ${K3.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: K3.fSerif, fontSize: 13, color: K3.brass,
          }}>↗</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <L tone="brass">From clipboard</L>
            <div style={{
              fontFamily: K3.fBody, fontSize: 13, fontWeight: 500, color: K3.text,
              marginTop: 2, lineHeight: 1.25,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>eastforkpottery.com/products/cobalt-mug</div>
          </div>
          <P tone="brass">Attach</P>
        </div>
      </Cd>
    </div>

    {/* For */}
    <div style={{ padding: '0 22px 8px' }}>
      <L>For</L>
    </div>
    <div style={{
      padding: '0 22px 22px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
    }}>
      <PersonChip initial="E" name="Eleanor" days={18} />
      <span style={{ fontFamily: K3.fBody, fontSize: 14, color: K3.text3 }}>jam</span>
      <span style={{
        display: 'inline-block', width: 1, height: 16,
        background: K3.brass,
        animation: 'blink 1s infinite', verticalAlign: 'middle',
      }} />
    </div>

    {/* Suggestions */}
    <div style={{ padding: '0 16px 22px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <SuggestRow initial="J" name="Jamie" rel="Sister" days={42} />
      <SuggestRow initial="J" name="James" rel="Coworker" days={null} />
    </div>

    {/* Optional fields */}
    <div style={{
      padding: '0 22px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
    }}>
      <div>
        <L style={{ marginBottom: 6, display: 'block' }}>Price · optional</L>
        <div style={{
          background: K3.surface, border: `1px solid ${K3.border}`,
          borderRadius: 12, padding: '10px 12px', height: 42, boxSizing: 'border-box',
          display: 'flex', alignItems: 'center',
          fontFamily: K3.fBody, fontSize: 14, color: K3.text3,
        }}>$ —</div>
      </div>
      <div>
        <L style={{ marginBottom: 6, display: 'block' }}>Occasion · optional</L>
        <div style={{
          background: K3.surface, border: `1px solid ${K3.border}`,
          borderRadius: 12, padding: '10px 12px', height: 42, boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: K3.fBody, fontSize: 14, color: K3.text3,
        }}>Anytime
          <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
            <path d="M1 1l3.5 3.5L8 1" stroke={K3.text3} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>

    <div style={{ padding: '0 16px 24px' }}>
      <Bt tone="primary" full>Save idea</Bt>
    </div>
  </div>;
}

function PersonChip({ initial, name, days }) {
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 10px 5px 5px', borderRadius: 999,
    background: 'rgba(200,164,90,0.14)', border: `1px solid rgba(200,164,90,0.4)`,
  }}>
    <span style={{
      width: 22, height: 22, borderRadius: 999,
      background: 'linear-gradient(140deg, #2a3d33, #16241e)',
      border: `1px solid ${K3.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: K3.fSerif, fontSize: 11, color: K3.brass,
    }}>{initial}</span>
    <span style={{ fontFamily: K3.fBody, fontSize: 13, color: K3.text, fontWeight: 500 }}>{name}</span>
    {days != null && <L tone="brass" style={{ fontSize: 9.5 }}>{days}d</L>}
    <span style={{ color: K3.text3, fontSize: 14, lineHeight: 1, marginLeft: 2 }}>×</span>
  </span>;
}

function SuggestRow({ initial, name, rel, days }) {
  return <div style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 6px',
    borderRadius: 10,
  }}>
    <Av initial={initial} size={40} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: K3.fSerif, fontSize: 18, color: K3.text, lineHeight: 1.15 }}>{name}</div>
      <div style={{ fontFamily: K3.fBody, fontSize: 13, color: K3.text3, marginTop: 2 }}>{rel}</div>
    </div>
    {days != null && <L>{days}d</L>}
  </div>;
}

// ─── C · People List ───────────────────────────────────
function ScreenPeople() {
  const urgent = [{ i: 'K', name: 'Kira', rel: 'Best friend', occ: 'Birthday', d: 6, ideas: 2 }];
  const upc = [
    { i: 'E', name: 'Eleanor', rel: 'Mom', occ: 'Birthday', d: 18, ideas: 4 },
    { i: 'D', name: 'Dad', rel: 'Father', occ: "Father's Day", d: 38, ideas: 1 },
    { i: 'J', name: 'Jamie', rel: 'Sister', occ: 'Birthday', d: 42, ideas: 0 },
    { i: 'A', name: 'Ana', rel: 'Partner', occ: 'Anniversary', d: 84, ideas: 7 },
    { i: 'L', name: 'Luca', rel: 'Nephew', occ: 'Birthday', d: 121, ideas: 3 },
  ];
  return <div style={{ background: K3.bg, color: K3.text, minHeight: '100%' }}>
    <Nv title="People · 12" trailing={
      <div style={{
        width: 40, height: 40, borderRadius: 999,
        background: 'rgba(200,164,90,0.14)', border: `1px solid rgba(200,164,90,0.4)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: K3.brass, fontFamily: K3.fBody, fontSize: 22, lineHeight: 1, paddingBottom: 2,
      }}>+</div>
    } />
    <ST sub="Sorted by next occasion">People</ST>

    {/* Search */}
    <div style={{ padding: '0 16px 18px' }}>
      <div style={{
        background: K3.surface, border: `1px solid ${K3.border}`, borderRadius: 12,
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: K3.fBody, fontSize: 14, color: K3.text3,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke={K3.text3} strokeWidth="1.4"/>
          <path d="M9.5 9.5L13 13" stroke={K3.text3} strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        Search people, interests…
      </div>
    </div>

    <div style={{ padding: '0 22px 4px' }}><L tone="claret">This week</L></div>
    <div style={{ padding: '0 22px 8px' }}>
      {urgent.map((p, i, a) => (
        <PR key={p.name} initial={p.i} name={p.name} relation={p.rel} occasion={p.occ}
            days={p.d} ideas={p.ideas} urgent last={i === a.length - 1} />
      ))}
    </div>

    <div style={{ padding: '12px 22px 4px' }}><L>Upcoming</L></div>
    <div style={{ padding: '0 22px 28px' }}>
      {upc.map((p, i, a) => (
        <PR key={p.name} initial={p.i} name={p.name} relation={p.rel} occasion={p.occ}
            days={p.d} ideas={p.ideas} last={i === a.length - 1} />
      ))}
    </div>
  </div>;
}

// ─── D · Calendar ──────────────────────────────────────
function ScreenCalendar() {
  return <div style={{ background: K3.bg, color: K3.text, minHeight: '100%' }}>
    <Nv title="Upcoming" trailing={
      <P tone="default">List ▾</P>
    } />
    <ST sub="14 occasions across 12 people">Upcoming</ST>

    {/* Stats */}
    <div style={{ padding: '0 16px 22px', display: 'flex', gap: 8 }}>
      <Stat n="3" label="this week" tone="claret" />
      <Stat n="6" label="this month" tone="brass" />
      <Stat n="2" label="ideas needed" tone="default" />
    </div>

    <Month name="May" year="2026" count={4} />
    <div style={{ padding: '0 22px' }}>
      <CalRow i="K" date="Wed · May 14" name="Kira" rel="Best friend" occ="Birthday" days={6} ideas={2} urgent />
      <CalRow i="E" date="Wed · May 14" name="Eleanor" rel="Mom" occ="Birthday" days={18} ideas={4} />
      <CalRow i="D" date="Tue · May 20" name="Dad" rel="Father" occ="Father's Day" days={24} needs />
      <CalRow i="J" date="Thu · May 29" name="Jamie" rel="Sister" occ="Birthday" days={33} needs last />
    </div>

    <Month name="June" year="2026" count={3} />
    <div style={{ padding: '0 22px' }}>
      <CalRow i="L" date="Tue · Jun 9" name="Luca" rel="Nephew" occ="Birthday" days={44} ideas={3} />
      <CalRow i="E" date="Mon · Jun 22" name="Eleanor" rel="Mom" occ="Anniversary" days={57} ideas={1} />
      <CalRow i="M" date="Tue · Jun 30" name="Marco" rel="Coworker" occ="Promotion" days={65} needs last />
    </div>

    <div style={{
      margin: '20px 22px 28px', padding: '12px 0',
      borderTop: `1px solid ${K3.border}`, textAlign: 'center',
    }}>
      <L tone="brass">Show 7 more →</L>
    </div>
  </div>;
}

function Stat({ n, label, tone }) {
  const c = tone === 'claret' ? K3.claret : tone === 'brass' ? K3.brass : K3.text3;
  return <Cd padding={12} style={{ flex: 1 }}>
    <div style={{ fontFamily: K3.fSerif, fontSize: 24, color: c, lineHeight: 1 }}>{n}</div>
    <div style={{ fontFamily: K3.fBody, fontSize: 12, color: K3.text3, marginTop: 4 }}>{label}</div>
  </Cd>;
}

function Month({ name, year, count }) {
  return <div style={{
    padding: '12px 22px 10px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'baseline',
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <div style={{
        fontFamily: K3.fSerif, fontSize: 22, color: K3.text, fontStyle: 'italic',
      }}>{name}</div>
      <L>{year}</L>
    </div>
    <L>{count} occ.</L>
  </div>;
}

function CalRow({ i, date, name, rel, occ, days, ideas, needs, urgent, last }) {
  return <div style={{
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
    borderBottom: last ? 'none' : `1px solid ${K3.border}`,
  }}>
    <Av initial={i} size={40} accent={urgent ? 'claret' : 'default'} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: K3.fSerif, fontSize: 18, color: K3.text }}>{name}</span>
        <span style={{ fontFamily: K3.fBody, fontSize: 13, color: K3.text3 }}>{rel}</span>
      </div>
      <div style={{
        fontFamily: K3.fBody, fontSize: 13, color: urgent ? K3.claret : K3.text2, marginTop: 2,
      }}>{date} · {occ} · in {days}d</div>
    </div>
    {needs ? <P tone="brass" dashed>+ ideas</P> : <P tone="fern">{ideas} ideas</P>}
  </div>;
}

// ─── E · Backlog ───────────────────────────────────────
function ScreenBacklog() {
  return <div style={{ background: K3.bg, color: K3.text, minHeight: '100%' }}>
    <Nv title="Ideas · 23" trailing={
      <div style={{
        width: 40, height: 40, borderRadius: 999,
        background: 'rgba(200,164,90,0.14)', border: `1px solid rgba(200,164,90,0.4)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: K3.brass, fontFamily: K3.fBody, fontSize: 22, lineHeight: 1, paddingBottom: 2,
      }}>+</div>
    } />
    <ST sub="All captured ideas across 12 people">Ideas</ST>

    <div className="hide-scrollbar" style={{
      padding: '0 16px 16px', display: 'flex', gap: 8, overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      <P tone="brass">Person · Mom ×</P>
      <P>Open · 18</P>
      <P>Under $75</P>
      <P dashed>+ Filter</P>
    </div>

    <div style={{
      padding: '0 22px 14px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <L>4 of 23 · for Eleanor</L>
      <L tone="brass">Recent ↓</L>
    </div>

    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <IC thumb="#3a4a4a" title="Tartine Bread cookbook" source="Powell's Books" price="$40" people={['E']} occasion="Birthday" status="open" />
      <IC thumb="#5a4a3a" title="Hand-thrown ceramic mug, cobalt" source="East Fork Pottery" price="$58" people={['E','A']} occasion="Anytime" status="open" />
      <IC thumb="#3a4a3a" title="Felco pruning shears (F-2)" source="Garden Tool Co." price="$62" people={['E']} occasion="Birthday" status="open" />
      <IC thumb="#4a3a4a" title="Italian wine club, 3-month subscription" source="Saved · Apr 14" price="$120/mo" people={['E']} occasion="Anniversary" status="given" given />
    </div>

    <div style={{
      margin: '20px 22px 28px', padding: '12px 0',
      borderTop: `1px solid ${K3.border}`, textAlign: 'center',
    }}>
      <L tone="brass">Show 19 more →</L>
    </div>
  </div>;
}

// ─── F · Brainstorm ────────────────────────────────────
function ScreenBrainstorm() {
  return <div style={{ background: K3.bg, color: K3.text, minHeight: '100%' }}>
    <Nv title="Brainstorm" trailing={<L tone="brass">Refine</L>} />

    <div style={{ padding: '0 22px 6px' }}>
      <L tone="brass">For Eleanor · Mom</L>
      <h1 style={{
        fontFamily: K3.fSerif, fontSize: 28, lineHeight: 1.05,
        color: K3.text, margin: '8px 0 0',
      }}>5 ideas for her birthday</h1>
      <div style={{
        fontFamily: K3.fBody, fontSize: 13, color: K3.text3, marginTop: 6,
      }}>Generated just now · based on her notes &amp; interests</div>
    </div>

    <div style={{ padding: '14px 16px 18px' }}>
      <Cd padding={12}>
        <L style={{ marginBottom: 8, display: 'block' }}>Context</L>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {['gardening','Italian wine','baking sourdough','hand pottery','true crime podcasts'].map(t => (
            <span key={t} style={{
              padding: '4px 10px', borderRadius: 999,
              background: K3.surface2, border: `1px solid ${K3.border}`,
              fontFamily: K3.fBody, fontSize: 12, color: K3.text,
            }}>{t}</span>
          ))}
        </div>
        <div style={{
          marginTop: 10, paddingTop: 10, borderTop: `1px solid ${K3.border}`,
          display: 'flex', gap: 16, fontFamily: K3.fBody, fontSize: 12, color: K3.text2,
        }}>
          <span><span style={{ color: K3.text3 }}>Budget</span> $40–80</span>
          <span><span style={{ color: K3.text3 }}>Avoiding</span> mugs · scented · linen apron (2025)</span>
        </div>
      </Cd>
    </div>

    <div style={{ padding: '0 22px 10px' }}><L>Suggestions · 5</L></div>
    <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SC n="01" title="Italian regional cookbook" why="Connects her sourdough baking with Italian-wine interest. A focused regional book (Puglia, Sicily) feels considered, not generic." price="$45–60" />
      <SC n="02" title="Handmade ceramic herb planter set" why="Pottery + gardening overlap. Function-first so it doesn't read as decorative." price="$55–75" />
      <SC n="03" title="True-crime podcast premium subscription" why="Lower commitment than a year, easy to renew." price="$40/yr" />
      <SC n="04" title="Heirloom tomato seed library" why="Adds variety to her existing garden. Italian varieties tie to her Amalfi note." price="$35–50" />
      <SC n="05" title="Hand-stitched gardener's apron" why="Heavier canvas + tool pockets is the next step up from the linen one in 2025." price="$60–80" />
    </div>

    <div style={{ padding: '6px 16px 24px', display: 'flex', gap: 10 }}>
      <Bt full>Regenerate</Bt>
      <Bt tone="primary" full>Adjust context</Bt>
    </div>
  </div>;
}

Object.assign(window, {
  ScreenProfile, ScreenCapture, ScreenPeople,
  ScreenCalendar, ScreenBacklog, ScreenBrainstorm,
});
