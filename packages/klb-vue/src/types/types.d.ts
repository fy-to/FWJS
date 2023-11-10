export interface BreadcrumbLink {
  name: string;
  to?: string;
}
export type NavLink = {
  to: string;
  isExternal?: boolean;
  name: string;
  childrens?: NavLink[];
  icon?: Component;
  id?: string;
};
