import { useRest } from "./rest";
import {
  KlbAPIOrderProcess,
  KlbOrder,
  KlbAPIOrder,
  KlbAPIOrders,
  KlbAPIProduct,
} from "../types/klb";
import { useCatalogStore } from "../stores/catalog";

export function useCart() {
  const rest = useRest();
  const catalogStore = useCatalogStore();
  return {
    async getCatalogProduct(product: string) {
      const result = await rest<KlbAPIProduct>(
        `Catalog/Product/${product}`,
        "GET",
      );
      if (result && result.result == "success") {
        catalogStore.setCatalogProduct(result.data);
      }
    },
    resetCart() {
      return new Promise<boolean>((resolve, reject) => {
        rest("Catalog/Cart/@:reset", "POST", {})
          .then((_resetResult) => {
            if (_resetResult && _resetResult.result === "success")
              resolve(true);
            else resolve(false);
          })
          .catch(() => {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject(false);
          });
      });
    },
    createOrderNoLocation(flags: Array<any>) {
      return rest("Catalog/Cart/@:createOrder", "POST", {
        Billing_User_Location__: "DEFER",
        Shipping_User_Location__: "DEFER",
        License_User_Location__: "DEFER",
        Flags: flags,
      });
    },
    createOrder(
      billingLocation: { User_Location__: string },
      flags: Array<any>,
    ) {
      return rest("Catalog/Cart/@:createOrder", "POST", {
        Billing: billingLocation,
        Flags: flags,
      });
    },
    getCart() {
      return rest("Catalog/Cart/@", "GET");
    },
    delProduct(productKey: string) {
      return new Promise<boolean>((resolve, reject) => {
        rest("Catalog/Cart/@:process", "POST", {
          request: `${productKey}=0`,
        })
          .then((_addProductCartResult) => {
            if (
              _addProductCartResult &&
              _addProductCartResult.result === "success"
            )
              resolve(true);
            else resolve(false);
          })
          .catch(() => {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject(false);
          });
      });
    },
    addProduct: (productUuid: string, meta: string) => {
      return new Promise((resolve, reject) => {
        rest("Catalog/Cart/@:process", "POST", {
          request: productUuid + meta,
        })
          .then((_addProductCartResult) => {
            if (
              _addProductCartResult &&
              _addProductCartResult.result === "success"
            )
              resolve(_addProductCartResult);
            else resolve(_addProductCartResult);
          })
          .catch((err) => {
            reject(err);
          });
      });
    },
    processOrder(data: any, orderUuid: string) {
      return rest<KlbAPIOrderProcess>(
        `Order/${orderUuid}:process`,
        "POST",
        data,
      );
    },
    getOrder(orderUuid: string) {
      return rest<KlbAPIOrder>(`Order/${orderUuid}`, "GET");
    },
    getOrders() {
      return rest("Order/", "GET");
    },
    getLastUnfinishedOrder() {
      return new Promise<KlbOrder | null>((resolve) => {
        rest<KlbAPIOrders>("Order/", "GET", {
          results_per_page: 1,
          sort: "Created",
          Status: "pending",
        })
          .then((_result) => {
            if (
              _result &&
              _result.result === "success" &&
              _result.data.length > 0
            )
              resolve(_result.data[0]);

            resolve(null);
          })
          .catch(() => {
            resolve(null);
          });
      });
    },
  };
}
