import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./style.css";

if (window.location.pathname.includes("/creator") && !window.location.hash) {
  window.location.hash = "#/";
}

createApp(App).use(router).mount("#app");
