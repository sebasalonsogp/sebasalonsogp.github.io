// GLSL for the explorer's bodies, ported from the concept's per-pixel canvas renderer
// (references/concept, "noise + textures" and "sphere renderer"). Colours are sRGB and written
// straight out, as in the concept. Three.js compiles these as GLSL ES 3.00 (WebGL2), which
// provides the unsigned integer maths the concept's hash relies on.

/** Value of the planet shader's DOMAIN define. */
export const DOMAIN_INDEX = { backend: 0, ml: 1, data: 2, math: 3 } as const;
export const MOON_DOMAIN = 4;

/** Rim light per domain: sRGB colour (0–1) and strength (concept's RIM). */
export const RIM: Record<keyof typeof DOMAIN_INDEX, [number, number, number, number]> = {
  backend: [201 / 255, 162 / 255, 122 / 255, 0.18],
  ml: [185 / 255, 168 / 255, 216 / 255, 0.55],
  data: [127 / 255, 196 / 255, 240 / 255, 0.8],
  math: [207 / 255, 227 / 255, 245 / 255, 0.5],
};

export const planetVertex = /* glsl */ `
varying vec3 vObject;
varying vec3 vNormalView;

void main() {
  vObject = position;
  vNormalView = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const planetFragment = /* glsl */ `
precision highp float;
precision highp int;

uniform int uSeed;
uniform float uSpin;
/** Direction to the star in view space. */
uniform vec3 uLight;
uniform vec4 uRim;

varying vec3 vObject;
varying vec3 vNormalView;

float hash3(int x, int y, int z, int s) {
  uint h = (uint(x) * 374761393u) ^ (uint(y) * 668265263u) ^ (uint(z) * 1440662683u) ^ (uint(s) * 1274126177u);
  h = (h ^ (h >> 13u)) * 1274126177u;
  h ^= h >> 16u;
  return float(h) / 4294967296.0;
}

float vnoise(vec3 p, int s) {
  vec3 i = floor(p);
  vec3 f = p - i;
  vec3 u = f * f * (3.0 - 2.0 * f);
  int X = int(i.x), Y = int(i.y), Z = int(i.z);
  float a = hash3(X, Y, Z, s), b = hash3(X + 1, Y, Z, s);
  float c = hash3(X, Y + 1, Z, s), d = hash3(X + 1, Y + 1, Z, s);
  float e = hash3(X, Y, Z + 1, s), g = hash3(X + 1, Y, Z + 1, s);
  float h = hash3(X, Y + 1, Z + 1, s), k = hash3(X + 1, Y + 1, Z + 1, s);
  float x1 = mix(a, b, u.x), x2 = mix(c, d, u.x), x3 = mix(e, g, u.x), x4 = mix(h, k, u.x);
  return mix(mix(x1, x2, u.y), mix(x3, x4, u.y), u.z);
}

float fbm(vec3 p, int s, int octaves) {
  float amp = 0.5, freq = 1.0, total = 0.0, norm = 0.0;
  // A guarded body rather than an early break: Direct3D's shader compiler (used by Chrome on
  // Windows) warns about early exits from unrolled loops.
  for (int i = 0; i < 5; i++) {
    if (i < octaves) {
      total += amp * vnoise(vec3(p.x * freq + float(i) * 3.1, p.y * freq, p.z * freq), s + i * 101);
      norm += amp;
      amp *= 0.5;
      freq *= 2.03;
    }
  }
  return total / norm;
}

// The concept's smoothstep also accepts e0 > e1 (a falling edge).
float sm(float e0, float e1, float x) {
  float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

vec3 rgb(float r, float g, float b) { return vec3(r, g, b) / 255.0; }

// DOMAIN is a compile-time define (one program per domain), so there is no per-pixel branch.
vec3 surface(vec3 p, int s) {
  vec3 c;
#if DOMAIN == 0
  {
    // Backend & product: rocky world.
    float n = fbm(p * 2.3, s, 5);
    float m = fbm(vec3(p.x * 1.2 + 7.0, p.y * 1.2, p.z * 1.2), s + 3, 3);
    c = mix(rgb(43.0, 38.0, 34.0), rgb(163.0, 141.0, 115.0), sm(0.3, 0.72, n));
    c *= (1.0 - 0.38 * sm(0.5, 0.38, m)) * (0.88 + 0.24 * vnoise(p * 24.0, s + 5));
  }
#elif DOMAIN == 1
  {
    // Machine learning: banded giant.
    float w = fbm(p * 1.8, s, 4);
    float t = sin(p.y * 12.0 + (w - 0.5) * 6.0) * 0.5 + 0.5;
    c = mix(rgb(79.0, 69.0, 102.0), rgb(220.0, 211.0, 196.0), t);
    c = mix(c, rgb(142.0, 123.0, 166.0), sm(0.55, 0.85, fbm(vec3(p.x * 2.0, p.y * 9.0, p.z * 2.0), s + 4, 3)) * 0.6);
    c *= 0.9 + 0.2 * vnoise(vec3(p.x * 4.0, p.y * 48.0, p.z * 4.0), s + 8);
  }
#elif DOMAIN == 2
  {
    // Data science: ocean world with clouds and polar caps.
    float wq = fbm(p * 1.5, s, 3);
    float o = fbm(vec3(p.x * 3.0 + wq * 2.0, p.y * 3.0, p.z * 3.0), s + 2, 4);
    vec3 cloud = rgb(233.0, 238.0, 241.0);
    c = mix(rgb(10.0, 33.0, 51.0), rgb(30.0, 88.0, 118.0), sm(0.35, 0.7, o));
    float cl = fbm(vec3(p.x * 2.4 + wq * 2.5, p.y * 3.2, p.z * 2.4), s + 5, 5);
    c = mix(c, cloud, sm(0.5, 0.66, cl) * 0.88);
    c = mix(c, cloud, sm(0.86, 0.95, abs(p.y)) * 0.9);
  }
#elif DOMAIN == 3
  {
    // Math & scientific computing: ice world with cracks.
    float n = fbm(p * 2.0, s, 5);
    vec3 crack = rgb(54.0, 80.0, 110.0);
    c = mix(rgb(122.0, 142.0, 164.0), rgb(226.0, 234.0, 240.0), sm(0.32, 0.7, n));
    c = mix(c, crack, sm(0.03, 0.0, abs(vnoise(p * 5.0, s + 11) - 0.5)) * 0.75);
    c = mix(c, crack, sm(0.025, 0.0, abs(vnoise(p * 11.0, s + 13) - 0.5)) * 0.4);
  }
#else
  // Moon: plain grey rock.
  c = rgb(181.0, 176.0, 168.0);
#endif
  return c;
}

void main() {
  vec3 n = normalize(vNormalView);
  float cs = cos(uSpin), sn = sin(uSpin);
  vec3 p = normalize(vec3(cs * vObject.x - sn * vObject.z, vObject.y, sn * vObject.x + cs * vObject.z));
  vec3 albedo = surface(p, uSeed);

  float ndl = dot(n, uLight);
  float lit = 0.03 + 0.97 * pow(clamp((ndl + 0.05) / 1.05, 0.0, 1.0), 1.15);
  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.6) * clamp(ndl + 0.35, 0.0, 1.0) * uRim.a;
  gl_FragColor = vec4(albedo * lit + uRim.rgb * rim, 1.0);
}
`;

export const ringVertex = /* glsl */ `
varying float vRadius;

void main() {
  vRadius = length(position.xy);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Concept's ring bands: radius (planet radii) and opacity; each band is 0.085 R wide. */
export const RING_BANDS = [
  [1.5, 0.12],
  [1.58, 0.26],
  [1.66, 0.2],
  [1.74, 0.3],
  [1.82, 0.16],
  [1.9, 0.26],
  [1.98, 0.1],
  [2.08, 0.18],
  [2.16, 0.07],
] as const;

export const ringFragment = /* glsl */ `
precision highp float;

varying float vRadius;

const float HALF_WIDTH = 0.0425;
const float RADII[9] = float[9](${RING_BANDS.map(([r]) => r.toFixed(2)).join(', ')});
const float ALPHAS[9] = float[9](${RING_BANDS.map(([, a]) => a.toFixed(2)).join(', ')});

void main() {
  float aa = max(fwidth(vRadius), 1e-4);
  float alpha = 0.0;
  for (int i = 0; i < 9; i++) {
    float d = abs(vRadius - RADII[i]);
    alpha += ALPHAS[i] * (1.0 - smoothstep(HALF_WIDTH - aa, HALF_WIDTH + aa, d));
  }
  if (alpha <= 0.001) discard;
  gl_FragColor = vec4(226.0 / 255.0, 214.0 / 255.0, 192.0 / 255.0, min(alpha, 1.0));
}
`;

export const beltVertex = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
/** Focal length in device pixels. */
uniform float uFocal;
uniform float uMinSize;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(uMinSize, uFocal * 0.014 * aSize / -mv.z);
  vAlpha = aAlpha;
}
`;

export const beltFragment = /* glsl */ `
precision highp float;

uniform vec3 uColor;
varying float vAlpha;

void main() {
  gl_FragColor = vec4(uColor, vAlpha);
}
`;
