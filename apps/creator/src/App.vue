<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import { initCreator } from "./store/creatorStore";

onMounted(() => {
  void initCreator();
});
</script>
