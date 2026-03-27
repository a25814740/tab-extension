<template>
  <div class="grid gap-6">
    <div class="grid gap-4 md:grid-cols-3">
      <div class="creator-card p-4">
        <div class="text-xs text-slate-500 dark:text-slate-400">作品數量</div>
        <div class="mt-2 text-2xl font-semibold">{{ creatorState.assets.length }}</div>
      </div>
      <div class="creator-card p-4">
        <div class="text-xs text-slate-500 dark:text-slate-400">最後更新</div>
        <div class="mt-2 text-lg font-semibold">{{ lastUpdatedLabel }}</div>
      </div>
      <div class="creator-card p-4">
        <div class="text-xs text-slate-500 dark:text-slate-400">狀態</div>
        <div class="mt-2 text-lg font-semibold">正常</div>
      </div>
    </div>

    <div class="creator-card p-6">
      <div class="text-sm font-semibold">快速操作</div>
      <div class="mt-4 flex flex-wrap gap-2">
        <RouterLink class="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white" to="/assets">
          前往作品列表
        </RouterLink>
        <RouterLink class="rounded-full border border-slate-200 px-4 py-2 text-xs dark:border-slate-700" to="/design">
          新增設計
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { creatorState, lastUpdatedLabel } from "../store/creatorStore";
</script>
