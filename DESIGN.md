---
name: Spotter
description: An indoor climbing app for beginners that shows what your body did on the wall.
colors:
  lime: "#C2FF01"
  lime-soft: "#E9F3C2"
  lime-wash: "#E4FF9C"
  orange: "#FF6A1F"
  ink: "#111111"
  white: "#FFFFFF"
  grey-fill: "#F4F4F4"
  grey-line: "#EDEDED"
  grey-track: "#E2E2DE"
  grey-mid: "#666666"
  grey-dark: "#3A3C3A"
  ok: "#2E7D32"
  warn: "#E5484D"
typography:
  display:
    fontFamily: "Urbanist, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Urbanist, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.2
  title:
    fontFamily: "Urbanist, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1.25
  body:
    fontFamily: "Urbanist, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "Urbanist, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    lineHeight: 1.2
rounded:
  s: "4px"
  m: "6px"
  l: "10px"
  sheet: "12px"
spacing:
  gutter: "16px"
  gap: "10px"
components:
  button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    height: "52px"
    rounded: "{rounded.m}"
  button-secondary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    height: "52px"
    rounded: "{rounded.m}"
  tag-pixel:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "0px"
  album-card:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.m}"
    padding: "16px"
  dock:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    height: "64px"
---

# Design System: Spotter

## Overview

**Creative North Star: "The Gym Sticker Book"**

Every try you film gets stuck into a book you carry to the gym. Pages are white or washed in lime with a faint pixel grid; the things worth keeping (your hardest send, a gym, a highlight) are cut out and stuck on as flat colour blocks, a pixel-cut tag or a die-cut sticker edge. Type is big and heavy, set tight, the way a sticker book shouts its section names.

The playfulness lives in a few signatures, not everywhere: the lime wash and grid behind tab headers, one mascot sticker by the tab title, pixel-cut tags, the ink dock with its lime Add block. Content (your videos, the measured body) does the rest. Corners stay small or square; pop-ups come up from the bottom.

**Key Characteristics:**
- White and lime grounds, ink type, orange for what needs you.
- Heavy Urbanist (800–900) for titles and numbers.
- Pixel-cut tags and sticker edges instead of soft rounding.
- Bottom sheets only; an ink dock with a lime Add block at the right.

## Colors

One loud accent, one warm signal, everything else ink and greys.

### Primary
- **Highlighter Lime** (#C2FF01): primary buttons, the album card, active dock item, positive tags ("Hardest send", "Topped"). Washed (#E4FF9C, #E9F3C2) behind tab headers with a pixel grid.

### Secondary
- **Belay Orange** (#FF6A1F): only for what asks something of the user or a hot moment: "1 without a gym", HOT starburst, ✦ sparkles. Text on it is ink, never white.

### Neutral
- **Ink** (#111111): type, outlines, the dock, secondary buttons.
- **Paper** (#FFFFFF): screens and cards.
- **Chalk Greys** (#F4F4F4 fill, #EDEDED hairline, #E2E2DE track, #666666 secondary text, #3A3C3A dark text).

**The Orange Asks Rule.** Orange appears only where the user has something to do or something hot to look at; never as decoration on a calm card.

## Typography

**Display Font:** Urbanist (with Helvetica Neue, Arial, system-ui)

**Character:** One geometric sans at many weights; big and black-weight for titles and numbers, plain 400 for reading.

### Hierarchy
- **Display** (900, 40px, 1.1): tab titles ("Videos", "Gyms").
- **Headline** (800, 20px): section names ("Your album", "Pinned"), card titles like "All videos" (italic 900 on the album card).
- **Title** (800, 15px): card lines ("Try 2", gym names).
- **Body** (400, 14px, 1.35): descriptions and meta.
- **Label** (800, 12px): tags and chips.

## Layout

A 402pt phone screen with a 16px gutter. Sections stack: section heading, then a full-width card or a two-column grid (gap 8–10px). The dock floats 22px above the bottom; content scrolls under it.

## Elevation & Depth

Flat. Cards separate by fill (lime, light grey #F4F4F4, ink), never by outlines. Depth comes only from sticker drop-shadows (a white die-cut edge plus a soft 8px shadow) on mascot stickers and the dock. Cards carry no ambient shadow.

## Shapes

Small or square corners: 4px, 6px, 10px; 12px only on the top corners of bottom sheets. Tags and some buttons use a stepped pixel-cut corner instead of rounding. Starburst badges for hot items. Circles only for avatars and the play button.

**The Few Corners Rule.** Prefer a square or pixel-cut corner over a bigger radius; never above 10px on cards.

## Components

### Buttons
- **Shape:** 6px radius or pixel-cut, 52px tall (44px small).
- **Primary:** lime with ink text, 800 weight.
- **Secondary:** ink with white text.

### Tags
- **Style:** pixel-cut, label type; lime for good news, orange (ink text) for asks.

### Cards / Containers
- **Album card (calendar page):** light grey paper under a lime header strip (italic title, month and year); one top row with the video count set large like a date ("03"), what it counts, and an ink pixel-cut go square; one large and two small photos (orange "No gym" tag on a photo that needs one); a full-width "This week" strip (lime = climbed, ink = today). Flat: no outline, no faux page curl.
- **Video card (Pinned):** light grey fill, no outline, 4:3 photo flush on top, tag on the photo, route swatch + name, bold try number, day.

### Navigation
- **Dock:** an ink bar with the four tabs (white labels at 62% opacity, 11px; active item lime icon and label, no underline), and Add as its own lime block at the right end, in thumb reach, a bold + only.

### Bottom sheet
- Comes up from the bottom, top corners 12px, lime wash + grid header, ink starburst badge with a white die-cut edge; swipe down, tap outside or Escape to close.

## Do's and Don'ts

### Do:
- **Do** keep the Videos tab to the user's own videos, in the album / Pinned / Gyms structure.
- **Do** use bottom sheets for every pop-up.
- **Do** keep one mascot sticker per screen header.
- **Do** put ink text on lime and orange.
- **Do** press cards in on tap (scale .98, strong ease-out); on pointer devices, photos zoom or fan out slightly on hover.

### Don't:
- **Don't** use centered modal dialogs.
- **Don't** draw strokes or outlines around cards, photos or buttons; separate with fill colour.
- **Don't** round cards above 10px or use pill shapes for cards.
- **Don't** put white text on orange (fails contrast).
- **Don't** mix other people's videos into the Videos tab.
