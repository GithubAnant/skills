# Vue 3 SFC version

The original implementation as a self-contained Single File Component. Props let
you size it, recolor it, toggle the outline, and freeze the animation (useful for
tests or static screenshots).

The wordmark path is long, so keep it in `assets/comfy-path.txt` and import it, or
paste your own outlined path. Below, `COMFY_PATH` stands in for that string.

```vue
<template>
  <span role="status" :class="['inline-flex', colorClass]">
    <svg
      :width="Math.round(heightMap[size] * (879 / 284))"
      :height="heightMap[size]"
      viewBox="0 0 879 284"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask :id="maskId">
          <path :d="COMFY_PATH" fill="white" />
        </mask>
      </defs>
      <path
        v-if="bordered"
        :d="COMFY_PATH"
        stroke="currentColor"
        stroke-width="2"
        fill="none"
        opacity="0.4"
      />
      <g :mask="`url(#${maskId})`">
        <g :class="disableAnimation ? 'wave-group-static' : 'wave-group'">
          <path
            :class="disableAnimation ? undefined : 'wave-path'"
            d="M 0 50 Q 110 0 220 50 T 440 50 T 660 50 T 880 50 T 1100 50 T 1320 50 T 1540 50 T 1760 50 V 400 H 0 Z"
            fill="currentColor"
          />
        </g>
      </g>
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
// import COMFY_PATH from your own module, or inline the string from assets/comfy-path.txt
import { COMFY_PATH } from './comfyPath'

const {
  size = 'md',
  color = 'white',
  bordered = true,
  disableAnimation = false
} = defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'yellow' | 'blue' | 'white' | 'black'
  bordered?: boolean
  disableAnimation?: boolean
}>()

const maskId = `wordmark-mask-${useId()}`

const heightMap = { sm: 40, md: 64, lg: 80, xl: 120 } as const
const colorMap = {
  yellow: 'text-yellow-400',
  blue: 'text-blue-500',
  white: 'text-white',
  black: 'text-black'
} as const

const colorClass = computed(() => colorMap[color])
</script>

<style scoped>
.wave-group { animation: rise-up 4s ease-in-out infinite alternate; }
.wave-path  { animation: wave-move 1.2s linear infinite; }

@keyframes rise-up  { 0% { transform: translateY(280px); } 100% { transform: translateY(-80px); } }
@keyframes wave-move { 0% { transform: translateX(0); } 100% { transform: translateX(-880px); } }

.wave-group-static { transform: translateY(280px); }

@media (prefers-reduced-motion: reduce) {
  .wave-group, .wave-path { animation: none; }
  .wave-group { transform: translateY(-80px); }
}
</style>
```

Notes on the props:
- `size` maps to pixel heights; width is derived from the `879 / 284` aspect ratio so the wordmark never distorts.
- `color` drives `currentColor`; both the mask fill and the wave inherit it. In the original project these were Tailwind theme tokens — swap for whatever your design system uses.
- `bordered` draws the faint outline so the letters are legible before the fill rises.
- `disableAnimation` freezes the wave at the empty position (`translateY(280px)`), matching what `prefers-reduced-motion` users would get mid-cycle; flip the transform to `-80px` if you want the frozen state to be "full" instead.
