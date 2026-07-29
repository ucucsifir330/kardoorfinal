<script setup lang="ts">
import NavLab from "~/components/lab/NavLab.vue";
</script>

<template>
  <div class="navbar-source-lab">
    <Teleport to="body">
      <NavLab>
        <template #logo>
          <svg
            class="navbar-source-lab__mark"
            viewBox="0 0 657 768"
            aria-hidden="true"
          >
            <rect x="6" y="7" width="188" height="753" rx="60" />
            <path
              d="M323 7h257.1a40 40 0 0 1 28.4 68.1L351.4 334.9a40 40 0 0 1-68.4-28.2V47a40 40 0 0 1 40-40Z"
            />
            <path
              d="m351.1 401.3 291.6 288.3a40 40 0 0 1-28.1 68.4H323a40 40 0 0 1-40-40V429.8a40 40 0 0 1 68.1-28.5Z"
            />
          </svg>
        </template>
      </NavLab>
    </Teleport>

    <main class="navbar-source-lab__stage">
      <h1>
        El işçiliği
        <br>
        kapılar
        <br>
        mimari
      </h1>
    </main>
  </div>
</template>

<style scoped>
:global(body:has(.navbar-source-lab) .site-header),
:global(body:has(.navbar-source-lab) .brand-blend-layer) {
  display: none;
}

.navbar-source-lab__stage {
  min-height: 220vh;
  padding: 48vh 7vw 20vh;
  background: var(--ambience-bg);
  color: var(--ambience-text);
}

.navbar-source-lab__stage h1 {
  width: min-content;
  margin: 0 auto;
  font-family: var(--font-display);
  font-size: clamp(62px, 8vw, 132px);
  font-weight: 500;
  line-height: 0.82;
}

.navbar-source-lab__mark {
  width: 55%;
  height: 55%;
  fill: currentColor;
  color: var(--ink);
}
</style>
