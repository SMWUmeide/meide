import { analyzeMenu } from './analyze-menu.js';
// Bundled into MJ's authenticated Cloud Run service. The original Supabase
// counter is retained, so both applications share the same Gemini daily cap.
export async function interpretMenu({ text }: { text: string }) {
  const response = await analyzeMenu(new Request('https://meide.internal/api/analyze-menu', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
  }));
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.message || '메뉴를 설명하지 못했어요.'), { status: response.status });
  return data;
}
