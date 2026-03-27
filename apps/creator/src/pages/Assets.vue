<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <div class="text-lg font-semibold">作品列表</div>
      <RouterLink class="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white" to="/design">
        新增設計
      </RouterLink>
    </div>

    <div v-if="creatorState.assets.length === 0" class="creator-card p-8 text-center text-sm text-slate-500 dark:text-slate-400">
      尚無作品，點擊「新增設計」開始。
    </div>

    <div v-else class="grid gap-3">
      <button
        v-for="asset in creatorState.assets"
        :key="asset.id"
        class="creator-card flex items-center gap-3 p-4 text-left"
        @click="edit(asset)"
      >
        <div class="preview-thumb w-32" :style="previewStyle(asset.preview || creatorState.fallbackPreview)"></div>
        <div class="flex-1">
          <div class="text-sm font-semibold">{{ asset.name }}</div>
          <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">更新：{{ formatDate(asset.updated_at) }}</div>
        </div>
        <div class="rounded-full border border-slate-200 px-3 py-1 text-xs dark:border-slate-700">編輯</div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { creatorState, formatDate, previewStyle, selectAsset } from "../store/creatorStore";

const router = useRouter();

const edit = (asset: any) => {
  selectAsset(asset);
  router.push(`/design/${asset.id}`);
};
</script>
