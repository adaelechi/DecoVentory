# Styling Guide

DecoVentory uses a custom-built design system based on Vanilla CSS and CSS Variables (Custom Properties). This ensures a consistent aesthetic across all modules and simplifies theme management.

## 🎨 Color Palette

The system uses a primary brand color and a set of semantic variables for background and text.

| Variable | Light Value | Dark Value | Purpose |
| :--- | :--- | :--- | :--- |
| `--deco-red` | `#C54344` | `#C54344` | Primary brand color (buttons, badges). |
| `--bg-primary` | `#ffffff` | `#09090b` | Main page background. |
| `--text-primary` | `#0f172a` | `#fafafa` | Primary text color. |
| `--border-color` | `#e2e8f0` | `#27272a` | Card and input borders. |

## 🌓 Dark Mode
The system supports a professional dark mode. Theme switching is handled by adding or removing the `.dark-mode` class from the `<body>` element.
- **Auto-detection:** Most pages will respect the user's system preferences on first load.
- **Manual Toggle:** A theme switch is available in the navigation bar of the Dashboard and Admin pages.

## 🧱 Design Components

### Cards
All modules use a standard card layout for resources and logs:
- Background: `var(--card-bg)`
- Border: `1px solid var(--border-color)`
- Shadow: `var(--card-shadow)`

### Loading States (Skeletons)
To improve perceived performance, the system uses "Skeleton" loading animations. These are defined in `global.css` using the `.skeleton` class and a shimmer keyframe animation.

### Transitions
Smooth transitions are applied to `background-color` and `color` to ensure a premium feel when switching themes or hovering over interactive elements.

## 📏 Typography
The system uses a modern sans-serif stack that prioritizes readability across different operating systems:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```
