<template>
    <div class="dpti-container">
        <main class="dpti-main-content">
            <div class="all-types-container animate-fade-in">
                <div class="header-row">
                    <button class="back-btn" @click="goBack">
                        <i class="fas fa-arrow-left"></i> 뒤로
                    </button>
                    <h2>다이버 유형 도감</h2>
                </div>

                <div class="types-grid">
                    <div v-for="type in allTypes" :key="type.type_code" class="type-card"
                        @click="goToResult(type.type_code)">
                        <div class="card-inner">
                            <div class="badge-wrapper">
                                <span class="type-code">{{ type.type_code }}</span>
                            </div>

                            <div class="animal-icon">
                                <img :src="getAnimalImageUrl(type)" :alt="type.animal_kr" class="animal-type-img" />
                            </div>

                            <h3 class="animal-name">{{ type.animal_kr }}</h3>
                            <p class="tagline">"{{ type.tagline }}"</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import dptiData from '@/data/dpti.json';
import type { DptiResultDefinition } from '@/types/dpti';
import { RouterName } from '@/mappings/enum';

const router = useRouter();
const allTypes = dptiData.results_definition as DptiResultDefinition[];

const getAnimalImageUrl = (type: DptiResultDefinition) => {
    const code = type.type_code.toUpperCase();

    const imageNumber = 1;

    return new URL(`/src/assets/icons/DPTI_${code}_${imageNumber}.png`, import.meta.url).href;
};

const goBack = () => {
    if (window.history.length > 2) {
        router.back();
    } else {
        router.push({ name: RouterName.Dpti });
    }
};

const goToResult = (code: string) => {
    router.push({ name: RouterName.DptiResult, params: { code } });
};
</script>

<style lang="scss" scoped>
@import '@/assets/scss/pages/_dpti-all-type.scss';
</style>