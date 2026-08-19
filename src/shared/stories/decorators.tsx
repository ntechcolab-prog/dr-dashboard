import React from 'react'
import type { Decorator } from '@storybook/react'
import { CompanyStateProvider } from '../../shared/client/CompanyState'
import { AVAIL_STATE_SEED } from './mocks'

// Wraps a story in its own per-company state store seeded with an availability
// plan + settings, so the availability hooks (useAvailabilityPlan / Settings)
// resolve to real, chart-worthy numbers. The nested provider overrides the
// empty global one for this story's subtree.
export const withAvailabilityState: Decorator = (Story) => (
  <CompanyStateProvider initial={{ ...AVAIL_STATE_SEED }}>
    <Story />
  </CompanyStateProvider>
)

// Constrain a story to a comfortable reading width (charts/cards look best when
// they aren't stretched across an ultra-wide canvas).
export const boxed = (maxWidth = 720): Decorator =>
  function Boxed(Story) {
    return (
      <div style={{ maxWidth, width: '100%' }}>
        <Story />
      </div>
    )
  }
