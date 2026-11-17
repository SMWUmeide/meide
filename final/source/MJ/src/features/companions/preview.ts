import type { CompanionDisplay } from './CompanionLists';

// Figma's fictional sample profiles. Used only by the explicit connected preview;
// these IDs must never be registered, synced, or saved as real friends.
export const companionPreview: CompanionDisplay[] = [
  { id: 'preview-miyoung', name: '김미영', foodSummary: '새우 알레르기 · 토마토 못 먹어요', photo: require('../../../assets/companions/apple.jpg') },
  { id: 'preview-jungsook', name: '박정숙', foodSummary: '갑각류 알레르기 · 고수 못 먹어요', photo: require('../../../assets/companions/orange.jpg') },
  { id: 'preview-youngsoo', name: '김영수', foodSummary: '견과류 알레르기 · 양고기 못 먹어요', photo: require('../../../assets/companions/lemon.jpg') },
];
