// Ray-traced Schwarzschild black hole (docs/design-spec.md, "Contact"), ported from the
// approved concept. Each pixel's ray bends toward the hole (Rs = 1, horizon at r = 1) under
// the photon-orbit acceleration −1.5·h²·p / r⁵, stepping further when far away; where it
// crosses the disk plane between r = 3 and 8.8 it gathers banded, noisy, Doppler-brightened
// amber light. The disk turns differentially (ω ∝ r^−1.5). GLSL ES 1.00, so WebGL 1 is enough.

export const VERTEX = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

export const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 R;
uniform float T;
uniform vec3 C0;
uniform vec3 C1;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; }
  return s;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * R) / R.y;
  float c = cos(-0.12), sn = sin(-0.12);
  uv = mat2(c, -sn, sn, c) * uv;
  vec3 ro = vec3(0.0, 2.2, -24.0);
  vec3 fw = normalize(-ro), rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))), up = cross(rt, fw);
  vec3 v = normalize(fw * 1.78 + uv.x * rt + uv.y * up), p = ro;
  vec3 h = cross(p, v);
  float h2 = dot(h, h);
  vec3 col = vec3(0.0);
  float a = 0.0;
  for (int i = 0; i < 420; i++) {
    float r2 = dot(p, p);
    if (r2 < 1.0) { a = 1.0; break; }
    float r = sqrt(r2);
    float dt = clamp(0.045 * r, 0.012, 0.8);
    vec3 pn = p + v * dt;
    v += -1.5 * h2 * p / (r2 * r2 * r) * dt;
    if (p.y * pn.y < 0.0) {
      vec3 q = mix(p, pn, p.y / (p.y - pn.y));
      float rr = length(q.xz);
      if (rr > 3.0 && rr < 8.8) {
        float om = 1.4 / pow(rr, 1.5), ca = cos(T * om), sa = sin(T * om);
        vec2 rq = mat2(ca, -sa, sa, ca) * q.xz;
        float streak = fbm(vec2(rr * 9.0, 0.0) + rq * 0.6) * 0.6 + noise(vec2(rr * 38.0, atan(rq.y, rq.x) * 2.0)) * 0.55;
        float band = 0.74 + 0.2 * sin(rr * 3.2 + fbm(rq * 1.1) * 3.0) + 0.34 * (streak - 0.5);
        float dens = band * (0.8 + 0.35 * fbm(rq * 2.2 + 7.0)) * smoothstep(3.0, 3.5, rr) * smoothstep(8.8, 5.0, rr);
        float tmp = pow(3.1 / rr, 1.05);
        vec3 c1 = mix(C0, C1, clamp(tmp, 0.0, 1.0)) + vec3(1.0) * pow(clamp(tmp, 0.0, 1.0), 5.0) * 0.35;
        vec3 vel = normalize(vec3(-q.z, 0.0, q.x));
        float dop = clamp(1.0 + 0.62 * dot(vel, -normalize(v)), 0.25, 1.9);
        float al = clamp(dens * 0.92, 0.0, 1.0);
        vec3 e = c1 * dens * dop * dop * 2.05;
        col += (1.0 - a) * e * al;
        a += (1.0 - a) * al;
        if (a > 0.985) break;
      }
    }
    p = pn;
    if (r2 > 1200.0) break;
  }
  col = 1.0 - exp(-col * 1.25);
  gl_FragColor = vec4(col * min(1.0, a), a);
}
`;

/** Disk colours: deep amber at the outer edge to pale gold near the inner edge. */
export const DISK_OUTER = [0.95, 0.36, 0.1] as const;
export const DISK_INNER = [1.0, 0.8, 0.52] as const;
