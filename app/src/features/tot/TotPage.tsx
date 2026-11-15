import { ArrowDown, ArrowUp, Cpu, Download, ListChecks, Send, Square, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PageBanner } from '@/components/PageBanner'
import { Panel, PanelHeader } from '@/components/Panel'
import { Action } from '@/components/ui/action'
import { TOT_CHAT_KEY, TOT_MAX_MESSAGES, TOT_MODEL_KEY, TOT_MODELS, TOT_PHONE_DEFAULT } from '@/config/tot'
import { INDICATORS } from '@/data/indicators'
import { ESCALATION_TEXT } from '@/engine/assess'
import type { IndicatorId } from '@/engine/types'
import { cn } from '@/lib/utils'
import { Page } from '@/shell/Page'
import { useStore } from '@/state/store'
import { useHealth } from '@/state/useHealth'
import { CPU_MODEL, cpuModelCached, explainError, gpuInfo, gpuRunner, loadCpuRunner, loadEngine, modelCached, type ChatMessage, type Runner } from './engine'
import { buildFacts } from './facts'
import { cpuPrompt, explanationOnly, measuredFor, SUGGESTED, systemPrompt, topicsOf } from './prompt'
import { retrieve } from './retrieve'

/*
  TOT (features.tot): an AI assistant that runs on this device through
  WebLLM. It answers from Khonsu's analytics and the offline knowledge
  library, shows its sources, and never calculates thresholds itself.
  Without WebGPU it says so and offers a rule-based summary instead.
*/

type Source = { title: string; label: string; url: string }
type Message = { role: 'user' | 'assistant'; text: string; sources?: Source[]; basic?: boolean; at: string }
type Status = 'checking' | 'unsupported' | 'idle' | 'loading' | 'ready' | 'error'

/* One engine for the whole app session, so leaving the page does not unload the model */
let current: { runner: Runner; modelId: string } | null = null

/* Whether this device's graphics chip has 16-bit float shaders; null until checked */
let deviceF16: boolean | null = null
const isPhone = () => window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 768
const readModel = () => {
  const fallback = isPhone() ? TOT_PHONE_DEFAULT : TOT_MODELS[0].id
  try {
    const id = localStorage.getItem(TOT_MODEL_KEY)
    return TOT_MODELS.some((m) => m.id === id) ? id! : fallback
  } catch {
    return fallback
  }
}
/** The build to load: f16 where the chip supports it, otherwise the f32 build of the same model */
const buildOf = (id: string) => {
  const m = TOT_MODELS.find((x) => x.id === id) ?? TOT_MODELS[0]
  return deviceF16 === false ? m.f32Id : m.id
}
const chatKey = (crew: string) => `${TOT_CHAT_KEY}:${crew}`
const readChat = (crew: string): Message[] => {
  try {
    return JSON.parse(localStorage.getItem(chatKey(crew)) ?? '[]') as Message[]
  } catch {
    return []
  }
}

function Answer({ text }: { text: string }) {
  return (
    <div className="grid gap-1.5">
      {text.split('\n').map((line, i) => {
        const clean = line.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim()
        if (!clean) return null
        const heading = (/^(measured|trend|possible explanations|background|what to do)\b/i.test(clean) && clean.length < 40) || /^#+\s/.test(line) || /^\*\*[^*]+\*\*:?$/.test(line.trim())
        if (heading) return <p key={i} className="label text-muted-foreground mt-2 first:mt-0">{clean.replace(/:$/, '')}</p>
        return (
          <p key={i} className={cn(/^[-*•]\s/.test(clean) && 'pl-3')}>
            {clean.replace(/^[-*•]\s/, '• ')}
          </p>
        )
      })}
    </div>
  )
}

export function TotPage() {
  const { crewId, mode, history } = useStore()
  const health = useHealth()
  const [status, setStatus] = useState<Status>(current ? 'ready' : 'checking')
  const [progress, setProgress] = useState({ pct: 0, text: '' })
  const [error, setError] = useState('')
  /* The raw error text, shown small under the plain message, to tell what failed */
  const [errorDetail, setErrorDetail] = useState('')
  const [modelId, setModelId] = useState(current?.modelId ?? readModel())
  /* gpu: WebLLM on the graphics chip; cpu: the smaller backup model on the processor (no WebGPU) */
  const [engineKind, setEngineKind] = useState<'gpu' | 'cpu'>(current?.runner.kind ?? 'gpu')
  const [messages, setMessages] = useState<Message[]>(() => readChat(crewId))
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  /* Where the Start TOT panel is while it is off screen, for the floating arrow */
  const modelPanel = useRef<HTMLDivElement>(null)
  const [panelAt, setPanelAt] = useState<'above' | 'below' | null>(null)
  useEffect(() => {
    const el = modelPanel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setPanelAt(e.isIntersecting ? null : e.boundingClientRect.top < 0 ? 'above' : 'below'), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const facts = useMemo(() => buildFacts({ crewId, mode, history, health }), [crewId, mode, history, health])
  const model = TOT_MODELS.find((m) => m.id === modelId)!

  useEffect(() => setMessages(readChat(crewId)), [crewId])
  useEffect(() => {
    try {
      localStorage.setItem(chatKey(crewId), JSON.stringify(messages.slice(-TOT_MAX_MESSAGES)))
    } catch {
      /* chat stays in memory only */
    }
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, crewId])

  const start = async (id = modelId, kind = engineKind) => {
    setError('')
    setStatus('loading')
    setProgress({ pct: 0, text: 'Starting…' })
    const wanted = kind === 'cpu' ? CPU_MODEL.id : id
    try {
      if (current && current.modelId !== wanted) {
        await current.runner.dispose()
        current = null
      }
      if (!current) {
        if (kind === 'cpu') {
          const runner = await loadCpuRunner((pct, text) => setProgress({ pct, text }))
          current = { runner, modelId: wanted }
        } else {
          const loaded = await loadEngine(buildOf(id), (r) => setProgress({ pct: Math.round(r.progress * 100), text: r.text }))
          current = { runner: gpuRunner(loaded.engine, loaded.worker), modelId: wanted }
        }
      }
      setStatus('ready')
    } catch (e) {
      setError(explainError(e))
      setErrorDetail(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }

  useEffect(() => {
    if (current) return
    let gone = false
    void (async () => {
      /* ?tot-cpu in the address forces the processor backup, to test or show it on any device */
      const forceCpu = new URLSearchParams(window.location.search).has('tot-cpu')
      const gpu = forceCpu ? { ok: false, f16: false } : await gpuInfo()
      deviceF16 = gpu.f16
      if (!gpu.ok) {
        /* No WebGPU: offer the processor backup instead */
        if (gone) return
        setEngineKind('cpu')
        if (await cpuModelCached()) {
          if (!gone) void start(CPU_MODEL.id, 'cpu')
        } else if (!gone) setStatus('idle')
        return
      }
      if (await modelCached(buildOf(modelId))) {
        if (!gone) void start(modelId)
      } else if (!gone) setStatus('idle')
    })()
    return () => {
      gone = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const basicSummary = () => {
    const at = new Date().toISOString()
    setMessages((m) => [...m, { role: 'user', text: 'Basic summary', at }, { role: 'assistant', text: facts.basic, basic: true, at }])
  }

  const ask = async (q: string) => {
    const question = q.trim()
    if (!question || busy || !current) return
    setInput('')
    /* The processor backup and the smallest GPU model only explain; Khonsu writes the numbers */
    const cpu = current.runner.kind === 'cpu' || TOT_MODELS.some((m) => m.grounded && (m.id === current?.modelId || m.f32Id === current?.modelId))
    const docs = retrieve(question, facts.topics).slice(0, cpu ? 1 : 3)
    const sources = docs.map((d) => ({ title: d.title, label: d.sourceLabel, url: d.sourceUrl }))
    const at = new Date().toISOString()
    const past: ChatMessage[] = messages
      .filter((m) => !m.basic)
      .slice(cpu ? -2 : -6)
      .map((m) => ({ role: m.role, content: m.text }))
    setMessages((m) => [...m, { role: 'user', text: question, at }, { role: 'assistant', text: '', sources, at }])
    setBusy(true)
    try {
      if (cpu) {
        /* Measured and What to do come from the analytics; the small model only adds possible explanations */
        const labels = Object.fromEntries(Object.entries(INDICATORS).map(([id, d]) => [id, d.label])) as Record<IndicatorId, string>
        const measured = measuredFor(question, facts, labels)
        const ids = topicsOf(question)
        const off = health.summary.priority.find((a) => a.guidance && (!ids.length || ids.includes(a.indicatorId)))
        const todo = off?.guidance ? `${off.guidance.doNow[0]} Re-check in ${off.guidance.recheckIn}.` : ESCALATION_TEXT[health.summary.escalation].detail
        const block = `Measured\n${measured.map((l) => (l.startsWith('- ') ? l : `- ${l}`)).join('\n')}\n\n`
        const head = `${block}Possible explanations (AI)\n`
        let said = ''
        await current.runner.stream([{ role: 'system', content: cpuPrompt(measured, docs[0]) }, { role: 'user', content: question }], current.runner.kind === 'cpu' ? 70 : 90, (text) => {
          said = text
          setMessages((m) => [...m.slice(0, -1), { ...m.at(-1)!, text: head + explanationOnly(text, '…') }])
        })
        const explained = explanationOnly(said)
        /* If the model only repeated numbers, fall back to the first sentence of the matching library note */
        const fallback = docs[0] ? `${docs[0].text.split(/(?<=[.!?])\s+/)[0]} [1]` : 'No extra explanation; see Measured.'
        setMessages((m) => [...m.slice(0, -1), { ...m.at(-1)!, text: `${block}${explained ? `Possible explanations (AI)\n${explained}` : `Background (library)\n${fallback}`}\n\nWhat to do\n${todo}` }])
      } else {
        await current.runner.stream([{ role: 'system', content: systemPrompt(facts, docs) }, ...past, { role: 'user', content: question }], 380, (text) =>
          setMessages((m) => [...m.slice(0, -1), { ...m.at(-1)!, text }]),
        )
      }
    } catch (e) {
      setMessages((m) => [...m.slice(0, -1), { ...m.at(-1)!, text: `TOT stopped: ${e instanceof Error ? e.message : String(e)}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageBanner eyebrow="On-device assistant" title="Ask TOT">
        TOT, named after Thoth, the Egyptian god of wisdom and writing, explains your health data in plain words. It runs on this device, works offline once downloaded and sends nothing anywhere. It does not diagnose.
      </PageBanner>
      <Page className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel aria-labelledby="tot-chat" className="flex min-h-[28rem] flex-col">
          <PanelHeader
            id="tot-chat"
            title="Conversation"
            meta={facts.overall ? `Today: ${facts.overall}` : undefined}
            action={
              messages.length > 0 && (
                <Action variant="ghost" onClick={() => setMessages([])} aria-label="Clear the conversation">
                  <Trash2 aria-hidden="true" /> Clear
                </Action>
              )
            }
          />
          <div className="grid max-h-[60vh] flex-1 content-start gap-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
            {messages.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Ask about your readings, trends, sleep or radiation. TOT answers only from what Khonsu has measured and calculated, and from its offline science library.
              </p>
            )}
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <p key={i} className="bg-muted ml-auto max-w-[85%] rounded-md px-3 py-2 text-sm">
                  {m.text}
                </p>
              ) : (
                <div key={i} className="border-border max-w-[95%] rounded-md border p-3 text-sm">
                  <p className="label text-muted-foreground mb-2">{m.basic ? 'Basic summary · rules, not AI' : 'TOT · AI on this device'}</p>
                  {m.text ? <Answer text={m.text} /> : <p className="text-muted-foreground">Thinking…</p>}
                  {!!m.sources?.length && m.text && (
                    <ol className="border-border mt-3 grid gap-1 border-t pt-2 text-xs">
                      {m.sources.map((s, j) => (
                        <li key={s.url + j}>
                          [{j + 1}] {s.title}:{' '}
                          <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                            {s.label}
                          </a>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ),
            )}
            <div ref={end} />
          </div>
          <div className="border-border grid gap-3 border-t p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={status !== 'ready' || busy}
                  onClick={() => void ask(q)}
                  className="border-border-strong hover:bg-muted min-h-11 rounded-full border px-3 text-xs disabled:opacity-50 md:min-h-9"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void ask(input)
              }}
            >
              <label className="min-w-0 flex-1">
                <span className="sr-only">Question for TOT</span>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={status !== 'ready'}
                  placeholder={status === 'ready' ? 'Ask TOT about your health…' : 'Start TOT to ask questions'}
                  className="border-border-strong bg-card h-11 w-full rounded-sm border px-3 text-sm disabled:opacity-60"
                />
              </label>
              {busy ? (
                <Action variant="secondary" onClick={() => current?.runner.interrupt()}>
                  <Square aria-hidden="true" /> Stop
                </Action>
              ) : (
                <Action variant="primary" type="submit" disabled={status !== 'ready' || !input.trim()}>
                  <Send aria-hidden="true" /> Ask
                </Action>
              )}
            </form>
          </div>
        </Panel>

        <div className="grid content-start gap-6">
          <div ref={modelPanel} className="scroll-mt-24">
          <Panel aria-labelledby="tot-model">
            <PanelHeader id="tot-model" title="Language model" meta={engineKind === 'cpu' ? 'Transformers.js · processor' : 'WebLLM · WebGPU'} />
            <div className="grid gap-3 p-4 text-sm sm:p-5">
              {engineKind === 'cpu' ? (
                <p className="text-muted-foreground">
                  This browser has no WebGPU, so TOT runs <span className="text-foreground font-medium">{CPU_MODEL.name}</span>, a smaller model, on the processor. Answers are shorter and slower: about a minute each, longer on older phones.
                </p>
              ) : (
              <label className="grid gap-1">
                <span className="text-muted-foreground text-xs">Model</span>
                <select
                  value={modelId}
                  disabled={status === 'loading'}
                  onChange={(e) => {
                    setModelId(e.target.value)
                    try {
                      localStorage.setItem(TOT_MODEL_KEY, e.target.value)
                    } catch {
                      /* ignore */
                    }
                    if (status === 'ready') setStatus('idle')
                  }}
                  className="border-border-strong bg-card h-11 rounded-sm border px-2"
                >
                  {TOT_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.downloadGB} GB
                    </option>
                  ))}
                </select>
                <span className="text-muted-foreground text-xs">{model.note}</span>
              </label>
              )}

              {status === 'checking' && <p className="text-muted-foreground">Checking this device…</p>}
              {status === 'unsupported' && (
                <p role="status" className="text-status-caution-ink">
                  This browser has no WebGPU, so the language model cannot run here. Use Chrome or Edge on a recent computer or tablet. The basic summary below still works; it is written by rules, not by AI.
                </p>
              )}
              {(status === 'idle' || status === 'error') && (
                <>
                  <p className="text-muted-foreground">
                    First start downloads about {engineKind === 'cpu' ? CPU_MODEL.downloadGB : model.downloadGB} GB once. After that TOT works without internet.
                  </p>
                  <Action variant="primary" onClick={() => void start()}>
                    <Download aria-hidden="true" /> {status === 'error' ? 'Try again' : 'Start TOT'}
                  </Action>
                </>
              )}
              {status === 'error' && (
                <p role="alert" className="text-status-danger-ink text-xs">
                  {error}
                  {errorDetail && <span className="text-muted-foreground mt-1 block break-words font-mono text-[11px]">{errorDetail.slice(0, 300)}</span>}
                  <span className="text-muted-foreground mt-1 block">Parts already downloaded are kept, so Try again continues where it stopped.</span>
                </p>
              )}
              {status === 'loading' && (
                <div role="status" className="grid gap-2">
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div className="bg-primary h-full origin-left transition-transform duration-300" style={{ transform: `scaleX(${progress.pct / 100})` }} />
                  </div>
                  <p className="text-muted-foreground text-xs break-words">{progress.text}</p>
                </div>
              )}
              {status === 'ready' && (
                <p role="status" className="text-status-ok-ink flex items-center gap-2 font-medium">
                  <Cpu className="size-4" aria-hidden="true" /> {engineKind === 'cpu' ? `${CPU_MODEL.name} running on this device's processor` : `${model.name} running on this device`}
                </p>
              )}
              <Action variant="secondary" onClick={basicSummary}>
                <ListChecks aria-hidden="true" /> Basic summary (not AI)
              </Action>
            </div>
          </Panel>
          </div>
          <Panel aria-labelledby="tot-rules">
            <PanelHeader id="tot-rules" title="How TOT answers" />
            <ul className="text-muted-foreground grid gap-2 p-4 text-sm sm:p-5">
              <li>Measured values, calculated trends, possible explanations and what to do are kept apart.</li>
              <li>Statuses and limits come from Khonsu’s analytics, never from the model.</li>
              <li>Background facts come from an offline library; each answer lists its sources.</li>
              <li>It does not diagnose. For anything worrying, talk to the crew medical officer.</li>
            </ul>
          </Panel>
        </div>
      </Page>
      {status !== 'ready' && status !== 'loading' && status !== 'checking' && panelAt && (
        <button
          type="button"
          onClick={() => modelPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className={cn(
            'bg-primary text-primary-foreground fixed left-1/2 z-40 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full px-5 text-sm font-semibold shadow-[var(--shadow-pop)]',
            panelAt === 'below' ? 'bottom-20 lg:bottom-6' : 'top-20',
          )}
        >
          {panelAt === 'below' ? <ArrowDown className="size-4" aria-hidden="true" /> : <ArrowUp className="size-4" aria-hidden="true" />}
          {status === 'unsupported' ? 'Basic summary' : 'Start TOT'}
        </button>
      )}
    </>
  )
}
