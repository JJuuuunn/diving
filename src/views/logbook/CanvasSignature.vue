<template>
  <div class="canvas-signature-modal" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>버디 서명 그리기 ✍️</h3>
        <button class="close-modal-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="canvas-wrapper" ref="canvasWrapper">
        <canvas 
          ref="canvasRef"
          @pointerdown="startDrawing"
          @pointermove="draw"
          @pointerup="stopDrawing"
          @pointerleave="stopDrawing"
        ></canvas>
      </div>

      <div class="canvas-tools">
        <button class="clear-btn" @click="clearCanvas">
          <i class="fa-solid fa-eraser"></i> 지우기
        </button>
        <button class="save-sig-btn" @click="saveSignature">
          <i class="fa-solid fa-check"></i> 서명 저장
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['close', 'save']);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWrapper = ref<HTMLElement | null>(null);
const isDrawing = ref(false);
let ctx: CanvasRenderingContext2D | null = null;

// 캔버스의 실제 해상도와 디바이스 픽셀 비율 조정 (레티나 고해상도 지원)
const resizeCanvas = () => {
  const canvas = canvasRef.value;
  const wrapper = canvasWrapper.value;
  if (!canvas || !wrapper || !ctx) return;

  const rect = wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // 화면 노출 크기 지정
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  // 실제 캔버스 드로잉 버퍼 크기 지정 (DPR 보정)
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // 배율 조정 및 선 스타일 복원
  ctx.scale(dpr, dpr);
  setupBrush();
};

const setupBrush = () => {
  if (!ctx) return;
  ctx.strokeStyle = '#0f172a'; // 다크 잉크 블루
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};

const startDrawing = (e: PointerEvent) => {
  const canvas = canvasRef.value;
  if (!canvas || !ctx) return;

  isDrawing.value = true;
  canvas.setPointerCapture(e.pointerId);

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.beginPath();
  ctx.moveTo(x, y);
};

const draw = (e: PointerEvent) => {
  if (!isDrawing.value || !canvasRef.value || !ctx) return;

  const rect = canvasRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.lineTo(x, y);
  ctx.stroke();
};

const stopDrawing = (e: PointerEvent) => {
  if (!isDrawing.value || !canvasRef.value) return;
  isDrawing.value = false;
  try {
    canvasRef.value.releasePointerCapture(e.pointerId);
  } catch (err) {
    // 일부 구형 브라우저 예외 처리
  }
};

const clearCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas || !ctx) return;
  
  // 캔버스 크기에 상관없이 깨끗하게 비움
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const saveSignature = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  // 아무것도 그리지 않았을 경우 예외처리
  const dataUrl = canvas.toDataURL('image/png');
  emit('save', dataUrl);
};

onMounted(() => {
  const canvas = canvasRef.value;
  if (canvas) {
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
});
</script>
