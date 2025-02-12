import type { KlbCatalogProduct } from '../types/klb'
import { defineStore } from 'pinia'

interface CatalogState {
  products: Array<KlbCatalogProduct>
}

export const useCatalogStore = defineStore('catalogStore', {
  state: (): CatalogState => ({
    products: [],
  }),
  actions: {
    setCatalogProduct(product: KlbCatalogProduct) {
      this.products.push(product)
    },
    getCatalog() {
      return this.products
    },
  },
})
