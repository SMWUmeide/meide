# AICard — CONTRACT

## 가져오는 위치
`import { AICard } from "@/components/AICard"`

## 속성과 허용 값
| prop | 값 | 기본 |
|---|---|---|
| kind | `"korean-analogy"` · `"estimated"` | — |
| title | 카드 제목 | kind별 기본값 |
| source | 출처 문구 (필수) | — |
| children | 내용 | — |

- 기본 제목: korean-analogy = "한국 음식으로 치면", estimated = "AI가 추정한 정보".
- 배경 `--color-surface` + AI 틴트(ai-gradient 7~10%), 테두리 1.5px `--gradient-ai`, `--rounded-lg`, 안쪽 `--space-xl`.
- 머리: AI 아이콘 30 (배경 `--gradient-ai`, 흰 반짝이) + 제목(title-md) + source(body-sm·secondary).
- 카드 안 섹션 라벨: body-sm, `--color-ai-text`.
- 하단 버튼 "직원에게 확인하는 문장 보기": 흰 배경 + 1px `--color-ai-text` 테두리 + label-md `--color-ai-text`.

## 사용 규칙
- AI가 만든 정보에만 쓴다. 메뉴판 원문에서 확인한 정보는 일반 Card + 블랙 체크 아이콘.
- source를 비우지 않는다.

## 확인 방법
- AICard 사용처에 source 누락 0건.

## 정상 예시
```tsx
<AICard kind="korean-analogy" source="AI가 한국 음식에 빗대어 설명했어요">
  보리를 넣은 걸쭉한 호박죽에 가까워요
</AICard>
```

## 반례
```tsx
<AICard kind="estimated">글루텐 (EU 1) — 메뉴판에 적혀 있어요</AICard>  // 확인된 정보를 AI 카드에, source 누락
```
