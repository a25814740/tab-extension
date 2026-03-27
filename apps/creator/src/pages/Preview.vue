<template>
  <div class="min-h-screen min-w-[1280px] bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header class="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div class="text-lg font-semibold">預覽模式</div>
        <div class="text-xs text-slate-400">這是套用到前台的預覽畫面</div>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink class="rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700" to="/design">返回設計</RouterLink>
        <button class="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white">購買</button>
      </div>
    </header>

    <div class="p-6">
      <iframe
        ref="previewFrame"
        class="h-[72vh] w-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        :src="previewSrc"
        @load="onPreviewLoad"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { creatorState, savedTokens, selectAsset, setPreviewBridge } from "../store/creatorStore";

const route = useRoute();
const previewFrame = ref<HTMLIFrameElement | null>(null);
const previewOrigin = ((import.meta as { env?: Record<string, string> }).env?.VITE_PREVIEW_ORIGIN ??
  window.location.origin).replace(/\/$/, "");
const previewSrc = computed(() => `${previewOrigin}/preview/`);

watchEffect(() => {
  const id = route.params.id as string | undefined;
  if (!id) return;
  const asset = creatorState.assets.find((item) => item.id === id);
  if (asset) {
    selectAsset(asset);
  }
});

const sendPreviewTokens = () => {
  const frame = previewFrame.value?.contentWindow;
  if (!frame) return;
  frame.postMessage(
    {
      type: "TABOARD_PREVIEW_TOKENS",
      tokens: JSON.parse(JSON.stringify(savedTokens.value)),
      theme: creatorState.theme,
    },
    previewOrigin
  );
};

const onPreviewLoad = () => {
  const frame = previewFrame.value?.contentWindow;
  if (!frame) return;
  setPreviewBridge(frame, previewOrigin);
  sendPreviewTokens();
};

onMounted(() => {
  const handleReady = (event: MessageEvent) => {
    if (event.origin !== previewOrigin) return;
    const payload = event.data as { type?: string };
    if (payload?.type !== "TABOARD_PREVIEW_READY") return;
    sendPreviewTokens();
  };
  window.addEventListener("message", handleReady);
  setTimeout(sendPreviewTokens, 600);
  return () => window.removeEventListener("message", handleReady);
});

watch([savedTokens, () => creatorState.theme], () => {
  sendPreviewTokens();
}, { deep: true });
</script>
