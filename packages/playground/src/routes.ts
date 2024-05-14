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
    path: "/test",
    name: "test",
    component: () => import("./pages/TestsPage.vue"),
    meta: {
      reqLogin: true,
    },
  },
  {
    path: "/js_workers",
    name: "/js_workers",
    component: () => import("./pages/JSProcessPage.vue"),
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
    path: "/forums",
    name: "bb_home",
    component: () => import("@/pages/forums/BBHome.vue"),
  },
  {
    path: "/forums/:uuid",
    name: "bb_thead_home",
    component: () => import("@/pages/forums/BBPage.vue"),
  },
  {
    path: "/forums/:uuid/new",
    name: "bn_new",
    component: () => import("@/pages/forums/BBNew.vue"),
    meta: {
      reqLogin: true,
    },
  },
  {
    path: "/forums/:uuid/:slug",
    name: "bb_home_slug",
    component: () => import("@/pages/forums/BBSingle.vue"),
  },
  {
    name: "notFoundView",
    path: "/:path(.*)",
    component: () => import("@/pages/NotFoundPage.vue"),
  },
];
