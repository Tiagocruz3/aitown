'use client'

import type { ComponentProps, KeyboardEvent, ReactNode, SVGProps } from 'react'
import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Divider } from '../divider/index.ts'
import { Kbd } from '../kbd/index.ts'
import { cx } from '../utils/cx.ts'

/**
 * Command (cmdk) — a fast, filterable command palette skinned with quanta
 * tokens. Hand-rolled (like the `cmdk` library) for a always-open, inline,
 * grouped, keyboard-driven list: fuzzy filtering, roving arrow-key navigation,
 * groups with headings, empty + loading states, per-item icons / shortcuts /
 * descriptions, and an optional `⌘K` Dialog shell (Base UI Dialog owns the
 * overlay, focus trap and a11y).
 *
 *   <Command.Dialog shortcut="mod+k" label="Command menu">
 *     <Command.Input placeholder="Type a command…" />
 *     <Command.List>
 *       <Command.Empty>No results.</Command.Empty>
 *       <Command.Group heading="Actions">
 *         <Command.Item icon={<Plus/>} shortcut="⌘N" onSelect={…}>New file</Command.Item>
 *       </Command.Group>
 *     </Command.List>
 *   </Command.Dialog>
 */

/* ── Fuzzy match: substring (strong) or subsequence (weak); empty query = all. */
function score(query: string, text: string): number {
  if (!query) return 1
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t.includes(q)) return 2
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length ? 1 : 0
}

/** Best-effort plain text from an arbitrary node (for matching). */
function nodeText(node: ReactNode): string {
  if (node == null || node === false || node === true) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join(' ')
  if (isValidElement(node)) return nodeText((node.props as { children?: ReactNode }).children)
  return ''
}

interface ItemMeta { id: string, text: string, groupId: string | null, disabled: boolean }

interface CommandContextValue {
  query: string
  matched: Set<string>
  activeId: string | null
  setActiveId: (id: string | null) => void
  register: (meta: ItemMeta, onSelect?: () => void) => () => void
  select: (id: string) => void
  groupHasMatch: (groupId: string) => boolean
  listId: string
  /** Detail node of the currently-active item (for the optional detail pane). */
  activeDetail: ReactNode
  setActiveDetail: (node: ReactNode) => void
  /** Footer action label of the currently-active (hovered/highlighted) item. */
  activeAction: ReactNode
  setActiveAction: (node: ReactNode) => void
}

const CommandContext = createContext<CommandContextValue | null>(null)
function useCommand() {
  const ctx = useContext(CommandContext)
  if (!ctx) throw new Error('Command parts must be used within <Command>')
  return ctx
}

/* The group a nested Item belongs to (null at top level). */
const GroupContext = createContext<string | null>(null)

export interface CommandProps extends Omit<ComponentProps<'div'>, 'onSelect'> {
  /** Controlled search value. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Disable built-in filtering (caller filters items themselves). */
  shouldFilter?: boolean
  /** Accessible label for the listbox. */
  label?: string
}

/** Root: owns search + the item registry + keyboard navigation. */
function CommandRoot({
  value,
  defaultValue = '',
  onValueChange,
  shouldFilter = true,
  label = 'Command menu',
  className,
  children,
  ...props
}: CommandProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const query = value ?? uncontrolled
  const setQuery = useCallback((q: string) => {
    if (value === undefined) setUncontrolled(q)
    onValueChange?.(q)
  }, [value, onValueChange])

  const listId = useId()
  const registry = useRef(new Map<string, ItemMeta>())
  const selects = useRef(new Map<string, () => void>())
  const [version, setVersion] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDetail, setActiveDetail] = useState<ReactNode>(null)
  const [activeAction, setActiveAction] = useState<ReactNode>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const register = useCallback((meta: ItemMeta, onSelect?: () => void) => {
    registry.current.set(meta.id, meta)
    if (onSelect) selects.current.set(meta.id, onSelect)
    setVersion(v => v + 1)
    return () => {
      registry.current.delete(meta.id)
      selects.current.delete(meta.id)
      setVersion(v => v + 1)
    }
  }, [])

  const matched = useMemo(() => {
    const set = new Set<string>()
    for (const [id, meta] of registry.current) {
      if (!shouldFilter || score(query, meta.text) > 0) set.add(id)
    }
    return set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, version, shouldFilter])

  const groupHasMatch = useCallback((groupId: string) => {
    for (const [id, meta] of registry.current) {
      if (meta.groupId === groupId && matched.has(id)) return true
    }
    return false
  }, [matched])

  const select = useCallback((id: string) => {
    if (registry.current.get(id)?.disabled) return
    selects.current.get(id)?.()
  }, [])

  /** Visible item ids in DOM order (source of truth for nav). */
  const visibleIds = useCallback(() => {
    const root = listRef.current
    if (!root) return [] as string[]
    return Array.from(root.querySelectorAll<HTMLElement>('[data-command-item]:not([hidden]):not([aria-disabled="true"])'))
      .map(el => el.id)
  }, [])

  // Reset / clamp the active item whenever the visible set changes.
  useEffect(() => {
    const ids = visibleIds()
    if (ids.length === 0) { setActiveId(null); return }
    setActiveId(prev => (prev && ids.includes(prev) ? prev : ids[0]))
  }, [matched, visibleIds])

  // Keep the active item scrolled into view.
  useEffect(() => {
    if (!activeId) return
    const el = listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(activeId)}`)
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [activeId])

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const ids = visibleIds()
    if (ids.length === 0) return
    const i = activeId ? ids.indexOf(activeId) : -1
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveId(ids[(i + 1) % ids.length])
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveId(ids[(i - 1 + ids.length) % ids.length])
    }
    else if (e.key === 'Home') {
      e.preventDefault()
      setActiveId(ids[0])
    }
    else if (e.key === 'End') {
      e.preventDefault()
      setActiveId(ids[ids.length - 1])
    }
    else if (e.key === 'Enter' && activeId) {
      e.preventDefault()
      select(activeId)
    }
  }, [activeId, select, visibleIds])

  const ctx = useMemo<CommandContextValue>(() => ({
    query, matched, activeId, setActiveId, register, select, groupHasMatch, listId,
    activeDetail, setActiveDetail, activeAction, setActiveAction,
  }), [query, matched, activeId, register, select, groupHasMatch, listId, activeDetail, activeAction])

  return (
    <CommandContext.Provider value={ctx}>
      <div
        className={cx('q-command', className)}
        onKeyDown={onKeyDown}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        {...props}
      >
        <SearchSync query={query} setQuery={setQuery} listId={listId} label={label} listRef={listRef}>
          {children}
        </SearchSync>
      </div>
    </CommandContext.Provider>
  )
}

/* Carries search wiring down to Input/List via a tiny secondary context. */
interface SearchCtx {
  query: string
  setQuery: (q: string) => void
  listId: string
  label: string
  listRef: React.RefObject<HTMLDivElement | null>
}
const SearchContext = createContext<SearchCtx | null>(null)
function SearchSync({ children, ...ctx }: SearchCtx & { children: ReactNode }) {
  return <SearchContext.Provider value={ctx}>{children}</SearchContext.Provider>
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export type CommandInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange'>

/** The search box — drives the filter; arrow keys navigate the list. */
export function CommandInput({ className, placeholder = 'Type a command or search…', ...props }: CommandInputProps) {
  const search = useContext(SearchContext)
  const { activeId, listId } = useCommand()
  if (!search) throw new Error('Command.Input must be used within <Command>')
  return (
    <div className="q-command-input-row">
      <span className="q-command-input-icon"><SearchIcon className="size-5" /></span>
      <input
        className={cx('q-command-input', className)}
        value={search.query}
        onChange={e => search.setQuery(e.target.value)}
        placeholder={placeholder}
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={activeId ?? undefined}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        {...props}
      />
    </div>
  )
}

export type CommandListProps = ComponentProps<'div'>

/** Scrollable listbox region. */
export function CommandList({ className, children, ...props }: CommandListProps) {
  const search = useContext(SearchContext)
  if (!search) throw new Error('Command.List must be used within <Command>')
  return (
    <div
      ref={search.listRef}
      id={search.listId}
      role="listbox"
      aria-label={search.label}
      className={cx('q-command-list', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export type CommandEmptyProps = ComponentProps<'div'>

/** Shown only when the query matches nothing. */
export function CommandEmpty({ className, children = 'No results found.', ...props }: CommandEmptyProps) {
  const { matched } = useCommand()
  if (matched.size > 0) return null
  return <div className={cx('q-command-empty', className)} role="presentation" {...props}>{children}</div>
}

export type CommandLoadingProps = ComponentProps<'div'>

/** Render inside the list while results load (caller controls mounting). */
export function CommandLoading({ className, children = 'Loading…', ...props }: CommandLoadingProps) {
  return <div className={cx('q-command-loading', className)} role="presentation" {...props}>{children}</div>
}

export type CommandGroupProps = ComponentProps<'div'> & { heading?: ReactNode }

/** A labelled group; hides itself (and its heading) when nothing inside matches. */
export function CommandGroup({ heading, className, children, ...props }: CommandGroupProps) {
  const groupId = useId()
  const { groupHasMatch } = useCommand()
  const visible = groupHasMatch(groupId)
  return (
    <GroupContext.Provider value={groupId}>
      <div className={cx('q-command-group', className)} role="group" hidden={!visible} {...props}>
        {heading != null ? <div className="q-command-group-heading" aria-hidden>{heading}</div> : null}
        {children}
      </div>
    </GroupContext.Provider>
  )
}

export interface CommandItemProps extends Omit<ComponentProps<'div'>, 'onSelect' | 'title'> {
  /** Leading slot — icon, avatar, etc. (ReactNode). */
  start?: ReactNode
  /** Primary label (ReactNode). Also the default search text. */
  title?: ReactNode
  /** Secondary line under the title (ReactNode). */
  subtitle?: ReactNode
  /** Trailing slot — shortcut, badge, chevron, etc. (ReactNode). */
  end?: ReactNode
  /** Rich content shown in `<Command.Detail>` while this item is active. */
  detail?: ReactNode
  /** Footer action label shown in `<Command.Action>` while this item is hovered/active (e.g. "Open dashboard"). */
  action?: ReactNode
  /** Explicit search text (overrides the title/subtitle text). */
  value?: string
  /** Extra search terms beyond title + subtitle. */
  keywords?: string
  disabled?: boolean
  onSelect?: () => void
}

/**
 * A selectable command. Compose it from four ReactNode slots — `start`,
 * `title`, `subtitle`, `end` — mirroring `Dropdown.Item`. It filters itself out
 * when it doesn't match the query (matched on title + subtitle + keywords).
 */
export function CommandItem({
  start,
  title,
  subtitle,
  end,
  detail,
  action,
  value,
  keywords,
  disabled = false,
  onSelect,
  className,
  ...props
}: CommandItemProps) {
  const id = useId()
  const groupId = useContext(GroupContext)
  const { matched, activeId, setActiveId, register, select, setActiveDetail, setActiveAction } = useCommand()
  const text = `${value ?? `${nodeText(title)} ${nodeText(subtitle)}`} ${keywords ?? ''}`.trim()

  useLayoutEffect(() => {
    return register({ id, text, groupId, disabled }, onSelect)
    // re-register when the searchable text / disabled / group changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, text, groupId, disabled])

  const visible = matched.has(id)
  const active = activeId === id

  // When this item becomes active (hover or keyboard), publish its detail to
  // <Command.Detail> and its action label to <Command.Action>.
  useEffect(() => {
    if (active) {
      setActiveDetail(detail ?? null)
      setActiveAction(action ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return (
    <div
      id={id}
      data-command-item=""
      role="option"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      data-active={active || undefined}
      hidden={!visible}
      className={cx('q-command-item', className)}
      onPointerMove={() => { if (!disabled) setActiveId(id) }}
      onClick={() => select(id)}
      {...props}
    >
      {start != null ? <span className="q-command-item-start">{start}</span> : null}
      <span className="q-command-item-body">
        {title != null ? <span className="q-command-item-title">{title}</span> : null}
        {subtitle != null ? <span className="q-command-item-subtitle">{subtitle}</span> : null}
      </span>
      {end != null ? <span className="q-command-item-end">{end}</span> : null}
    </div>
  )
}

export function CommandSeparator({ className, ...props }: ComponentProps<'div'>) {
  // The Divider component draws the etched line; this wrapper owns the spacing.
  return (
    <div className={cx('q-command-separator', className)} {...props}>
      <Divider />
    </div>
  )
}

/**
 * A keyboard-shortcut pill in an item's trailing slot. Composes the canonical
 * `Kbd` (the cmdk shortcut has no bespoke design — reuse Kbd rather than
 * reinvent the pill). For multi-key combos joined by a separator use
 * `KbdSequence` directly in the item's `end` slot.
 */
export function CommandShortcut(props: ComponentProps<typeof Kbd>) {
  return <Kbd {...props} />
}

/* ── Two-pane layout (optional: list sidebar + detail panel) ──────────────────── */

export type CommandBodyProps = ComponentProps<'div'>
/** Row region between Input and Footer — holds the List (left) + Detail (right). */
export function CommandBody({ className, ...props }: CommandBodyProps) {
  return <div className={cx('q-command-body', className)} {...props} />
}

export type CommandDetailProps = ComponentProps<'div'>
/** Right pane — renders the active item's `detail`. Renders nothing (so the list
 * goes full-width) when the active item carries no `detail`. */
export function CommandDetail({ className, ...props }: CommandDetailProps) {
  const { activeId, activeDetail } = useCommand()
  if (!activeId || activeDetail == null) return null
  return <div className={cx('q-command-detail', className)} {...props}>{activeDetail}</div>
}

export type CommandFooterProps = ComponentProps<'div'>
/** Bottom bar — e.g. brand on the left, an Enter-to-confirm action on the right. */
export function CommandFooter({ className, ...props }: CommandFooterProps) {
  return <div className={cx('q-command-footer', className)} {...props} />
}

export interface CommandActionProps extends ComponentProps<'button'> {
  /** Label shown when no active item provides an `action` (e.g. "Select"). */
  fallback?: ReactNode
}
/**
 * Footer confirm button. Shows the active item's `action` label (falling back to
 * `fallback`) followed by `children` (typically a `<Kbd>`), and runs the active
 * item on click — the click equivalent of pressing Enter.
 */
export function CommandAction({ fallback, className, children, ...props }: CommandActionProps) {
  const { activeId, select, activeAction } = useCommand()
  const label = activeAction ?? fallback
  return (
    <button
      type="button"
      className={cx('q-command-action', className)}
      onClick={() => { if (activeId) select(activeId) }}
      disabled={!activeId}
      {...props}
    >
      {label != null ? <span className="q-command-action-label">{label}</span> : null}
      {children}
    </button>
  )
}

/* ── Dialog shell (⌘K palette) ─────────────────────────────────────────────── */

function matchShortcut(e: globalThis.KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const needMod = parts.includes('mod') || parts.includes('cmd') || parts.includes('ctrl') || parts.includes('meta')
  const mod = e.metaKey || e.ctrlKey
  return e.key.toLowerCase() === key && (needMod ? mod : true)
}

export interface CommandDialogProps extends CommandProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Global hotkey to toggle the palette, e.g. `"mod+k"`. */
  shortcut?: string
  /** Width preset. */
  className?: string
  container?: ComponentProps<typeof DialogPrimitive.Portal>['container']
}

/** The command palette in a centered, frosted Dialog with an optional hotkey. */
export function CommandDialog({
  open,
  defaultOpen = false,
  onOpenChange,
  shortcut,
  className,
  container,
  children,
  ...commandProps
}: CommandDialogProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const isOpen = open ?? uncontrolled
  const setOpen = useCallback((next: boolean) => {
    if (open === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!shortcut) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (matchShortcut(e, shortcut)) {
        e.preventDefault()
        setOpen(!isOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcut, isOpen, setOpen])

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Popup className={cx('q-command-dialog', className)}>
          <CommandRoot {...commandProps}>{children}</CommandRoot>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/* `Command` is both the inline root and the namespace holding the parts. */
export const Command = Object.assign(CommandRoot, {
  Root: CommandRoot,
  Dialog: CommandDialog,
  Input: CommandInput,
  List: CommandList,
  Empty: CommandEmpty,
  Loading: CommandLoading,
  Group: CommandGroup,
  Item: CommandItem,
  Separator: CommandSeparator,
  Shortcut: CommandShortcut,
  Body: CommandBody,
  Detail: CommandDetail,
  Footer: CommandFooter,
  Action: CommandAction,
})
