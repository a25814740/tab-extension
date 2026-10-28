<template>
  <div class="grid gap-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <div class="text-lg font-semibold">????</div>
        <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          ?????????????????????????????????????
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="rounded-full border border-slate-200 px-4 py-2 text-xs dark:border-slate-700">
          {{ creatorState.analytics.mode === 'live' ? '????' : '????' }}
        </div>
        <div class="rounded-full border border-slate-200 px-4 py-2 text-xs dark:border-slate-700">
          {{ creatorState.payoutsLoading ? '?????' : `???? ${creatorState.payouts.length}` }}
        </div>
      </div>
    </div>

    <section class="grid gap-4 xl:grid-cols-4">
      <div class="creator-card p-5" v-for="card in revenueCards" :key="card.label">
        <div class="text-xs text-slate-500 dark:text-slate-400">{{ card.label }}</div>
        <div class="mt-3 text-2xl font-semibold">{{ card.value }}</div>
        <div class="mt-2 text-xs text-slate-400">{{ card.helper }}</div>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
      <div class="creator-card p-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-semibold">????</div>
            <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              ???????????????????????????? payment events?
            </div>
          </div>
          <div v-if="creatorState.analyticsLoading" class="text-xs text-slate-400">???...</div>
        </div>

        <div
          v-if="creatorState.analytics.recentOrders.length === 0"
          class="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
        >
          ??????????????
        </div>

        <div v-else class="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-400 dark:bg-slate-900/70">
              <tr>
                <th class="px-4 py-3">??</th>
                <th class="px-4 py-3">??</th>
                <th class="px-4 py-3">??</th>
                <th class="px-4 py-3">??</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="order in creatorState.analytics.recentOrders"
                :key="order.id"
                class="border-t border-slate-200 dark:border-slate-800"
              >
                <td class="px-4 py-3 font-medium">{{ order.assetName }}</td>
                <td class="px-4 py-3">{{ formatCurrencyTwd(order.amountTwd) }}</td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2 py-1 text-[11px]" :class="order.status === 'paid' || order.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'">
                    {{ order.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {{ formatDate(order.createdAt, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid gap-6">
        <div class="creator-card p-6">
          <div class="text-lg font-semibold">????</div>
          <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            {{ creatorState.analytics.note }}
          </div>
          <div class="mt-4 text-xs text-slate-400">
            ?????{{ creatorState.analytics.updatedAt ? formatDate(creatorState.analytics.updatedAt, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '????' }}
          </div>
        </div>

        <div class="creator-card p-6">
          <div class="text-lg font-semibold">?? SOP</div>
          <ul class="mt-4 grid gap-3 text-sm text-slate-500 dark:text-slate-400">
            <li>1. ?????????????????????????</li>
            <li>2. ???????????????????????????</li>
            <li>3. PAYUNi ????????????????????????????</li>
            <li>4. `creator_payout_ledger` ????????????? payout API ????</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="creator-card p-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="text-lg font-semibold">????</div>
          <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            ????????????????????????????????????
          </div>
        </div>
        <div class="text-xs text-slate-400">
          ???{{ creatorState.payouts.length > 0 ? 'creator_payout_ledger' : '??????' }}
        </div>
      </div>

      <div
        v-if="creatorState.payouts.length === 0"
        class="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
      >
        ???????????????????????????????
      </div>

      <div v-else class="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-400 dark:bg-slate-900/70">
            <tr>
              <th class="px-4 py-3">????</th>
              <th class="px-4 py-3">?????</th>
              <th class="px-4 py-3">????</th>
              <th class="px-4 py-3">????</th>
              <th class="px-4 py-3">??</th>
              <th class="px-4 py-3">??</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in creatorState.payouts"
              :key="entry.id"
              class="border-t border-slate-200 align-top dark:border-slate-800"
            >
              <td class="px-4 py-3">
                <div class="font-medium">{{ formatPeriod(entry.periodStart, entry.periodEnd) }}</div>
                <div class="mt-1 text-xs text-slate-400">
                  ??? {{ formatDate(entry.createdAt, { year: 'numeric', month: 'short', day: 'numeric' }) }}
                </div>
              </td>
              <td class="px-4 py-3">
                <div>{{ formatCurrencyTwd(entry.creatorShareTwd) }}</div>
                <div class="mt-1 text-xs text-slate-400">{{ entry.creatorSharePercent }}% / ?? {{ formatCurrencyTwd(entry.grossRevenueTwd) }}</div>
              </td>
              <td class="px-4 py-3">{{ formatCurrencyTwd(entry.platformFeeTwd) }}</td>
              <td class="px-4 py-3 font-medium">{{ formatCurrencyTwd(entry.payoutAmountTwd) }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-1 text-[11px]" :class="statusToneMap[entry.payoutStatus]">
                  {{ payoutStatusLabels[entry.payoutStatus] }}
                </span>
                <div class="mt-1 text-xs text-slate-400">
                  {{ entry.paidAt ? `??? ${formatDate(entry.paidAt, { year: 'numeric', month: 'short', day: 'numeric' })}` : `???${entry.payoutMethod}` }}
                </div>
              </td>
              <td class="px-4 py-3 text-slate-500 dark:text-slate-400">
                <div>{{ entry.notes || '?' }}</div>
                <div v-if="entry.payoutReference" class="mt-1 text-xs text-slate-400">????{{ entry.payoutReference }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { creatorState, formatCurrencyTwd, formatDate } from "../store/creatorStore";

const payoutStatusLabels = {
  pending: "???",
  approved: "???",
  paid: "???",
  reversed: "???",
  cancelled: "???",
} as const;

const statusToneMap = {
  pending: "bg-amber-500/15 text-amber-400",
  approved: "bg-sky-500/15 text-sky-400",
  paid: "bg-emerald-500/15 text-emerald-400",
  reversed: "bg-rose-500/15 text-rose-400",
  cancelled: "bg-slate-500/15 text-slate-400",
} as const;

const pendingPayoutCount = computed(() =>
  creatorState.payouts.filter((entry) => entry.payoutStatus === "pending" || entry.payoutStatus === "approved").length
);

const revenueCards = computed(() => [
  {
    label: "?????",
    value: formatCurrencyTwd(creatorState.analytics.grossRevenueTwd),
    helper: "????????????????",
  },
  {
    label: "??????",
    value: formatCurrencyTwd(creatorState.analytics.creatorRevenueTwd),
    helper: "?????? revenue_share_percent ???",
  },
  {
    label: "?????",
    value: String(creatorState.analytics.paidOrderCount),
    helper: "??? paid / completed ???",
  },
  {
    label: "?????",
    value: String(pendingPayoutCount.value),
    helper: creatorState.payouts.length > 0 ? "?? creator_payout_ledger ? pending / approved?" : "??????????????",
  },
]);

const formatPeriod = (start: string, end: string) => {
  const startText = formatDate(start, { year: "numeric", month: "short", day: "numeric" });
  const endText = formatDate(end, { year: "numeric", month: "short", day: "numeric" });
  return `${startText} ? ${endText}`;
};
</script>
