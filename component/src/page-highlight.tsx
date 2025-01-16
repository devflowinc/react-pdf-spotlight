import * as pdf from "pdfjs-dist";
pdf.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs`;
import { useEffect, useRef } from "react";
import { findObjects, makeSpacing } from "./utils";
import { cached } from "./cache";

export type PdfPageHighlightProps = {
  url: string;
  searchFor: string;
  page: number;
  wrapStyle?: React.CSSProperties;
  canvasStyle?: React.CSSProperties;
  onFoundResult?: (found: boolean) => void;
  scale?: number;
};

export const PdfPageHighlight = (props: PdfPageHighlightProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const highlightText = async (
    pagePdf: any,
    keyword: string,
    ctx: CanvasRenderingContext2D,
    viewport: { width: number; height: number; scale: number },
  ) => {
    if (!keyword) {
      if (props.onFoundResult) {
        props.onFoundResult(false);
      }
      return;
    }
    const { items, styles } = await pagePdf.getTextContent();
    const findObject = findObjects(items, keyword);
    const { objects, begin: indexBegin, end } = findObject;
    if (indexBegin < 0 || !objects.length) {
      if (props.onFoundResult) {
        props.onFoundResult(false);
      }
      return;
    }
    const colorHighlight = "#ff00f0";
    let indexSub = indexBegin;

    for (let index = 0; index < objects.length; index++) {
      const object = objects[index];
      const str = object.str;
      const style = styles[object.fontName];
      ctx.save();
      ctx.beginPath();

      const fontSize = object.transform[3] * viewport.scale;
      ctx.font = `${fontSize}px ${style.fontFamily}`;

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
        // For first object, measure the text before the highlight
        w1 = ctx.measureText(str.substring(0, indexSub)).width;
      }

      // Calculate the width of the highlighted portion
      let highlightWidth;
      if (objects.length === 1) {
        // Single object case
        highlightWidth = ctx.measureText(
          str.substring(indexSub, indexSub + keyword.length),
        ).width;
      } else if (index === 0) {
        // First object in multi-object case
        highlightWidth = ctx.measureText(str.substring(indexSub)).width;
      } else if (index === objects.length - 1) {
        // Last object in multi-object case
        highlightWidth = ctx.measureText(str.substring(0, end)).width;
      } else {
        // Middle objects in multi-object case
        highlightWidth = ctx.measureText(str).width;
      }

      // Calculate position accounting for scale
      const x = object.transform[4] * viewport.scale + w1;
      const y =
        viewport.height -
        object.transform[5] * viewport.scale -
        object.height * viewport.scale;

      ctx.fillStyle = colorHighlight;
      ctx.globalAlpha = 0.2;

      // Draw highlight with scaled dimensions
      ctx.fillRect(x, y, highlightWidth, object.height * viewport.scale);

      ctx.closePath();
      ctx.restore();
      indexSub += str.length;
    }

    if (props.onFoundResult) {
      props.onFoundResult(true);
    }
  };

  useEffect(() => {
    let isCurrentRender = true; // Track if this is the current render

    const load = async () => {
      try {
        // Reset canvas if it exists
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d")!;
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height,
          );
        }

        const doc = await cached(
          async () => pdf.getDocument({ url: props.url }).promise,
          `doc${props.url}`,
        );
        const page = await doc.getPage(props.page);

        // Check if this is still the current render
        if (!isCurrentRender) return;

        const scale = props.scale || 1;
        const viewport = page.getViewport({ scale });

        if (canvasRef.current && containerRef.current) {
          // Set dimensions first
          canvasRef.current.height = viewport.height;
          canvasRef.current.width = viewport.width;

          const ctx = canvasRef.current.getContext("2d")!;

          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
          };

          // Wait for render to complete
          await page.render(renderContext).promise;

          // Check again if this is still the current render
          if (!isCurrentRender) return;

          await new Promise(requestAnimationFrame);

          if (props.searchFor) {
            await highlightText(page, props.searchFor, ctx, {
              width: viewport.width,
              height: viewport.height,
              scale: viewport.scale,
            });
          }
        }
      } catch (error) {
        console.error("Error rendering PDF:", error);
      }
    };

    load();

    // Cleanup function
    return () => {
      isCurrentRender = false;
    };
  }, [props.url, props.searchFor, props.page, props.scale]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflow: "auto",
        ...props.wrapStyle,
      }}
    >
      <canvas
        style={{
          display: "block",
          ...props.canvasStyle,
        }}
        ref={canvasRef}
      />
    </div>
  );
};
