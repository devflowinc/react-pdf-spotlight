import * as pdf from "pdfjs-dist";
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdf.GlobalWorkerOptions.workerSrc = pdfWorker;
import { useEffect, useRef, useState } from "react";
import { findObjects, makeSpacing } from "./utils";

export type PdfSpotlightProps = {
  url: string;
  searchFor: string;
  padding?: number; // padding around the highlighted area in pixels
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
    if (indexBegin < 0 || !objects.length) return;

    // Track the bounds of all highlighted areas
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const colorHighlight = "#ff00f0";
    let indexSub = indexBegin;

    for (let index = 0; index < objects.length; index++) {
      const object = objects[index];
      const str = object.str;
      const style = styles[object.fontName];
      ctx.save();
      ctx.beginPath();
      ctx.font = `${object.transform[3] * viewport.scale}px ${style.fontFamily}`;

      const spacing = makeSpacing(
        object.width,
        str,
        viewport.scale,
        ctx,
        0.3,
        0,
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
      const y =
        viewport.height -
        object.transform[5] -
        object.height +
        style.ascent -
        style.descent;

      ctx.fillStyle = colorHighlight;
      ctx.globalAlpha = 0.2;

      // Draw highlight
      ctx.fillRect(
        x * viewport.scale - viewport.scale / 2,
        y * viewport.scale,
        w,
        object.height * viewport.scale,
      );

      // Update bounds
      minX = Math.min(minX, x * viewport.scale - viewport.scale / 2);
      minY = Math.min(minY, y * viewport.scale);
      maxX = Math.max(maxX, x * viewport.scale - viewport.scale / 2 + w);
      maxY = Math.max(
        maxY,
        y * viewport.scale + object.height * viewport.scale,
      );

      ctx.closePath();
      ctx.restore();
      indexSub += str.length;
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  useEffect(() => {
    const load = async () => {
      const loading = pdf.getDocument({ url: props.url });
      const doc = await loading.promise;
      doc.getPage(1).then(async (page) => {
        const viewport = page.getViewport({ scale: 1 });
        const tempCanvas = document.createElement("canvas");
        tempCanvas.height = viewport.height;
        tempCanvas.width = viewport.width;

        // First render the full page to a temporary canvas
        const tempCtx = tempCanvas.getContext("2d")!;
        const renderContext = {
          canvasContext: tempCtx,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        await task.promise;

        // Highlight the text and get the bounds
        const bounds = await highlightText(page, props.searchFor, tempCtx, {
          width: viewport.width,
          height: viewport.height,
          scale: viewport.scale,
        });

        if (bounds && canvasRef.current) {
          const padding = props.padding || 20;

          // Set the final canvas size to match the highlighted area plus padding
          canvasRef.current.width = bounds.width + padding * 2;
          canvasRef.current.height = bounds.height + padding * 2;

          const finalCtx = canvasRef.current.getContext("2d")!;

          // Draw the cropped portion of the temp canvas onto the final canvas
          finalCtx.drawImage(
            tempCanvas,
            bounds.x - padding, // source x
            bounds.y - padding, // source y
            bounds.width + padding * 2, // source width
            bounds.height + padding * 2, // source height
            0, // dest x
            0, // dest y
            bounds.width + padding * 2, // dest width
            bounds.height + padding * 2, // dest height
          );
        }
      });
    };
    load();
  }, [props.url, props.searchFor, props.padding]);

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
