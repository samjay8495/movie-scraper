import axios from 'axios';
import cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://laoxhbwlixoezqxpmdjm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhb3hoYndsaXhvZXpxeHBtZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTM0NzEsImV4cCI6MjA2ODM2OTQ3MX0.DDsco5AyMoF7RT90t_LauxPYPGYkCg6_JEj-XvxClT8');

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

    for (const movie of movies) {
      await supabase.from(table).upsert(movie, { onConflict: 'link' });
    }

    console.log(`✅ Updated: ${table}`);
  } catch (err) {
    console.error(`❌ Error: ${table}`, err.message);
  }
}

for (const category of categories) {
  scrapeCategory(category);
}
