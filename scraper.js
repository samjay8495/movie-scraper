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

async function scrapeCategory({ url, table }) {
  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const movies = [];

    $('div.filmyvideo > a').each((_, el) => {
      const name = $(el).text().trim();
      const link = $(el).attr('href');
      if (!name || !link) return;
      movies.push({ name, link });
    });

    console.log(`[${table}] Scraped movies count: ${movies.length}`);
    if (movies.length === 0) {
      console.warn(`[${table}] No movies found! Possible selector issue.`);
      return;
    }

    const { data, error } = await supabase.from(table).upsert(movies, {
      onConflict: ['link']
    });

    if (error) {
      console.error(`[${table}] ❌ Supabase error:`, error.message);
    } else {
      console.log(`[${table}] ✅ Inserted/Updated: ${data?.length || movies.length}`);
    }
  } catch (err) {
    console.error(`❌ Error fetching ${table}:`, err.message);
  }
}

(async () => {
  for (const category of categories) {
    await scrapeCategory(category);
  }
})();
