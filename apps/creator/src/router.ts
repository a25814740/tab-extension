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
        { path: "", name: "dashboard", component: Dashboard, meta: { title: "總覽" } },
        { path: "assets", name: "assets", component: Assets, meta: { title: "作品列表" } },
        { path: "revenue", name: "revenue", component: Revenue, meta: { title: "收益中心" } },
      ],
    },
    { path: "/design/:id?", name: "design", component: Design, meta: { title: "主題設計" } },
    { path: "/preview/:id?", name: "preview", component: Preview, meta: { title: "主題預覽" } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
