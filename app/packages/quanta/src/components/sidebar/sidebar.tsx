'use client'

import type { ComponentProps, ReactNode, SVGProps } from 'react'
import { useRender } from '@base-ui/react/use-render'
import { cx } from '../utils/cx.ts'

/**
 * Sidebar — the product navigation rail, pixel-matched to the Figma "Sidebar"
 * system (Primitives 2438:253 / Semantic 2438:278). A composition namespace:
 *
 *   <Sidebar.Root>
 *     <Sidebar.Header logo={<Logo/>} title="Cinema Studio" chevron
 *       actions={<Sidebar.Toggle><CollapseIcon/></Sidebar.Toggle>} />
 *     <Sidebar.Body>
 *       <Sidebar.Section>
 *         <Sidebar.Item start={<HomeIcon/>} selected>Home</Sidebar.Item>
 *       </Sidebar.Section>
 *       <Sidebar.Section title="Projects" actions={<AddIcon/>}>
 *         <Sidebar.Item start={<Avatar/>} meta="484">Blue Horizon</Sidebar.Item>
 *       </Sidebar.Section>
 *     </Sidebar.Body>
 *     <Sidebar.Footer>
 *       <Sidebar.FooterItem variant="promo" start={<DiamondIcon/>} end={<Badge variant="pink">50% OFF</Badge>}>Pricing</Sidebar.FooterItem>
 *     </Sidebar.Footer>
 *   </Sidebar.Root>
 *
 * `collapsed` on the Root shrinks it to an icon strip (labels/meta/actions hide,
 * icons centre). Rows render a `<button>`, or an `<a>` when `href` is set, or any
 * element via `render` (Base UI useRender — e.g. a router Link).
 */

export type SidebarItemSize = 'md' | 'sm'
export type SidebarFooterVariant = 'default' | 'promo' | 'login'

/* Inline glyphs (quanta ships no icon set). */
function ChevronUpDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden {...props}>
      <path d="M5.5 6.25L8 3.75l2.5 2.5M5.5 9.75L8 12.25l2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function SearchGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
/* Pin — Figma IconPinFilledThin (node 932:2105, used by ProjectItem 2441:1073).
 * The full thumbtack WITH the needle; bound to currentColor so the `q-sidebar-pin`
 * states (idle icon-tertiary / hover + pinned icon-primary) drive it. */
function PinGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path fill="currentColor" d="M15.817 2.36a1.5 1.5 0 0 0-2.39.367l-2.17 4.157a.5.5 0 0 1-.309.25L4.018 9.06a1.5 1.5 0 0 0-.66 2.505l4.185 4.185-4.396 4.397a.5.5 0 1 0 .707.707l4.396-4.397 4.185 4.185a1.5 1.5 0 0 0 2.505-.66l1.926-6.93a.5.5 0 0 1 .25-.31l4.157-2.168a1.5 1.5 0 0 0 .367-2.39z" />
    </svg>
  )
}

/* ── Root ───────────────────────────────────────────────────────────────────── */
export type SidebarRootProps = ComponentProps<'aside'> & {
  /** Icon-strip mode — labels/meta/actions hide and icons centre. */
  collapsed?: boolean
  /** Square corners (docked flush to a screen edge). */
  flush?: boolean
}
function Root({ collapsed = false, flush = false, className, ...props }: SidebarRootProps) {
  return (
    <aside
      data-collapsed={collapsed ? '' : undefined}
      className={cx('q-sidebar', collapsed && 'q-sidebar-collapsed', flush && 'q-sidebar-flush', className)}
      {...props}
    />
  )
}

/* ── Header — workspace switcher + collapse toggle ──────────────────────────── */
export type SidebarHeaderProps = Omit<ComponentProps<'div'>, 'title'> & {
  /** Brand mark (logo). Any node. */
  logo?: ReactNode
  /** Workspace name. */
  title?: ReactNode
  /** Show the up/down switcher chevron. */
  chevron?: boolean
  /** Props for the switcher button (e.g. onClick). */
  switcherProps?: ComponentProps<'button'>
  /** Trailing actions — typically a `Sidebar.Toggle`. Any node. */
  actions?: ReactNode
  /** @deprecated Use `actions` — kept as an alias for back-compat. */
  action?: ReactNode
}
function Header({ logo, title, chevron = false, switcherProps, actions, action, className, children, ...props }: SidebarHeaderProps) {
  // `actions` is canonical (matches Section / Card / Modal); `action` is the alias.
  const trailing = actions ?? action
  return (
    <div className={cx('q-sidebar-header', className)} {...props}>
      {children ?? (
        <>
          <button type="button" className="q-sidebar-switcher" {...switcherProps}>
            {logo != null ? <span className="q-sidebar-logo">{logo}</span> : null}
            <span className="q-sidebar-switcher-name">
              {title}
              {chevron ? <ChevronUpDown /> : null}
            </span>
          </button>
          {trailing}
        </>
      )}
    </div>
  )
}

/** Square icon button for the header (collapse toggle / quick action). */
function Toggle({ className, type, children, ...props }: ComponentProps<'button'>) {
  return (
    <button type={type ?? 'button'} className={cx('q-sidebar-toggle', className)} {...props}>
      {children}
    </button>
  )
}

/* ── Body ───────────────────────────────────────────────────────────────────── */
function Body({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('q-sidebar-body', className)} {...props} />
}

/* ── Search — the filter input row (Figma search variant) ───────────── */
export type SidebarSearchProps = Omit<ComponentProps<'input'>, 'size'> & {
  /** Leading icon — defaults to a magnifier. */
  icon?: ReactNode
  className?: string
  inputClassName?: string
}
function Search({ icon, className, inputClassName, placeholder = 'Search', ...props }: SidebarSearchProps) {
  return (
    <div className={cx('q-sidebar-search', className)}>
      {icon ?? <SearchGlyph />}
      <input className={cx('q-sidebar-search-input', inputClassName)} placeholder={placeholder} {...props} />
    </div>
  )
}

/* ── Section — optional header (title + actions) + items ────────────────────── */
export type SidebarSectionProps = Omit<ComponentProps<'div'>, 'title'> & {
  title?: ReactNode
  /** Trailing actions for the section header (e.g. search / sort / add icons). */
  actions?: ReactNode
}
function Section({ title, actions, className, children, ...props }: SidebarSectionProps) {
  return (
    <div className={cx('q-sidebar-section', className)} {...props}>
      {(title != null || actions != null) && (
        <div className="q-sidebar-section-header">
          <span className="q-sidebar-section-title">{title}</span>
          {actions != null ? <span className="q-sidebar-section-actions">{actions}</span> : null}
        </div>
      )}
      {children}
    </div>
  )
}

/* ── Item — the single composite row ────────────────────────────────────────── */
type RowOwnProps = {
  /** Leading slot — an icon, Avatar, thumbnail tile, Dot… any node. */
  start?: ReactNode
  /** Trailing slot — badge / action icon / shortcut. Any node. Sits after `meta`. */
  end?: ReactNode
  /** Trailing meta — e.g. a count ("484"). Muted, sits between the label and `end`. */
  meta?: ReactNode
  /** Link target — renders an `<a>` instead of a `<button>`. */
  href?: string
  /** Swap the host element (Base UI useRender — e.g. a router Link). */
  render?: useRender.RenderProp
}
type RowProps = Omit<ComponentProps<'button'>, 'title'> & RowOwnProps

export type SidebarItemProps = RowProps & {
  size?: SidebarItemSize
  selected?: boolean
  /** Pinned visual state — the pin shows filled and stays visible. */
  pinned?: boolean
  /** Enable a pin toggle (a pin button that reveals on hover). `(next) => void`.
   *  Ordering is the caller's: sort each section's data pinned-first so pins
   *  stay scoped to their group, not global. */
  onPinChange?: (pinned: boolean) => void
}

/**
 * A sidebar row — the one composite item used for nav links, projects, chats,
 * anything. Slots: `start` (leading icon/avatar/tile/any node) · `children`
 * (label) · `meta` (trailing count) · `end` (trailing badge/action). Renders a
 * `<button>`, an `<a>` when `href` is set, or any element via `render`. Pass
 * `onPinChange` to add a hover-revealed pin toggle.
 */
function Item({ start, meta, end, size = 'md', selected = false, pinned = false, onPinChange, href, render, className, children, ...rest }: SidebarItemProps) {
  const isLink = href != null
  const main = useRender({
    render,
    defaultTagName: isLink ? 'a' : 'button',
    props: {
      className: cx('q-sidebar-row', size === 'sm' ? 'q-sidebar-item-sm' : 'q-sidebar-item', selected && 'q-sidebar-selected', className),
      ...(isLink ? { href } : { type: 'button' as const }),
      ...(selected ? { 'aria-current': 'page' as const } : {}),
      ...rest,
      children: (
        <>
          {start != null ? <span className="q-sidebar-icon">{start}</span> : null}
          <span className="q-sidebar-label">{children}</span>
          {meta != null ? <span className="q-sidebar-meta">{meta}</span> : null}
          {end != null ? <span className="q-sidebar-end">{end}</span> : null}
        </>
      ),
    },
  })
  // No pin → the Item IS the button/link (unchanged). With a pin, wrap so the
  // toggle is a SIBLING of the link, not nested inside it (interactive-in-
  // interactive is invalid HTML). It reveals on hover and stays when pinned.
  if (onPinChange == null)
    return main
  return (
    <div className={cx('q-sidebar-pinrow', pinned && 'q-sidebar-pinned')}>
      {main}
      <button
        type="button"
        className="q-sidebar-pin"
        data-pinned={pinned ? '' : undefined}
        aria-pressed={pinned}
        aria-label={pinned ? 'Unpin' : 'Pin'}
        onClick={() => onPinChange(!pinned)}
      >
        <PinGlyph />
      </button>
    </div>
  )
}

/* ── Footer ─────────────────────────────────────────────────────────────────── */
function Footer({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('q-sidebar-footer', className)} {...props} />
}

export type SidebarFooterItemProps = RowProps & {
  variant?: SidebarFooterVariant
}
function FooterItem({ variant = 'default', start, end, href, render, className, children, ...rest }: SidebarFooterItemProps) {
  const isLink = href != null
  const variantClass = variant === 'promo' ? 'q-sidebar-footeritem-promo' : variant === 'login' ? 'q-sidebar-footeritem-login' : undefined
  return useRender({
    render,
    defaultTagName: isLink ? 'a' : 'button',
    props: {
      className: cx('q-sidebar-row', 'q-sidebar-footeritem', variantClass, className),
      ...(isLink ? { href } : { type: 'button' as const }),
      ...rest,
      children: (
        <>
          {start != null ? <span className="q-sidebar-icon">{start}</span> : null}
          <span className="q-sidebar-label">{children}</span>
          {end != null ? <span className="q-sidebar-end">{end}</span> : null}
        </>
      ),
    },
  })
}

export const Sidebar = {
  Root,
  Header,
  Toggle,
  Body,
  Search,
  Section,
  Item,
  Footer,
  FooterItem,
}
