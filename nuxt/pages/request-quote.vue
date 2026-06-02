<script setup lang="ts">
useSeoMeta({
  title: "Request Quote",
  description: "Request a Kardoor steel door quote for export, dealer or project supply."
});
</script>

<template>
  <section class="content-page">
    <p class="eyebrow">Request quote</p>
    <h1>Send your door selection and project requirements.</h1>
    <form class="quote-form">
      <label>
        Company name
        <input name="company" type="text" placeholder="Your company" />
      </label>
      <label>
        Country
        <input name="country" type="text" placeholder="Destination country" />
      </label>
      <label>
        Order quantity
        <input name="quantity" type="text" placeholder="Example: 48 doors" />
      </label>
      <label>
        Preferred series or model codes
        <input name="models" type="text" placeholder="K1001, Laminox, Composite..." />
      </label>
      <label>
        Message
        <textarea name="message" rows="5" placeholder="Project notes, dimensions, packaging requirements" />
      </label>
      <button class="btn btn-primary" type="submit">Request Quote</button>
    </form>
  </section>
</template>
