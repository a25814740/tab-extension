<template>
  <section
    :id="`${prefix}Root`"
    class="preview-layer rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm"
    :style="rootStyle"
  >
    <button class="gear-btn" title="編輯整體" @click.stop="emit('open-editor', 'root')">⚙</button>
    <div
      class="flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold"
      :style="topbarStyle"
    >
      <div>{{ store.workspace.name }} / {{ activeSpace.name }}</div>
      <div class="flex items-center gap-2 text-[11px]">
        <span class="rounded-full border px-2 py-1" :style="chipStyle">搜尋</span>
        <span class="rounded-full border px-2 py-1" :style="chipStyle">同步</span>
      </div>
    </div>

    <div class="mt-3 grid gap-3" :class="compact ? 'grid-cols-[140px_minmax(0,1fr)_180px]' : 'grid-cols-[180px_minmax(0,1fr)_220px]'">
      <aside :id="`${prefix}Left`" class="preview-layer rounded-[18px] border border-zinc-200 bg-white p-3" :style="leftStyle">
        <button class="gear-btn" title="編輯左側" @click.stop="emit('open-editor', 'left')">⚙</button>
        <div class="text-[11px]" :style="mutedStyle">空間</div>
        <div class="mt-2 grid gap-2">
          <div
            v-for="space in store.spaces.slice(0, 4)"
            :key="space.id"
            class="rounded-xl border px-3 py-2 text-xs"
            :style="chipStyle"
          >
            {{ space.name }}
          </div>
        </div>
      </aside>

      <main :id="`${prefix}Main`" class="preview-layer rounded-[18px] border border-zinc-200 bg-white p-3" :style="mainStyle">
        <button class="gear-btn" title="編輯主內容" @click.stop="emit('open-editor', 'main')">⚙</button>
        <div class="text-[11px]" :style="mutedStyle">集合</div>
        <div class="mt-2 grid gap-2">
          <div
            v-for="collection in collections"
            :key="collection.id"
            class="rounded-[16px] border p-3"
            :style="chipStyle"
          >
            <div class="text-xs font-semibold">{{ collection.name }}</div>
            <div class="mt-2 grid gap-1 text-[11px]" :style="mutedStyle">
              <div v-for="tab in collection.tabs.slice(0, 2)" :key="tab.id" class="truncate">
                {{ tab.title }}
              </div>
            </div>
          </div>
        </div>
      </main>

      <section :id="`${prefix}Right`" class="preview-layer rounded-[18px] border border-zinc-200 bg-white p-3" :style="rightStyle">
        <button class="gear-btn" title="編輯右側" @click.stop="emit('open-editor', 'right')">⚙</button>
        <div class="text-[11px]" :style="mutedStyle">開啟分頁</div>
        <div class="mt-2 grid gap-2">
          <div
            v-for="tab in store.openTabs.slice(0, 4)"
            :key="tab.id"
            class="rounded-xl border px-3 py-2 text-[11px] truncate"
            :style="chipStyle"
          >
            {{ tab.title }}
          </div>
        </div>
      </section>
    </div>

    <div :id="`${prefix}Dock`" class="preview-layer mt-3 rounded-[20px] border border-zinc-200 bg-white px-4 py-3" :style="dockStyle">
      <button class="gear-btn" title="編輯 Dock" @click.stop="emit('open-editor', 'dock')">⚙</button>
      <div class="flex items-center gap-2">
        <div class="h-8 w-8 rounded-2xl" :style="{ background: tokens.accent || '#f43f5e' }"></div>
        <div class="h-8 w-8 rounded-2xl border" :style="chipStyle"></div>
        <div class="h-8 w-8 rounded-2xl border" :style="chipStyle"></div>
        <div class="h-8 w-8 rounded-2xl border" :style="chipStyle"></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

type TabItem = { id: string; title: string };
type CollectionItem = { id: string; name: string; tabs: TabItem[] };
type SpaceItem = { id: string; name: string };
type PreviewStore = {
  workspace: { id: string; name: string };
  spaces: SpaceItem[];
  activeSpaceId: string;
  collections: CollectionItem[];
  openTabs: TabItem[];
};
type TokenSet = {
  background: string;
  backgroundImageOpacity?: number;
  panel: string;
  leftPanelBackground?: string;
  leftPanelImageOpacity?: number;
  mainPanelBackground?: string;
  mainPanelImageOpacity?: number;
  rightPanelBackground?: string;
  rightPanelImageOpacity?: number;
  panelMuted?: string;
  dockImageOpacity?: number;
  border: string;
  shadow: string;
  text: string;
  textMuted: string;
  accent: string;
};

const props = defineProps<{
  prefix: string;
  compact?: boolean;
  tokens: TokenSet;
  store: PreviewStore;
}>();

const emit = defineEmits<{
  (e: "open-editor", target: string): void;
}>();

const isImage = (value?: string) => (value || "").trim().startsWith("url(");
const layerStyle = (value: string | undefined, fallback: string, opacity?: number) => {
  const trimmed = (value || "").trim();
  const safeOpacity = Math.min(1, Math.max(0, Number(opacity ?? 10) / 100));
  if (isImage(trimmed)) {
    return {
      background: fallback,
      "--bg-image": trimmed,
      "--bg-opacity": safeOpacity.toFixed(2),
    } as Record<string, string>;
  }
  return {
    background: trimmed || fallback,
    "--bg-image": "none",
    "--bg-opacity": safeOpacity.toFixed(2),
  } as Record<string, string>;
};

const activeSpace = computed(() => {
  return props.store.spaces.find((space) => space.id === props.store.activeSpaceId) || props.store.spaces[0];
});
const collections = computed(() => {
  return props.store.collections.filter((col) => col.id).slice(0, 3);
});

const rootStyle = computed(() => ({
  color: props.tokens.text || "#0f172a",
  borderColor: props.tokens.border || "#dbe3f0",
  boxShadow: `0 16px 34px ${props.tokens.shadow || "rgba(0,0,0,0.35)"}`,
  ...layerStyle(props.tokens.background, "#0f172a", props.tokens.backgroundImageOpacity),
}));
const leftStyle = computed(() => ({
  color: props.tokens.text || "#0f172a",
  borderColor: props.tokens.border || "#dbe3f0",
  boxShadow: `0 10px 18px ${props.tokens.shadow || "rgba(0,0,0,0.35)"}`,
  ...layerStyle(props.tokens.leftPanelBackground || props.tokens.panel, "#111827", props.tokens.leftPanelImageOpacity),
}));
const mainStyle = computed(() => ({
  color: props.tokens.text || "#0f172a",
  borderColor: props.tokens.border || "#dbe3f0",
  boxShadow: `0 10px 18px ${props.tokens.shadow || "rgba(0,0,0,0.35)"}`,
  ...layerStyle(props.tokens.mainPanelBackground || props.tokens.panel, "#111827", props.tokens.mainPanelImageOpacity),
}));
const rightStyle = computed(() => ({
  color: props.tokens.text || "#0f172a",
  borderColor: props.tokens.border || "#dbe3f0",
  boxShadow: `0 10px 18px ${props.tokens.shadow || "rgba(0,0,0,0.35)"}`,
  ...layerStyle(props.tokens.rightPanelBackground || props.tokens.panel, "#111827", props.tokens.rightPanelImageOpacity),
}));
const dockStyle = computed(() => ({
  borderColor: props.tokens.border || "#dbe3f0",
  boxShadow: `0 10px 18px ${props.tokens.shadow || "rgba(0,0,0,0.35)"}`,
  ...layerStyle(props.tokens.panelMuted || "rgba(255,255,255,.06)", "rgba(255,255,255,.06)", props.tokens.dockImageOpacity),
}));

const topbarStyle = computed(() => ({
  color: props.tokens.text || "#0f172a",
  borderColor: props.tokens.border || "#dbe3f0",
  background: props.tokens.panelMuted || "rgba(255,255,255,.08)",
}));

const chipStyle = computed(() => ({
  color: props.tokens.text || "#0f172a",
  borderColor: props.tokens.border || "#dbe3f0",
  background: props.tokens.panelMuted || "rgba(255,255,255,.08)",
}));

const mutedStyle = computed(() => ({
  color: props.tokens.textMuted || "#94a3b8",
}));
</script>
