import type { DptiScores } from '@/types/dpti';

export const DPTI_TRAIT_LABELS: Record<keyof DptiScores, { left: string, right: string }> = {
    Focus: { left: '팀워크', right: '마이웨이' },
    Purpose: { left: '인생샷', right: '힐링' },
    Style: { left: '계획파', right: '흐름파' },
    Social: { left: '뒷풀이', right: '휴식' }
} as const;
