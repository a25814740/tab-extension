<template>
  <div class="min-h-screen min-w-[1280px] bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <div class="flex min-h-screen">
      <aside class="flex w-72 flex-col border-r border-slate-200 bg-white/95 px-5 py-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div>
          <div class="text-[11px] uppercase tracking-[0.32em] text-slate-400">Creator Console</div>
          <div class="mt-2 text-2xl font-semibold">Taboard</div>
          <div class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            管理你的主題、檢查上架狀態，之後收益與分潤也會從這裡進來。
          </div>
        </div>

        <nav class="mt-8 grid gap-2 text-sm">
          <RouterLink class="nav-link" to="/">
            <span>總覽</span>
            <span class="text-[11px] text-slate-400">Dashboard</span>
          </RouterLink>
          <RouterLink class="nav-link" to="/assets">
            <span>作品列表</span>
            <span class="text-[11px] text-slate-400">Themes</span>
          </RouterLink>
          <RouterLink class="nav-link" to="/revenue">
            <span>收益中心</span>
            <span class="text-[11px] text-slate-400">Revenue</span>
          </RouterLink>
        </nav>

        <div class="mt-8 rounded-3xl border border-slate-200/70 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div class="text-[11px] uppercase tracking-[0.24em] text-slate-400">產品狀態</div>
          <div class="mt-3 grid gap-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400">已上架</span>
              <span class="font-semibold">{{ creatorHealthSummary.publishedCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400">草稿</span>
              <span class="font-semibold">{{ creatorHealthSummary.draftCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400">收益模式</span>
              <span class="font-semibold">{{ creatorHealthSummary.analyticsMode === 'live' ? '即時' : '估算' }}</span>
            </div>
          </div>
        </div>

        <div class="mt-auto rounded-3xl border border-slate-200/70 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div class="text-sm font-semibold">接下來要補的</div>
          <ul class="mt-3 grid gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            <li>1. 主題商城前台購買流程</li>
            <li>2. 真實收益聚合與人工撥款清單</li>
            <li>3. 安裝量、轉換率與客服追蹤</li>
          </ul>
        </div>
      </aside>

      <div class="flex min-h-screen min-w-0 flex-1 flex-col">
        <header class="flex items-center justify-between border-b border-slate-200 bg-white/95 px-8 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div>
            <div class="text-[11px] uppercase tracking-[0.28em] text-slate-400">{{ pageEyebrow }}</div>
            <div class="mt-1 text-2xl font-semibold">{{ pageTitle }}</div>
          </div>

          <div class="flex items-center gap-3">
            <button
              class="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              @click="toggleTheme"
            >
              {{ themeLabel }}
            </button>

            <div class="relative">
              <button
                class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                @click="menuOpen = !menuOpen"
              >
                <img v-if="avatarUrl" :src="avatarUrl" class="h-full w-full object-cover" />
                <span v-else class="text-xs font-semibold">{{ profileInitials }}</span>
              </button>

              <div
                v-if="menuOpen"
                class="absolute right-0 mt-3 w-72 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <img v-if="avatarUrl" :src="avatarUrl" class="h-full w-full object-cover" />
                    <span v-else class="text-sm font-semibold">{{ profileInitials }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-semibold">{{ profileName }}</div>
                    <div class="truncate text-xs text-slate-500 dark:text-slate-400">{{ profileEmail || '尚未登入' }}</div>
                  </div>
                </div>

                <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                  Creator 後台目前以主題上架為主。分潤與撥款會建立在現有收益中心之上。
                </div>

                <button
                  class="mt-4 w-full rounded-2xl border border-slate-200 px-3 py-2 text-left text-xs font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  @click="logout"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </header>

        <main class="flex-1 p-8">
          <div
            v-if="creatorState.statusMessage"
            class="mb-6 rounded-2xl border px-4 py-3 text-sm"
            :class="statusBannerClass"
          >
            {{ creatorState.statusMessage }}
          </div>
          <RouterView />
        </main>
      </div>
    </div>

    <div v-if="gateVisible" class="auth-gate">
      <div class="auth-card">
        <div class="text-sm font-semibold text-white">登入後才可使用 Creator 後台</div>
        <div class="text-xs text-slate-400">請先登入，才能管理作品、儲存主題與查看收益資料。</div>
        <div v-if="showConfigHint" class="text-xs text-rose-300">
          開發環境尚未提供 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY。
        </div>
        <div v-else-if="gateMessage" class="text-xs text-rose-300">{{ gateMessage }}</div>
        <button class="btn btn-primary" @click="loginWithGoogle">使用 Google 登入</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import {
  avatarUrl,
  creatorHealthSummary,
  creatorState,
  loginWithGoogle,
  logout,
  profileEmail,
  profileName,
  toggleTheme,
} from "../store/creatorStore";

const route = useRoute();
const menuOpen = ref(false);
const isDev = import.meta.env.DEV;

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  }
);

const gateVisible = computed(() => creatorState.ready && !creatorState.session);
const showConfigHint = computed(() => isDev && creatorState.configMissing);
const gateMessage = computed(() => {
  if (creatorState.statusMessage) return creatorState.statusMessage;
  if (!isDev && creatorState.configMissing) {
    return "登入服務目前尚未完成設定，請聯絡管理者處理。";
  }
  return "";
});
const themeLabel = computed(() => (creatorState.theme === "dark" ? "切到淺色" : "切到深色"));
const profileInitials = computed(() => {
  const source = profileName.value || profileEmail.value || "TB";
  return source.slice(0, 2).toUpperCase();
});
const pageTitle = computed(() => String(route.meta.title || "Creator Console"));
const pageEyebrow = computed(() => (route.name === "dashboard" ? "Overview" : route.name === "assets" ? "Themes" : route.name === "revenue" ? "Revenue" : "Editor"));
const statusBannerClass = computed(() => {
  if (creatorState.statusTone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300";
  }
  if (creatorState.statusTone === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300";
  }
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";
});
</script>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 20px;
  padding: 14px 16px;
  background: rgba(148, 163, 184, 0.08);
  color: inherit;
  transition: transform 0.18s ease, background-color 0.18s ease;
}

.nav-link:hover {
  transform: translateX(2px);
}

.nav-link.router-link-active {
  background: rgba(244, 63, 94, 0.12);
  color: #f43f5e;
  font-weight: 600;
}
</style>
