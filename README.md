# FrameZ

**Batch photos. One frame. Zero effort.**

FrameZ is a modern web application that lets you batch-apply templates to multiple photos and export them as a single ZIP file. Perfect for creating consistent product photos, event badges, social media content, or any scenario where you need the same frame/border applied to hundreds of images.

---

## Features

### Template Management
- **Upload Templates** — Drag & drop PNG or SVG templates to create reusable frames
- **Organize Templates** — Rename and delete templates from your gallery
- **Live Preview** — See your template with sample photos before exporting

### Photo Processing
- **Bulk Upload** — Upload 1 to 1000+ photos at once
- **Smart Compositing** — Photos are automatically fit into your template with cover/contain options
- **Session-Based** — Photos are processed locally and never uploaded to any server

### Export Options
- **Individual Download** — Download any single image with the template applied
- **Batch Export** — Export all photos as a single ZIP file with progress tracking
- **Cancelable Exports** — Stop exports mid-process at any time
- **PNG Quality** — Lossless PNG export at original resolution

### Design
- **Dark Theme** — Professional mono-black aesthetic with electric lime accents
- **Responsive** — Works on desktop and mobile devices
- **Performance** — Client-side processing, no backend required

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (React 19, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Canvas | Native Canvas 2D API |
| Storage | Dexie.js (IndexedDB) — Templates only |
| State | Zustand |
| Export | JSZip + FileSaver |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository (or use your existing copy)
git clone https://github.com/example/framez.git
cd framez

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## Usage

### 1. Create a Template
1. Go to the home page
2. Drag & drop a PNG or SVG file (your frame/border design)
3. Name your template and save it

### 2. Apply to Photos
1. Click on a template card to open the editor
2. Drag & drop your photos into the upload zone
3. Preview how photos look with the template applied
4. Click any photo to see a larger preview

### 3. Export
- **Single Image** — Click on a photo in the grid, then click "Download this image"
- **All Images** — Click "Download All" in the navbar, wait for export to complete

---

## Data & Privacy

- **Templates** are stored locally in your browser's IndexedDB
- **Photos are never uploaded** — All processing happens in your browser
- **No account required** — Works completely offline after first load
- **Clear data** by visiting your browser's site data settings

---

## Project Structure

```
framez/
├── app/                      # Next.js pages
│   ├── page.tsx              # Home page (template gallery)
│   └── template/[id]/        # Template editor
├── components/
│   ├── home/                 # Home page components
│   ├── template/             # Editor components
│   ├── layout/               # Navbar, Logo
│   └── shared/               # Reusable dialogs
├── lib/
│   ├── canvas/               # Compositor & export pipeline
│   ├── storage/              # Dexie database
│   └── utils/                # Image & file helpers
├── store/                    # Zustand state stores
├── hooks/                    # Custom React hooks
└── types/                    # TypeScript interfaces
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## License

[MIT License](LICENSE)

---

**Website:** [sample.com](https://sample.com)
**Support:** support@sample.com