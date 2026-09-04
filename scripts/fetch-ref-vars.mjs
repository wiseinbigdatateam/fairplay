const css = await fetch('https://fairplay-biz.lovable.app/assets/styles-8jYiI2k-.css').then((r) => r.text());
const vars = [...css.matchAll(/--[a-zA-Z0-9-]+:[^;{}]+/g)].map((m) => m[0]);
const interesting = vars.filter((v) =>
  /navy|ivory|gold|accent|font|foreground|background|warm|charcoal|cream|sand|stone|primary|secondary/i.test(v),
);
console.log('--- VARS ---');
[...new Set(interesting)].forEach((v) => console.log(v));

const html = await fetch('https://fairplay-biz.lovable.app/').then((r) => r.text());
const imgs = [...html.matchAll(/\/assets\/[^"'\s>]+\.(?:jpg|jpeg|png|webp|svg)/g)].map((m) => m[0]);
console.log('\n--- IMGS ---');
[...new Set(imgs)].forEach((i) => console.log(i));
