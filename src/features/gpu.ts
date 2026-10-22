// Software WebGL (SwiftShader, llvmpipe, Microsoft Basic Render: no GPU, a blocklisted one,
// a virtual machine) draws on the CPU. Animated graphics would keep the main thread busy
// there, so the explorer and the black hole draw still frames instead.

const SOFTWARE_RENDERER = /SwiftShader|llvmpipe|softpipe|Basic Render|Software/i;

/** True when the context renders on the CPU, as far as the browser says. */
export function isSoftwareRenderer(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const name = `${gl.getParameter(gl.RENDERER)} ${info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : ''}`;
  return SOFTWARE_RENDERER.test(name);
}
