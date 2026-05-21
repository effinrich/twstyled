import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  Button,
  Input,
  Badge,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../index'

describe('Button', () => {
  it('renders without throwing', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('forwards className correctly (consumer wins)', () => {
    render(<Button className="bg-red-500">Styled</Button>)
    const btn = screen.getByRole('button', { name: 'Styled' })
    // Consumer class should be present
    expect(btn.className).toContain('bg-red-500')
  })

  it('does not forward transient props ($variant, $size) to the DOM', () => {
    render(
      <Button $variant="outline" $size="sm">
        Transient
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'Transient' })
    const attrNames = Array.from(btn.attributes).map((a) => a.name)
    expect(attrNames.every((name) => !name.startsWith('$'))).toBe(true)
  })
})

describe('Input', () => {
  it('renders as an input element', () => {
    render(<Input data-testid="my-input" />)
    const el = screen.getByTestId('my-input')
    expect(el.tagName).toBe('INPUT')
  })
})

describe('Badge', () => {
  it('renders without throwing', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('renders with variant classes', () => {
    render(<Badge $variant="destructive">Error</Badge>)
    const el = screen.getByText('Error')
    expect(el.className).toContain('bg-[--destructive]')
  })
})

describe('Label', () => {
  it('renders as a label element', () => {
    render(<Label>Email</Label>)
    const el = screen.getByText('Email')
    expect(el.tagName).toBe('LABEL')
  })
})

describe('Card', () => {
  it('Card renders without throwing', () => {
    render(<Card data-testid="card">Content</Card>)
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('CardHeader renders without throwing', () => {
    render(<CardHeader data-testid="card-header">Header</CardHeader>)
    expect(screen.getByTestId('card-header')).toBeInTheDocument()
  })

  it('CardContent renders without throwing', () => {
    render(<CardContent data-testid="card-content">Body</CardContent>)
    expect(screen.getByTestId('card-content')).toBeInTheDocument()
  })

  it('CardFooter renders without throwing', () => {
    render(<CardFooter data-testid="card-footer">Footer</CardFooter>)
    expect(screen.getByTestId('card-footer')).toBeInTheDocument()
  })

  it('CardTitle renders without throwing', () => {
    render(<CardTitle>Title</CardTitle>)
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('CardDescription renders without throwing', () => {
    render(<CardDescription>Description</CardDescription>)
    expect(screen.getByText('Description')).toBeInTheDocument()
  })
})
