const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const srcRoot = path.resolve(__dirname, '../src');
const read = (relative) => fs.readFileSync(path.join(srcRoot, relative), 'utf8');

// 1. The shared figure component carries the guideline's size tiers and grounding variants.
const figure = read('components/ui/MascotFigure.tsx');
for (const tier of ['S', 'M', 'L', 'XL']) {
  assert(figure.includes(`${tier}: { width:`), `size tier ${tier} must be defined`);
}
for (const px of ['38', '48', '72', '80', '150', '160', '220', '240']) {
  assert(figure.includes(px), `tier baseline ${px}px must appear`);
}
assert(figure.includes('grounding === "disc"'), 'disc grounding must be implemented');
assert(figure.includes('grounding === "shadow"'), 'shadow grounding must be implemented');
assert(figure.includes('getMascotImagePath(mascotId, "face")'), 'circle presentation must use the face image');
assert(figure.includes('objectFit: "contain"'), 'figure must render with contain');
assert(!figure.includes('objectFit: "cover"'), 'figure must not crop with cover');
assert(figure.includes('prefers-reduced-motion'), 'motion must stop under reduced-motion');

// 2. Every mascot display site goes through the shared component.
const sites = [
  'app/component/appHeader.tsx',
  'components/ui/BlockingProcessOverlay.tsx',
  'components/ui/PageTransitionOverlay.tsx',
  'features/create/components/MascotHint.tsx',
  'features/home/HomeScreen.tsx',
  'app/page.tsx',
  'features/profile/ProfileScreen.tsx',
];
for (const site of sites) {
  const source = read(site);
  assert(source.includes('MascotFigure'), `${site} must use MascotFigure`);
  assert(!source.includes('getMascotImagePath'), `${site} must not build mascot image paths directly`);
  assert(!source.includes('objectFit: "cover"'), `${site} must not crop images with cover`);
}

// 3. Waiting overlays are the only looping-motion sites and cannot request the unused states.
for (const overlay of ['components/ui/BlockingProcessOverlay.tsx', 'components/ui/PageTransitionOverlay.tsx']) {
  const source = read(overlay);
  assert(source.includes('motion='), `${overlay} must pass its waiting motion to MascotFigure`);
  assert(source.includes('"surprise"') && source.includes('"celebrate"'), `${overlay} must exclude surprise/celebrate from its state type`);
}

// 4. The learning path stays mascot-free.
const unitOverview = read('features/learning/app/UnitOverview.tsx');
assert(!unitOverview.includes('MascotFigure') && !unitOverview.includes('getMascotImagePath'),
  'UnitOverview must not display the mascot');

console.log('verifyMascotPresentation: ok');
