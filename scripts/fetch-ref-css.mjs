const base = 'https://fairplay-biz.lovable.app';
const cssRes = await fetch(`${base}/assets/styles-8jYiI2k-.css`);
const css = await cssRes.text();
console.log(css.slice(0, 15000));
const colors = [...css.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0]);
console.log('\n---COLORS---');
[...new Set(colors)].slice(0, 40).forEach((c) => console.log(c));

const imgs = [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/['"]/g, ''));
console.log('\n---CSS URLS---');
[...new Set(imgs)].slice(0, 30).forEach((u) => console.log(u));
