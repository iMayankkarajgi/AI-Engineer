// Builds the static, server-free version of the site into dist-static/.
// The entry file is written without document-level tags so it can also be
// published as a hosted page that supplies its own <html>/<head>/<body>.
import { execSync } from 'node:child_process';
import fs from 'node:fs';

// Supabase is left out by default: some hosts for the single shareable page block
// network calls. Pass --with-supabase when deploying to a normal static host.
const cloud = process.argv.includes('--with-supabase') ? {} : { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' };
execSync('npx vite build', { stdio: 'inherit', env: { ...process.env, ...cloud, VITE_STATIC: '1' } });
const html = fs.readFileSync('dist-static/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta charset[^>]*>|<meta name="viewport"[^>]*>/g, '');
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
fs.writeFileSync('dist-static/page.html', (head + body).replace(/\n\s*\n/g, '\n').trim() + '\n');
console.log('wrote dist-static/page.html');
