<template>
  <div class="mobile-root">
    <main class="mobile-content">
      <slot name="default" />
    </main>
    <slot name="bottom-nav" />
  </div>
</template>

<style scoped>
.mobile-root {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 56px;
}
</style>
