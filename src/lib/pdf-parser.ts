// This polyfill is necessary for environments that don't support Promise.withResolvers yet.
if (Promise.withResolvers === undefined) {
  Promise.withResolvers = function withResolvers<T>() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    // @ts-ignore
    return { promise, resolve, reject };
  };
}

import {getDocument, GlobalWorkerOptions} from 'pdfjs-dist';
import path from 'path';

// This is a workaround to make pdfjs-dist work with Next.js
GlobalWorkerOptions.workerSrc = path.resolve(
  process.cwd(),
  'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'
);

export async function extractTextFromPdf(dataUri: string): Promise<string> {
  const base64Data = dataUri.split(',')[1];
  const pdfData = new Uint8Array(Buffer.from(base64Data, 'base64'));

  const loadingTask = getDocument({data: pdfData});
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}
