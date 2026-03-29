import { createRouter, createWebHashHistory } from "vue-router";
import AdminLayout from "./layouts/AdminLayout.vue";
import Dashboard from "./pages/Dashboard.vue";
import Assets from "./pages/Assets.vue";
import Revenue from "./pages/Revenue.vue";
import Design from "./pages/Design.vue";
import Preview from "./pages/Preview.vue";

const resolveBase = () => {
  const envBase = import.meta.env.BASE_URL;
  if (envBase && envBase !== "./" && envBase !== "/") {
    return envBase;
  }
  if (typeof window !== "undefined" && window.location.pathname.includes("/creator")) {
    return "/creator/";
  }
  return "/";
};

export const router = createRouter({
  history: createWebHashHistory(resolveBase()),
  routes: [
    {
      path: "/",
      component: AdminLayout,
      children: [
        { path: "", name: "dashboard", component: Dashboard },
        { path: "assets", name: "assets", component: Assets },
        { path: "revenue", name: "revenue", component: Revenue },
      ],
    },
    { path: "/design/:id?", name: "design", component: Design },
    { path: "/preview/:id?", name: "preview", component: Preview },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
