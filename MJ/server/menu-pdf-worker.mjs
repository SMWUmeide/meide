import { parentPort, workerData } from 'node:worker_threads';
import { getDocumentProxy, renderPageAsImage } from 'unpdf';

// No PDF scripts, URL fetching, or external font/resource retrieval.
globalThis.fetch = () => { throw Error('External PDF resources are disabled'); };
try {
  const pdf = await getDocumentProxy(new Uint8Array(workerData), { isEvalSupported: false, useSystemFonts: false, disableFontFace: true, stopAtErrors: true });
  const pages = []; const total = pdf.numPages; const count = Math.min(total, 2);
  for (let i = 1; i <= count; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let text = '';
    for (const item of content.items) if ('str' in item) text += item.str + (item.hasEOL ? '\n' : ' ');
    if (text.trim().length > 40) pages.push({ text });
    else {
      const view = page.getViewport({ scale: 1 });
      if (!Number.isFinite(view.width * view.height) || view.width <= 0 || view.height <= 0) throw Error('Invalid page');
      const scale = Math.min(1.5, 1600 / Math.max(view.width, view.height), Math.sqrt(2_000_000 / (view.width * view.height)));
      const image = await renderPageAsImage(pdf, i, { scale, canvasImport: () => import('@napi-rs/canvas') });
      if (image.byteLength > 3_000_000) throw Error('PDF image too large');
      pages.push({ image: new Uint8Array(image) });
    }
  }
  await pdf.loadingTask.destroy();
  parentPort.postMessage({ pages, partial: total > count });
} catch (error) { parentPort.postMessage({ error: error.message || 'Unreadable PDF' }); }
