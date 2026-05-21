import dayjs from 'dayjs';

/**
 * 숫자를 3자리마다 콤마(,)가 포함된 문자열로 변환합니다.
 */
export const formatNumber = (n: number | string | undefined | null): string => {
    if (n === undefined || n === null || n === '') return '';
    const num = typeof n === 'string' ? n.replace(/,/g, '') : n;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * 콤마가 포함된 문자열에서 숫자만 추출하여 Number 타입으로 반환합니다.
 */
export const getNumericPrice = (formattedPrice: string | number): number => {
    if (typeof formattedPrice === 'number') return formattedPrice;
    return Number(formattedPrice.replace(/[^0-9]/g, '')) || 0;
};

/**
 * 날짜 데이터를 지정된 형식의 문자열로 변환합니다 (Day.js 활용).
 */
export const formatDate = (date: string | Date | undefined | null, formatPattern: string = 'YYYY-MM-DD'): string => {
    if (!date) return '';
    return dayjs(date).format(formatPattern);
};