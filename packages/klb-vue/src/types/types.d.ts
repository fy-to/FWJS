export interface BreadcrumbLink {
  name: string
  to?: string
}
export interface NavLink {
  to: string
  isExternal?: boolean
  name: string
  childrens?: NavLink[]
  icon?: Component
  id?: string
}

export interface FilterDataItems {
  label: string
  req: boolean
  uid: string
  type: string
  restValue?: string
  options?: any[][]
  isHidden?: boolean
  default?: any | undefined
  formats?: Record<string, (value: any) => any>
  autocomplete?: (value: string) => Promise<any[]>
  formatRestValue?: (value: any) => any
  onChangeValue?: (form: any, value: any) => void
  focused?: boolean
}
export interface StepperSteps {
  list: StepperStep[]
  current: number
}
