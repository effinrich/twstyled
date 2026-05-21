import React, { useState } from 'react'
import { styled, type Props } from 'tw-styled'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from 'tw-styled-ui'

// Static classes demo
const Hero = styled.section`
  min-h-screen bg-gray-50 dark:bg-gray-950
  flex flex-col items-center justify-center gap-8 p-8
`

const Title = styled.h1`
  text-4xl font-bold tracking-tight
  text-gray-900 dark:text-gray-100
`

// Dynamic interpolation demo
type PillVariant = 'teal' | 'lime' | 'rose'
const pillColors: Record<PillVariant, string> = {
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  lime: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
}

const Pill = styled.span<{ $color: PillVariant }>`
  inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
  ${(p: Props<{ $color: PillVariant }>) => pillColors[p.$color]}
`

// Dark mode toggle demo
const DarkModeBox = styled.div`
  rounded-lg border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  p-4 text-sm
`

export function App() {
  const [count, setCount] = useState(0)
  const [dark, setDark] = useState(false)

  return (
    <div className={dark ? 'dark' : ''}>
      <Hero>
        <Title>tw-styled playground</Title>

        {/* Dynamic interpolation with variant props */}
        <div className="flex gap-3">
          <Pill $color="teal">Teal pill</Pill>
          <Pill $color="lime">Lime pill</Pill>
          <Pill $color="rose">Rose pill</Pill>
        </div>

        {/* Dark mode via dark: prefix */}
        <DarkModeBox>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
            Dark mode
          </label>
        </DarkModeBox>

        {/* shadcn token usage with consumer className merging */}
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Counter</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Badge $variant="secondary">Count: {count}</Badge>
            <div className="flex gap-2">
              <Button onClick={() => setCount((c) => c - 1)} $variant="outline">
                −
              </Button>
              <Button onClick={() => setCount((c) => c + 1)}>+</Button>
            </div>
            <Input placeholder="Type something..." />
          </CardContent>
        </Card>
      </Hero>
    </div>
  )
}
