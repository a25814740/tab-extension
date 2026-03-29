<template>
  <div class="grid gap-3">
    <div class="flex items-center gap-3 text-xs text-slate-200">
      <span class="w-12 text-slate-400">角度</span>
      <input
        v-model.number="state.angle"
        type="range"
        min="0"
        max="360"
        class="h-2 w-full accent-rose-400"
        @input="emitUpdate"
      />
      <span class="w-12 text-right text-slate-300">{{ state.angle }}°</span>
    </div>

    <div
      ref="barRef"
      class="relative h-10 rounded-full border border-slate-700/70"
      :style="{ background: gradientCss }"
      @click="onBarClick"
    >
      <button
        v-for="stop in state.stops"
        :key="stop.id"
        class="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-white/70 shadow"
        :style="{ left: `${stop.position}%`, background: stop.color }"
        type="button"
        @mousedown.prevent="startDrag(stop.id, $event)"
      ></button>
    </div>

    <div class="grid gap-2">
      <div v-for="stop in state.stops" :key="stop.id" class="flex items-center gap-2 text-xs text-slate-200">
        <input type="color" v-model="stop.color" class="h-8 w-10 rounded border border-slate-700 bg-transparent" @input="emitUpdate" />
        <input
          v-model.number="stop.position"
          type="range"
          min="0"
          max="100"
          class="h-2 w-full accent-rose-400"
          @input="emitUpdate"
        />
        <span class="w-10 text-right text-slate-400">{{ Math.round(stop.position) }}%</span>
        <button
          v-if="state.stops.length > 2"
          type="button"
          class="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300"
          @click="removeStop(stop.id)"
        >
          刪除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";

type GradientStop = { id: string; color: string; position: number };
export type GradientConfig = {
  angle: number;
  stops: GradientStop[];
};

const props = defineProps<{
  modelValue: GradientConfig;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", payload: GradientConfig): void;
}>();

const cloneConfig = (config: GradientConfig): GradientConfig => ({
  angle: config.angle,
  stops: config.stops.map((stop) => ({ ...stop })),
});

const state = reactive<GradientConfig>(cloneConfig(props.modelValue));

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(state, cloneConfig(value));
  },
  { deep: true }
);

const emitUpdate = () => {
  emit("update:modelValue", cloneConfig(state));
};

const gradientCss = computed(() => {
  const stops = [...state.stops].sort((a, b) => a.position - b.position);
  const parts = stops.map((stop) => `${stop.color} ${Math.round(stop.position)}%`);
  return `linear-gradient(${state.angle}deg, ${parts.join(", ")})`;
});

const barRef = ref<HTMLElement | null>(null);

const onBarClick = (event: MouseEvent) => {
  const target = barRef.value ?? (event.currentTarget as HTMLElement);
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const percent = ((event.clientX - rect.left) / rect.width) * 100;
  state.stops.push({
    id: `stop_${Date.now()}_${Math.round(percent)}`,
    color: "#f43f5e",
    position: Math.min(100, Math.max(0, percent)),
  });
  emitUpdate();
};

let draggingId: string | null = null;

const onDragMove = (event: MouseEvent) => {
  if (!draggingId) return;
  const bar = barRef.value;
  if (!bar) return;
  const rect = bar.getBoundingClientRect();
  const percent = ((event.clientX - rect.left) / rect.width) * 100;
  const stop = state.stops.find((item) => item.id === draggingId);
  if (!stop) return;
  stop.position = Math.min(100, Math.max(0, percent));
  emitUpdate();
};

const onDragEnd = () => {
  draggingId = null;
  window.removeEventListener("mousemove", onDragMove);
  window.removeEventListener("mouseup", onDragEnd);
};

const startDrag = (id: string, event: MouseEvent) => {
  draggingId = id;
  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup", onDragEnd);
};

const removeStop = (id: string) => {
  if (state.stops.length <= 2) return;
  state.stops = state.stops.filter((item) => item.id !== id);
  emitUpdate();
};

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onDragMove);
  window.removeEventListener("mouseup", onDragEnd);
});
</script>
