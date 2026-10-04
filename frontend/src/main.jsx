import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown, ArrowUp, ArrowUpRight, BedDouble, CalendarDays, Check, CheckCheck,
  ChevronDown, ChevronRight, CircleAlert, Compass, Download, ExternalLink,
  Globe, Image as ImageIcon, LoaderCircle, MapPin, Menu, MessageSquare,
  PanelRightClose, Plane, Plus, Search, ShieldCheck, Square, Users, X,
} from 'lucide-react';
import './style.css';

const roles = {
  coordinator: { name: 'Coordinator', specialty: 'Trip brief', icon: MessageSquare },
  transit: { name: 'Transit agent', specialty: 'Flights & getting around', icon: Plane },
  hotels: { name: 'Stay agent', specialty: 'Hotels & neighborhoods', icon: BedDouble },
  places: { name: 'Places agent', specialty: 'Experiences & local finds', icon: Compass },
  planner: { name: 'Planner', specialty: 'Itinerary & final checks', icon: MapPin },
};
const activeStatuses = new Set(['running', 'queued']);
const labels = { queued: 'Queued', running: 'Working', waiting_for_answers: 'Your turn', completed: 'Complete', failed: 'Needs attention', cancelled: 'Stopped' };
const fmtDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
const money = (amount, currency = 'USD') => amount == null ? 'Not verified' : `${currency} ${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const costText = value => value == null ? 'Pending' : `$${Number(value).toFixed(4)}`;
const safeUrl = url => { try { const u = new URL(url); return ['https:', 'http:'].includes(u.protocol) ? u.href : undefined; } catch { return undefined; } };

async function api(path, body) {
  const response = await fetch(path, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Request failed (${response.status})`);
  return data;
}

function IconButton({ icon: Icon, label, className = '', ...props }) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}><Icon size={18} /></button>;
}
function StatusIcon({ status }) {
  if (activeStatuses.has(status)) return <LoaderCircle className="spin" size={15} />;
  if (status === 'completed') return <Check size={15} />;
  if (status === 'failed') return <CircleAlert size={15} />;
  if (status === 'cancelled') return <Square size={12} />;
  return <span className="status-dot" />;
}
function SourceLinks({ ids = [], sources = [] }) {
  return <span className="citations">{ids.map(id => {
    const index = sources.findIndex(source => source.id === id);
    if (index < 0) return null;
    return <a key={id} href={safeUrl(sources[index].url)} target="_blank" rel="noopener noreferrer" title={sources[index].title}>[{index + 1}]</a>;
  })}</span>;
}
function Domain({ url }) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'Source'; }
}
function Photo({ photo }) {
  const [failed, setFailed] = useState(false);
  return <figure className="trip-photo">
    {failed ? <div className="photo-unavailable"><ImageIcon size={24} /><span>Photo unavailable</span></div> :
      <a href={safeUrl(photo.source_url)} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
        <img src={safeUrl(photo.image_url)} alt={photo.title} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      </a>}
    <figcaption><a href={safeUrl(photo.source_url)} target="_blank" rel="noopener noreferrer">{photo.title}<ArrowUpRight size={12} /></a>
      <span>{photo.author} · <a href={safeUrl(photo.license_url)} target="_blank" rel="noopener noreferrer">{photo.license}</a></span>
    </figcaption>
  </figure>;
}

function FinalReport({ result, runId }) {
  const plan = result.plan;
  const [day, setDay] = useState(0);
  const [tab, setTab] = useState('itinerary');
  const [allDays, setAllDays] = useState(false);
  if (!plan) return null;
  const sources = plan.sources || [];
  const currency = plan.brief.currency;
  const caution = [...new Set([...(plan.validation.errors || []), ...(plan.validation.warnings || []), ...(plan.warnings || [])])];
  const reviewed = plan.validation.status === 'passed';
  const renderDay = (item, index) => <section className="day-plan" key={item.date}>
    <div className="day-heading"><span className="day-number">{String(index + 1).padStart(2, '0')}</span><div><span className="subtle">{fmtDate(item.date)}</span><h3>{item.theme}</h3></div></div>
    <div className="activities">{item.activities.map((activity, i) => <div className="activity" key={i}>
      <div className="activity-time"><strong>{activity.time}</strong><span>{activity.duration_minutes} min</span></div>
      <div className="activity-body"><h4>{activity.title}<SourceLinks ids={activity.source_ids} sources={sources} /></h4><span className="activity-location"><MapPin size={12} />{activity.location}</span><p>{activity.details}</p>
        {activity.estimated_cost != null && <span className="subtle">Estimate · {money(activity.estimated_cost, currency)}</span>}</div>
    </div>)}</div>
  </section>;
  return <article className="final-report" data-testid="final-report">
    <div className={`report-status ${reviewed ? 'verified' : ''}`}><ShieldCheck size={15} />{reviewed ? 'Checks passed' : 'Booking details need review'}<span>{sources.length} sources</span></div>
    <h2>{plan.title}</h2>
    <div className="trip-meta"><span><CalendarDays size={14} />{fmtDate(plan.brief.start_date)} - {fmtDate(plan.brief.end_date)}</span><span><Users size={14} />{plan.brief.travelers} travelers</span><span><MapPin size={14} />{plan.brief.destination}</span></div>
    <p className="report-summary">{plan.summary}</p>
    {plan.images?.length > 0 && <div className="photos">{plan.images.map(photo => <Photo key={photo.image_url} photo={photo} />)}</div>}
    <div className="report-tabs" role="tablist" aria-label="Report sections">{[['itinerary', 'Itinerary'], ['logistics', 'Travel & stays'], ['budget', 'Budget'], ['sources', 'Sources']].map(([id, title]) =>
      <button type="button" role="tab" aria-selected={tab === id} aria-controls={`report-panel-${runId}`} key={id} onClick={() => setTab(id)}>{title}</button>)}</div>
    <div id={`report-panel-${runId}`} role="tabpanel">
      {tab === 'itinerary' && <>
        <div className="day-controls"><div className="day-tabs" aria-label="Trip days">{plan.days.map((item, index) => <button type="button" key={item.date} aria-pressed={!allDays && day === index} onClick={() => { setDay(index); setAllDays(false); }}>Day {index + 1}</button>)}</div>
          <button type="button" className="text-button" aria-pressed={allDays} onClick={() => setAllDays(!allDays)}>{allDays ? 'One day' : 'All days'}</button></div>
        {allDays ? plan.days.map(renderDay) : renderDay(plan.days[day] || plan.days[0], day)}
      </>}
      {tab === 'logistics' && <div className="logistics">{[['Transport', plan.transport, Plane], ['Places to stay', plan.stays, BedDouble]].map(([title, items, Icon]) => <section key={title}>
        <h3><Icon size={17} />{title}</h3>{items.map((item, i) => <div className="recommendation" key={i}><h4>{item.name}<SourceLinks ids={item.source_ids} sources={sources} /></h4><p>{item.details}</p><span className="subtle">{money(item.estimated_cost, currency)} · {item.cost_basis.replaceAll('_', ' ')}</span></div>)}
      </section>)}</div>}
      {tab === 'budget' && <section className="budget-section"><div className="budget-total"><div><span className="subtle">Known estimate · whole trip</span><strong>{money(plan.validation.known_estimated_total, currency)}</strong></div><span>of {money(plan.brief.budget, currency)}</span></div>
        <div className="budget-table">{plan.budget_items.map((item, i) => <div className="budget-row" key={i}><div><strong>{item.category.replaceAll('_', ' ')}</strong><p>{item.notes}<SourceLinks ids={item.source_ids} sources={sources} /></p></div><span>{money(item.amount, currency)}</span></div>)}</div>
        {plan.validation.has_unknown_costs && <p className="caution-text">Some costs are not yet verified.</p>}
      </section>}
      {tab === 'sources' && <ol className="source-list">{sources.map(source => <li key={source.id}><a href={safeUrl(source.url)} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={13} /></a><span><Domain url={source.url} /> · Retrieved {new Date(source.retrieved_at).toLocaleDateString()}</span><p>{source.snippet}</p></li>)}</ol>}
    </div>
    <details className="report-notes"><summary><CircleAlert size={15} />Assumptions & checks <span>{caution.length + plan.assumptions.length}</span><ChevronDown size={14} /></summary><ul>{plan.assumptions.map((text, i) => <li key={`a${i}`}>{text}</li>)}{caution.map((text, i) => <li key={`c${i}`}>{text}</li>)}</ul></details>
    <footer className="report-actions"><a className="action-link" href={`/runs/${runId}/report`} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />Full report</a><a className="action-link" href={`/runs/${runId}/download/md`}><Download size={15} />Markdown</a><a className="action-link" href={`/runs/${runId}/download/json`}><Download size={15} />JSON</a><span>API spend {costText(result.cost?.run_accounted_usd)}</span></footer>
  </article>;
}

function deriveAgents(events, chatStatus) {
  const agents = {};
  for (const event of events) {
    const p = event.payload;
    if (event.kind === 'research_spawned') for (const role of p.roles) agents[role] ||= { role, status: 'queued', events: [] };
    if (!p.role || !roles[p.role]) continue;
    const agent = agents[p.role] ||= { role: p.role, status: 'queued', events: [] };
    agent.events.push(event);
    if (event.kind === 'agent_started' || event.kind === 'planner_started') { agent.status = 'running'; agent.started = event.created_at; agent.model = p.model || agent.model; }
    if (event.kind === 'model_started') { agent.call = p.call; agent.latest = 'Preparing a draft'; agent.draft = null; agent.content = ''; }
    if (event.kind === 'agent_draft') { agent.draft = p.draft || agent.draft; agent.content = p.content || ''; agent.latest = p.draft?.summary || p.content || agent.latest; }
    if (event.kind === 'tool_started') { agent.latest = p.tool === 'search_images' ? 'Finding destination photos' : `Searching: ${p.query}`; }
    if (event.kind === 'tool_completed') {
      agent.sources = [...new Map([...(agent.sources || []), ...(p.sources || [])].map(s => [s.id, s])).values()];
      agent.latest = p.sources ? `Found ${p.sources.length} sources` : `Found ${p.images?.length || 0} photos`;
    }
    if (event.kind === 'agent_completed') { agent.status = 'completed'; agent.data = p.data; agent.latest = p.data?.summary || 'Work complete'; agent.sources = p.sources || agent.sources; agent.metrics = p.metrics; }
    if (event.kind === 'agent_failed') { agent.status = 'failed'; agent.latest = p.message || p.error || 'Could not finish research'; }
    if (event.kind === 'agent_cancelled') { agent.status = 'cancelled'; agent.latest = 'Stopped'; }
    if (event.kind === 'validation' && !p.valid) agent.latest = 'Revising after validation checks';
  }
  if (['failed', 'cancelled'].includes(chatStatus)) for (const a of Object.values(agents)) if (activeStatuses.has(a.status)) a.status = chatStatus;
  return agents;
}

function AgentCard({ agent, role, onClick, selected }) {
  const { name, specialty, icon: Icon } = roles[role];
  const status = agent?.status || 'queued';
  return <button type="button" className={`agent-card ${selected ? 'selected' : ''}`} onClick={onClick} data-testid={`agent-${role}`}>
    <div className="agent-card-top"><span className={`agent-symbol ${role}`}><Icon size={18} /></span><ChevronRight size={15} /></div>
    <strong>{name}</strong><span className="agent-specialty">{specialty}</span>
    <div className={`agent-state ${status}`}><StatusIcon status={status} /><span>{labels[status]}</span>{agent?.metrics?.searches != null && <small>{agent.metrics.searches} searches</small>}</div>
    <p className="agent-preview">{agent?.latest || 'Waiting to start'}</p>
  </button>;
}

function Draft({ data, content, sources = [] }) {
  return <div className="draft-output">
    {data?.title && <h3>{data.title}</h3>}
    {data?.summary && <p>{data.summary}</p>}
    {data?.recommendations?.map((item, i) => <section className="draft-item" key={i}><h4>{item.name}<SourceLinks ids={item.source_ids} sources={sources} /></h4><p>{item.details}</p></section>)}
    {data?.days?.map((item, i) => <section className="draft-item" key={i}><span className="subtle">Day {i + 1} · {fmtDate(item.date)}</span><h4>{item.theme}</h4>{item.activities?.map((activity, j) => <p key={j}><strong>{activity.time} · {activity.title}</strong><br />{activity.details}</p>)}</section>)}
    {data?.brief && <dl className="brief-list">{Object.entries(data.brief).filter(([, value]) => value != null && value !== '').map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{Array.isArray(value) ? value.join(', ') : String(value)}</dd></div>)}</dl>}
    {data?.cautions?.length > 0 && <ul>{data.cautions.map((text, i) => <li key={i}>{text}</li>)}</ul>}
    {content && <p className="public-content">{content}</p>}
    {!data && !content && <div className="drawer-empty"><LoaderCircle size={22} className="spin" /><p>No draft yet.</p></div>}
  </div>;
}

function AgentDrawer({ role, agent, onClose }) {
  const [tab, setTab] = useState('activity');
  const closeRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const key = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && window.matchMedia('(max-width: 1200px)').matches) {
        const focusable = [...closeRef.current.closest('.agent-drawer').querySelectorAll('button, a[href], [tabindex="0"]')].filter(el => el.tabIndex >= 0 && !el.disabled);
        const first = focusable[0], last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); previous?.focus(); };
  }, [role]);
  const Icon = roles[role].icon;
  const activity = (agent?.events || []).filter(e => !['agent_draft', 'model_completed'].includes(e.kind));
  const eventTitle = e => ({
    agent_started: 'Agent spawned', model_started: `Drafting · call ${e.payload.call}`,
    tool_started: e.payload.tool === 'search_images' ? 'Searching photos' : 'Searching the web',
    tool_completed: e.payload.sources ? `${e.payload.sources.length} sources retrieved` : `${e.payload.images?.length || 0} photos retrieved`,
    validation: e.payload.valid ? 'Structured output accepted' : 'Revision requested',
    agent_completed: 'Work complete', agent_failed: 'Agent could not finish',
    agent_warning: 'Request warning', agent_cancelled: 'Agent stopped', planner_started: 'Combining research', plan_validated: 'Plan checked',
  }[e.kind] || e.kind.replaceAll('_', ' '));
  return <>
    <button className="drawer-scrim" aria-label="Close agent panel" onClick={onClose} />
    <aside className="agent-drawer" aria-label={`${roles[role].name} details`}>
      <header><span className={`agent-symbol ${role}`}><Icon size={20} /></span><div><h2>{roles[role].name}</h2><span className={`agent-state ${agent?.status}`}><StatusIcon status={agent?.status} />{labels[agent?.status] || 'Queued'}</span></div><button type="button" ref={closeRef} className="icon-button" aria-label="Close agent panel" title="Close agent panel" onClick={onClose}><PanelRightClose size={18} /></button></header>
      <div className="drawer-tabs" role="tablist" aria-label="Agent detail views">{['activity', 'output'].map(t => <button type="button" key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t === 'activity' ? 'Activity' : 'Output'}{t === 'output' && activeStatuses.has(agent?.status) && <span className="live-dot" />}</button>)}</div>
      <div className="drawer-scroll" role="tabpanel">
        {tab === 'activity' ? <ol className="activity-log">{activity.map(e => <li key={e.id} className={e.kind}><span className="log-marker">{e.kind.startsWith('tool') ? <Search size={13} /> : e.kind === 'agent_completed' ? <Check size={13} /> : <span />}</span><div><div className="log-title"><strong>{eventTitle(e)}</strong><time>{new Date(e.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time></div>
          {e.payload.query && <p>{e.payload.query}</p>}{e.payload.message && <p>{e.payload.message}</p>}
          {e.payload.sources?.length > 0 && <ul className="log-sources">{e.payload.sources.map(s => <li key={s.id}><a href={safeUrl(s.url)} target="_blank" rel="noopener noreferrer">{s.title}<ArrowUpRight size={12} /></a><span><Domain url={s.url} /></span></li>)}</ul>}
          {e.payload.images?.length > 0 && <div className="log-photos">{e.payload.images.map(photo => <Photo key={photo.image_url} photo={photo} />)}</div>}
          {e.kind === 'validation' && !e.payload.valid && <ul>{e.payload.errors.map((error, i) => <li key={i}>{typeof error === 'string' ? error : error.msg}</li>)}</ul>}
          {e.kind === 'agent_completed' && e.payload.data?.summary && <p>{e.payload.data.summary}</p>}
        </div></li>)}</ol> : <Draft data={agent?.data || agent?.draft} content={agent?.content} sources={agent?.sources} />}
      </div>
      <footer><Globe size={13} /><span>{agent?.model || roles[role].specialty}</span></footer>
    </aside>
  </>;
}

function App() {
  const [config, setConfig] = useState(null);
  const [mode, setMode] = useState('cline');
  const [history, setHistory] = useState([]);
  const [chat, setChat] = useState(null);
  const [events, setEvents] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [sidebar, setSidebar] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const streamRef = useRef(null);
  const selectionRef = useRef(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const tailRef = useRef(null);
  const agents = deriveAgents(events, chat?.status);
  const working = activeStatuses.has(chat?.status);
  const followup = chat?.status === 'waiting_for_answers';
  const modeInfo = config?.modes.find(m => m.id === (chat?.mode || mode));
  const hasResearch = events.some(e => e.kind === 'research_spawned');

  async function refreshHistory() { setHistory(await api('/chats')); }

  function subscribe(runId, token, snapshotCursor = 0) {
    streamRef.current?.close();
    const source = new EventSource(`/chats/${runId}/events`);
    streamRef.current = source;
    source.onopen = () => { if (selectionRef.current === token) setConnection(''); };
    source.onmessage = e => {
      if (selectionRef.current !== token) return;
      const event = JSON.parse(e.data);
      setEvents(previous => previous.some(item => item.id === event.id) ? previous : [...previous, event]);
      if (event.kind === 'state' && event.id > snapshotCursor) {
        setChat(previous => previous?.run_id === runId ? { ...previous, status: event.payload.status, ...(event.payload.result ? { result: event.payload.result } : {}) } : previous);
      }
    };
    source.addEventListener('idle', e => {
      if (selectionRef.current !== token) return;
      setChat(JSON.parse(e.data)); source.close(); setConnection(''); refreshHistory().catch(() => {});
    });
    source.onerror = () => { if (selectionRef.current === token && source.readyState !== EventSource.CLOSED) setConnection('Reconnecting'); };
  }

  async function openChat(runId) {
    const token = ++selectionRef.current;
    streamRef.current?.close();
    setError(''); setEvents([]); setSelectedAgent(null); setInput(''); setSidebar(false); setConnection('Loading');
    try {
      const next = await api(`/chats/${runId}`);
      if (selectionRef.current !== token) return;
      setChat(next); setMode(next.mode); setAtBottom(true);
      localStorage.setItem('optiroute-chat', runId);
      window.history.replaceState(null, '', `/?chat=${runId}`);
      subscribe(runId, token, next.last_event_id);
    } catch (e) { if (selectionRef.current === token) { setError(e.message); setConnection(''); setChat(null); } }
  }

  function newChat() {
    selectionRef.current++;
    streamRef.current?.close(); setChat(null); setEvents([]); setInput(''); setError(''); setConnection(''); setSelectedAgent(null); setSidebar(false); setAtBottom(true);
    localStorage.removeItem('optiroute-chat'); window.history.replaceState(null, '', '/'); inputRef.current?.focus();
  }

  useEffect(() => {
    Promise.all([api('/chat-config'), api('/chats')]).then(([configuration, chats]) => {
      setConfig(configuration); setMode(configuration.default_mode); setHistory(chats);
      const saved = new URLSearchParams(window.location.search).get('chat') || localStorage.getItem('optiroute-chat');
      if (saved && chats.some(item => item.run_id === saved)) openChat(saved);
    }).catch(e => setError(e.message));
    return () => streamRef.current?.close();
  }, []);

  useEffect(() => {
    if (atBottom) requestAnimationFrame(() => tailRef.current?.scrollIntoView({ block: 'end', behavior: 'instant' }));
  }, [events.length, chat?.status, selectedAgent, atBottom]);

  useEffect(() => {
    if (!history.some(h => activeStatuses.has(h.status))) return;
    const interval = setInterval(() => refreshHistory().catch(() => {}), 5000);
    return () => clearInterval(interval);
  }, [history]);

  async function send(event) {
    event.preventDefault();
    if (!input.trim() || sending || working || !config || connection === 'Loading') return;
    setSending(true); setError(''); setAtBottom(true);
    const text = input.trim();
    const token = selectionRef.current;
    try {
      if (followup) {
        const updated = await api(`/chats/${chat.run_id}/answers`, { answers: text });
        if (selectionRef.current === token) { setChat(updated); setInput(''); subscribe(chat.run_id, token, updated.last_event_id); }
      } else {
        const created = await api('/chats', { message: text, mode });
        if (selectionRef.current === token) await openChat(created.run_id);
      }
      await refreshHistory();
    } catch (e) { setError(e.message); } finally { setSending(false); inputRef.current?.focus(); }
  }

  async function stop() {
    if (!chat || sending) return;
    setSending(true);
    const token = selectionRef.current;
    try { const stopped = await api(`/chats/${chat.run_id}/cancel`, {}); if (selectionRef.current === token) setChat(stopped); await refreshHistory(); } catch (e) { setError(e.message); } finally { setSending(false); }
  }

  const messages = events.filter(e => e.kind === 'user_message' || e.kind === 'state' && e.payload.status === 'waiting_for_answers');
  return <div className={`workspace ${selectedAgent ? 'with-drawer' : ''}`}>
    {sidebar && <button className="sidebar-scrim" onClick={() => setSidebar(false)} aria-label="Close chat history" />}
    <aside className={`sidebar ${sidebar ? 'open' : ''}`} aria-label="Chat history">
      <div className="brand"><span className="brand-mark"><Compass size={23} /></span><strong>OptiRoute<span>TRAVEL WORKSPACE</span></strong><IconButton className="mobile-only" icon={X} label="Close chat history" onClick={() => setSidebar(false)} /></div>
      <button type="button" className="new-chat" onClick={newChat}><Plus size={16} />New trip</button>
      <div className="history-heading">Trips<span>{history.length}</span></div>
      <nav className="history-list">{history.map(item => <button type="button" className={`history-item ${chat?.run_id === item.run_id ? 'current' : ''}`} key={item.run_id} onClick={() => openChat(item.run_id)} title={item.title}>
        <MessageSquare size={15} /><span><strong>{item.title}</strong><small>{item.mode === 'demo' ? 'Demo · ' : ''}{labels[item.status]}</small></span>{activeStatuses.has(item.status) && <LoaderCircle size={13} className="spin" />}
      </button>)}</nav>
      <footer className="sidebar-footer"><span className="connection-dot" /><div><strong>Local workspace</strong><span>Cline SDK + LangGraph</span></div><a href="/docs" target="_blank" rel="noopener noreferrer" title="API documentation" aria-label="API documentation"><ExternalLink size={15} /></a></footer>
    </aside>
    <main className="chat-main">
      <header className="chat-header"><IconButton className="mobile-only" icon={Menu} label="Open chat history" onClick={() => setSidebar(true)} /><div className="header-title"><h1>{chat ? chat.result?.brief?.destination || 'Trip planning' : 'New trip'}</h1><span>{chat ? labels[chat.status] : 'Your next destination'}</span></div>
        <div className="provider"><Globe size={14} /><select aria-label="Model provider" value={chat?.mode || mode} onChange={e => setMode(e.target.value)} disabled={!!chat || !config}>{config?.modes.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select><ChevronDown size={12} /></div>
        <span className="free-badge">{modeInfo?.free_only ? 'Free only' : 'Budget capped'}</span>
      </header>
      <div className="thread" ref={scrollRef} onScroll={() => { const el = scrollRef.current; setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 100); }}>
        <div className="thread-inner">
          {!chat && <section className="empty-state"><span className="empty-mark"><Compass size={30} strokeWidth={1.5} /></span><p className="eyebrow">A TRIP WORTH PLANNING</p><h2>Where are we going?</h2><div className="suggestions">{['A week in Switzerland', 'A weekend in Jaipur', 'Five days in Japan'].map(text => <button type="button" key={text} onClick={() => { setInput(text); inputRef.current?.focus(); }}>{text}<ArrowUpRight size={14} /></button>)}</div></section>}
          {chat?.mode === 'demo' && <div className="demo-notice"><CircleAlert size={14} />Demo fixtures · Jaipur · no live research or API charges</div>}
          {messages.map(event => event.kind === 'user_message' ? <div className="user-message" key={event.id}><div>{event.payload.text}</div></div> : <section className="assistant-message followup" key={event.id}><div className="message-author"><span className="mini-brand"><Compass size={14} /></span>OptiRoute<span>Coordinator</span></div><h3>A few details before we go.</h3><ol>{event.payload.result?.follow_up?.questions?.map(q => <li key={q.id}>{q.question}</li>)}</ol></section>)}
          {chat && !hasResearch && working && <button type="button" className="coordinator-progress" onClick={() => setSelectedAgent('coordinator')}><LoaderCircle size={16} className="spin" />{agents.coordinator?.latest || 'Reading your trip brief'}<ChevronRight size={14} /></button>}
          {hasResearch && <section className="research-message"><div className="message-author"><span className="mini-brand"><Compass size={14} /></span>OptiRoute<span>Research</span></div><div className="research-heading"><h3>Three agents, one trip.</h3><span>{['transit', 'hotels', 'places'].filter(role => agents[role]?.status === 'completed').length}/3 complete</span></div>
            <div className="agent-grid">{['transit', 'hotels', 'places'].map(role => <AgentCard key={role} role={role} agent={agents[role]} selected={selectedAgent === role} onClick={() => setSelectedAgent(role)} />)}</div>
            {agents.planner && <button type="button" className="planner-progress" onClick={() => setSelectedAgent('planner')}><span className="agent-symbol planner"><MapPin size={16} /></span><div><strong>Planner</strong><span>{agents.planner.status === 'completed' ? 'Research combined. Itinerary ready.' : agents.planner.latest || 'Combining research & checking the plan'}</span></div><StatusIcon status={agents.planner.status} /><ChevronRight size={15} /></button>}
          </section>}
          {chat?.status === 'completed' && chat.result?.plan && <section className="assistant-message report-message"><div className="message-author"><span className="mini-brand"><Compass size={14} /></span>OptiRoute<span>Final report</span><CheckCheck size={14} /></div><FinalReport key={chat.run_id} result={chat.result} runId={chat.run_id} /></section>}
          {chat?.status === 'failed' && <div className="chat-error" role="alert"><CircleAlert size={18} /><div><strong>This request could not finish.</strong>{chat.result?.errors?.map((text, i) => <p key={i}>{text}</p>)}<button type="button" className="text-button" onClick={() => { const prompt = events.find(e => e.kind === 'user_message')?.payload.text; newChat(); setInput(prompt || ''); }}>Try in a new trip<ArrowUpRight size={13} /></button></div></div>}
          {chat?.status === 'cancelled' && <div className="stopped-message"><Square size={13} />Request stopped. Partial activity has been preserved.</div>}
          <div ref={tailRef} className="thread-tail" />
        </div>
      </div>
      <div className="composer-area">
        {!atBottom && chat && <IconButton className="jump-bottom" icon={ArrowDown} label="Jump to latest message" onClick={() => { setAtBottom(true); tailRef.current?.scrollIntoView({ behavior: 'smooth' }); }} />}
        {error && <div className="input-error" role="alert"><CircleAlert size={15} />{error}<IconButton icon={X} label="Dismiss error" onClick={() => setError('')} /></div>}
        {chat && !working && !followup ? <button type="button" className="next-trip" onClick={newChat}><Plus size={16} />Plan another trip</button> : <form className={`composer ${followup ? 'answering' : ''}`} onSubmit={send}>
          <textarea ref={inputRef} aria-label={followup ? 'Follow-up answers' : 'Trip prompt'} placeholder={followup ? 'Your dates, budget, and preferences...' : 'Where to? Add dates, a budget, or anything you have in mind.'} value={input} maxLength={12000} rows={2} disabled={working} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(e); } }} />
          <div className="composer-toolbar"><span>{working ? <><span className="live-dot" />Agents working</> : followup ? <><MessageSquare size={13} />Reply to coordinator</> : <><Compass size={14} />Travel planning</>}</span>
            {working ? <IconButton className="send-button stop-button" icon={Square} label="Stop request" disabled={sending} onClick={stop} /> : <button type="submit" className="icon-button send-button" aria-label="Send message" title="Send message" disabled={!input.trim() || sending || !config}>{sending ? <LoaderCircle size={18} className="spin" /> : <ArrowUp size={18} />}</button>}
          </div>
        </form>}
        <div className="composer-foot"><span>{modeInfo?.model || 'Connecting to workspace'}{modeInfo?.id !== 'demo' && modeInfo?.free_only ? ' · Paid models disabled' : ''}</span><span className={connection ? 'reconnecting' : ''}>{connection || (chat?.result?.cost ? `API spend ${costText(chat.result.cost.run_accounted_usd)}` : 'Source-backed planning')}</span></div>
      </div>
    </main>
    {selectedAgent && <AgentDrawer key={selectedAgent} role={selectedAgent} agent={agents[selectedAgent]} onClose={() => setSelectedAgent(null)} />}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
