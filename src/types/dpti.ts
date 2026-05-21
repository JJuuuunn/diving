export type DptiCategory = 'Focus' | 'Purpose' | 'Style' | 'Social';

export interface DptiOption {
    text: string;
    value: string;
}

export interface DptiQuestion {
    category: DptiCategory;
    question: string;
    options: DptiOption[];
}

export interface DptiResultDefinition {
    type_code: string;
    tagline: string;
    animal_kr: string;
    title: string;
    description: string;
    best_match: string;
    worst_match: string;
}

export interface DptiAnswer {
    category: DptiCategory;
    value: string;
}

export interface DptiScores {
    Focus: number;
    Purpose: number;
    Style: number;
    Social: number;
}

export interface DptiHistoryItem {
    id: number;
    userName: string;
    result: DptiResultDefinition;
    scores: DptiScores;
    date: string;
}