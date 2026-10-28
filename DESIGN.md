# Design System

## Theme

Taboard 官網採用白色主題，以白色與極淺灰紫留白，讓深色產品截圖自然成為視覺焦點。紫色、薄荷綠與珊瑚色只作為節奏與品牌記憶點，不搶走產品畫面。

## Color Palette

- Brand Violet: `#7057F5`
- Brand Violet Dark: `#563ED4`
- Mint: `#A8F0C6`
- Coral: `#FF8066`
- Ink: `#11182C`
- Muted Ink: `#586079`
- Canvas: `#FAFAFC`
- White: `#FFFFFF`
- Product Navy: `#07111F`
- Light Lavender Surface: `#F1EFFF`

## Typography

- Display / Latin: Nunito Sans, 700–900
- Chinese / UI: Noto Sans TC, system sans-serif
- Hero headings use a fluid scale with a maximum of 88px and letter spacing no tighter than `-0.035em`.
- Body copy is 17–20px with a maximum line length around 65ch.

## Layout

- Content width: 1180–1240px
- Hero uses centered copy and an oversized product screenshot with an asymmetric color field behind it.
- Feature sections alternate between copy and cropped regions of the real product screenshot.
- Section spacing is generous and varied; avoid repeated card grids.

## Components

- Buttons: pill-shaped, high-contrast, minimum 44px height, visible keyboard focus.
- Product frame: 12–16px radius，使用淺紫色實心偏移陰影，不讓深色截圖與背景黏在一起。
- Navigation: compact, sticky on larger pages, simplified on mobile.
- Brand shapes: solid CSS circles and rounded organic blocks; no illustrated SVG filler.

## Motion

- One coordinated hero entrance for copy, brand shapes, and screenshot.
- Hover movement is limited to 2–3px with an ease-out curve.
- Reduced-motion mode removes transform-based animation and smooth scrolling.
