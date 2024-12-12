import * as pdf from "pdfjs-dist";

// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdf.GlobalWorkerOptions.workerSrc = pdfWorker;

import { useEffect, useRef } from "react";
import { findObjects, makeSpacing } from "./utils";
export type PdfSpotlightProps = {
  url: string;
  searchFor: string;
};

export const PdfSpotlight = (props: PdfSpotlightProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const highlightText = async (
    pagePdf: any,
    keyword: string,
    ctx: CanvasRenderingContext2D,
    viewport: { width: number; height: number; scale: number },
  ) => {
    if (!keyword) return;
    const { items, styles } = await pagePdf.getTextContent();
    const findObject = findObjects(items, keyword);
    const { objects, begin: indexBegin, end } = findObject;
    if (indexBegin < 0) return;
    if (!objects.length) return;

    const colorHighlight = "#ff00f0";
    const isBorderHighlight = false;

    let indexSub = indexBegin;
    for (let index = 0; index < objects.length; index++) {
      const object = objects[index];
      const str = object.str;
      const style = styles[object.fontName];
      ctx.save();
      ctx.beginPath();
      ctx.font = `${object.transform[3] * viewport.scale}px ${
        style.fontFamily
      }`;
      let indexLoop = 0;
      const spacing: number = makeSpacing(
        object.width,
        str,
        viewport.scale,
        ctx,
        0.3,
        indexLoop,
      ) as number;
      (ctx as any).letterSpacing = `${spacing}px`;
      let w1 = 0;
      let w2 = 0;
      if (!index) {
        w1 = ctx.measureText(str.substring(0, indexSub)).width;
        w2 = ctx.measureText(
          str.substring(indexSub + keyword.length, str.length),
        ).width;
      } else if (index === objects.length - 1) {
        const textEnd = str.slice(end, str.length);
        w2 = ctx.measureText(textEnd).width;
      }
      const w = (object.width - (w1 + w2) / viewport.scale) * viewport.scale;
      const x = Math.floor(object.transform[4] + w1 / viewport.scale);
      if (isBorderHighlight) {
        ctx.strokeStyle = colorHighlight;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = colorHighlight;
        ctx.globalAlpha = 0.2;
      }
      const y =
        viewport.height -
        object.transform[5] -
        object.height +
        style.ascent -
        style.descent;

      if (!isBorderHighlight) {
        ctx.fillRect(
          x * viewport.scale - viewport.scale / 2,
          y * viewport.scale,
          w,
          object.height * viewport.scale,
        );
      } else {
        ctx.strokeRect(
          x * viewport.scale - viewport.scale / 2,
          y * viewport.scale,
          w,
          object.height * viewport.scale,
        );
      }
      ctx.closePath();
      ctx.restore();
      indexSub += str.length;
    }
    return;
  };

  useEffect(() => {
    const load = async () => {
      let loading = pdf.getDocument({
        url: props.url,
      });

      let doc = await loading.promise;

      doc.getPage(1).then(async (page) => {
        let viewport = page.getViewport({ scale: 1 });
        let canvas = canvasRef.current;
        if (canvas) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          let renderContext = {
            canvasContext: canvas.getContext("2d")!,
            viewport: viewport,
          };
          const task = page.render(renderContext);
          await task.promise;
          await highlightText(
            page,
            props.searchFor,
            renderContext.canvasContext!,
            {
              width: viewport.width,
              height: viewport.height,
              scale: viewport.scale,
            },
          );
        }
      });
    };

    load();
  }, []);

  return (
    <div>
      <div>Hi I should render</div>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};
