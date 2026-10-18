import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const t = JSON.parse(await readFile(new URL('worldling.tokens.json', root), 'utf8'));
const variables = [];
const add = (name, value) => variables.push([name, String(value)]);
function flatten(prefix, object) {
  for (const [key, value] of Object.entries(object)) {
    if (value && typeof value === 'object') flatten(`${prefix}-${key}`, value);
    else add(`${prefix}-${key}`, value);
  }
}
flatten('--color', t.color);
flatten('--font', t.typography.family);
flatten('--font-weight', t.typography.weight);
const typeStyles = { ...t.typography.scale, ...t.typography.ui };
for (const [name, s] of Object.entries(typeStyles)) {
  add(`--text-${name}`, s.size);
  add(`--text-${name}--line-height`, s.lineHeight);
  add(`--text-${name}--letter-spacing`, s.letterSpacing);
  add(`--text-${name}--font-weight`, s.weight);
}
flatten('--radius', t.radius);
add('--spacing', t.spacing.unit);
flatten('--spacing', t.spacing.scale);
flatten('--shadow', t.shadow);
flatten('--duration', t.motion.duration);
flatten('--ease', t.motion.ease);
flatten('--blur', t.blur);
flatten('--border', t.border);
flatten('--size', t.size);
flatten('--layout', t.layout);
flatten('--gradient', t.gradient);
flatten('--icon', t.icon);
add('--measure-body', t.typography.bodyMeasure);
add('--measure-display', t.typography.displayMeasure);
add('--display-width', t.typography.displayWidth);

const required = JSON.parse(await readFile(new URL('docs/required-variables.json', root), 'utf8'));
const names = new Set(variables.map(([key]) => key));
for (const name of required) if (!names.has(name)) throw new Error(`Required variable missing: ${name}`);
if (names.size !== variables.length) throw new Error('Duplicate CSS variable');

let css = '/* Generated from worldling.tokens.json. Run node scripts/build-theme.mjs after editing tokens. */\n';
css += '/* @theme static preserves all tokens for CSS, JS and WebGL consumers. */\n';
css += '@theme static {\n' + variables.map(([name, value]) => `  ${name}: ${value};`).join('\n') + '\n}\n';

// The exact requested --duration-* variables remain intact. Explicit utilities
// give them friendly class names without relying on an undocumented namespace.
for (const name of Object.keys(t.motion.duration)) {
  css += `\n@utility duration-${name} {\n  transition-duration: var(--duration-${name});\n}\n`;
}
for (const [name, s] of Object.entries(typeStyles)) {
  css += `\n@utility wl-${name} {\n  font-family: var(--font-${s.family});\n  font-size: var(--text-${name});\n  font-weight: var(--text-${name}--font-weight);\n  line-height: var(--text-${name}--line-height);\n  letter-spacing: var(--text-${name}--letter-spacing);\n`;
  if (s.family === 'display') css += '  font-optical-sizing: auto;\n  font-stretch: var(--display-width);\n';
  if (s.family === 'mono') css += '  font-variant-numeric: tabular-nums;\n';
  css += '}\n';
}
css += '\n@utility bg-worldling-gradient {\n  background-image: var(--gradient-worldling);\n}\n';
await writeFile(new URL('worldling.theme.css', root), css);
await writeFile(new URL('docs/css-variable-map.json', root), JSON.stringify(Object.fromEntries(variables), null, 2) + '\n');
console.log(JSON.stringify({ cssVariables: variables.length, requiredVariables: required.length, typographyUtilities: Object.keys(typeStyles).length }));
