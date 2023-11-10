import { getCurrentInstance } from "vue";
import type { KlbCountry, KlbAPICountry } from "../types/klb";
import { useRest } from "./rest";
export type GlobalCountries = {
  countries: Array<KlbCountry>;
  byUuid: {
    [key: string]: KlbCountry;
  };
  countriesOptions: string[][];
};
const countries: GlobalCountries = {
  countries: new Array<KlbCountry>(),
  byUuid: {},
  countriesOptions: [],
};
const useCountries = () => {
  const vueInstance = getCurrentInstance();
  return vueInstance!.appContext.config.globalProperties.$countries;
};
const countriesPromise = () => {
  const rest = useRest();

  const vueInstance = getCurrentInstance();
  return new Promise((resolve) => {
    rest<KlbAPICountry>("Country", "GET")
      .then((_countries) => {
        if (_countries && _countries.result == "success") {
          countries.countries = _countries.data;
          _countries.data.forEach((_country) => {
            countries.byUuid[_country.Country__] = _country;
            countries.countriesOptions.push([
              _country.Country__,
              _country.Name,
            ]);
          });
          vueInstance!.appContext.config.globalProperties.$countries =
            countries;
        }
        resolve(true);
      })
      .catch(() => {});
  });
};

export { countriesPromise, useCountries, countries };
