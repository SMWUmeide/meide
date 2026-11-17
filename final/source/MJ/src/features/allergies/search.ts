import { allergens } from './catalog.ts';
const normalize = (text: string) => text.normalize('NFC').trim().toLocaleLowerCase().replace(/\s+/g, '');
export function searchAllergens(query: string) {
  const prefix = normalize(query);
  if (!prefix) return [];
  return allergens.filter(item => [item.name, item.english, ...item.aliases].some(name => normalize(name).startsWith(prefix)))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}
