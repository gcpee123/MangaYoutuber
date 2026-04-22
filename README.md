# MangaCut - Manga to YouTube Video Maker

A web-based tool for converting manga chapters into YouTube videos with AI-generated narration.

## Setup & Installation

### 1. Start the Web App (Frontend Only - MangaDex)

If you only want to use MangaDex as a source, you can run the HTML file directly:

```bash
# Option A: Python HTTP Server
python -m http.server 8000
# Then open http://localhost:8000 in your browser

# Option B: Using Live Server (VS Code)
# Install "Live Server" extension, then right-click index.html and select "Open with Live Server"
```

### 2. Enable MangaKakalot Scraping (Backend Required)

To download chapters directly from MangaKakalot, you need to start the backend server:

#### Install Dependencies
```bash
npm install
```

This installs:
- `express` - Web server
- `axios` - HTTP client
- `cheerio` - HTML parsing
- `cors` - Cross-origin requests

#### Start the Backend Server
```bash
npm start
```

You should see:
```
🎬 MangaCut Backend Server running on http://localhost:3001
📁 Downloads directory: ./downloads
```

#### Use in the App

1. Keep the backend server running
2. Open the web app (http://localhost:8000)
3. Select "MangaKakalot" as the source
4. Enter a MangaKakalot URL (e.g., `https://mangakakalot.com/manga/solo-leveling`)
5. Click "Load Manga" then "Download Chapters"
6. The backend will:
   - Scrape the chapter pages
   - Extract image URLs
   - Download all images to `./downloads/`
   - Return them to the app for processing

## Project Structure

```
MangaYoutuber/
├── index.html          # Main web application
├── server.js           # Backend server (MangaKakalot scraper)
├── package.json        # Node.js dependencies
├── downloads/          # Downloaded manga chapters (auto-created)
└── README.md          # This file
```

## Supported Sources

| Source | Status | Notes |
|--------|--------|-------|
| **MangaDex** | ✅ Full | Uses official API, no backend needed |
| **MangaKakalot** | ✅ Full | Requires backend server (`npm start`) |
| **Local Folder** | 🚧 WIP | Manual folder upload |
| **Custom URL** | 🚧 WIP | Generic HTTP source |

## Features

### Step 1: Manga Picker
- Search MangaDex or enter MangaKakalot URLs
- View manga metadata and descriptions

### Step 2: Character Cast
- Add characters with names, roles, voices
- Auto-detect characters from panels
- Assign voice actors (8 TTS voices available)

### Step 3: Chapters
- Download chapters from MangaDex or MangaKakalot
- Select chapter ranges
- Supports multiple languages (MangaDex)

### Step 4: Panels
- Browse downloaded panels in gallery
- Filter by chapter and character
- Select panels for video

### Step 5: Script
- Auto-generate narration with AI
- Edit dialogue and narration
- Export as .txt or .srt

### Step 6: Video
- Preview video with panels and narration
- Export as:
  - SRT subtitles
  - Panel ZIP archive
  - FFmpeg command for rendering

## API Endpoints (Backend)

### POST `/api/mangakakalot/chapters`
Scrape chapters from MangaKakalot and extract image URLs.

**Request:**
```json
{
  "url": "https://mangakakalot.com/manga/solo-leveling",
  "from": 1,
  "to": 5
}
```

**Response:**
```json
{
  "chapters": [
    {
      "num": 1,
      "title": "Chapter 1",
      "images": ["image_url_1", "image_url_2", ...],
      "imageCount": 25
    }
  ],
  "totalImages": 125
}
```

### POST `/api/mangakakalot/download-images`
Download images from a chapter and save locally.

**Request:**
```json
{
  "chapterNum": 1,
  "images": ["url1", "url2", ...],
  "mangaTitle": "Solo Leveling"
}
```

**Response:**
```json
{
  "success": true,
  "chapterDir": "./downloads/Solo Leveling_ch1",
  "downloaded": 25,
  "failed": 0
}
```

### GET `/api/mangakakalot/downloaded`
List all downloaded chapters.

## Troubleshooting

### "Backend server not running"
- Make sure `npm start` is running in another terminal
- Check that port 3001 is not blocked
- Verify Node.js is installed: `node --version`

### "No images found" for MangaKakalot
- MangaKakalot HTML structure may have changed
- Try updating the selectors in `server.js` (lines ~50-60)
- Check the browser console for detailed errors

### Images not loading in preview
- File URLs may not work in all browsers
- Switch to using a proper HTTP server to serve downloaded images
- Images are saved to `./downloads/` - check the folder directly

### Rate limiting / Timeouts
- MangaKakalot has built-in rate limiting
- The server already includes delays between requests
- Reduce the number of chapters if timeouts occur

## Development

### Customize MangaKakalot Scraper
Edit `server.js` around line 50 to adjust CSS selectors if MangaKakalot's HTML changes:

```javascript
// Update these selectors to match current MangaKakalot structure
$('img.img-loading').each((_, el) => {
  const src = $(el).attr('src') || $(el).attr('data-src');
  // ...
});
```

## License

MIT

## Notes

- This tool is for personal use and education
- Respect the Terms of Service of manga websites
- Download speeds are intentionally throttled to avoid overloading servers
- Images are stored locally in the `downloads/` directory
