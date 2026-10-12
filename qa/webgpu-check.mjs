import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
for (const args of [['--use-angle=default', '--enable-unsafe-webgpu'], ['--use-angle=default', '--enable-unsafe-webgpu', '--enable-features=Vulkan'], ['--enable-unsafe-webgpu', '--use-angle=d3d11']]) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: [...args, '--mute-audio'] });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5441/qa/blank.html').catch(() => page.goto('about:blank'));
  const r = await page.evaluate(async () => {
    const out = { gpu: !!navigator.gpu };
    try { const a = await navigator.gpu?.requestAdapter(); out.adapter = !!a; if (a) { const info = a.info || {}; out.vendor = info.vendor; out.arch = info.architecture; out.device = info.device; const d = await a.requestDevice(); out.deviceOk = !!d; out.maxStorage = d.limits.maxStorageBufferBindingSize; } } catch (e) { out.err = e.message; }
    try { const c = document.createElement('canvas'); const gl = c.getContext('webgl2'); out.webgl2 = !!gl; out.glRenderer = gl?.getParameter(gl.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL || 0x1F01); } catch (e) { out.glErr = e.message; }
    return out;
  });
  console.log(JSON.stringify(args), JSON.stringify(r));
  await browser.close();
}
