/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  // eslint-disable-next-line ts/no-empty-object-type
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@karpeleslab/klbfw';
declare module '@karpeleslab/i18next-klb-backend';
