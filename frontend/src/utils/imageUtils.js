import { API_BASE_URL } from '../config';

export const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseURLWithoutApi = API_BASE_URL.split('/api')[0];
    return `${baseURLWithoutApi}${imagePath}`;
}; 