<template>
  <ResultViewComponent :history-id="historyId" />
</template>
<script setup>
import ResultViewComponent from '@/components/ResultView.vue';
defineProps({ historyId: { type: String, required: true } });
</script>
