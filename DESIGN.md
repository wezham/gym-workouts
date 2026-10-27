# IRON / Training Club

A gym floor visual language: charcoal surfaces, chalk-white type, acid-lime highlights, compact technical labels, oversized headlines and a locally drawn weight plate. Quiet navigation and dense but expandable exercise rows keep the workout usable between sets. No stock-photo network requests, remote fonts or JavaScript framework runtime.

## Open source components

Real daisyUI CSS components are vendored locally in `vendor/daisyui.css`: button, checkbox, badge, progress, input and shared properties. Version pinned to npm `daisyui@5.5.19` (the upstream CSS banner reports 5.5.18). The MIT license is retained in `vendor/daisyui.LICENSE`. Custom `styles.css` supplies the IRON theme and responsive layout. This uses daisyUI component CSS directly, with no Tailwind utilities or browser compiler dependency.

- [daisyUI official component catalog](https://daisyui.com/components/) — buttons, badges, checkboxes, progress and inputs.
- [daisyUI official standalone CSS documentation](https://daisyui.com/docs/cdn/) — individually downloadable component CSS; only used parts included locally.
- Source: `https://cdn.jsdelivr.net/combine/npm/daisyui@5.5.19/base/properties.css,npm/daisyui@5.5.19/components/button.css,npm/daisyui@5.5.19/components/checkbox.css,npm/daisyui@5.5.19/components/badge.css,npm/daisyui@5.5.19/components/progress.css,npm/daisyui@5.5.19/components/input.css`

[Lucide](https://lucide.dev/guide/) was also evaluated for consistent open source SVG icons. The final interface needs only a few decorative arrows and a CSS weight illustration, so it does not ship an unused icon library.

## Tokens

| Token | Value | Purpose |
| --- | --- | --- |
| Background | `#171918` | Gym charcoal |
| Panel | `#202321` | Session surface |
| Text | `#f1f2ea` | Chalk |
| Muted | `#a6aea4` | Supporting instructions |
| Accent | `#cef563` | Active day, progress and key labels |
| Border | `#3a403a` | Section separation |
| Typography | Arial / Helvetica / sans-serif | Local, fast, legible |
| Corners | 3–8 px | Restrained equipment-like geometry |

## Interaction and accessibility

Desktop: roadmap on the left, current session on the right, guidance below. Mobile: horizontal week strip, full-width session, one-column guidance. Native buttons, checkboxes, details and labeled inputs support keyboard operation, with visible focus rings and a skip link. Reduced motion and print styles are included. Day and week selectors expose `aria-pressed`; checklist progress exposes status; timer uses a quiet numerical display with a separate completion announcement.

Checks and notes persist locally, scoped by cycle start date, week, day and movement. If browser storage is blocked the app continues with a visible visit-only storage message. Rest timer uses an absolute end time so delayed browser ticks do not extend the rest. All program text is escaped before insertion. The cycle follows Sydney civil dates and clamps before week 1 and after week 12 instead of silently repeating.
