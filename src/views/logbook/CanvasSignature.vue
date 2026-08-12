<template>
  <div
    ref="modalRef"
    class="canvas-signature-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="signature-modal-title"
    tabindex="-1"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="signature-modal-title">버디 서명 그리기 ✍️</h3>
        <CustomButton class="close-modal-btn" aria-label="서명 창 닫기" @click="emit('close')">&times;</CustomButton>
      </div>

      <div class="canvas-wrapper" ref="canvasWrapper">
        <canvas
          ref="canvasRef"
          role="img"
          aria-label="버디 서명 입력 캔버스"
          @pointerdown="startDrawing"
          @pointermove="draw"
          @pointerup="stopDrawing"
          @pointerleave="stopDrawing"
        ></canvas>
      </div>

      <div class="canvas-tools">
        <CustomButton class="clear-btn" @click="clearCanvas">
          <i class="fa-solid fa-eraser"></i> 지우기
        </CustomButton>
        <CustomButton class="save-sig-btn" @click="saveSignature">
          <i class="fa-solid fa-check"></i> 서명 저장
        </CustomButton>
      </div>
      <p v-if="errorMessage" class="signature-error" role="alert">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'save', dataUrl: string): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWrapper = ref<HTMLElement | null>(null);
const modalRef = ref<HTMLElement | null>(null);
const isDrawing = ref(false);
const hasDrawing = ref(false);
const errorMessage = ref('');
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
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
  hasDrawing.value = true;
  errorMessage.value = '';
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
  hasDrawing.value = false;
  errorMessage.value = '';
};

const getCroppedCanvas = (srcCanvas: HTMLCanvasElement): HTMLCanvasElement | null => {
  const context = srcCanvas.getContext('2d');
  if (!context) return null;

  const width = srcCanvas.width;
  const height = srcCanvas.height;

  const imgData = context.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1 || maxY === -1) {
    return null;
  }

  const padding = 10;
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropW = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
  const cropH = Math.min(height - cropY, maxY - minY + 1 + padding * 2);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;

  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) return null;

  croppedCtx.drawImage(
    srcCanvas,
    cropX, cropY, cropW, cropH,
    0, 0, cropW, cropH
  );

  return croppedCanvas;
};

const saveSignature = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  if (!hasDrawing.value) {
    errorMessage.value = '서명을 그린 뒤 저장해주세요.';
    return;
  }

  const croppedCanvas = getCroppedCanvas(canvas);
  if (!croppedCanvas) {
    errorMessage.value = '서명을 그린 뒤 저장해주세요.';
    return;
  }

  const dataUrl = croppedCanvas.toDataURL('image/png');
  emit('save', dataUrl);
};

onMounted(() => {
  const canvas = canvasRef.value;
  if (canvas) {
    ctx = canvas.getContext('2d');
    resizeCanvas();
    modalRef.value?.focus();
  }
});
</script>
