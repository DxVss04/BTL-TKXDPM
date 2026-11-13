const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lines = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);

// Ghép nguyên liệu + các bước thành HTML (backend lưu ở trường htmlContent)
export function buildRecipeHtml(ingredients, steps) {
  let html = '';
  if (lines(ingredients).length) html += `<h3>Nguyên liệu</h3><ul>${lines(ingredients).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
  if (lines(steps).length) html += `<h3>Cách làm</h3><ol>${lines(steps).map((l) => `<li>${esc(l)}</li>`).join('')}</ol>`;
  return html;
}

const unesc = (s) => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
const items = (block) => (block ? [...block.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => unesc(m[1])) : []);

// Tách ngược HTML về 2 ô nhập (dùng khi sửa công thức)
export function parseRecipeHtml(html = '') {
  const ul = html.match(/<ul>([\s\S]*?)<\/ul>/);
  const ol = html.match(/<ol>([\s\S]*?)<\/ol>/);
  if (!ul && !ol) return { ingredients: '', steps: unesc(html.replace(/<\/(p|div|h\d)>|<br\s*\/?>/g, '\n')) };
  return { ingredients: items(ul && ul[1]).join('\n'), steps: items(ol && ol[1]).join('\n') };
}

export const wrapHtml = (body) => `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
body{font-family:-apple-system,Roboto,sans-serif;font-size:17px;line-height:1.6;color:#1B1F24;padding:4px 16px 40px;margin:0}
h3{color:#1F7A44;margin:18px 0 6px}li{margin-bottom:6px}img{max-width:100%;border-radius:8px}
</style></head><body>${body}</body></html>`;
