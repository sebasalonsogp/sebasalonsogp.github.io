/**
 * True when the browser can create a WebGL2 context, which Three.js requires. Checked before
 * downloading the explorer so unsupported browsers keep the readable hero and project list.
 */
export function supportsWebGL2(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
