'use client'

import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { useId } from 'react'
import { NavigationMenu as Primitive } from '@base-ui/react/navigation-menu'
import { useRender } from '@base-ui/react/use-render'
import { Divider } from '../divider/index.ts'
import { cx } from '../utils/cx.ts'

/**
 * NavigationMenu — the product header: a logo, a bar of nav-items (each an
 * optional trigger for a morphing mega-menu panel), and a right-side actions
 * cluster. Built on the Base UI `NavigationMenu` primitive (keyboard + roving
 * focus, hover/click open, the shared size-morphing popup, ARIA, portal +
 * positioning), skinned with quanta tokens.
 *
 * DATA-AGNOSTIC: the component owns the DESIGN (slots, spacing, the bar-item and
 * glass-action-pill treatments, the accent glow, dividers, the panel grid).
 * Every label / icon / badge / action / menu is CONTENT the dev passes — compose
 * Badge, Avatar, Button, icons, etc. freely.
 *
 *   <NavigationMenu.Root>
 *     <NavigationMenu.Logo><Wordmark/></NavigationMenu.Logo>
 *     <NavigationMenu.List>
 *       <NavigationMenu.Item label="Image">             // trigger (has a Menu child)
 *         <NavigationMenu.Menu rows={3}>…</NavigationMenu.Menu>
 *       </NavigationMenu.Item>
 *       <NavigationMenu.Separator />
 *       <NavigationMenu.Item label="Supercomputer" accent start={<Spark/>} end={<Badge variant="nBrand">new</Badge>} href="/sc" />
 *     </NavigationMenu.List>
 *     <NavigationMenu.Actions>
 *       <NavigationMenu.ActionsGroup>
 *         <NavigationMenu.Action iconOnly aria-label="Search"><Search/></NavigationMenu.Action>
 *         <NavigationMenu.Action href="/pricing"><Diamond/>Pricing<Badge variant="pink">30% OFF</Badge></NavigationMenu.Action>
 *       </NavigationMenu.ActionsGroup>
 *       <NavigationMenu.Separator />
 *       <Avatar … />
 *     </NavigationMenu.Actions>
 *   </NavigationMenu.Root>
 *
 * An `Item` is a TRIGGER when it has a `Menu` child, or a plain LINK otherwise.
 */

/** Rows of items a column holds before wrapping to the next column. */
export type NavRows = 1 | 2 | 3 | 4

const ROWS_CLASS = {
  1: 'q-nav-rows-1',
  2: 'q-nav-rows-2',
  3: 'q-nav-rows-3',
  4: 'q-nav-rows-4',
} satisfies Record<NavRows, string>

/* ── Root: the bar primitive + the shared morphing popup shell ─────────────── */

export type NavigationMenuRootProps = Omit<ComponentProps<typeof Primitive.Root>, 'className'> & {
  className?: string
  side?: ComponentProps<typeof Primitive.Positioner>['side']
  align?: ComponentProps<typeof Primitive.Positioner>['align']
  sideOffset?: ComponentProps<typeof Primitive.Positioner>['sideOffset']
  alignOffset?: ComponentProps<typeof Primitive.Positioner>['alignOffset']
  collisionPadding?: ComponentProps<typeof Primitive.Positioner>['collisionPadding']
  container?: ComponentProps<typeof Primitive.Portal>['container']
}

/**
 * Renders the `<nav>` bar (logo / list / actions are its children) PLUS the
 * single shared Portal › Positioner › Popup › Viewport that every Item's
 * `Content` morphs into when it opens.
 */
function Root({
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  alignOffset,
  collisionPadding = 16,
  container,
  className,
  children,
  ...props
}: NavigationMenuRootProps) {
  return (
    <Primitive.Root className={cx('q-nav-root', className)} {...props}>
      {children}
      <Primitive.Portal container={container}>
        <Primitive.Positioner
          className="q-nav-positioner"
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          collisionPadding={collisionPadding}
        >
          <Primitive.Popup className="q-nav-popup">
            <Primitive.Viewport className="q-nav-viewport" />
          </Primitive.Popup>
        </Primitive.Positioner>
      </Primitive.Portal>
    </Primitive.Root>
  )
}

/** Logo slot — content is the dev's. */
function Logo({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('q-nav-logo', className)} {...props} />
}

type ListProps = Omit<ComponentProps<typeof Primitive.List>, 'className'> & { className?: string }
/** The horizontal bar of items. */
function List({ className, ...props }: ListProps) {
  return <Primitive.List className={cx('q-nav-list', className)} {...props} />
}

/* ── Item: polymorphic bar element — trigger (has Menu) or plain link ──────── */

export type NavigationMenuItemProps = {
  /** Bar label — any node. */
  label: ReactNode
  /** Stable identity for controlled open state; derived from a string label otherwise. */
  value?: string
  /** Leading slot (icon, any node). */
  start?: ReactNode
  /** Trailing slot (badge, any node — e.g. a Badge). */
  end?: ReactNode
  /** Apply the accent (lime-glow) design treatment. */
  accent?: boolean
  /** Link target — makes this a plain link when there's no `Menu` child. */
  href?: string
  /** Swap the link element (e.g. a framework `<Link>`); link items only. */
  render?: ComponentProps<typeof Primitive.Link>['render']
  disabled?: boolean
  className?: string
  /** A `<NavigationMenu.Menu>` → renders this item as a trigger with a panel. */
  children?: ReactNode
}

function Item({ label, value, start, end, accent, href, render, disabled, className, children }: NavigationMenuItemProps) {
  const autoId = useId()
  const hasMenu = children != null
  const itemValue = value ?? (typeof label === 'string' ? label : autoId)
  const itemClass = cx('q-nav-item', accent && 'q-nav-item-accent', className)
  const inner = (
    <>
      {start != null ? <span className="q-nav-item-icon">{start}</span> : null}
      {label}
      {end}
    </>
  )

  return (
    <Primitive.Item value={itemValue}>
      {hasMenu
        ? (
            <>
              <Primitive.Trigger className={itemClass} disabled={disabled}>
                {inner}
              </Primitive.Trigger>
              <Primitive.Content className="q-nav-content">{children}</Primitive.Content>
            </>
          )
        : (
            <Primitive.Link className={itemClass} href={href} render={render}>
              {inner}
            </Primitive.Link>
          )}
    </Primitive.Item>
  )
}

/* ── Right-side actions ────────────────────────────────────────────────────── */

/** The actions cluster, pushed to the right end of the bar. */
function Actions({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('q-nav-actions', className)} {...props} />
}

/** A tighter sub-group of adjacent actions. */
function ActionsGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('q-nav-actions-group', className)} {...props} />
}

export type NavigationMenuActionProps = Omit<ComponentProps<'button'>, 'type'> & {
  /** Square icon-only pill (e.g. search). */
  iconOnly?: boolean
  /** Render an `<a>` instead of a `<button>`. */
  href?: string
  /** Swap the underlying element (e.g. a framework `<Link>` or quanta `Button`). */
  render?: ReactElement
}

/** A glass action pill (search / Pricing / Assets). Content is the dev's. */
function Action({ iconOnly, className, href, render, ...props }: NavigationMenuActionProps) {
  const cls = cx('q-nav-action', iconOnly && 'q-nav-action-icon', className)
  // Default element: <a> when href is set, else a real <button> (gets implicit
  // type). A `render` element overrides the tag; href is forwarded when present.
  const isNativeButton = render == null && href == null
  return useRender({
    render,
    defaultTagName: href != null ? 'a' : 'button',
    props: {
      className: cls,
      ...(href != null ? { href } : {}),
      ...(isNativeButton ? { type: 'button' as const } : {}),
      ...props,
    },
  })
}

/** A divider — vertical in the bar/actions, reusing the Divider component. */
function Separator({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cx('q-nav-separator', className)} {...props}>
      <Divider orientation="vertical" />
    </div>
  )
}

/* ── Menu: the panel — a 2–4 row grid + optional featured rail ─────────────── */

export type NavigationMenuMenuProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Rows of items per column before wrapping (1–4; 2–4 typical). Default 2. */
  rows?: NavRows
  /** Side rail content (promo / imagery / CTA). Any node. */
  featured?: ReactNode
  children?: ReactNode
}

function Menu({ rows = 2, featured, className, children, ...props }: NavigationMenuMenuProps) {
  return (
    <div className={cx('q-nav-menu', className)} {...props}>
      <div className={cx('q-nav-menu-grid', ROWS_CLASS[rows])}>{children}</div>
      {featured != null ? <div className="q-nav-featured">{featured}</div> : null}
    </div>
  )
}

/* ── Group: a labeled cluster of items (its own full-height column) ────────── */

export type NavigationMenuGroupProps = ComponentProps<'div'> & {
  /** Column heading. Any node. */
  heading?: ReactNode
}

function Group({ heading, className, children, ...props }: NavigationMenuGroupProps) {
  return (
    <div className={cx('q-nav-group', className)} {...props}>
      {heading != null ? <div className="q-nav-group-label">{heading}</div> : null}
      {children}
    </div>
  )
}

/* ── MenuItem: a rich panel link (reuses the shared menu item visuals) ─────── */

export type NavigationMenuMenuItemProps = {
  /** Leading slot — icon / avatar / media. Any node. */
  start?: ReactNode
  /** Primary content. Any node. */
  title?: ReactNode
  /** Secondary line under the title. Any node. */
  subtitle?: ReactNode
  /** Trailing slot — badge, shortcut, chevron. Any node. */
  end?: ReactNode
  /** Link target. */
  href?: string
  /** Swap the link element (e.g. a framework `<Link>`). */
  render?: ComponentProps<typeof Primitive.Link>['render']
  className?: string
} & Omit<ComponentProps<typeof Primitive.Link>, 'href' | 'render' | 'className' | 'title'>

/**
 * A panel row. Renders a real `NavigationMenu.Link` (so keyboard + active state
 * work) and reuses the shared `q-menu-item*` presentation (see menu.css).
 */
function MenuItem({ start, title, subtitle, end, href, render, className, ...props }: NavigationMenuMenuItemProps) {
  return (
    <Primitive.Link className={cx('q-menu-item', 'q-nav-menu-item', className)} href={href} render={render} {...props}>
      {start != null ? <span className="q-menu-item-icon">{start}</span> : null}
      <span className="q-menu-item-label">
        <span className="q-menu-item-title-row">
          {typeof title === 'string' || typeof title === 'number'
            ? <span className="q-menu-item-title">{title}</span>
            : title}
        </span>
        {subtitle != null ? <span className="q-menu-item-description">{subtitle}</span> : null}
      </span>
      {end != null ? <span className="q-menu-item-trailing">{end}</span> : null}
    </Primitive.Link>
  )
}

/* ── Passthrough (Base UI owns behavior). ──────────────────────────────────── */
const Link = Primitive.Link

export const NavigationMenu = {
  Root,
  Logo,
  List,
  Item,
  Actions,
  ActionsGroup,
  Action,
  Separator,
  Menu,
  Group,
  MenuItem,
  Link,
}
