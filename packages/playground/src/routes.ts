export default [
  {
    path: "/",
    name: "home",
    component: () => import("./pages/HomePage.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("./pages/LoginPage.vue"),
  },
  {
    path: "/docs",
    name: "docs",
    component: () => import("./pages/doc/IndexDoc.vue"),
  },
  {
    path: "/fws-vue",
    name: "fws-vue",
    component: () => import("./pages/fv/IndexFv.vue"),
  },
  {
    path: "/klb-vue",
    name: "klb-vue",
    component: () => import("./pages/klb/IndexKlb.vue"),
  },
  {
    path: "/pages/:slug",
    name: "pages_post",
    component: () => import("./pages/CmsPage.vue"),
  },
  {
    name: "notFoundView",
    path: "/:path(.*)",
    component: () => import("@/pages/NotFoundPage.vue"),
  },
];
