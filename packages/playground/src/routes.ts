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
    name: "notFoundView",
    path: "/:path(.*)",
    component: () => import("@/pages/NotFoundPage.vue"),
  },
];
