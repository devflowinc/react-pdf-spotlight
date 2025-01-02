import * as pdf from "pdfjs-dist";
pdf.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs`;
import { useEffect, useRef } from "react";
import { findObjects, makeSpacing } from "./utils";

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

      ctx.closePath();
      ctx.restore();
      indexSub += str.length;
    }

    if (props.onFoundResult) {
      props.onFoundResult(true);
    }
  };

  useEffect(() => {
    const load = async () => {
      const loading = pdf.getDocument({ url: props.url });
      const doc = await loading.promise;

      doc.getPage(props.page).then(async (page) => {
        const scale = props.scale || 1;
        const viewport = page.getViewport({ scale });

        if (canvasRef.current && containerRef.current) {
          canvasRef.current.height = viewport.height;
          canvasRef.current.width = viewport.width;

          const ctx = canvasRef.current.getContext("2d")!;

          // Render the page
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
          };

          await page.render(renderContext).promise;

          // Highlight the text
          await highlightText(page, props.searchFor, ctx, {
            width: viewport.width,
            height: viewport.height,
            scale: viewport.scale,
          });
        }
      });
    };

    load();
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
