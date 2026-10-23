// Expected results per product (Settings › Production).
//
// A product's targets are a starting point: a batch loads them into its own
// Expected Results (Registry › Product) and can adjust them from there. Editing
// a product here never rewrites batches that already loaded it.

import { useLocalStorage } from './useLocalStorage'
import { RECIPES } from '../data/mockData'

export interface ProductTargets {
  product: string
  /** Expected value per variable name — same shape as ResultsData.expected. */
  expected: Record<string, string>
}

// Mock seed: chocolates are ground to a coarser finish than paints and inks.
const seed = (product: string): Record<string, string> =>
  /chocolate/i.test(product)
    ? { d50: '8', d90: '25', Viscosity: '3500' }
    : { d10: '0,70', d50: '1,60', d90: '2,50' }

export const DEFAULT_PRODUCT_TARGETS: ProductTargets[] = RECIPES.map((product) => ({
  product,
  expected: seed(product),
}))

const KEY = 'dr-product-targets'

export function useProductTargets() {
  return useLocalStorage<ProductTargets[]>(KEY, DEFAULT_PRODUCT_TARGETS)
}
