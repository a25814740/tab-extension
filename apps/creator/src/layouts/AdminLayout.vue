<template>
  <div class="min-h-screen min-w-[1280px] bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <div class="flex">
      <aside class="h-screen w-64 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div class="text-lg font-semibold">Taboard</div>
        <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">主題上架後台</div>
        <nav class="mt-6 grid gap-2 text-sm">
          <RouterLink class="nav-link" to="/">總覽</RouterLink>
          <RouterLink class="nav-link" to="/assets">作品列表</RouterLink>
          <RouterLink class="nav-link" to="/revenue">收益</RouterLink>
          <div class="mt-4 text-[11px] uppercase tracking-[0.2em] text-slate-400">其他</div>
          <div class="nav-link">審核中</div>
          <div class="nav-link">設定</div>
        </nav>
      </aside>

      <div class="flex min-h-screen flex-1 flex-col">
        <header class="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div class="text-lg font-semibold">後台總覽</div>
          <div class="flex items-center gap-3">
            <button class="rounded-full border border-slate-200 px-3 py-1 text-xs dark:border-slate-700" @click="toggleTheme">
              {{ themeLabel }}
            </button>
            <div class="relative">
              <button
                class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                @click="menuOpen = !menuOpen"
              >
                <img v-if="avatarUrl" :src="avatarUrl" class="h-full w-full object-cover" />
                <span v-else class="text-xs">帳</span>
              </button>
              <div
                v-if="menuOpen"
                class="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900"
              >
                <div class="flex items-center gap-2">
                  <img v-if="avatarUrl" :src="avatarUrl" class="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <div class="font-semibold">{{ profileName }}</div>
                    <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ profileEmail }}</div>
                  </div>
                </div>
                <div class="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <button class="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-[11px] dark:border-slate-700" @click="logout">
                    登出
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main class="flex-1 p-6">
          <RouterView />
        </main>
      </div>
    </div>

    <div v-if="gateVisible" class="auth-gate">
      <div class="auth-card">
        <div class="text-sm font-semibold text-white">登入後才可使用主題上架後台</div>
        <div class="mt-2 text-xs text-slate-400">請先登入以存取你的作品與設定。</div>
        <div v-if="creatorState.configMissing" class="text-xs text-rose-300">請先設定 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY</div>
        <button class="btn btn-primary" @click="loginWithGoogle">使用 Google 登入</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { creatorState, avatarUrl, profileEmail, profileName, loginWithGoogle, logout, toggleTheme } from "../store/creatorStore";

const menuOpen = ref(false);
const gateVisible = computed(() => creatorState.ready && !creatorState.session);
const themeLabel = computed(() => (creatorState.theme === "dark" ? "切換亮色" : "切換暗色"));
</script>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(148, 163, 184, 0.08);
  color: inherit;
}
.nav-link.router-link-active {
  background: rgba(244, 63, 94, 0.12);
  color: #f43f5e;
  font-weight: 600;
}
</style>
