// Read colors from the CSS custom properties in common.css so canvas/SVG match.
// Brand colors are always used at full opacity; neutral greys cover anything softer.
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const color = (name) => cssVar(`--color-${name}`); // brand: green, red, lightbrown, darkbrown, black, white
export const grey = (name) => cssVar(`--grey-${name}`); // neutral: dark, mid, light, faint
