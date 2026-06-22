import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Switch, SwitchLabel } from './index.ts'

describe('<Switch>', () => {
  it('renders the small switch by default', () => {
    render(<Switch aria-label="Notifications" />)

    expect(screen.getByRole('switch', { name: 'Notifications' })).toHaveClass(
      'q-switch',
      'q-switch-small',
    )
  })

  it('supports the default Figma size', () => {
    render(<Switch aria-label="Notifications" size="default" />)

    expect(screen.getByRole('switch', { name: 'Notifications' })).toHaveClass('q-switch-default')
  })

  it('supports the medium Figma size', () => {
    render(<Switch aria-label="Notifications" size="medium" />)

    expect(screen.getByRole('switch', { name: 'Notifications' })).toHaveClass('q-switch-medium')
  })

  it('reflects checked and disabled state attributes', () => {
    render(<Switch aria-label="Notifications" checked disabled />)

    const control = screen.getByRole('switch', { name: 'Notifications' })
    expect(control).toBeChecked()
    expect(control).toHaveAttribute('aria-disabled', 'true')
    expect(control).toHaveAttribute('data-checked')
    expect(control).toHaveAttribute('data-disabled')
  })

  it('toggles when clicked', async () => {
    const user = userEvent.setup()
    render(<Switch aria-label="Notifications" />)

    const control = screen.getByRole('switch', { name: 'Notifications' })
    expect(control).not.toBeChecked()

    await user.click(control)

    expect(control).toBeChecked()
  })

  it('renders a bare control with no label wrapper (back-compat)', () => {
    const { container } = render(<Switch aria-label="Bare" />)
    expect(container.querySelector('.q-switch-label')).not.toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Bare' })).toHaveClass('q-switch', 'q-switch-small')
  })
})

describe('<SwitchLabel>', () => {
  it('renders the label, description and a Switch', () => {
    render(<SwitchLabel label="Wi-Fi" description="Connect automatically" switchProps={{ checked: true }} />)
    expect(screen.getByText('Wi-Fi')).toHaveClass('q-switch-label-title')
    expect(screen.getByText('Connect automatically')).toHaveClass('q-switch-label-description')
    const control = screen.getByRole('switch')
    expect(control).toHaveClass('q-switch')
    expect(control).toBeChecked()
  })

  it('supports right-aligned switch and medium label typography', () => {
    render(<SwitchLabel direction="right" size="md" label="Email digest" />)
    expect(screen.getByText('Email digest').closest('.q-switch-label')).toHaveClass(
      'q-switch-label-right',
      'q-switch-label-md',
    )
  })

  it('lets children override the title and forwards color/size to the Switch', () => {
    render(
      <SwitchLabel color="success" switchSize="default" switchProps={{ checked: true }}>
        <strong data-testid="rich">Custom</strong>
      </SwitchLabel>,
    )
    expect(screen.getByTestId('rich')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toHaveClass('q-switch-default')
  })
})
