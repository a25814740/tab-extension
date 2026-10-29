<template>
  <div class="min-h-screen min-w-[1280px] bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header class="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div class="text-lg font-semibold">{{ headerTitle }}</div>
        <div class="text-xs text-slate-400">直接在右側改設定，左邊 iframe 會即時吃到主題 tokens。</div>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink class="rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700" to="/assets">返回作品列表</RouterLink>
        <RouterLink class="rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700" :to="previewRoute">預覽頁</RouterLink>
        <button class="rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700" :disabled="isBusy" @click="persistDraft">儲存草稿</button>
        <button class="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60" :disabled="isBusy" @click="persistPublic">公開上架</button>
      </div>
    </header>

    <div class="grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_400px]">
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
        <div class="rounded-2xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-center justify-between">
            <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">作品資料</div>
            <span class="rounded-full px-2 py-1 text-[11px]" :class="statusBadgeClass">{{ currentStatusLabel }}</span>
          </div>
          <div class="mt-3 grid gap-2">
            <input v-model="creatorState.form.name" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800" placeholder="主題名稱" />
            <input v-model="creatorState.form.slug" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800" placeholder="slug（只接受英數與 -）" />
            <textarea v-model="creatorState.form.description" class="h-20 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800" placeholder="告訴使用者這個主題改了哪些區塊、適合什麼場景"></textarea>
            <div class="grid grid-cols-2 gap-2">
              <input v-model.number="creatorState.form.price" type="number" min="0" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800" placeholder="售價（TWD）" />
              <select v-model.number="creatorState.form.revenueShare" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
                <option v-for="option in revenueOptions" :key="option" :value="option">分潤 {{ option }}%</option>
              </select>
            </div>
            <input v-model="creatorState.form.tags" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800" placeholder="標籤，使用半形逗號分隔" />
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-center justify-between">
            <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">預覽封面</div>
            <div class="text-[10px] text-slate-400">未上傳時會改抓 iframe 截圖</div>
          </div>
          <div class="mt-3 grid gap-3">
            <input type="file" accept="image/*" class="text-[11px]" @change="onPreviewUpload" />
            <div class="preview-thumb h-[120px] w-full" :style="previewStyle(creatorState.previewUpload || creatorState.fallbackPreview)"></div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
          <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">整體色彩</div>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1">
              <span class="text-[11px] text-slate-400">主要文字</span>
              <input v-model="creatorState.draftEditor.base.text" type="color" class="h-10 w-16 rounded border border-slate-300 bg-transparent dark:border-slate-700" />
            </label>
            <label class="grid gap-1">
              <span class="text-[11px] text-slate-400">次要文字</span>
              <input v-model="creatorState.draftEditor.base.textMuted" type="color" class="h-10 w-16 rounded border border-slate-300 bg-transparent dark:border-slate-700" />
            </label>
            <label class="grid gap-1">
              <span class="text-[11px] text-slate-400">框線色</span>
              <input v-model="creatorState.draftEditor.base.border" type="color" class="h-10 w-16 rounded border border-slate-300 bg-transparent dark:border-slate-700" />
            </label>
            <label class="grid gap-1">
              <span class="text-[11px] text-slate-400">陰影色</span>
              <input v-model="creatorState.draftEditor.base.shadow" type="color" class="h-10 w-16 rounded border border-slate-300 bg-transparent dark:border-slate-700" />
            </label>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
          <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">區塊背景</div>
          <div class="mt-3 grid gap-2">
            <button
              v-for="section in sectionOptions"
              :key="section.key"
              class="flex items-center justify-between rounded-xl border px-3 py-2 text-left transition"
              :class="creatorState.activeSection === section.key ? 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'"
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

        <div class="rounded-2xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
          <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">填色方式</div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="mode in paintModes"
              :key="mode.value"
              class="rounded-full border px-3 py-1 text-[11px]"
              :class="activePaint.mode === mode.value ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'"
              @click="setPaintMode(mode.value)"
            >
              {{ mode.label }}
            </button>
          </div>

          <div class="mt-4 grid gap-3">
            <div v-if="activePaint.mode === 'solid'" class="grid gap-3">
              <div class="flex items-center gap-3">
                <input v-model="activePaint.color" type="color" class="h-10 w-14 rounded border border-slate-300 bg-transparent dark:border-slate-700" />
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
                  <span class="text-[11px] text-slate-400">X 軸</span>
                  <input v-model.number="activePaint.image.positionX" type="number" min="0" max="100" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
                </label>
                <label class="grid gap-1">
                  <span class="text-[11px] text-slate-400">Y 軸</span>
                  <input v-model.number="activePaint.image.positionY" type="number" min="0" max="100" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
                </label>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <label class="grid gap-1">
                  <span class="text-[11px] text-slate-400">Repeat</span>
                  <select v-model="activePaint.image.repeat" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
                    <option value="no-repeat">不重複</option>
                    <option value="repeat">重複</option>
                    <option value="repeat-x">水平重複</option>
                    <option value="repeat-y">垂直重複</option>
                  </select>
                </label>
                <label class="grid gap-1">
                  <span class="text-[11px] text-slate-400">Attachment</span>
                  <select v-model="activePaint.image.attachment" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
                    <option value="scroll">scroll</option>
                    <option value="fixed">fixed</option>
                    <option value="local">local</option>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import GradientEditor from "../components/GradientEditor.vue";
import {
  activePaint,
  creatorState,
  designTokens,
  onImageUpload,
  onPreviewUpload,
  paintModes,
  previewStyle,
  publishTheme,
  revenueOptions,
  saveDraft,
  sectionOptions,
  selectAsset,
  setActiveSection,
  setPaintMode,
  setPreviewBridge,
} from "../store/creatorStore";

const route = useRoute();
const router = useRouter();
const previewFrame = ref<HTMLIFrameElement | null>(null);
const previewOrigin = ((import.meta as { env?: Record<string, string> }).env?.VITE_PREVIEW_ORIGIN ?? window.location.origin).replace(/\/$/, "");
const previewSrc = computed(() => `${previewOrigin}/preview/`);
const previewLoadError = ref("");
const isBusy = computed(() => creatorState.pendingAction !== "idle");
const headerTitle = computed(() => creatorState.form.name.trim() || (creatorState.editingId ? "編輯主題" : "新增主題"));
const currentStatusLabel = computed(() => {
  if (!creatorState.editingId) return "未儲存";
  const current = creatorState.assets.find((asset) => asset.id === creatorState.editingId);
  return current?.is_public ? "已上架" : "草稿";
});
const statusBadgeClass = computed(() => {
  if (currentStatusLabel.value === "已上架") return "bg-emerald-500/15 text-emerald-400";
  if (currentStatusLabel.value === "草稿") return "bg-amber-500/15 text-amber-400";
  return "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
});
const previewRoute = computed(() => (creatorState.editingId ? `/preview/${creatorState.editingId}` : "/preview"));
let readyListener: ((event: MessageEvent) => void) | null = null;
let previewTimeoutId: number | null = null;

watchEffect(() => {
  const id = route.params.id as string | undefined;
  if (!id) return;
  const asset = creatorState.assets.find((item) => item.id === id);
  if (asset) {
    selectAsset(asset);
  }
});

const sectionPreview = (key: string) => {
  const paint = creatorState.draftEditor.sections[key];
  return paint.mode === "gradient"
    ? `linear-gradient(${paint.gradient.angle}deg, ${paint.gradient.stops[0]?.color ?? '#0f172a'}, ${paint.gradient.stops[1]?.color ?? '#111827'})`
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

const syncRouteToAsset = async () => {
  if (!creatorState.editingId) return;
  const currentId = route.params.id as string | undefined;
  if (currentId === creatorState.editingId) return;
  await router.replace(`/design/${creatorState.editingId}`);
};

const persistDraft = async () => {
  const asset = await saveDraft();
  if (asset?.id) {
    await syncRouteToAsset();
  }
};

const persistPublic = async () => {
  const asset = await publishTheme();
  if (asset?.id) {
    await syncRouteToAsset();
  }
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
    previewLoadError.value = "預覽 iframe 載入超時，請重新整理或確認 preview 部署是否正常。";
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
</script>
