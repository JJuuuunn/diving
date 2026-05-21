// src/types/quiz.ts

export type QuestionType = 'single-choice' | 'multi-choice' | 'ox' | 'short-answer';

export interface BaseQuestion {
  id: number;
  setId: string; // 소속된 시험지 세트 ID
  category: string; // 물리, 생리, 장비 등 카테고리
  type: QuestionType;
  question: string;
  explanation: string; // 친절한 해설
}

// 1. 객관식 단일 선택 (예: 4지선다형)
export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'single-choice';
  options: string[];
  answer: number; // 선택지의 0-indexed 인덱스 값
}

// 2. 객관식 다중 선택 (복수 정답 선택)
export interface MultiChoiceQuestion extends BaseQuestion {
  type: 'multi-choice';
  options: string[];
  answer: number[]; // 복수 정답의 0-indexed 인덱스 배열
}

// 3. O/X 문제
export interface OXQuestion extends BaseQuestion {
  type: 'ox';
  answer: boolean; // true (O) 또는 false (X)
}

// 4. 주관식 단답형
export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  answer: string[]; // 정답으로 매칭할 수 있는 텍스트 키워드들 (공백 제거 후 대소문자 무시 매칭 가능)
}

// 전체 문제 유니온 타입
export type Question = 
  | SingleChoiceQuestion 
  | MultiChoiceQuestion 
  | OXQuestion 
  | ShortAnswerQuestion;

// 시험지 세트 정보
export interface QuizSet {
  id: string;
  title: string;
  description: string;
  totalQuestions: number; // 풀게 될 총 문제 수
  timeLimit?: number; // 제한시간 (초 단위, 옵션)
}

// 사용자 답변 상태 기록
export interface UserAnswer {
  questionId: number;
  answer: number | number[] | boolean | string; // 입력한 답안
  isCorrect: boolean; // 정답 여부
}

// 풀이 히스토리 기록
export interface QuizHistory {
  id: string; // 고유 기록 ID
  setId: string;
  title: string;
  score: number; // 획득 점수
  totalQuestions: number;
  correctCount: number;
  solvedAt: string; // 풀이 시각 ISO
  answers: UserAnswer[];
}
