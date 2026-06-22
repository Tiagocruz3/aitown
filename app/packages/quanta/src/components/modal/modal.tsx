'use client'

import type { ComponentProps, ReactElement, ReactNode, Ref, SVGProps } from 'react'
import { Children, isValidElement, useRef } from 'react'
import { Dialog as Primitive } from '@base-ui/react/dialog'
import type { ClassValue } from '../utils/cx.ts'
import { cx } from '../utils/cx.ts'
import { CloseIcon, closeButton } from '../close-button/index.ts'

/**
 * Modal — Base UI Dialog (focus trap, scroll lock, escape, a11y, portal, and
 * exit-mount timing) skinned with quanta tokens, pixel-matched to the Figma
 * modal system (node 1947:1403). Dialog is centered (no Positioner), so the
 * glass card lives on `Popup` (z-q-modal) and the dim scrim on `Backdrop`.
 *
 * Two ways to use it:
 *
 *   // composition — full control (header variants, etc.)
 *   <Modal.Root>
 *     <Modal.Trigger render={<Button>Open</Button>} />
 *     <Modal.Content>
 *       <Modal.Header title="Title" />
 *       <Modal.Body>…</Modal.Body>
 *       <Modal.Footer caption="…" actions={<Button>Save</Button>} />
 *     </Modal.Content>
 *   </Modal.Root>
 *
 *   // flat — everything as props (default header)
 *   <Modal open={open} onOpenChange={setOpen} title="Title" actions={…}>…</Modal>
 *
 * `Modal` is both the flat component and the namespace holding the parts.
 */

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type ModalHeaderVariant = 'default' | 'back' | 'search' | 'tabs'

const SIZE_CLASS = {
  sm: 'q-modal-size-sm',
  md: 'q-modal-size-md',
  lg: 'q-modal-size-lg',
  xl: 'q-modal-size-xl',
  '2xl': 'q-modal-size-2xl',
} satisfies Record<ModalSize, string>

export interface ModalOptions {
  size?: ModalSize
}

/** Build the modal popup class string. Also usable to style a non-popup element. */
export function modal(options: ModalOptions = {}, ...extra: ClassValue[]): string {
  const { size = 'md' } = options
  return cx('q-modal', SIZE_CLASS[size], ...extra)
}

/* ── Inline glyphs (quanta ships no icon set). The close cross comes from the
 * shared CloseButton so every overlay uses one dismiss control. ────────────── */
function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <path d="M12.5 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Populate every ref in `refs` with the same node (object or callback refs). */
function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function')
        ref(node)
      else if (ref)
        (ref as { current: T | null }).current = node
    }
  }
}

/* ── Passthrough parts (Base UI owns behavior; quanta only names them). ─────── */
const Root = Primitive.Root
const Trigger = Primitive.Trigger
/** Raw dismiss trigger — wrap a Button via `render`, or pass your own children. */
const Close = Primitive.Close

type TitleProps = Omit<ComponentProps<typeof Primitive.Title>, 'className'> & { className?: string }
function Title({ className, ...props }: TitleProps) {
  return <Primitive.Title className={cx('q-modal-title', className)} {...props} />
}

type DescriptionProps = Omit<ComponentProps<typeof Primitive.Description>, 'className'> & { className?: string }
function Description({ className, ...props }: DescriptionProps) {
  return <Primitive.Description className={cx('q-modal-description', className)} {...props} />
}

type CloseButtonProps = Omit<ComponentProps<typeof Primitive.Close>, 'className'> & { className?: string }
/** Styled round dismiss button (Figma 32px disc) used by default in the header. */
function CloseButton({ className, children, ...props }: CloseButtonProps) {
  return (
    <Primitive.Close aria-label="Close" className={closeButton({}, className)} {...props}>
      {children ?? <CloseIcon />}
    </Primitive.Close>
  )
}

type BackButtonProps = Omit<ComponentProps<'button'>, 'className'> & { className?: string }
/** Styled round back button (Figma 32px disc) for the "back" header. */
function BackButton({ className, children, type, ...props }: BackButtonProps) {
  return (
    <button type={type ?? 'button'} aria-label="Back" className={closeButton({}, className)} {...props}>
      {children ?? <ChevronLeftIcon />}
    </button>
  )
}

type SearchProps = Omit<ComponentProps<'input'>, 'className' | 'size'> & {
  className?: string
  inputClassName?: string
  icon?: ReactNode
}
/** Search row for the "search" header (magnifier + input). */
function Search({ className, inputClassName, icon, placeholder = 'Search', type, ...props }: SearchProps) {
  return (
    <div className={cx('q-modal-search', className)}>
      <span className="q-modal-search-icon">{icon ?? <SearchIcon />}</span>
      <input className={cx('q-modal-search-input', inputClassName)} placeholder={placeholder} type={type ?? 'search'} {...props} />
    </div>
  )
}

type ContentProps = Omit<ComponentProps<typeof Primitive.Popup>, 'className'> & {
  className?: string
  /** Width preset (Figma sizes). Use className/style for one-off dimensions. */
  size?: ModalSize
  backdropClassName?: string
  /** Portal mount node. Defaults to document.body. */
  container?: ComponentProps<typeof Primitive.Portal>['container']
}

/** Portal + Backdrop + the centered glass Popup. */
function Content({ size = 'md', backdropClassName, container, className, children, initialFocus, ref, ...props }: ContentProps) {
  // Focus the popup itself (not the first tabbable) so opening doesn't ring the ✕.
  const popupRef = useRef<HTMLDivElement>(null)
  return (
    <Primitive.Portal container={container}>
      <Primitive.Backdrop className={cx('q-modal-backdrop', backdropClassName)} />
      <Primitive.Popup
        ref={mergeRefs(popupRef, ref)}
        initialFocus={initialFocus ?? popupRef}
        className={modal({ size }, className)}
        {...props}
      >
        {children}
      </Primitive.Popup>
    </Primitive.Portal>
  )
}

type HeaderProps = Omit<ComponentProps<'div'>, 'title'> & {
  /** Header layout (Figma header types). */
  variant?: ModalHeaderVariant
  /** Title content; rendered as the accessible Dialog title (sets aria-labelledby). */
  title?: ReactNode
  /** Leading slot — overrides the default back button (back) / sits before search. */
  start?: ReactNode
  /** Trailing slot — sits just before the close affordance (e.g. a settings Button / Badge). */
  end?: ReactNode
  /** Close affordance: `true` (default styled button), `false` (none), or custom node. */
  closeButton?: ReactNode | boolean
  /** Props for the built-in Search (search variant). */
  searchProps?: SearchProps
  /** Tabs control to render in the "tabs" header (e.g. a Tabs pill). */
  tabs?: ReactNode
}

function Header({
  variant = 'default',
  title,
  start,
  end,
  closeButton = true,
  searchProps,
  tabs,
  children,
  className,
  ...props
}: HeaderProps) {
  const close = closeButton === true ? <CloseButton /> : closeButton === false ? null : closeButton
  let content: ReactNode
  if (children != null) {
    content = children
  }
  else if (variant === 'back') {
    content = (
      <>
        <div className="q-modal-header-lead">
          {start ?? <BackButton />}
          {title ? <Title>{title}</Title> : null}
        </div>
        <span className="q-modal-spacer" aria-hidden />
        {end}
        {close}
      </>
    )
  }
  else if (variant === 'search') {
    content = (
      <>
        {start}
        <Search {...searchProps} />
        {end}
        {close}
      </>
    )
  }
  else if (variant === 'tabs') {
    content = (
      <>
        {tabs}
        <span className="q-modal-spacer" aria-hidden />
        {end}
        {close}
      </>
    )
  }
  else {
    content = (
      <>
        {start}
        {/* truthiness, not != null: title="" must not register an empty aria-labelledby */}
        {title ? <Title>{title}</Title> : <span className="q-modal-spacer" aria-hidden />}
        {end}
        {close}
      </>
    )
  }
  // Search / tabs headers run flush (Figma px 0) so the row/pill spans the width.
  const flush = variant === 'search' || variant === 'tabs'
  return (
    <div className={cx('q-modal-header', flush && 'q-modal-header-flush', className)} {...props}>
      {content}
    </div>
  )
}

type WorkspaceProps = ComponentProps<'div'> & {
  /** Apply the default content padding. Set false for edge-to-edge content. */
  padded?: boolean
}

/**
 * The inset "window" — a frosted, lighter pane inside the body. Place a single
 * one to fill the body, or several inside your own layout div (flex row,
 * column, grid — any order) for split layouts like the Figma "Left sidebar" /
 * "Selector" variants. Size a fixed pane with `className` (e.g. `w-* flex-none`);
 * the rest grow to fill. Each pane scrolls independently when constrained.
 */
function Workspace({ className, padded = true, ...props }: WorkspaceProps) {
  return <div className={cx('q-modal-workspace', padded && 'q-modal-workspace-padded', className)} {...props} />
}

type BodyProps = ComponentProps<'div'> & {
  /** Padding for the auto-wrapped single Workspace (ignored when you nest your own). */
  padded?: boolean
}

/**
 * Body — the scrollable region between header and footer. It imposes NO layout:
 * arrange Workspaces however you like by passing your own div(s) (flex row /
 * column / grid), or a single `Modal.Workspace`. As a convenience, plain content
 * with no Workspace anywhere is auto-wrapped in one full Workspace so the window
 * effect still applies. Scrolls (it never crops) when content overflows.
 */
function Body({ className, padded = true, children, ...props }: BodyProps) {
  // Recurse so a Workspace nested in the caller's own layout div is detected
  // (and we don't double-wrap it); only truly Workspace-free content is wrapped.
  const hasWorkspace = (nodes: ReactNode): boolean =>
    Children.toArray(nodes).some(c =>
      isValidElement(c) && (c.type === Workspace || hasWorkspace((c.props as { children?: ReactNode }).children)),
    )
  return (
    <div className={cx('q-modal-body', className)} {...props}>
      {hasWorkspace(children) ? children : <Workspace padded={padded}>{children}</Workspace>}
    </div>
  )
}

type FooterProps = ComponentProps<'div'> & {
  /** Leading caption text. */
  caption?: ReactNode
  /** Trailing action buttons. */
  actions?: ReactNode
  /** Stretch the actions to fill the footer width (Figma footer type=full). */
  full?: boolean
}

function Footer({ caption, actions, full = false, children, className, ...props }: FooterProps) {
  return (
    <div className={cx('q-modal-footer', className)} {...props}>
      {children ?? (
        <>
          {caption ? <div className="q-modal-caption">{caption}</div> : full ? null : <span className="q-modal-spacer" aria-hidden />}
          {actions != null ? <div className={cx('q-modal-actions', full && 'q-modal-actions-full')}>{actions}</div> : null}
        </>
      )}
    </div>
  )
}

export type ModalProps = ComponentProps<typeof Primitive.Root> & {
  size?: ModalSize
  /** Optional trigger element (e.g. a Button). Rendered via Base UI's `render`. */
  trigger?: ReactElement
  /** Title content; sets the dialog's accessible name. Provide this OR `aria-label`. */
  title?: ReactNode
  /** Accessible name when there is no visible `title` (forwarded to the popup). */
  'aria-label'?: string
  'aria-labelledby'?: string
  /** Optional accessible description, shown under the header. */
  description?: ReactNode
  /** Header close affordance — see `Modal.Header`. */
  closeButton?: ReactNode | boolean
  /** Footer caption; footer is omitted unless `caption` or `actions` is set. */
  caption?: ReactNode
  /** Footer actions; footer is omitted unless `caption` or `actions` is set. */
  actions?: ReactNode
  /** Body content. */
  children?: ReactNode
  /** Apply default body padding (default true). */
  padded?: boolean
  /** Class for the glass popup. */
  className?: string
  backdropClassName?: string
  container?: ContentProps['container']
  initialFocus?: ContentProps['initialFocus']
  finalFocus?: ContentProps['finalFocus']
}

/** Flat all-in-one Modal — composes the parts (default header) from props. */
function ModalComponent({
  size,
  trigger,
  title,
  description,
  closeButton,
  caption,
  actions,
  children,
  padded,
  className,
  backdropClassName,
  container,
  initialFocus,
  finalFocus,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...rootProps
}: ModalProps) {
  const hasHeader = title != null || closeButton !== false
  const hasFooter = caption != null || actions != null
  return (
    <Root {...rootProps}>
      {trigger != null ? <Trigger render={trigger} /> : null}
      <Content
        size={size}
        className={className}
        backdropClassName={backdropClassName}
        container={container}
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        // Only forward when set — passing undefined would clobber the
        // title-derived aria-labelledby Base UI computes from Modal.Title.
        {...(ariaLabel != null ? { 'aria-label': ariaLabel } : {})}
        {...(ariaLabelledby != null ? { 'aria-labelledby': ariaLabelledby } : {})}
      >
        {hasHeader ? <Header title={title} closeButton={closeButton} /> : null}
        {description != null ? <Description>{description}</Description> : null}
        <Body padded={padded}>{children}</Body>
        {hasFooter ? <Footer caption={caption} actions={actions} /> : null}
      </Content>
    </Root>
  )
}

export const Modal = Object.assign(ModalComponent, {
  Root,
  Trigger,
  Content,
  Header,
  Body,
  Workspace,
  Footer,
  Title,
  Description,
  Close,
  CloseButton,
  BackButton,
  Search,
})
