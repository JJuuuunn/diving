import { reactive, ref } from 'vue';
import type { HudLayoutMap, PhotoHudPreset } from '@/types/logbook';

export const DEFAULT_HUD_LAYOUT: HudLayoutMap = {
  heroStat: { x: 5, y: 65, scale: 1 },
  subline: { x: 5, y: 84, scale: 1 },
  brandBadge: { x: 5, y: 5, scale: 1 },
  rightStats: { x: 47, y: 22, scale: 1 }
};

export const HUD_PRESETS: Array<{
  id: PhotoHudPreset;
  label: string;
  icon: string;
  layout: HudLayoutMap;
}> = [
  {
    id: 'sporty-right',
    label: '하단 스포티',
    icon: 'fa-bolt',
    layout: {
      heroStat: { x: 5, y: 65, scale: 1 },
      subline: { x: 5, y: 84, scale: 1 },
      brandBadge: { x: 5, y: 5, scale: 1 },
      rightStats: { x: 47, y: 22, scale: 1 }
    }
  },
  {
    id: 'left-minimal',
    label: '좌측 미니멀',
    icon: 'fa-bullseye',
    layout: {
      heroStat: { x: 5, y: 52, scale: 1 },
      subline: { x: 5, y: 72, scale: 1 },
      brandBadge: { x: 5, y: 5, scale: 1 },
      rightStats: { x: 5, y: 78, scale: 1 }
    }
  },
  {
    id: 'top-hero',
    label: '상단 히어로',
    icon: 'fa-crown',
    layout: {
      heroStat: { x: 5, y: 5, scale: 1 },
      subline: { x: 5, y: 22, scale: 1 },
      brandBadge: { x: 5, y: 88, scale: 1 },
      rightStats: { x: 47, y: 22, scale: 1 }
    }
  },
  {
    id: 'balanced',
    label: '균형 분할',
    icon: 'fa-scale-balanced',
    layout: {
      heroStat: { x: 5, y: 62, scale: 1 },
      subline: { x: 5, y: 82, scale: 1 },
      brandBadge: { x: 5, y: 5, scale: 1 },
      rightStats: { x: 47, y: 58, scale: 1 }
    }
  }
];

export interface UseHudDragOptions {
  initialLayout?: HudLayoutMap;
  onLayoutChange?: (layout: HudLayoutMap) => void;
  defaultDragMode?: boolean;
}

export function useHudDrag(options: UseHudDragOptions = {}) {
  const isDragMode = ref(options.defaultDragMode ?? false);
  const currentPresetId = ref<PhotoHudPreset>('sporty-right');
  const selectedWidgetKey = ref<keyof HudLayoutMap>('heroStat');
  const activeDragKey = ref<keyof HudLayoutMap | null>(null);
  const isResizing = ref(false);
  const dragOffset = ref({ x: 0, y: 0 });

  const hudLayout = reactive<HudLayoutMap>({
    heroStat: { ...(options.initialLayout?.heroStat || DEFAULT_HUD_LAYOUT.heroStat!) },
    subline: { ...(options.initialLayout?.subline || DEFAULT_HUD_LAYOUT.subline!) },
    brandBadge: { ...(options.initialLayout?.brandBadge || DEFAULT_HUD_LAYOUT.brandBadge!) },
    rightStats: { ...(options.initialLayout?.rightStats || DEFAULT_HUD_LAYOUT.rightStats!) }
  });

  const syncLayout = (newLayout?: HudLayoutMap) => {
    if (!newLayout) return;
    if (newLayout.heroStat) Object.assign(hudLayout.heroStat!, newLayout.heroStat);
    if (newLayout.subline) Object.assign(hudLayout.subline!, newLayout.subline);
    if (newLayout.brandBadge) Object.assign(hudLayout.brandBadge!, newLayout.brandBadge);
    if (newLayout.rightStats) Object.assign(hudLayout.rightStats!, newLayout.rightStats);
  };

  const emitLayoutChange = () => {
    if (options.onLayoutChange) {
      options.onLayoutChange(JSON.parse(JSON.stringify(hudLayout)));
    }
  };

  const setWidgetScale = (key: keyof HudLayoutMap, scale: number) => {
    const clamped = Math.min(Math.max(Number(scale.toFixed(2)), 0.5), 2.2);
    if (hudLayout[key]) {
      hudLayout[key]!.scale = clamped;
    } else {
      hudLayout[key] = { x: 0, y: 0, scale: clamped };
    }
    emitLayoutChange();
  };

  const adjustWidgetScale = (key: keyof HudLayoutMap, delta: number) => {
    const current = hudLayout[key]?.scale ?? 1.0;
    setWidgetScale(key, current + delta);
  };

  const selectWidget = (key: keyof HudLayoutMap) => {
    selectedWidgetKey.value = key;
  };

  const applyPreset = (presetId: PhotoHudPreset): string => {
    const preset = HUD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return '';
    currentPresetId.value = presetId;
    syncLayout(preset.layout);
    emitLayoutChange();
    return preset.label;
  };

  const resetLayout = (): string => {
    return applyPreset('sporty-right');
  };

  const toggleDragMode = () => {
    isDragMode.value = !isDragMode.value;
  };

  // Mouse Wheel Zoom for PC
  const handleWheelZoom = (key: keyof HudLayoutMap, event: WheelEvent) => {
    selectedWidgetKey.value = key;
    if (event.cancelable) {
      event.preventDefault();
    }
    const currentScale = hudLayout[key]?.scale ?? 1.0;
    const delta = event.deltaY < 0 ? 0.05 : -0.05;
    setWidgetScale(key, currentScale + delta);
  };

  // Direct On-Widget Drag (Moving Position) & Mobile Pinch-to-Zoom
  const startDrag = (key: keyof HudLayoutMap, event: PointerEvent | MouseEvent | TouchEvent) => {
    selectedWidgetKey.value = key;
    if (!isDragMode.value || isResizing.value) return;
    if (event.cancelable) {
      event.preventDefault();
    }
    activeDragKey.value = key;

    const isTouchEvent = 'touches' in event;
    const isMultiTouch = isTouchEvent && (event as TouchEvent).touches.length >= 2;

    // Mobile Pinch-to-Zoom Mode (Two fingers)
    if (isMultiTouch) {
      const touches = (event as TouchEvent).touches;
      const initialDist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      const initialScale = hudLayout[key]?.scale ?? 1.0;

      const handlePinchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length < 2) return;
        if (moveEvent.cancelable) {
          moveEvent.preventDefault();
        }
        const currentDist = Math.hypot(
          moveEvent.touches[0].clientX - moveEvent.touches[1].clientX,
          moveEvent.touches[0].clientY - moveEvent.touches[1].clientY
        );
        if (initialDist > 0) {
          const ratio = currentDist / initialDist;
          setWidgetScale(key, initialScale * ratio);
        }
      };

      const handlePinchEnd = () => {
        window.removeEventListener('touchmove', handlePinchMove);
        window.removeEventListener('touchend', handlePinchEnd);
        activeDragKey.value = null;
      };

      window.addEventListener('touchmove', handlePinchMove, { passive: false });
      window.addEventListener('touchend', handlePinchEnd, { passive: false });
      return;
    }

    const isPointer = 'pointerId' in event;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const currentTarget = event.currentTarget as HTMLElement | null;
    const targetParent = currentTarget?.parentElement;
    if (!targetParent) return;

    if (isPointer && currentTarget && typeof currentTarget.setPointerCapture === 'function') {
      try {
        currentTarget.setPointerCapture((event as PointerEvent).pointerId);
      } catch {
        // Fallback gracefully
      }
    }

    const rect = targetParent.getBoundingClientRect();
    const currentPos = hudLayout[key] || { x: 0, y: 0 };
    const currentPxX = (currentPos.x / 100) * rect.width;
    const currentPxY = (currentPos.y / 100) * rect.height;

    dragOffset.value = {
      x: clientX - (rect.left + currentPxX),
      y: clientY - (rect.top + currentPxY)
    };

    const handlePointerMove = (moveEvent: PointerEvent | MouseEvent | TouchEvent) => {
      if (!activeDragKey.value || isResizing.value) return;

      // Check if user added a second finger mid-drag
      if ('touches' in moveEvent && moveEvent.touches.length >= 2) {
        return;
      }

      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }

      const moveX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const parentRect = targetParent.getBoundingClientRect();
      if (!parentRect.width || !parentRect.height) return;

      const targetPxX = moveX - parentRect.left - dragOffset.value.x;
      const targetPxY = moveY - parentRect.top - dragOffset.value.y;

      let pctX = (targetPxX / parentRect.width) * 100;
      let pctY = (targetPxY / parentRect.height) * 100;

      // Safe bounds clamping (2% ~ 85% X, 2% ~ 88% Y)
      pctX = Math.min(Math.max(pctX, 2), 85);
      pctY = Math.min(Math.max(pctY, 2), 88);

      if (hudLayout[activeDragKey.value]) {
        hudLayout[activeDragKey.value]!.x = Math.round(pctX);
        hudLayout[activeDragKey.value]!.y = Math.round(pctY);
      }
    };

    const handlePointerUp = (upEvent: PointerEvent | MouseEvent | TouchEvent) => {
      if (isPointer && currentTarget && typeof currentTarget.releasePointerCapture === 'function') {
        try {
          currentTarget.releasePointerCapture((upEvent as PointerEvent).pointerId);
        } catch {
          // Fallback
        }
      }

      window.removeEventListener('pointermove', handlePointerMove as EventListener);
      window.removeEventListener('pointerup', handlePointerUp as EventListener);
      window.removeEventListener('mousemove', handlePointerMove as EventListener);
      window.removeEventListener('mouseup', handlePointerUp as EventListener);
      window.removeEventListener('touchmove', handlePointerMove as EventListener);
      window.removeEventListener('touchend', handlePointerUp as EventListener);

      activeDragKey.value = null;
      emitLayoutChange();
    };

    window.addEventListener('pointermove', handlePointerMove as EventListener, { passive: false });
    window.addEventListener('pointerup', handlePointerUp as EventListener, { passive: false });
    window.addEventListener('mousemove', handlePointerMove as EventListener, { passive: false });
    window.addEventListener('mouseup', handlePointerUp as EventListener, { passive: false });
    window.addEventListener('touchmove', handlePointerMove as EventListener, { passive: false });
    window.addEventListener('touchend', handlePointerUp as EventListener, { passive: false });
  };

  // Direct On-Widget Corner Handle Drag (Optional / Secondary Resizing)
  const startResize = (key: keyof HudLayoutMap, event: PointerEvent | MouseEvent | TouchEvent) => {
    event.stopPropagation();
    if (event.cancelable) {
      event.preventDefault();
    }
    selectedWidgetKey.value = key;
    if (!isDragMode.value) return;

    isResizing.value = true;
    const isPointer = 'pointerId' in event;
    const startX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const startY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const initialScale = hudLayout[key]?.scale ?? 1.0;

    const currentTarget = event.currentTarget as HTMLElement | null;
    if (isPointer && currentTarget && typeof currentTarget.setPointerCapture === 'function') {
      try {
        currentTarget.setPointerCapture((event as PointerEvent).pointerId);
      } catch {
        // Fallback
      }
    }

    const handlePointerMove = (moveEvent: PointerEvent | MouseEvent | TouchEvent) => {
      if (!isResizing.value) return;
      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }
      const moveX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      // Distance moved relative to initial touch
      const deltaX = moveX - startX;
      const deltaY = moveY - startY;
      const delta = (deltaX + deltaY) / 120;

      const newScale = Math.min(Math.max(Number((initialScale + delta).toFixed(2)), 0.5), 2.2);
      if (hudLayout[key]) {
        hudLayout[key]!.scale = newScale;
      }
    };

    const handlePointerUp = (upEvent: PointerEvent | MouseEvent | TouchEvent) => {
      isResizing.value = false;
      if (isPointer && currentTarget && typeof currentTarget.releasePointerCapture === 'function') {
        try {
          currentTarget.releasePointerCapture((upEvent as PointerEvent).pointerId);
        } catch {
          // Fallback
        }
      }

      window.removeEventListener('pointermove', handlePointerMove as EventListener);
      window.removeEventListener('pointerup', handlePointerUp as EventListener);
      window.removeEventListener('mousemove', handlePointerMove as EventListener);
      window.removeEventListener('mouseup', handlePointerUp as EventListener);
      window.removeEventListener('touchmove', handlePointerMove as EventListener);
      window.removeEventListener('touchend', handlePointerUp as EventListener);
      emitLayoutChange();
    };

    window.addEventListener('pointermove', handlePointerMove as EventListener, { passive: false });
    window.addEventListener('pointerup', handlePointerUp as EventListener, { passive: false });
    window.addEventListener('mousemove', handlePointerMove as EventListener, { passive: false });
    window.addEventListener('mouseup', handlePointerUp as EventListener, { passive: false });
    window.addEventListener('touchmove', handlePointerMove as EventListener, { passive: false });
    window.addEventListener('touchend', handlePointerUp as EventListener, { passive: false });
  };

  return {
    hudLayout,
    isDragMode,
    isResizing,
    currentPresetId,
    selectedWidgetKey,
    HUD_PRESETS,
    startDrag,
    startResize,
    handleWheelZoom,
    toggleDragMode,
    selectWidget,
    setWidgetScale,
    adjustWidgetScale,
    applyPreset,
    resetLayout,
    syncLayout
  };
}
