<script setup lang="ts">
import { gsap } from "gsap";

useSeoMeta({
  title: "Request Quote",
  description: "Request a Kardoor steel door quote for export, dealer or project supply."
});

onMounted(() => {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.from(".archive-page__header", {
      opacity: 0,
      y: 24,
      duration: 0.72,
      ease: "expo.out",
      delay: 0.08
    });

    gsap.from(".archive-form__section", {
      opacity: 0,
      y: 16,
      duration: 0.56,
      ease: "expo.out",
      stagger: 0.1,
      delay: 0.32
    });
  });
});

type FormState = 'idle' | 'submitting' | 'success';

const state = ref<FormState>('idle');

const form = reactive({
  company: '',
  country: '',
  quantity: '',
  models: '',
  message: ''
});

async function handleSubmit() {
  if (state.value === 'submitting') return;
  state.value = 'submitting';

  // Replace with real endpoint
  await new Promise(resolve => setTimeout(resolve, 1200));

  state.value = 'success';
}
</script>

<template>
  <section class="archive-page">

    <header class="archive-page__header">
      <div>
        <p class="eyebrow">Request quote</p>
        <h1>Send your door selection and project requirements.</h1>
      </div>
      <div class="archive-page__meta">
        <strong>Response time</strong>
        Within 1–2 business days.<br>
        Export and project inquiries<br>prioritised.
      </div>
    </header>

    <form
      v-if="state !== 'success'"
      class="archive-form"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <div class="archive-form__section">
        <p class="archive-form__section-label">Buyer information</p>
        <div class="archive-form__grid">
          <div class="archive-form__field">
            <label for="company">
              Company name <span class="required-mark" aria-hidden="true">*</span>
            </label>
            <input
              id="company"
              v-model="form.company"
              name="company"
              type="text"
              placeholder="Your company or trading name"
              required
              autocomplete="organization"
            />
          </div>
          <div class="archive-form__field">
            <label for="country">
              Destination country <span class="required-mark" aria-hidden="true">*</span>
            </label>
            <input
              id="country"
              v-model="form.country"
              name="country"
              type="text"
              placeholder="e.g. Germany, UAE, Kazakhstan"
              required
              autocomplete="country-name"
            />
          </div>
        </div>
      </div>

      <div class="archive-form__section">
        <p class="archive-form__section-label">Order details</p>
        <div class="archive-form__grid">
          <div class="archive-form__field">
            <label for="quantity">
              Estimated quantity <span class="required-mark" aria-hidden="true">*</span>
            </label>
            <input
              id="quantity"
              v-model="form.quantity"
              name="quantity"
              type="text"
              inputmode="numeric"
              placeholder="e.g. 48 doors, 200 units"
              required
            />
          </div>
          <div class="archive-form__field">
            <label for="models">Preferred series or model codes</label>
            <input
              id="models"
              v-model="form.models"
              name="models"
              type="text"
              placeholder="K1001, Laminox, Composite…"
            />
          </div>
          <p class="archive-form__field--hint">
            Not sure which model? Browse the <NuxtLink to="/catalog">catalog</NuxtLink> and note the codes, or leave blank and describe your requirements below.
          </p>
          <div class="archive-form__field archive-form__field--full">
            <label for="message">
              Project notes <span class="required-mark" aria-hidden="true">*</span>
            </label>
            <textarea
              id="message"
              v-model="form.message"
              name="message"
              rows="5"
              placeholder="Dimensions, surface finish, lock type, packaging requirements, delivery schedule…"
              required
            />
          </div>
        </div>
      </div>

      <div class="archive-form__actions">
        <button
          type="submit"
          class="archive-form__submit"
          :disabled="state === 'submitting'"
        >
          <span
            v-if="state === 'submitting'"
            class="archive-form__submit-spinner"
            aria-hidden="true"
          />
          {{ state === 'submitting' ? 'Sending…' : 'Send request' }}
        </button>
        <p class="archive-form__note">
          Your inquiry goes directly to our export team.<br>
          No automated responses.
        </p>
      </div>
    </form>

    <div v-else class="archive-form__success" role="status" aria-live="polite">
      <div class="archive-form__success-mark" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 9l4.5 4.5L15 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2>Request received</h2>
      <p>Our export team will review your requirements and respond within 1–2 business days. Check your inbox — we reply from info@kardoorcelikkapi.com.tr.</p>
    </div>

  </section>
</template>
