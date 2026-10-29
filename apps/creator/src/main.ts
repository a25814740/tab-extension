import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { normalizeCreatorEntryHash } from "./store/authCallback";
import "./style.css";

if (window.location.pathname.includes("/creator")) {
  const normalizedHash = normalizeCreatorEntryHash(window.location.hash);
  if (normalizedHash !== window.location.hash) {
    window.location.hash = normalizedHash;
  }
}

createApp(App).use(router).mount("#app");
