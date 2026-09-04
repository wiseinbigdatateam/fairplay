const css = await fetch('https://fairplay-biz.lovable.app/assets/styles-8jYiI2k-.css').then((r) => r.text());
const rootMatch = css.match(/:root\{[^}]+\}/);
if (rootMatch) console.log(rootMatch[0].slice(0, 4000));
const all = [...css.matchAll(/--(?:navy|cobalt|graphite|ivory|gold|cream|accent|warm)[a-zA-Z0-9-]*:[^;{}]+/g)].map((m) => m[0]);
console.log('\n---');
[...new Set(all)].forEach((v) => console.log(v));
