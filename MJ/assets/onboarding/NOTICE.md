# Onboarding artwork

Original illustration-only PNG exports from the user's Figma design, downloaded
2026-11-16 without image edits. These are not screenshots of complete screens.

File: https://www.figma.com/design/EyR8e24IyNMuHpg5Z617dc
Page: `894:5240` — 앱 테스트용 화면, leftmost three onboarding frames.

| Asset | Screen | Illustration layer | Export pixels |
| --- | --- | --- | --- |
| menu-scan.png | 1014:1520 | 1014:1538 | 412 × 400 |
| shared-menu.png | 1014:1609 | 1014:1655 | 412 × 538 |
| nearby-restaurants.png | 1014:1760 | 1014:1801 | 412 × 400 |

All illustration frames are 412 × 400 at (0, 148) inside a 412 × 917 screen.
The second export includes overflowing arms: its render origin is 60.368805px
above the illustration frame. `content.ts` preserves that offset. The enclosing
screen clips horizontally, as in Figma; the illustration frame does not clip.
Titles, descriptions, page indicators, and buttons are rendered separately.
