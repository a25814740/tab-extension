import { createRouter, createWebHistory } from "vue-router";
import AdminLayout from "./layouts/AdminLayout.vue";
import Dashboard from "./pages/Dashboard.vue";
import Assets from "./pages/Assets.vue";
import Revenue from "./pages/Revenue.vue";
import Design from "./pages/Design.vue";
import Preview from "./pages/Preview.vue";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
  ],
});
