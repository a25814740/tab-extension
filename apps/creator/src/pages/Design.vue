<template>
  <div class="min-h-screen min-w-[1280px] bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header class="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div class="text-lg font-semibold">全畫面設計模式</div>
        <div class="text-xs text-slate-400">可直接編輯主題樣式並即時預覽</div>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink class="rounded-full border border-slate-700 px-3 py-1 text-xs" to="/assets">返回後台</RouterLink>
        <RouterLink class="rounded-full border border-slate-700 px-3 py-1 text-xs" :to="previewRoute">預覽模式</RouterLink>
        <button class="rounded-full border border-slate-700 px-3 py-1 text-xs" @click="saveDraft">儲存草稿</button>
        <button class="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white" @click="publishTheme">儲存上架</button>
      </div>
    </header>

    <div class="grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div class="grid gap-2">
        <div v-if="previewLoadError" class="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
          {{ previewLoadError }}
        </div>
        <iframe
          ref="previewFrame"
          class="h-[78vh] w-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          :src="previewSrc"
          @load="onPreviewLoad"
        ></iframe>
      </div>

      <div class="grid gap-4">
        <div class="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 text-xs">
          <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">主題資訊</div>
          <div class="mt-3 grid gap-2">
            <input v-model="creatorState.form.name" class="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs" placeholder="主題名稱" />
            <input v-model="creatorState.form.slug" class="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs" placeholder="slug (自動產生可修改)" />
            <textarea v-model="creatorState.form.description" class="h-20 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs" placeholder="主題描述"></textarea>
            <div class="grid grid-cols-2 gap-2">
              <input v-model.number="creatorState.form.price" type="number" min="0" class="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs" placeholder="價格 (TWD)" />
              <select v-model.number="creatorState.form.revenueShare" class="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs">
                <option v-for="option in revenueOptions" :key="option" :value="option">{{ option }}%</option>
              </select>
            </div>
            <input v-model="creatorState.form.tags" class="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs" placeholder="標籤 (逗號分隔)" />
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 text-xs">
          <div class="flex items-center justify-between">
            <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">預覽圖</div>
            <div class="text-[10px] text-slate-400">未上傳時自動截圖</div>
          </div>
          <div class="mt-3 grid gap-2">
            <input type="file" accept="image/*" class="text-[11px]" @change="onPreviewUpload" />
            <div class="preview-thumb w-full" :style="previewStyle(creatorState.previewUpload || creatorState.fallbackPreview)"></div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 text-xs">
          <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">色系設定</div>
          <div class="mt-3 grid gap-2">
            <label class="grid gap-1">
              <span class="text-[11px] text-slate-400">主要文字</span>
              <input v-model="creatorState.draftEditor.base.text" type="color" class="h-9 w-20 rounded border border-slate-700 bg-transparent" />
            </label>
            <label class="grid gap-1">
              <span class="text-[11px] text-slate-400">次要文字</span>
              <input v-model="creatorState.draftEditor.base.textMuted" type="color" class="h-9 w-20 rounded border border-slate-700 bg-transparent" />
            </label>
            <label class="grid gap-1">
              <span class="text-[11px] text-slate-400">框線顏色</span>
              <input v-model="creatorState.draftEditor.base.border" type="color" class="h-9 w-20 rounded border border-slate-700 bg-transparent" />
            </label>
            <label class="grid gap-1">
              <span class="text-[11px] text-slate-400">陰影顏色</span>
              <input v-model="creatorState.draftEditor.base.shadow" type="color" class="h-9 w-20 rounded border border-slate-700 bg-transparent" />
            </label>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 text-xs">
          <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">編輯區塊</div>
          <div class="mt-3 grid gap-2">
            <button
              v-for="section in sectionOptions"
              :key="section.key"
              class="flex items-center justify-between rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-left"
              @click="setActiveSection(section.key)"
            >
              <span>{{ section.label }}</span>
              <span class="inline-flex items-center gap-2 text-[10px] text-slate-400">
                <span class="h-3 w-3 rounded-sm" :style="{ background: sectionPreview(section.key) }"></span>
                編輯
              </span>
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 text-xs">
          <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">填色方式</div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="mode in paintModes"
              :key="mode.value"
              class="rounded-full border border-slate-700 px-3 py-1 text-[11px]"
              :class="activePaint.mode === mode.value ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-800 text-slate-300'"
              @click="setPaintMode(mode.value)"
            >
              {{ mode.label }}
            </button>
          </div>

          <div class="mt-4 grid gap-3">
            <div v-if="activePaint.mode === 'solid'" class="grid gap-3">
              <div class="flex items-center gap-3">
                <input v-model="activePaint.color" type="color" class="h-10 w-14 rounded border border-slate-700 bg-transparent" />
                <div class="flex-1">
                  <div class="text-[11px] text-slate-400">透明度</div>
                  <input v-model.number="activePaint.opacity" type="range" min="0" max="1" step="0.05" class="w-full accent-rose-400" />
                </div>
                <span class="w-10 text-right text-[11px] text-slate-400">{{ Math.round(activePaint.opacity * 100) }}%</span>
              </div>
            </div>

            <GradientEditor v-if="activePaint.mode === 'gradient'" v-model="activePaint.gradient" />

            <div v-if="activePaint.mode === 'image'" class="grid gap-3">
              <input type="file" accept="image/*" class="text-[11px]" @change="onImageUpload" />
              <div class="grid grid-cols-2 gap-2">
                <label class="grid gap-1">
                  <span class="text-[11px] text-slate-400">X</span>
                  <input v-model.number="activePaint.image.positionX" type="number" min="0" max="100" class="rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs" />
                </label>
                <label class="grid gap-1">
                  <span class="text-[11px] text-slate-400">Y</span>
                  <input v-model.number="activePaint.image.positionY" type="number" min="0" max="100" class="rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs" />
                </label>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <label class="grid gap-1">
                  <span class="text-[11px] text-slate-400">重複</span>
                  <select v-model="activePaint.image.repeat" class="rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs">
                    <option value="no-repeat">不重複</option>
                    <option value="repeat">重複</option>
                    <option value="repeat-x">水平重複</option>
                    <option value="repeat-y">垂直重複</option>
                  </select>
                </label>
                <label class="grid gap-1">
                  <span class="text-[11px] text-slate-400">固定</span>
                  <select v-model="activePaint.image.attachment" class="rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs">
                    <option value="scroll">滾動</option>
                    <option value="fixed">固定</option>
                    <option value="local">區塊內</option>
                  </select>
                </label>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-[11px] text-slate-400">透明度</div>
                <input v-model.number="activePaint.image.opacity" type="range" min="0" max="1" step="0.05" class="w-full accent-rose-400" />
                <span class="w-10 text-right text-[11px] text-slate-400">{{ Math.round(activePaint.image.opacity * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="creatorState.statusMessage" class="text-xs text-rose-300">
          {{ creatorState.statusMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import GradientEditor from "../components/GradientEditor.vue";
import {
  creatorState,
  designTokens,
  setActiveSection,
  setPaintMode,
  activePaint,
  sectionOptions,
  paintModes,
  revenueOptions,
  onImageUpload,
  onPreviewUpload,
  previewStyle,
  saveDraft,
  setPreviewBridge,
  publishTheme,
} from "../store/creatorStore";

const previewFrame = ref<HTMLIFrameElement | null>(null);
const previewOrigin = ((import.meta as { env?: Record<string, string> }).env?.VITE_PREVIEW_ORIGIN ??
  window.location.origin).replace(/\/$/, "");
const previewSrc = computed(() => `${previewOrigin}/preview/`);
const previewLoadError = ref("");
let readyListener: ((event: MessageEvent) => void) | null = null;
let previewTimeoutId: number | null = null;

const sectionPreview = (key: string) => {
  const paint = creatorState.draftEditor.sections[key];
  return paint.mode === "gradient"
    ? `linear-gradient(${paint.gradient.angle}deg, ${paint.gradient.stops[0].color}, ${paint.gradient.stops[1].color})`
    : paint.color;
};

const sendPreviewTokens = () => {
  const frame = previewFrame.value?.contentWindow;
  if (!frame) return;
  frame.postMessage(
    {
      type: "TABOARD_PREVIEW_TOKENS",
      tokens: JSON.parse(JSON.stringify(designTokens.value)),
      theme: creatorState.theme,
    },
    previewOrigin
  );
};

const onPreviewLoad = () => {
  const frame = previewFrame.value?.contentWindow;
  if (!frame) return;
  previewLoadError.value = "";
  if (previewTimeoutId) {
    window.clearTimeout(previewTimeoutId);
    previewTimeoutId = null;
  }
  setPreviewBridge(frame, previewOrigin);
  sendPreviewTokens();
};

onMounted(() => {
  readyListener = (event: MessageEvent) => {
    if (event.origin !== previewOrigin) return;
    const payload = event.data as { type?: string };
    if (payload?.type !== "TABOARD_PREVIEW_READY") return;
    sendPreviewTokens();
  };
  window.addEventListener("message", readyListener);
  previewTimeoutId = window.setTimeout(() => {
    previewLoadError.value = "預覽載入逾時，請重新整理頁面或稍後再試。";
  }, 8000);
  window.setTimeout(sendPreviewTokens, 600);
});

onUnmounted(() => {
  if (readyListener) {
    window.removeEventListener("message", readyListener);
    readyListener = null;
  }
  if (previewTimeoutId) {
    window.clearTimeout(previewTimeoutId);
    previewTimeoutId = null;
  }
});

watch([designTokens, () => creatorState.theme], () => {
  sendPreviewTokens();
}, { deep: true });

const previewRoute = computed(() => {
  return creatorState.editingId ? `/preview/${creatorState.editingId}` : "/preview";
});
</script>
