// Phase 03 — shared bits + 4 screens

const MG3 = {
  bg: '#0F1A16', surface: '#16241E', surfaceHi: '#1c2d26',
  border: '#213830', borderHi: '#2a4338',
  text: '#E8E1CF', text2: '#a8b5a8', text3: '#8a9a8f',
  brass: '#C8A45A', brassDim: '#a08735',
  claret: '#A04545', fern: '#5a8a6a',
};
const fS = "'DM Serif Display', Georgia, serif";
const fB = "'Work Sans', -apple-system, system-ui, sans-serif";
const fM = "'IBM Plex Mono', ui-monospace, monospace";

// ---------- Shared atoms ----------
function Eb({ children, c = MG3.text3, style = {} }) {
  return <div style={{
    fontFamily: fM, fontSize: 10.5, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: c, ...style,
  }}>{children}</div>;
}

function Avatar({ initial, size = 40, accent = false }) {
  return <div style={{
    width: size, height: size, borderRadius: 999, flexShrink: 0,
    background: 'linear-gradient(140deg, #2a3d33, #16241e)',
    border: `1px solid ${accent ? MG3.brass : MG3.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: fS, fontSize: size * 0.4,
    color: accent ? MG3.brass : MG3.text2,
  }}>{initial}</div>;
}

function NavBar({ title, leading = 'back', trailing }) {
  return <div>
    <div style={{ height: 54 }} />
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '0 16px', marginBottom: 16, alignItems: 'center',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 999,
        background: MG3.surface, border: `1px solid ${MG3.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {leading === 'back' ? (
          <svg width="9" height="14" viewBox="0 0 9 14" fill="none">
            <path d="M7.5 1.5L1.5 7l6 5.5" stroke={MG3.text2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 6l4 4 4-4" stroke={MG3.text2} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <Eb>{title}</Eb>
      {trailing || <div style={{ width: 40 }} />}
    </div>
  </div>;
}

function ScreenTitle({ children, sub }) {
  return <div style={{ padding: '0 22px', marginBottom: 22 }}>
    <h1 style={{
      fontFamily: fS, fontSize: 32, lineHeight: 1.05,
      color: MG3.text, margin: 0, letterSpacing: -0.4,
    }}>{children}</h1>
    {sub && <div style={{
      fontFamily: fB, fontSize: 13.5, color: MG3.text3, marginTop: 6,
    }}>{sub}</div>}
  </div>;
}

// =================================================================
// SCREEN 1 — People List
// =================================================================
function PeopleListScreen() {
  const people = [
    { i: 'K', name: 'Kira', rel: 'Best friend', occ: 'Birthday', days: 6, ideas: 2, urgent: true },
    { i: 'E', name: 'Eleanor', rel: 'Mom', occ: 'Birthday', days: 18, ideas: 4, urgent: false },
    { i: 'D', name: 'Dad', rel: 'Father', occ: "Father's Day", days: 38, ideas: 1, urgent: false },
    { i: 'J', name: 'Jamie', rel: 'Sister', occ: 'Birthday', days: 42, ideas: 0, urgent: false },
    { i: 'A', name: 'Ana', rel: 'Partner', occ: 'Anniversary', days: 84, ideas: 7, urgent: false },
    { i: 'L', name: 'Luca', rel: 'Nephew', occ: 'Birthday', days: 121, ideas: 3, urgent: false },
    { i: 'M', name: 'Marco', rel: 'Coworker', occ: 'Christmas', days: 244, ideas: 0, urgent: false },
  ];
  return (
    <div style={{ background: MG3.bg, color: MG3.text, minHeight: '100%' }}>
      <NavBar title="People · 12" trailing={
        <div style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'rgba(200,164,90,0.14)', border: `1px solid rgba(200,164,90,0.4)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: MG3.brass, fontFamily: fB, fontSize: 22, lineHeight: 1, paddingBottom: 2,
        }}>+</div>
      } />
      <ScreenTitle sub="Sorted by next occasion">People</ScreenTitle>

      {/* Search */}
      <div style={{ padding: '0 16px 18px' }}>
        <div style={{
          background: MG3.surface, border: `1px solid ${MG3.border}`,
          borderRadius: 12, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: fB, fontSize: 14, color: MG3.text3,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke={MG3.text3} strokeWidth="1.4"/>
            <path d="M9.5 9.5L13 13" stroke={MG3.text3} strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Search people, interests…
        </div>
      </div>

      {/* List grouped by urgency */}
      <div style={{ padding: '0 22px 6px' }}>
        <Eb c={MG3.claret}>This week</Eb>
      </div>
      <div style={{ padding: '0 16px 14px' }}>
        {people.filter(p => p.urgent).map((p, idx, arr) => (
          <PersonRow key={p.name} {...p} last={idx === arr.length - 1} urgent />
        ))}
      </div>

      <div style={{ padding: '6px 22px 6px' }}>
        <Eb>Upcoming</Eb>
      </div>
      <div style={{ padding: '0 16px 24px' }}>
        {people.filter(p => !p.urgent).map((p, idx, arr) => (
          <PersonRow key={p.name} {...p} last={idx === arr.length - 1} />
        ))}
      </div>
    </div>
  );
}

function PersonRow({ i, name, rel, occ, days, ideas, urgent, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 6px',
      borderBottom: last ? 'none' : `1px solid ${MG3.border}`,
    }}>
      <Avatar initial={i} size={44} accent={urgent} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{
            fontFamily: fS, fontSize: 19, color: MG3.text, lineHeight: 1.15,
          }}>{name}</div>
          <div style={{
            fontFamily: fB, fontSize: 12, color: MG3.text3,
          }}>{rel}</div>
        </div>
        <div style={{
          fontFamily: fB, fontSize: 13, color: urgent ? MG3.claret : MG3.text2,
          marginTop: 3, fontWeight: urgent ? 500 : 400,
        }}>
          {occ} · in {days} days
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: fS, fontSize: 18, color: ideas > 0 ? MG3.brass : MG3.text3,
          lineHeight: 1,
        }}>{ideas}</div>
        <Eb style={{ marginTop: 4, fontSize: 9.5 }}>{ideas === 1 ? 'idea' : 'ideas'}</Eb>
      </div>
    </div>
  );
}

// =================================================================
// SCREEN 2 — Calendar / Upcoming
// =================================================================
function CalendarScreen() {
  return (
    <div style={{ background: MG3.bg, color: MG3.text, minHeight: '100%' }}>
      <NavBar title="Upcoming" trailing={
        <div style={{
          padding: '0 12px', height: 32, borderRadius: 999,
          background: MG3.surface, border: `1px solid ${MG3.border}`,
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: fB, fontSize: 12, color: MG3.text2,
        }}>List
          <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
            <path d="M1 1l3.5 3.5L8 1" stroke={MG3.text2} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      } />
      <ScreenTitle sub="14 occasions across 12 people">Upcoming</ScreenTitle>

      {/* Stats strip */}
      <div style={{ padding: '0 16px 22px', display: 'flex', gap: 8 }}>
        <StatPill big="3" sub="this week" tone="claret" />
        <StatPill big="6" sub="this month" tone="brass" />
        <StatPill big="2" sub="ideas needed" tone="muted" />
      </div>

      <MonthHeader name="May" year="2026" count={4} />
      <div style={{ padding: '0 16px' }}>
        <OccRow day="3" weekday="Sun" name="Kira" rel="Best friend" occ="Birthday" days={6} ideaState="have" ideas={2} urgent />
        <OccRow day="14" weekday="Wed" name="Eleanor" rel="Mom" occ="Birthday" days={18} ideaState="have" ideas={4} />
        <OccRow day="20" weekday="Tue" name="Dad" rel="Father" occ="Father's Day" days={24} ideaState="needs" />
        <OccRow day="29" weekday="Thu" name="Jamie" rel="Sister" occ="Birthday" days={33} ideaState="needs" last />
      </div>

      <MonthHeader name="June" year="2026" count={3} />
      <div style={{ padding: '0 16px' }}>
        <OccRow day="9" weekday="Tue" name="Luca" rel="Nephew" occ="Birthday" days={44} ideaState="have" ideas={3} />
        <OccRow day="22" weekday="Mon" name="Eleanor" rel="Mom" occ="Anniversary" days={57} ideaState="have" ideas={1} />
        <OccRow day="30" weekday="Tue" name="Marco" rel="Coworker" occ="Promotion" days={65} ideaState="needs" last />
      </div>

      <MonthHeader name="July" year="2026" count={2} />
      <div style={{ padding: '0 16px 28px' }}>
        <OccRow day="14" weekday="Tue" name="Ana" rel="Partner" occ="Anniversary" days={79} ideaState="have" ideas={7} />
        <OccRow day="28" weekday="Tue" name="Aunt Vera" rel="Aunt" occ="Birthday" days={93} ideaState="needs" last />
      </div>

      <div style={{
        margin: '0 22px 28px',
        textAlign: 'center', padding: '10px 0',
        borderTop: `1px solid ${MG3.border}`,
      }}>
        <Eb c={MG3.brass}>Show 5 more →</Eb>
      </div>
    </div>
  );
}

function StatPill({ big, sub, tone }) {
  const c = tone === 'claret' ? MG3.claret : tone === 'brass' ? MG3.brass : MG3.text3;
  return (
    <div style={{
      flex: 1, background: MG3.surface, border: `1px solid ${MG3.border}`,
      borderRadius: 14, padding: '10px 12px',
    }}>
      <div style={{
        fontFamily: fS, fontSize: 24, color: c, lineHeight: 1,
      }}>{big}</div>
      <div style={{
        fontFamily: fB, fontSize: 11.5, color: MG3.text3, marginTop: 4,
      }}>{sub}</div>
    </div>
  );
}

function MonthHeader({ name, year, count }) {
  return (
    <div style={{
      padding: '12px 22px 10px', display: 'flex', alignItems: 'baseline',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{
          fontFamily: fS, fontSize: 22, color: MG3.text, fontStyle: 'italic',
        }}>{name}</div>
        <div style={{
          fontFamily: fM, fontSize: 11, color: MG3.text3,
          letterSpacing: '0.12em',
        }}>{year}</div>
      </div>
      <div style={{
        fontFamily: fM, fontSize: 10, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: MG3.text3,
      }}>{count} occ.</div>
    </div>
  );
}

function OccRow({ day, weekday, name, rel, occ, days, ideaState, ideas, urgent, last }) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'center',
      padding: '12px 6px',
      borderBottom: last ? 'none' : `1px solid ${MG3.border}`,
    }}>
      {/* date column */}
      <div style={{
        width: 44, flexShrink: 0, textAlign: 'center',
        padding: '6px 0', borderRadius: 8,
        background: urgent ? 'rgba(160,69,69,0.14)' : 'transparent',
        border: urgent ? `1px solid rgba(160,69,69,0.35)` : `1px solid ${MG3.border}`,
      }}>
        <div style={{
          fontFamily: fS, fontSize: 18, lineHeight: 1,
          color: urgent ? MG3.claret : MG3.text,
        }}>{day}</div>
        <div style={{
          fontFamily: fM, fontSize: 9, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: MG3.text3, marginTop: 3,
        }}>{weekday}</div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: fB, fontSize: 14.5, color: MG3.text, fontWeight: 500,
        }}>{occ} · {name}</div>
        <div style={{
          fontFamily: fB, fontSize: 12, color: MG3.text3, marginTop: 2,
        }}>{rel} · in {days} days</div>
      </div>

      {ideaState === 'have' ? (
        <div style={{
          padding: '4px 9px', borderRadius: 999,
          background: 'rgba(90,138,106,0.14)', border: `1px solid rgba(90,138,106,0.3)`,
          fontFamily: fM, fontSize: 9.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: MG3.fern,
        }}>{ideas} ideas</div>
      ) : (
        <div style={{
          padding: '4px 9px', borderRadius: 999,
          background: 'rgba(200,164,90,0.1)', border: `1px dashed ${MG3.brass}`,
          fontFamily: fM, fontSize: 9.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: MG3.brass,
        }}>+ ideas</div>
      )}
    </div>
  );
}

// =================================================================
// SCREEN 3 — Gift Ideas Backlog
// =================================================================
function BacklogScreen() {
  return (
    <div style={{ background: MG3.bg, color: MG3.text, minHeight: '100%' }}>
      <NavBar title="Ideas · 23" trailing={
        <div style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'rgba(200,164,90,0.14)', border: `1px solid rgba(200,164,90,0.4)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: MG3.brass, fontFamily: fB, fontSize: 22, lineHeight: 1, paddingBottom: 2,
        }}>+</div>
      } />
      <ScreenTitle sub="All captured ideas across 12 people">Ideas</ScreenTitle>

      {/* Filter bar */}
      <div className="hide-scrollbar" style={{
        padding: '0 16px 16px',
        display: 'flex', gap: 8, overflowX: 'auto',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        <Filter label="Person · Mom" active />
        <Filter label="Open · 18" />
        <Filter label="Under $75" />
        <Filter label="+ Filter" dashed />
      </div>

      {/* Sort + count */}
      <div style={{
        padding: '0 22px 14px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Eb>4 of 23 · for Eleanor</Eb>
        <div style={{
          fontFamily: fM, fontSize: 10, color: MG3.brass,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>Sort: Recent ↓</div>
      </div>

      {/* Cards */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BacklogCard
          thumb="#3a4a4a" title="Tartine Bread cookbook"
          source="Powell's Books" price="$40"
          people={[{ i: 'E' }]} occasion="Birthday"
        />
        <BacklogCard
          thumb="#5a4a3a" title="Hand-thrown ceramic mug, cobalt"
          source="East Fork Pottery" price="$58"
          people={[{ i: 'E' }, { i: 'A' }]} occasion="Anytime" multi
        />
        <BacklogCard
          thumb="#3a4a3a" title="Felco pruning shears (F-2)"
          source="Garden Tool Co." price="$62"
          people={[{ i: 'E' }]} occasion="Birthday"
        />
        <BacklogCard
          thumb="#4a3a4a" title="Italian wine club, 3-month subscription"
          source="Saved from link · Apr 14" price="$120/mo"
          people={[{ i: 'E' }]} occasion="Anniversary"
        />
      </div>

      <div style={{
        margin: '20px 22px 28px', padding: '12px 0',
        borderTop: `1px solid ${MG3.border}`,
        textAlign: 'center',
      }}>
        <Eb c={MG3.brass}>Show 19 more →</Eb>
      </div>
    </div>
  );
}

function Filter({ label, active, dashed }) {
  return (
    <span style={{
      flexShrink: 0, padding: '7px 12px', borderRadius: 999,
      background: active ? 'rgba(200,164,90,0.14)' : MG3.surface,
      border: `1px ${dashed ? 'dashed' : 'solid'} ${active ? 'rgba(200,164,90,0.4)' : MG3.border}`,
      fontFamily: fB, fontSize: 12.5, fontWeight: 500,
      color: active ? MG3.brass : dashed ? MG3.text3 : MG3.text2,
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      {label}
      {active && <span style={{ color: MG3.brass, fontSize: 14, lineHeight: 1, marginLeft: 2 }}>×</span>}
    </span>
  );
}

function BacklogCard({ thumb, title, source, price, people, occasion, multi }) {
  return (
    <div style={{
      display: 'flex', gap: 12, padding: 12,
      background: MG3.surface, border: `1px solid ${MG3.border}`,
      borderRadius: 14,
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 10, flexShrink: 0,
        background: thumb,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 4px, transparent 4px 8px)',
        border: `1px solid ${MG3.border}`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: fB, fontSize: 14.5, fontWeight: 500,
          color: MG3.text, lineHeight: 1.3,
        }}>{title}</div>
        <div style={{
          fontFamily: fB, fontSize: 12, color: MG3.text3, marginTop: 3,
        }}>{source}</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
        }}>
          {/* avatar stack */}
          <div style={{ display: 'flex' }}>
            {people.map((p, i) => (
              <div key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                <Avatar initial={p.i} size={22} />
              </div>
            ))}
          </div>
          <span style={{
            fontFamily: fB, fontSize: 12.5, color: MG3.text2,
          }}>{multi ? '2 people' : 'Eleanor'} · {occasion}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: fS, fontSize: 16, color: MG3.text,
        }}>{price}</div>
      </div>
    </div>
  );
}

// =================================================================
// SCREEN 4 — AI Brainstorm
// =================================================================
function BrainstormScreen() {
  return (
    <div style={{ background: MG3.bg, color: MG3.text, minHeight: '100%' }}>
      <NavBar title="Brainstorm" trailing={
        <div style={{
          fontFamily: fM, fontSize: 10, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: MG3.brass,
          padding: '0 4px',
        }}>Refine</div>
      } />

      {/* Context block */}
      <div style={{ padding: '0 22px 6px' }}>
        <Eb c={MG3.brass}>For Eleanor · Mom</Eb>
        <h1 style={{
          fontFamily: fS, fontSize: 28, lineHeight: 1.05,
          color: MG3.text, margin: '8px 0 0',
        }}>5 ideas for her birthday</h1>
        <div style={{
          fontFamily: fB, fontSize: 13, color: MG3.text3, marginTop: 6,
        }}>Generated just now · based on her notes &amp; interests</div>
      </div>

      {/* Context chips */}
      <div style={{ padding: '14px 16px 18px' }}>
        <div style={{
          background: MG3.surface, border: `1px solid ${MG3.border}`,
          borderRadius: 12, padding: '12px 14px',
        }}>
          <Eb style={{ marginBottom: 8 }}>Context</Eb>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            <CtxChip>gardening</CtxChip>
            <CtxChip>Italian wine</CtxChip>
            <CtxChip>baking sourdough</CtxChip>
            <CtxChip>hand pottery</CtxChip>
            <CtxChip>true crime podcasts</CtxChip>
          </div>
          <div style={{
            marginTop: 10, paddingTop: 10, borderTop: `1px solid ${MG3.border}`,
            display: 'flex', gap: 16, fontFamily: fB, fontSize: 12, color: MG3.text2,
          }}>
            <span><span style={{ color: MG3.text3 }}>Budget</span> $40–80</span>
            <span><span style={{ color: MG3.text3 }}>Avoiding</span> mugs · scented</span>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div style={{ padding: '0 22px 10px' }}>
        <Eb>Suggestions · 5</Eb>
      </div>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Suggest
          n="01" title="Italian regional cookbook"
          why="Connects her sourdough baking with Italian-wine interest. A focused regional book (Puglia, Sicily) feels considered, not generic."
          price="$45–60"
        />
        <Suggest
          n="02" title="Handmade ceramic herb planter set"
          why="Pottery + gardening overlap. Function-first so it doesn't read as decorative."
          price="$55–75"
        />
        <Suggest
          n="03" title="True-crime podcast premium subscription"
          why="Gift card-like but scoped. Lower commitment than a year, easy to renew."
          price="$40/yr"
        />
        <Suggest
          n="04" title="Heirloom tomato seed library"
          why="Adds variety to her existing garden without taking up space. Italian varieties tie to her Amalfi note."
          price="$35–50"
        />
        <Suggest
          n="05" title="Hand-stitched gardener's apron"
          why="Apron-shaped repeat: she liked the linen one in 2025. Heavier canvas + tool pockets is the next step up."
          price="$60–80"
          last
        />
      </div>

      {/* Footer actions */}
      <div style={{
        padding: '6px 16px 24px',
        display: 'flex', gap: 10,
      }}>
        <button style={{
          flex: 1, padding: '13px 14px',
          background: MG3.surface, border: `1px solid ${MG3.border}`,
          borderRadius: 12, color: MG3.text2,
          fontFamily: fB, fontSize: 14, fontWeight: 500,
        }}>Regenerate</button>
        <button style={{
          flex: 1, padding: '13px 14px',
          background: 'rgba(200,164,90,0.14)',
          border: `1px solid rgba(200,164,90,0.4)`,
          borderRadius: 12, color: MG3.brass,
          fontFamily: fB, fontSize: 14, fontWeight: 600,
        }}>Adjust context</button>
      </div>
    </div>
  );
}

function CtxChip({ children }) {
  return <span style={{
    padding: '4px 10px', borderRadius: 999,
    background: MG3.surfaceHi, border: `1px solid ${MG3.border}`,
    fontFamily: fB, fontSize: 12, color: MG3.text,
  }}>{children}</span>;
}

function Suggest({ n, title, why, price, last }) {
  return (
    <div style={{
      background: MG3.surface, border: `1px solid ${MG3.border}`,
      borderRadius: 14, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontFamily: fM, fontSize: 10.5, color: MG3.brass,
              letterSpacing: '0.14em',
            }}>{n}</span>
            <div style={{
              fontFamily: fS, fontSize: 17, color: MG3.text, lineHeight: 1.2,
              fontStyle: 'italic',
            }}>{title}</div>
          </div>
          <div style={{
            fontFamily: fB, fontSize: 13, color: MG3.text2,
            lineHeight: 1.5, marginTop: 6,
          }}>{why}</div>
        </div>
      </div>
      <div style={{
        marginTop: 12, paddingTop: 10, borderTop: `1px solid ${MG3.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: fS, fontSize: 16, color: MG3.text,
        }}>{price}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            padding: '6px 10px', borderRadius: 999,
            background: 'transparent', border: `1px solid ${MG3.border}`,
            fontFamily: fM, fontSize: 9.5, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: MG3.text3,
          }}>Skip</button>
          <button style={{
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(200,164,90,0.14)', border: `1px solid rgba(200,164,90,0.4)`,
            fontFamily: fM, fontSize: 9.5, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: MG3.brass, fontWeight: 600,
          }}>+ Save as idea</button>
        </div>
      </div>
    </div>
  );
}

window.PeopleListScreen = PeopleListScreen;
window.CalendarScreen = CalendarScreen;
window.BacklogScreen = BacklogScreen;
window.BrainstormScreen = BrainstormScreen;
