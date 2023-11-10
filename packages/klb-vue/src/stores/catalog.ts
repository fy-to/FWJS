import { defineStore } from "pinia";
import { KlbCatalogProduct } from "../types/klb";

type CatalogState = {
  products: Array<KlbCatalogProduct>;
};

export const useCatalogStore = defineStore({
  id: "catalogStore",
  state: (): CatalogState => ({
    products: [],
  }),
  actions: {
    setCatalogProduct(product: KlbCatalogProduct) {
      this.products.push(product);
    },
    getCatalog() {
      return this.products;
    },
  },
});
