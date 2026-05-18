**Visit website:** [framez-it.vercel.app](https://framez-it.vercel.app/)

# FrameZ

**Batch photos. One frame. Zero effort.**

FrameZ is a modern web application that lets you batch-apply templates to multiple photos with full text customization, then export individually or as a single ZIP. Perfect for creating consistent product photos, event badges, social media content, personalized certificates, or any scenario where you need the same frame applied to hundreds of images with unique text for each.

---

## Features

### Template Management
- **Upload Templates** — Drag & drop PNG or SVG templates to create reusable frames
- **Organize Templates** — Rename and delete templates from your gallery
- **Live Preview** — See your template with sample photos before exporting
- **Template Layering** — Toggle whether the template appears on top of or behind your photos

### Photo Processing
- **Bulk Upload** — Upload 1 to 1000+ photos at once
- **Smart Compositing** — Photos are automatically fit into your template with cover/contain options
- **Image Navigation** — Browse photos with prev/next controls and keyboard shortcuts
- **Full-Resolution Export** — Export images at their original resolution
- **Session-Based** — Photos are processed locally and never uploaded to any server

### Text System
- **Text Elements** — Add freely-positioned text on the canvas with visual drag-and-drop
- **Floating Toolbar** — Full styling controls that appear when a text element is selected:
  - Color picker with spectrum, hue slider, hex input, and recent colors
  - Font family selector with search and recent fonts
  - Font size with quick-access preset sizes
  - Bold, Italic, Underline, Strikethrough
  - Text alignment (left, center, right)
  - Letter spacing control
  - Line height control
  - Text transform (No change, UPPERCASE, lowercase, Capitalize)
- **Text Presets** — Quick-add buttons for common text types (Heading, Subheading, Tagline, Caption)
- **Undo / Redo** — Full history stack for text and positioning changes (Ctrl+Z / Ctrl+Y)
- **Duplicate** — Clone any text element instantly (Ctrl+D)

### Multi-Element Layers
- **Layers Panel** — View and manage all text elements in one place
- **Drag & Drop Reordering** — Drag layer rows to change the visual stacking order
- **Multi-Select** — Select multiple text layers at once (Ctrl+Click, Shift+Click, Ctrl+A, Ctrl+Shift+Click)
- **Batch Delete** — Delete multiple selected layers at once

### Global vs Per-Page Text
- **Global Text** — Applies the same text content to all images in a batch
- **Per-Page Text** — Customize text content individually per image
- **Text Mode Toggle** — Switch between "All" (global) and "Individual" (per-page) styling
- **Per-Page Overrides** — Customize font, size, color, position, and content per image
- **Unlock Override** — Revert a per-page override to apply global text settings

### Script (Mail Merge)
- **Placeholder System** — Use `<name>` style placeholders in your text elements
- **Bulk Replacement** — Fill in unique values for each image in one operation
- **Auto-Detection** — Detected placeholders are shown as quick-add buttons
- **Validation** — Warnings for mismatched value counts before applying
- **Per-Image Resolution** — Each exported image gets its own replaced text

### Export Options
- **Individual Download** — Download any single image with the template and text applied in full resolution
- **Batch Export** — Export all photos as a single ZIP file with progress tracking
- **Cancelable Exports** — Stop exports mid-process at any time
- **Progress Tracking** — Real-time progress bar during batch export
- **PNG Quality** — Lossless PNG export at original resolution

### Keyboard Shortcuts
- **Ctrl+A** — Select all text layers
- **Ctrl+D** — Duplicate selected text
- **Ctrl+Z** — Undo
- **Ctrl+Y / Ctrl+Shift+Z** — Redo
- **Delete / Backspace** — Delete selected text elements
- **Escape** — Deselect or close panels

### Design
- **Dark Theme** — Professional mono-black aesthetic with electric lime accents
- **Responsive** — Works on desktop and mobile with optimized layouts
- **Performance** — Client-side compositing using Canvas 2D API, no backend required
- **Fabric.js Integration** — Rich canvas text editor with multi-select, drag, resize, and rotation controls

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (React 19, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Canvas | Fabric.js (editor) + Native Canvas 2D API (export) |
| Text Rendering | Fabric.js IText + Canvas 2D fallback |
| Storage | Dexie.js (IndexedDB) — Templates and text data |
| State | Zustand |
| Export | JSZip + FileSaver |
| Fonts | Google Fonts via next/font |
| Icons | Lucide React |

---

## Usage

### 1. Create a Template
1. Go to the home page
2. Drag & drop a PNG or SVG file (your frame/border design)
3. Name your template and save it

### 2. Open the Editor
1. Click on a template card to open the editor
2. Add a text element using the Text panel, then style it with the floating toolbar

### 3. Add Photos
1. Drag & drop your photos into the upload zone, or click to browse
2. Navigate between photos using the prev/next controls

### 4. Customize Text Per Image
1. Add placeholders like `<name>` in your text
2. Use the Script panel to define values for each photo
3. Click "Apply Replacements" to fill in the text for all images

### 5. Export
- **Single Image** — Click on a photo in the grid to open the preview modal, then click "Download this image"
- **All Images** — Click "Download All" in the navbar to export the entire batch as a ZIP

---

## Data & Privacy

- **Templates** are stored locally in your browser's IndexedDB
- **Text elements and per-image overrides** are also persisted in IndexedDB
- **Photos are never uploaded** — All processing happens in your browser
- **No account required** — Works completely offline after first load
- **Clear data** by visiting your browser's site data settings

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## License

[MIT License](LICENSE)