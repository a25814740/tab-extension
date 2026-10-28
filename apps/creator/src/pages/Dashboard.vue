<template>
  <div class="grid gap-6">
    <section class="grid gap-4 xl:grid-cols-4">
      <div class="creator-card p-5" v-for="card in summaryCards" :key="card.label">
        <div class="text-xs text-slate-500 dark:text-slate-400">{{ card.label }}</div>
        <div class="mt-3 text-2xl font-semibold">{{ card.value }}</div>
        <div class="mt-2 text-xs text-slate-400">{{ card.helper }}</div>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
      <div class="creator-card p-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-semibold">最近作品</div>
            <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">先把上架品質顧好，再去談放量，這樣比較不會被自己追著跑。</div>
          </div>
          <RouterLink class="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white" to="/assets">
            管理作品
          </RouterLink>
        </div>

        <div v-if="recentAssets.length === 0" class="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          還沒有任何作品。先新增第一個主題，後台資料線才會完整跑起來。
        </div>

        <div v-else class="mt-6 grid gap-3">
          <RouterLink
            v-for="asset in recentAssets"
            :key="asset.id"
            :to="`/design/${asset.id}`"
            class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-900"
          >
            <div class="preview-thumb w-28 shrink-0" :style="previewStyle(asset.preview || creatorState.fallbackPreview)"></div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <div class="truncate text-sm font-semibold">{{ asset.name }}</div>
                <span class="rounded-full px-2 py-1 text-[11px]" :class="asset.is_public ? publishedBadgeClass : draftBadgeClass">
                  {{ getAssetStatusLabel(asset) }}
                </span>
              </div>
              <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">{{ asset.description || '尚未填寫作品描述。' }}</div>
              <div class="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-400">
                <span>價格 {{ formatCurrencyTwd(asset.price_twd) }}</span>
                <span>分潤 {{ asset.revenue_share_percent }}%</span>
                <span>更新於 {{ formatDate(asset.updated_at) }}</span>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>

      <div class="grid gap-6">
        <div class="creator-card p-6">
          <div class="text-lg font-semibold">上架檢查</div>
          <div class="mt-4 grid gap-3 text-sm">
            <div v-for="item in checklist" :key="item.label" class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
              <div class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold" :class="item.done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'">
                {{ item.done ? 'OK' : '待' }}
              </div>
              <div>
                <div class="font-medium">{{ item.label }}</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ item.helper }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="creator-card p-6">
          <div class="text-lg font-semibold">快速操作</div>
          <div class="mt-4 grid gap-3">
            <RouterLink class="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white" to="/design">
              新增主題設計
            </RouterLink>
            <RouterLink class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-700" to="/revenue">
              查看收益中心
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import {
  creatorState,
  formatCurrencyTwd,
  formatDate,
  getAssetStatusLabel,
  previewStyle,
  recentAssets,
} from "../store/creatorStore";

const summaryCards = computed(() => [
  {
    label: "作品總數",
    value: String(creatorState.assets.length),
    helper: creatorState.assets.length > 0 ? `最近更新：${formatDate(creatorState.assets[0]?.updated_at)}` : "先建立第一個主題。",
  },
  {
    label: "已公開上架",
    value: String(creatorState.analytics.publishedCount || creatorState.assets.filter((asset) => asset.is_public).length),
    helper: "草稿不會出現在商店前台。",
  },
  {
    label: "草稿數量",
    value: String(creatorState.analytics.draftCount || creatorState.assets.filter((asset) => !asset.is_public).length),
    helper: "建議草稿先把描述與預覽補齊。",
  },
  {
    label: creatorState.analytics.mode === 'live' ? "累積可分潤" : "收益模式",
    value: creatorState.analytics.mode === 'live' ? formatCurrencyTwd(creatorState.analytics.creatorRevenueTwd) : '估算中',
    helper: creatorState.analytics.note,
  },
]);

const checklist = computed(() => [
  {
    label: "至少一個公開作品",
    done: creatorState.assets.some((asset) => asset.is_public),
    helper: "沒有公開作品，就還談不上正式販售。",
  },
  {
    label: "預覽圖已準備",
    done: creatorState.assets.every((asset) => Boolean(asset.preview)),
    helper: "預覽圖是轉換率最容易漏掉的一塊。",
  },
  {
    label: "作品描述已填寫",
    done: creatorState.assets.every((asset) => Boolean(asset.description?.trim())),
    helper: "描述要清楚告訴使用者它改了哪些區塊。",
  },
  {
    label: "收益聚合可用",
    done: creatorState.analytics.mode === 'live',
    helper: creatorState.analytics.mode === 'live' ? '目前已接到 server-side analytics。' : '部署 creator_dashboard 後就能看到真實收益。',
  },
]);

const publishedBadgeClass = "bg-emerald-500/15 text-emerald-400";
const draftBadgeClass = "bg-amber-500/15 text-amber-400";
</script>
