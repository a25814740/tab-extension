<template>
  <div class="grid gap-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <div class="text-lg font-semibold">作品列表</div>
        <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          這裡管理你的主題草稿、上架狀態、價格與分潤比例。
        </div>
      </div>
      <button class="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white" @click="createTheme">
        新增設計
      </button>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="creator-card p-4">
        <div class="text-xs text-slate-500 dark:text-slate-400">作品總數</div>
        <div class="mt-2 text-2xl font-semibold">{{ creatorState.assets.length }}</div>
      </div>
      <div class="creator-card p-4">
        <div class="text-xs text-slate-500 dark:text-slate-400">公開作品</div>
        <div class="mt-2 text-2xl font-semibold">{{ publishedAssets.length }}</div>
      </div>
      <div class="creator-card p-4">
        <div class="text-xs text-slate-500 dark:text-slate-400">草稿</div>
        <div class="mt-2 text-2xl font-semibold">{{ draftAssets.length }}</div>
      </div>
    </div>

    <div v-if="creatorState.assets.length === 0" class="creator-card p-10 text-center text-sm text-slate-500 dark:text-slate-400">
      目前還沒有作品。先新增一個主題，把「草稿 -> 預覽 -> 上架」流程跑通。
    </div>

    <div v-else class="grid gap-4">
      <article
        v-for="asset in creatorState.assets"
        :key="asset.id"
        class="creator-card grid gap-4 p-5 xl:grid-cols-[220px_minmax(0,1fr)_230px]"
      >
        <div class="preview-thumb h-[140px] w-full" :style="previewStyle(asset.preview || creatorState.fallbackPreview)"></div>

        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="truncate text-lg font-semibold">{{ asset.name }}</h2>
            <span class="rounded-full px-2 py-1 text-[11px]" :class="badgeClass(asset)">{{ getAssetStatusLabel(asset) }}</span>
          </div>
          <div class="mt-2 text-sm text-slate-500 dark:text-slate-400">{{ asset.description || '尚未填寫作品描述。' }}</div>

          <div class="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>價格 {{ formatCurrencyTwd(asset.price_twd) }}</span>
            <span>分潤 {{ asset.revenue_share_percent }}%</span>
            <span>更新於 {{ formatDate(asset.updated_at) }}</span>
            <span>Slug: {{ asset.slug }}</span>
          </div>

          <div v-if="asset.tags?.length" class="mt-4 flex flex-wrap gap-2">
            <span v-for="tag in asset.tags" :key="tag" class="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
              #{{ tag }}
            </span>
          </div>
        </div>

        <div class="grid content-start gap-3">
          <button class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900" @click="edit(asset)">
            編輯主題
          </button>
          <button class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-700" @click="preview(asset)">
            預覽畫面
          </button>
          <button
            class="rounded-2xl border px-4 py-3 text-sm font-medium"
            :class="asset.is_public ? 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-300' : 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-300'"
            @click="toggleVisibility(asset)"
          >
            {{ asset.is_public ? '下架改回草稿' : '公開上架' }}
          </button>
          <button class="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-600 dark:border-rose-900/60 dark:text-rose-300" @click="remove(asset)">
            刪除作品
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  type AssetRecord,
  createNewAsset,
  creatorState,
  deleteAsset,
  draftAssets,
  formatCurrencyTwd,
  formatDate,
  getAssetStatusLabel,
  previewStyle,
  publishedAssets,
  selectAsset,
  setAssetVisibility,
} from "../store/creatorStore";

const router = useRouter();

const badgeClass = (asset: AssetRecord) =>
  asset.is_public ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400";

const createTheme = () => {
  createNewAsset();
  void router.push("/design");
};

const edit = (asset: AssetRecord) => {
  selectAsset(asset);
  void router.push(`/design/${asset.id}`);
};

const preview = (asset: AssetRecord) => {
  selectAsset(asset);
  void router.push(`/preview/${asset.id}`);
};

const toggleVisibility = async (asset: AssetRecord) => {
  await setAssetVisibility(asset, !asset.is_public);
};

const remove = async (asset: AssetRecord) => {
  const confirmed = window.confirm(`確定要刪除「${asset.name}」嗎？這個動作不能還原。`);
  if (!confirmed) return;
  await deleteAsset(asset.id);
};
</script>
