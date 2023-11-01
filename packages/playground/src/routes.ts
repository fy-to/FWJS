export default [
    {
      path: "/",
      name: "home",
      component: () => import("./pages/HomePage.vue"),
    },
    {
        name: "notFoundView",
        path: "/:path(.*)",
        component: () => import("@/pages/NotFoundPage.vue"),
      },
    ];
    