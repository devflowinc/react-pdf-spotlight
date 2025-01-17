import * as pdf from "pdfjs-dist";

pdf.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs`;

import { useEffect, useRef } from "react";
import { findObjects, makeSpacing } from "./utils";
import { cached } from "./cache";

export type PdfSpotlightProps = {
  url: string;
  searchFor: string;
  padding?: {
    horizontal?: number;
    vertical?: number;
  };
  page: number;
  wrapStyle?: React.CSSProperties;
  canvasStyle?: React.CSSProperties;
  onFoundResult?: (found: boolean) => void;
  height: number; // Height is now required
};

export * from "./page-highlight";

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const PdfSpotlight = (props: PdfSpotlightProps) => {
  const tempCanvas = useRef<OffscreenCanvas | null>(null);
  const boundsRef = useRef<Bounds | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const highlightText = async (
    pagePdf: any,
    keyword: string,
    ctx: OffscreenCanvasRenderingContext2D,
    viewport: { width: number; height: number; scale: number },
  ) => {
    if (!keyword) {
      if (props.onFoundResult) {
        props.onFoundResult(false);
      }
      return;
    }
    // This is the slow line!
    const { items, styles } = await pagePdf.getTextContent();
    const findObject = findObjects(items, keyword);
    const { objects, begin: indexBegin, end } = findObject;
    if (indexBegin < 0 || !objects.length) {
      if (props.onFoundResult) {
        props.onFoundResult(false);
      }
      return;
    }

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
      const doc = await cached(
        async () => pdf.getDocument({ url: props.url }).promise,
        `doc${props.url}`,
      );
      doc.getPage(props.page).then(async (page) => {
        const viewport = page.getViewport({ scale: 1 });
        if (!tempCanvas.current) {
          tempCanvas.current = new OffscreenCanvas(
            viewport.width,
            viewport.height,
          );

          // First render the full page to a temporary canvas
          const tempCtx = tempCanvas.current.getContext("2d")!;
          const renderContext = {
            canvasContext: tempCtx,
            viewport: viewport,
          };

          const task = page.render(renderContext as any);
          await task.promise;

          boundsRef.current = await highlightText(
            page,
            props.searchFor,
            tempCtx,
            {
              width: viewport.width,
              height: viewport.height,
              scale: viewport.scale,
            },
          );

          if (!boundsRef.current && props.onFoundResult) {
            props.onFoundResult(false);
            return;
          }
        }

        if (boundsRef.current && canvasRef.current && containerRef.current) {
          const horizontalPadding = props.padding?.horizontal ?? 20;
          const verticalPadding = props.padding?.vertical ?? 20;

          // Calculate the padded bounds
          const paddedBounds = {
            x: boundsRef.current.x - horizontalPadding,
            y: boundsRef.current.y - verticalPadding,
            width: boundsRef.current.width + horizontalPadding * 2,
            height: boundsRef.current.height + verticalPadding * 2,
          };

          // Calculate the aspect ratio of the padded area
          const aspectRatio = paddedBounds.width / paddedBounds.height;

          // Set the canvas dimensions
          canvasRef.current.width = containerRef.current.clientWidth;
          canvasRef.current.height = props.height;

          const finalCtx = canvasRef.current.getContext("2d")!;

          // Clear the canvas
          finalCtx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height,
          );

          // Calculate the dimensions for drawing
          let drawWidth, drawHeight, offsetX, offsetY;
          if (
            canvasRef.current.width / canvasRef.current.height >
            aspectRatio
          ) {
            // Canvas is wider than needed
            drawHeight = canvasRef.current.height;
            drawWidth = drawHeight * aspectRatio;
            offsetX = (canvasRef.current.width - drawWidth) / 2;
            offsetY = 0;
          } else {
            // Canvas is taller than needed
            drawWidth = canvasRef.current.width;
            drawHeight = drawWidth / aspectRatio;
            offsetX = 0;
            offsetY = (canvasRef.current.height - drawHeight) / 2;
          }

          // Draw the padded portion of the temp canvas onto the final canvas (scaled)
          finalCtx.drawImage(
            tempCanvas.current,
            paddedBounds.x, // source x
            paddedBounds.y, // source y
            paddedBounds.width, // source width
            paddedBounds.height, // source height
            offsetX, // dest x
            offsetY, // dest y
            drawWidth, // dest width
            drawHeight, // dest height
          );

          if (props.onFoundResult) {
            props.onFoundResult(true);
          }
        }
      });
    };
    load();
  }, [props.url, props.searchFor, props.padding, props.height, props.page]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: props.height,
        overflow: "hidden",
        ...props.wrapStyle,
      }}
    >
      <canvas
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          ...props.canvasStyle,
        }}
        ref={canvasRef}
      />
    </div>
  );
};
