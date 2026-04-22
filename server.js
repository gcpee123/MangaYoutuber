const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.dirname(__filename)));

const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

// Helper to extract manga slug from URL
function extractSlug(url) {
  const match = url.match(/(?:www\.)?mangakakalot\.(?:com|gg)\/manga\/([^\/]+)/);
  return match ? match[1] : null;
}

// Helper to extract domain from URL
function extractDomain(url) {
  const match = url.match(/(?:www\.)?(mangakakalot\.(?:com|gg))/);
  return match ? match[1] : 'mangakakalot.com';
}

// Endpoint to fetch chapters from MangaKakalot
app.post('/api/mangakakalot/chapters', async (req, res) => {
  try {
    const { url, from, to } = req.body;
    const slug = extractSlug(url);
    const domain = extractDomain(url);
    
    if (!slug) {
      return res.status(400).json({ error: 'Invalid MangaKakalot URL' });
    }

    const chapters = [];
    const chapterRange = to - from + 1;

    for (let i = 0; i < chapterRange; i++) {
      const chNum = from + i;
      const chapterUrl = `https://${domain}/chapter/${slug}/chapter-${chNum}`;
      
      try {
        const { data } = await axios.get(chapterUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });

        const $ = cheerio.load(data);
        const images = [];
        
        // MangaKakalot uses img tags with data-src or src
        $('img.img-loading').each((_, el) => {
          const src = $(el).attr('src') || $(el).attr('data-src');
          if (src && src.includes('http')) {
            images.push(src);
          }
        });

        if (images.length === 0) {
          // Fallback: try different selector
          $('div.container-chapter-reader img').each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            if (src && src.includes('http')) {
              images.push(src);
            }
          });
        }

        chapters.push({
          num: chNum,
          title: `Chapter ${chNum}`,
          url: chapterUrl,
          images,
          imageCount: images.length
        });

        console.log(`✓ Chapter ${chNum}: ${images.length} images found`);
      } catch (e) {
        console.error(`✗ Chapter ${chNum} failed: ${e.message}`);
        chapters.push({
          num: chNum,
          title: `Chapter ${chNum}`,
          url: chapterUrl,
          images: [],
          imageCount: 0,
          error: e.message
        });
      }

      // Rate limiting - be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    res.json({ chapters, totalImages: chapters.reduce((sum, c) => sum + c.imageCount, 0) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Endpoint to download images from a chapter
app.post('/api/mangakakalot/download-images', async (req, res) => {
  try {
    const { chapterNum, images, mangaTitle } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images to download' });
    }

    const chapterDir = path.join(downloadDir, `${mangaTitle}_ch${chapterNum}`);
    if (!fs.existsSync(chapterDir)) {
      fs.mkdirSync(chapterDir, { recursive: true });
    }

    const downloaded = [];
    const failed = [];

    for (let i = 0; i < images.length; i++) {
      const imgUrl = images[i];
      const filename = `page_${String(i + 1).padStart(3, '0')}.jpg`;
      const filepath = path.join(chapterDir, filename);

      try {
        const response = await axios.get(imgUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://mangakakalot.com/'
          },
          timeout: 15000
        });

        fs.writeFileSync(filepath, response.data);
        downloaded.push(filename);
        console.log(`✓ Downloaded: ${filename}`);
      } catch (e) {
        failed.push({ page: i + 1, error: e.message });
        console.error(`✗ Failed to download page ${i + 1}: ${e.message}`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    res.json({
      success: true,
      chapterDir,
      downloaded: downloaded.length,
      failed: failed.length,
      failedList: failed
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Endpoint to get downloaded chapters
app.get('/api/mangakakalot/downloaded', (req, res) => {
  try {
    const folders = fs.readdirSync(downloadDir);
    const chapters = folders.map(folder => {
      const folderPath = path.join(downloadDir, folder);
      const files = fs.readdirSync(folderPath);
      return {
        folder,
        imageCount: files.length,
        images: files.sort()
      };
    });
    res.json({ chapters });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎬 MangaCut Backend Server running on http://localhost:${PORT}`);
  console.log(`📁 Downloads directory: ${downloadDir}\n`);
});
