// Updated scraper.js to also scrape poster, starcast, language, length

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://laoxhbwlixoezqxpmdjm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhb3hoYndsaXhvZXpxeHBtZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTM0NzEsImV4cCI6MjA2ODM2OTQ3MX0.DDsco5AyMoF7RT90t_LauxPYPGYkCg6_JEj-XvxClT8'
);

const categories = [
  {
    table: 'bollywood_full_movies',
    url: 'https://www.filmyzilla15.com/category/398/2025-latest-bollywood-movies/default/1.html'
  },
  {
    table: 'punjabi_full_movies',
    url: 'https://www.filmyzilla15.com/category/402/2025-latest-punjabi-movies/default/1.html'
  }
];

async function scrapeMovieDetails(movieUrl) {
  try {
    const res = await axios.get(movieUrl);
    const $ = cheerio.load(res.data);

    const poster = $('div.mov_img img').attr('src') || null;
    const details = $('div.mov_info').text();

    const starcastMatch = details.match(/Starcast:\s*(.*?)\n/i);
    const languageMatch = details.match(/Language:\s*(.*?)\n/i);
    const lengthMatch = details.match(/Length:\s*(.*?)\n/i);

    return {
      poster,
      starcast: starcastMatch ? starcastMatch[1].trim() : null,
      language: languageMatch ? languageMatch[1].trim() : null,
      length: lengthMatch ? lengthMatch[1].trim() : null
    };
  } catch (err) {
    console.error('❌ Failed to scrape movie details from', movieUrl);
    return {};
  }
}

async function scrapeCategory({ url, table }) {
  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const movies = [];

    const movieElements = $('div.filmyvideo > a');

    for (let i = 0; i < movieElements.length; i++) {
      const el = movieElements[i];
      const name = $(el).text().trim();
      const link = $(el).attr('href');

      if (!name || !link) continue;

      const fullLink = link.startsWith('http') ? link : `https://www.filmyzilla15.com${link}`;
      const details = await scrapeMovieDetails(fullLink);

      movies.push({ name, link: fullLink, ...details });
    }

    for (const movie of movies) {
      const { error } = await supabase.from(table).upsert(movie, { onConflict: 'link' });
      if (error) console.error(`[${table}] ❌ Supabase error:`, error.message);
    }

    console.log(`[${table}] ✅ Scraped movies count: ${movies.length}`);
  } catch (err) {
    console.error(`[${table}] ❌ Error:`, err.message);
  }
}

for (const category of categories) {
  scrapeCategory(category);
}
