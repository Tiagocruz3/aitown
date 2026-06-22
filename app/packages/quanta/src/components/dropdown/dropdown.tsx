'use client'

import type { ComponentProps, ReactNode } from 'react'
import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Menu as Primitive } from '@base-ui/react/menu'
import { Checkbox } from '../checkbox/index.ts'
import { Divider } from '../divider/index.ts'
import { CheckIcon, ChevronRightIcon, SearchIcon } from '../menu/icons.tsx'
import { NotFound } from '../not-found/index.ts'
import { Switch } from '../switch/index.ts'
import { cx } from '../utils/cx.ts'

/**
 * Dropdown — a click-triggered menu on the Base UI `Menu` primitive (roving
 * focus, typeahead, keyboard, ARIA, portal + positioning, submenu timing),
 * skinned with quanta's shared `q-menu-*` presentation utilities.
 *
 * Fully dynamic, single-`Item` API — the consumer decides everything; quanta
 * only owns the status visuals (checkbox / switch). Every region is a free
 * ReactNode, so a `title` can be a `<div>` with a `<Badge>`, a `subtitle` can
 * be chips/text, and `start` can be any icon/avatar/media node.
 *
 *   <Dropdown.Root onSelected={setActive}>
 *     <Dropdown.Trigger render={<Button>Open</Button>} />
 *     <Dropdown.Content withSearch>
 *       <Dropdown.GroupItem heading="Models">
 *         <Dropdown.Item
 *           value="seedance"
 *           start={<Sparkles />}
 *           title={<>Seedance 2.0 <Badge variant="nBrand" /></>}
 *           subtitle={<><Tag>720p</Tag><Tag>4s-15s</Tag></>}
 *           selectable
 *           indicator="checkbox"
 *         />
 *         <Dropdown.Item title="More">         // children → submenu
 *           <Dropdown.Item title="Nested" />
 *         </Dropdown.Item>
 *       </Dropdown.GroupItem>
 *     </Dropdown.Content>
 *   </Dropdown.Root>
 *
 * SELECTION STATE lives in `Dropdown.Root` and is exposed as a simple
 * `selected: string[]` of item `value`s. By default it's fully internal
 * (uncontrolled) — a `selectable` Item with a `value` reads/writes it
 * automatically and the row just works. Subscribe to changes with
 * `onSelected(next)`, seed the initial set with `defaultSelected`, or take
 * full control by passing `selected` (+ `onSelected`). `selectionMode`
 * ('multiple' default | 'single') controls whether toggling replaces or adds.
 * An individual Item can still opt out of Root state by passing its own
 * `checked` / `onCheckedChange`.
 *
 * `selectable` makes an item a stateful, multi-select-friendly row (stays open
 * on toggle) and shows a selection indicator. `indicator` picks the visual —
 * 'check' (trailing check icon, default), 'checkbox' (reuses the real
 * <Checkbox>), or 'switch' (reuses the real <Switch>). A non-selectable item
 * (the default) is a plain action row: no indicator, closes on click.
 *
 * `withSearch` on Content adds a cmdk-style filter bar that hides non-matching
 * items (and empty groups) live. Items expose searchable text from their
 * string `title`/`subtitle`, or via an explicit `value` prop for rich nodes.
 */

export type DropdownIndicator = 'check' | 'checkbox' | 'switch'
export type DropdownSelectionMode = 'single' | 'multiple'

/* ── Search filtering ──────────────────────────────────────────────────────── */

const QueryContext = createContext<string>('')

/** Pull the plain text out of an arbitrary ReactNode (best-effort, for search). */
function extractText(node: ReactNode): string {
  if (node == null || node === false || node === true)
    return ''
  if (typeof node === 'string' || typeof node === 'number')
    return String(node)
  if (Array.isArray(node))
    return node.map(extractText).join(' ')
  if (isValidElement(node))
    return extractText((node.props as { children?: ReactNode }).children)
  return ''
}

/** All whitespace-split terms must appear (case-insensitive substring). */
function matchQuery(text: string, query: string): boolean {
  if (!query)
    return true
  const haystack = text.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every(term => haystack.includes(term))
}

/** Searchable text for an Item from its props (explicit `value` wins). */
function itemText(props: ItemProps): string {
  if (props.value != null)
    return props.value
  return `${extractText(props.title)} ${extractText(props.subtitle ?? props.subheader)}`.trim()
}

/** Whether a subtree of Dropdown.Items has anything matching the query. */
function subtreeMatches(children: ReactNode, query: string): boolean {
  if (!query)
    return true
  let found = false
  const visit = (nodes: ReactNode) => {
    for (const child of toArray(nodes)) {
      if (!isValidElement(child))
        continue
      const props = child.props as ItemProps & { children?: ReactNode }
      if (child.type === Item) {
        if (matchQuery(itemText(props), query)) {
          found = true
          return
        }
        // A submenu parent matches if any of its sub-items match.
        if (props.children != null)
          visit(props.children)
      }
      else if (child.type === GroupItem) {
        visit(props.children)
      }
      if (found)
        return
    }
  }
  visit(children)
  return found
}

function toArray(node: ReactNode): ReactNode[] {
  if (Array.isArray(node))
    return node
  return node == null ? [] : [node]
}

/* ── Selection state (owned by Root, exposed as `selected: string[]`) ──────── */

interface SelectionContextValue {
  selected: string[]
  isSelected: (value: string) => boolean
  toggle: (value: string, next: boolean) => void
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

/* ── Passthrough parts (Base UI owns behavior; quanta only names them). ────── */
const Trigger = Primitive.Trigger

type RootProps = ComponentProps<typeof Primitive.Root> & {
  /** Controlled set of selected item `value`s. Pair with `onSelected`. */
  selected?: string[]
  /** Initial selection for the uncontrolled (internal-state) case. */
  defaultSelected?: string[]
  /** Subscribe to selection changes — fires with the next `string[]`. */
  onSelected?: (selected: string[]) => void
  /** 'multiple' (default) toggles items independently; 'single' keeps one. */
  selectionMode?: DropdownSelectionMode
}

/**
 * Root owns selection state. Uncontrolled by default (internal `useState`
 * seeded by `defaultSelected`); pass `selected` to control it. Either way,
 * `onSelected` fires with the next array on every change.
 */
function Root({
  selected,
  defaultSelected,
  onSelected,
  selectionMode = 'multiple',
  ...props
}: RootProps) {
  const [internal, setInternal] = useState<string[]>(defaultSelected ?? [])
  const isControlled = selected != null
  const current = isControlled ? selected : internal

  const isSelected = useCallback((value: string) => current.includes(value), [current])

  const toggle = useCallback((value: string, next: boolean) => {
    const compute = (prev: string[]): string[] => {
      if (selectionMode === 'single')
        return next ? [value] : prev.filter(v => v !== value)
      if (next)
        return prev.includes(value) ? prev : [...prev, value]
      return prev.filter(v => v !== value)
    }
    if (isControlled) {
      onSelected?.(compute(current))
    }
    else {
      setInternal((prev) => {
        const nextState = compute(prev)
        onSelected?.(nextState)
        return nextState
      })
    }
  }, [current, isControlled, onSelected, selectionMode])

  const ctx = useMemo<SelectionContextValue>(
    () => ({ selected: current, isSelected, toggle }),
    [current, isSelected, toggle],
  )

  return (
    <SelectionContext.Provider value={ctx}>
      <Primitive.Root {...props} />
    </SelectionContext.Provider>
  )
}

/* ── Content (Portal + Positioner + Popup, optional search) ────────────────── */

type ContentProps = Omit<ComponentProps<typeof Primitive.Popup>, 'className'> & {
  className?: string
  positionerClassName?: string
  size?: 'compact' | 'default' | 'large'
  side?: ComponentProps<typeof Primitive.Positioner>['side']
  align?: ComponentProps<typeof Primitive.Positioner>['align']
  sideOffset?: ComponentProps<typeof Primitive.Positioner>['sideOffset']
  alignOffset?: ComponentProps<typeof Primitive.Positioner>['alignOffset']
  container?: ComponentProps<typeof Primitive.Portal>['container']
  /** Show a cmdk-style search bar that filters items live. */
  withSearch?: boolean
  searchPlaceholder?: string
  /**
   * Rendered in place of the list when a live search filters out every item.
   * Defaults to a generic <NotFound>. Pass your own node for custom copy/icon.
   */
  notFound?: ReactNode
}

const SIZE_CLASS = {
  compact: 'q-menu-content-compact',
  default: '',
  large: 'q-menu-content-large',
} satisfies Record<NonNullable<ContentProps['size']>, string>

function Content({
  className,
  positionerClassName,
  size = 'default',
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  alignOffset,
  container,
  withSearch = false,
  searchPlaceholder = 'Search',
  notFound,
  children,
  ...props
}: ContentProps) {
  return (
    <Primitive.Portal container={container}>
      <Primitive.Positioner
        className={positionerClassName}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <Primitive.Popup className={cx('q-menu-content', SIZE_CLASS[size], className)} {...props}>
          <SearchableContent withSearch={withSearch} placeholder={searchPlaceholder} notFound={notFound}>
            {children}
          </SearchableContent>
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  )
}

/** Holds query state INSIDE the popup so it resets every time the menu reopens. */
function SearchableContent({
  withSearch,
  placeholder,
  notFound,
  children,
}: {
  withSearch: boolean
  placeholder: string
  notFound?: ReactNode
  children: ReactNode
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Keep focus in the search field after Base UI's open-focus settles.
  useEffect(() => {
    if (!withSearch)
      return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [withSearch])

  if (!withSearch)
    return <>{children}</>

  const focusFirstItem = () => {
    const first = rootRef.current?.querySelector<HTMLElement>('[role^="menuitem"]:not([data-disabled])')
    first?.focus()
  }

  const hasResults = subtreeMatches(children, query)

  return (
    <div ref={rootRef} className="q-menu-search-wrap">
      <div className="q-menu-search">
        <span className="q-menu-search-icon"><SearchIcon /></span>
        <input
          ref={inputRef}
          className="q-menu-search-input"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Base UI's menu treats the popup as a composite widget and
            // preventDefaults typing for typeahead. Keep the input editable by
            // stopping keystrokes from reaching the menu — except navigation
            // keys we explicitly want the menu (or us) to handle.
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              focusFirstItem()
              return
            }
            if (e.key === 'Escape')
              return // let it bubble so the menu closes
            e.stopPropagation()
          }}
        />
      </div>
      <Divider className="q-menu-separator" />
      {hasResults
        ? <QueryContext.Provider value={query}>{children}</QueryContext.Provider>
        : (notFound ?? <NotFound title="No results found" subtitle="Try a different search" />)}
    </div>
  )
}

/* ── Separator ─────────────────────────────────────────────────────────────── */

type SeparatorProps = Omit<ComponentProps<typeof Primitive.Separator>, 'className'> & {
  className?: string
}
function Separator({ className, ...props }: SeparatorProps) {
  return <Primitive.Separator render={<Divider />} className={cx('q-menu-separator', className)} {...props} />
}

/* ── GroupItem (group + heading; hides itself when filtered empty) ─────────── */

type GroupItemProps = Omit<ComponentProps<typeof Primitive.Group>, 'className'> & {
  className?: string
  /** Section heading (Figma menu label). Omit for an unlabeled group. */
  heading?: ReactNode
}

function GroupItem({ className, heading, children, ...props }: GroupItemProps) {
  const query = useContext(QueryContext)
  const visible = useMemo(() => subtreeMatches(children, query), [children, query])
  if (!visible)
    return null
  return (
    <Primitive.Group className={className} {...props}>
      {heading != null ? (
        <Primitive.GroupLabel className="q-menu-group-label">{heading}</Primitive.GroupLabel>
      ) : null}
      {children}
    </Primitive.Group>
  )
}

/* ── Selection indicator (reuse the real Checkbox / Switch components) ─────── */

function SelectionIndicator({ indicator, checked }: { indicator: DropdownIndicator, checked: boolean }) {
  if (indicator === 'checkbox') {
    // Presentational mirror — the menu row is the control; the Checkbox just paints state.
    return <Checkbox checked={checked} size="sm" tabIndex={-1} aria-hidden className="pointer-events-none" />
  }
  if (indicator === 'switch')
    return <Switch checked={checked} size="small" tabIndex={-1} aria-hidden className="pointer-events-none" />
  // 'check' — trailing check icon, only when selected.
  return checked ? <CheckIcon className="size-4 text-q-icon-accent" /> : null
}

/* ── Item (the one polymorphic part) ───────────────────────────────────────── */

interface ItemTemplateProps {
  /** Leading slot — icon, avatar, media. Any node. */
  start?: ReactNode
  /** Primary content. Any node (text, or a `<div>` with a `<Badge>`). */
  title?: ReactNode
  /** Secondary line under the title. Any node (chips, badge, text). */
  subtitle?: ReactNode
  /** @deprecated Use `subtitle` — kept as an alias for back-compat. */
  subheader?: ReactNode
  /**
   * Arbitrary trailing content (count, meta, an action button…), rendered in the
   * trailing slot BEFORE any selection indicator. Lets a row be customized into
   * the Figma "trailing text / button" patterns without a bespoke part.
   */
  end?: ReactNode
  /**
   * Make this a stateful selectable row (stays open on toggle). When false (the
   * default) it's a plain action item with no selection indicator.
   */
  selectable?: boolean
  /** Selection indicator style for `selectable` items. Default 'check'. */
  indicator?: DropdownIndicator
  /** Explicit searchable text for rich (non-string) titles. */
  value?: string
}

type ItemProps = ItemTemplateProps & {
  className?: string
  checked?: boolean
  onCheckedChange?: ComponentProps<typeof Primitive.CheckboxItem>['onCheckedChange']
  disabled?: boolean
  /** Action handler for non-stateful ('none') items. */
  onSelect?: ComponentProps<typeof Primitive.Item>['onClick']
  /** Sub-items → renders this item as a submenu trigger. */
  children?: ReactNode
  /** Submenu popup density (only when children are present). */
  submenuClassName?: string
  /**
   * Gap (px) between the parent menu's outer edge and the nested submenu.
   * Default 4. Base UI anchors the submenu to the trigger row, which sits
   * inside the parent's 8px content padding, so this value is pre-compensated
   * for that padding when applied (the submenu clears the parent edge by
   * exactly this many px).
   */
  submenuSideOffset?: number
  /**
   * Cross-axis nudge (px) of the submenu relative to the trigger. Defaults to
   * `-8` so the submenu's first row lines up with the trigger row (cancels the
   * menu's 8px content padding). Set 0 to align the popup edge with the trigger.
   */
  submenuAlignOffset?: number
}

function ItemBody({ start, title, subtitle, end, trailing }: {
  start?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  /** Caller's arbitrary trailing content (count, button…), before the indicator. */
  end?: ReactNode
  /** The selection indicator / submenu chevron (owned by Item). */
  trailing?: ReactNode
}) {
  const titleNode = typeof title === 'string' || typeof title === 'number'
    ? <span className="q-menu-item-title">{title}</span>
    : title
  return (
    <>
      {start != null ? <span className="q-menu-item-icon">{start}</span> : null}
      <span className="q-menu-item-label">
        <span className="q-menu-item-title-row">{titleNode}</span>
        {subtitle != null ? <span className="q-menu-item-description">{subtitle}</span> : null}
      </span>
      {end != null || trailing != null
        ? <span className="q-menu-item-trailing">{end}{trailing}</span>
        : null}
    </>
  )
}

function Item(props: ItemProps) {
  const {
    className,
    start,
    title,
    subtitle: subtitleProp,
    subheader,
    end,
    selectable = false,
    indicator = 'check',
    value: _value,
    checked,
    onCheckedChange,
    disabled,
    onSelect,
    children,
    submenuClassName,
    submenuSideOffset = 4,
    submenuAlignOffset = -8,
    ...rest
  } = props

  // `subtitle` is canonical; `subheader` is the back-compat alias.
  const subtitle = subtitleProp ?? subheader

  const query = useContext(QueryContext)
  const selection = useContext(SelectionContext)

  // Submenu mode: any children → trigger + nested popup.
  if (children != null) {
    if (query && !subtreeMatches([<Item key="self" {...props} children={undefined} />, ...toArray(children)], query))
      return null
    return (
      <Primitive.SubmenuRoot>
        <Primitive.SubmenuTrigger className={cx('q-menu-item', className)} disabled={disabled}>
          <ItemBody
            start={start}
            title={title}
            subtitle={subtitle}
            end={end}
            trailing={<ChevronRightIcon className="size-4" />}
          />
        </Primitive.SubmenuTrigger>
        <Primitive.Portal>
          {/* Base UI anchors the submenu to the trigger, which sits inside the
           * parent's 8px content padding (--hf-space-200). Add that padding to
           * the requested gap so `submenuSideOffset` measures from the parent's
           * outer edge, not the inset trigger. */}
          <Primitive.Positioner side="right" align="start" sideOffset={submenuSideOffset + 8} alignOffset={submenuAlignOffset}>
            <Primitive.Popup className={cx('q-menu-content', submenuClassName)}>
              {/* Reset the query so sub-items aren't filtered by the parent search. */}
              <QueryContext.Provider value="">{children}</QueryContext.Provider>
            </Primitive.Popup>
          </Primitive.Positioner>
        </Primitive.Portal>
      </Primitive.SubmenuRoot>
    )
  }

  // Filter when searching.
  if (query && !matchQuery(itemText(props), query))
    return null

  // Non-selectable → plain action item (closes on click, no indicator).
  if (!selectable) {
    return (
      <Primitive.Item className={cx('q-menu-item', className)} disabled={disabled} onClick={onSelect} {...rest}>
        <ItemBody start={start} title={title} subtitle={subtitle} end={end} />
      </Primitive.Item>
    )
  }

  // Selectable → stateful row showing the chosen indicator, stays open on toggle.
  // Resolve state: an explicit `checked`/`onCheckedChange` wins (manual control);
  // otherwise derive from Root's selection state keyed by `value`.
  const value = props.value
  const useRootState = checked === undefined && onCheckedChange == null
    && selection != null && value != null
  const resolvedChecked = useRootState ? selection.isSelected(value) : (checked ?? false)
  const handleCheckedChange: ItemProps['onCheckedChange'] = useRootState
    ? next => selection.toggle(value, next)
    : onCheckedChange

  return (
    <Primitive.CheckboxItem
      className={cx('q-menu-item', className)}
      checked={resolvedChecked}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
      closeOnClick={false}
      {...rest}
    >
      <ItemBody
        start={start}
        title={title}
        subtitle={subtitle}
        end={end}
        trailing={<SelectionIndicator indicator={indicator} checked={resolvedChecked} />}
      />
    </Primitive.CheckboxItem>
  )
}

export const Dropdown = {
  Root,
  Trigger,
  Content,
  Item,
  GroupItem,
  Separator,
}
