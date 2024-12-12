import { Component, type CSSProperties } from "react";

type Contents = {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
};

type Props = {
  url?: string;
  width?: number | string;
  scale?: number;
  page?: number;
  pageSearch?: number;
  onLoaded?: (error?: any) => void;
  onStartLoad?: (error?: any) => void;
  keywords?: string[];
  colorHighlight?: string;
  isBorderHighlight?: boolean;
  styleWrap?: CSSProperties;
  debug?: boolean;
  allowHtml?: boolean;
  extractLetterSpacing?: number;
  specialWordRemoves?: string[];
  maxKeywordLength?: number;
};

type ValueFindObject = {
  objects: Contents[];
  begin: number;
  end: number;
  matching: string;
};

const __DEV__ = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

const DEFAULT_CDN_PDFJS =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

const DEFAULT_CDN_WORKER =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const DEFAULT_INTEGRITY =
  "sha512-q+4liFwdPC/bNdhUpZx6aXDx/h77yEQtn4I1slHydcbZK34nLaR3cAeYSJshoxIOq3mjEf7xJE8YWIUHMn+oCQ==";

class PDFHighlight extends Component<Props> {
  private remove?: () => void;
  private pdf?: any;
  private refCanvasWrap?: HTMLDivElement | null;
  private removeResize?: () => void;
  private timeoutRender?: NodeJS.Timeout;

  componentDidMount(): void {
    const { onStartLoad } = this.props;
    onStartLoad?.();
    this.appendScript();
    window.addEventListener("resize", this.loadResize);
    this.removeResize = () => {
      window.removeEventListener("resize", this.loadResize);
    };
  }

  private isObjectEqual = (obj1: any, obj2: any) => {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== typeof obj2) return false;
    const obj1Keys = Object.keys(obj1);
    const obj2Keys = Object.keys(obj2);
    if (obj1Keys.length !== obj2Keys.length) {
      return false;
    }
    let isEqual = true;
    for (let key of obj1Keys) {
      if (obj1[key] !== obj2[key]) {
        isEqual = false;
        break;
      }
    }
    return isEqual;
  };

  private isEqualKeyword = (keywords?: string[], keywords2?: string[]) => {
    if (keywords === keywords2) return true;
    if (keywords?.length !== keywords2?.length) return false;
    if (keywords2?.some((e) => !keywords?.includes(e))) return false;
    return true;
  };

  shouldComponentUpdate(nProps: Props): boolean {
    const { width, keywords, onStartLoad, styleWrap, debug, url } = this.props;
    const keys: (keyof Props)[] = [
      "scale",
      "page",
      "pageSearch",
      "isBorderHighlight",
      "colorHighlight",
    ];
    if (url !== nProps.url) {
      if (debug && __DEV__) {
        console.info(
          "Reload key change => ",
          keys.find((key) => this.props[key] !== nProps[key]),
        );
      }
      onStartLoad?.();
      this.loadPDf(nProps).then(() => this.renderPage(nProps));
    } else if (
      !this.isEqualKeyword(nProps.keywords, keywords) ||
      !this.isObjectEqual(styleWrap, nProps.styleWrap) ||
      keys.some((key) => this.props[key] !== nProps[key])
    ) {
      if (debug && __DEV__) {
        console.info(
          "Reload keyword or style => ",
          "keyword ? ",
          this.isEqualKeyword(nProps.keywords, keywords),
          ", styleWrap ? ",
          this.isObjectEqual(styleWrap, nProps.styleWrap),
        );
      }
      onStartLoad?.();
      this.renderPage(nProps);
    }
    return width !== nProps.width;
  }

  componentWillUnmount(): void {
    this.remove?.();
    this.removeResize?.();
  }

  private appendScript = async (props = this.props) => {
    let head = document.querySelector("head");
    const cdn = DEFAULT_CDN_PDFJS;
    if (!head) {
      head = document.createElement("head");
      document.querySelector("html")?.appendChild(head);
    }
    if (!head) return;
    if (document.querySelector(`script[src="${cdn}"]`)) {
      return this.pdfLoaded();
    }
    const script = document.createElement("script");
    script.src = cdn;
    script.setAttribute("crossorigin", "anonymous");
    script.setAttribute("integrity", DEFAULT_INTEGRITY);
    script.setAttribute("referrerpolicy", "no-referrer");
    head.appendChild(script);
    script.onload = this.pdfLoaded;
    this.remove = () => head?.removeChild(script);
  };

  private pdfLoaded = async () => {
    try {
      await this.initPdf();
      await this.loadPDf();
      this.renderPage();
    } catch (e: any) {
      console.error(e.message || e);
    }
  };

  private loadResize = () => {
    if (this.timeoutRender) clearTimeout(this.timeoutRender);
    this.timeoutRender = setTimeout(async () => {
      const { debug } = this.props;
      if (debug && __DEV__) {
        console.info("Resize PDF");
      }
      const { onStartLoad } = this.props;
      onStartLoad?.();
      this.renderPage();
    }, 100);
  };

  private initPdf = async () => {
    let interval: NodeJS.Timeout;
    let loop = 0;
    return new Promise((res, rej) => {
      let pdfjsLib = (window?.globalThis as any)?.pdfjsLib;
      if (!pdfjsLib) {
        interval = setInterval(() => {
          loop++;
          if ((window?.globalThis as any)?.pdfjsLib || loop === 60) {
            pdfjsLib = (window?.globalThis as any)?.pdfjsLib;
            if (pdfjsLib) {
              pdfjsLib.GlobalWorkerOptions.workerSrc = DEFAULT_CDN_WORKER;
              res(null);
            } else rej("Browser loaded PDFJs Failed");
            clearInterval(interval);
          }
        }, 100);
      } else {
        pdfjsLib.GlobalWorkerOptions.workerSrc = DEFAULT_CDN_WORKER;
        res(null);
      }
    });
  };

  private loadPDf = async (props = this.props) => {
    const { url } = props;
    if (!url) return;
    return new Promise((res, rej) => {
      const { pdfjsLib } = window.globalThis as any;
      const loadingTask = pdfjsLib.getDocument(url);
      loadingTask.promise.then((pdf: any) => this.setPdf(pdf, res)).catch(rej);
    });
  };

  private setPdf = (pdf: any, callback: (pdf: any) => void) => {
    this.pdf = pdf;
    callback(pdf);
  };

  private renderPage = async (props = this.props) => {
    if (!this.pdf) return;
    if (this.refCanvasWrap) this.refCanvasWrap.innerHTML = "";
    const { onLoaded, page } = props;
    try {
      if (page) {
        const pagePdf = await this.pdf.getPage(page);
        await this.renderPdf(pagePdf, props, page);
      } else {
        const totalPages = this.pdf.numPages;
        let promises = [];
        for (let i = 1; i <= totalPages; i++) {
          const pagePdf = await this.pdf.getPage(i);
          promises.push(this.renderPdf(pagePdf, props, i));
        }
        await Promise.all(promises);
      }
      onLoaded?.();
    } catch {
      onLoaded?.();
    }
  };

  private renderPdf = async (
    pagePdf: any,
    props = this.props,
    page: number,
  ) => {
    if (!this.refCanvasWrap) return;
    const { width } = this.refCanvasWrap.getBoundingClientRect();
    const {
      keywords = [],
      scale = 1,
      pageSearch,
      allowHtml,
      maxKeywordLength = 2000,
    } = props;

    const div = document.createElement("div");
    div.id = `wrap-canvas-page-${page}`;
    div.style.position = "relative";

    const id = `canvas-page-${page}`;
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.id = id;

    div.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let viewport = pagePdf.getViewport({ scale: 1 });
    const size = viewport;
    let newScale = Math.ceil(width / viewport.width);
    if (newScale < scale) {
      newScale = scale;
    }
    const exist = document.querySelector(`#${id}`);
    if (exist) this.refCanvasWrap.removeChild(exist);
    this.refCanvasWrap.appendChild(div);
    viewport = pagePdf.getViewport({ scale: newScale });
    if (allowHtml) {
      this.appendTextToCanvas(pagePdf, div, newScale, viewport.width / width);
    }
    canvas.style.width = `${width}px`;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderTask = await pagePdf.render({ canvasContext: ctx, viewport });
    await renderTask.promise;
    if (pageSearch && pageSearch !== page) return;
    const promiseAll = keywords.map(async (keyword) => {
      if (maxKeywordLength && keyword.length > maxKeywordLength) {
        console.warn("Keywords are too big: " + keyword.length + " characters");
      }
      return this.hightlightText(
        pagePdf,
        keyword,
        ctx,
        {
          ...size,
          scale: newScale,
        },
        props,
      );
    });
    return Promise.all(promiseAll);
  };

  private appendTextToCanvas = async (
    pagePdf: any,
    parent: HTMLDivElement,
    scale: number,
    scaleReal: number,
  ) => {
    const { items, styles } = await pagePdf.getTextContent();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const style = styles[item.fontName];
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.color = "transparent";
      div.style.fontFamily = style.fontFamily;
      div.style.fontSize = `${(item.transform[3] * scale) / scaleReal}px`;
      div.style.letterSpacing = `${0.3}px`;
      div.style.minWidth = `${(item.width * scale) / scaleReal}px`;
      div.style.left = `${(item.transform[4] * scale) / scaleReal}px`;
      div.style.bottom = `${(item.transform[5] * scale) / scaleReal}px`;
      div.innerHTML = item.str;
      parent.appendChild(div);
    }
  };

  private makeSpacing = (
    width: number,
    str: string,
    scale: number,
    ctx: any,
    spacing: number,
    indexLoop: number,
  ): number => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari || indexLoop > 500) return spacing;
    const { extractLetterSpacing = 0.1 } = this.props;
    ctx.save();
    ctx.letterSpacing = `${spacing * scale}px`;
    const { width: w } = ctx.measureText(str);
    ctx.restore();
    if (
      Math.floor(w / scale) - 4 * scale <= Math.floor(width) &&
      Math.floor(w / scale) + 4 * scale >= Math.floor(width)
    ) {
      return spacing;
    }
    indexLoop++;
    if (Math.floor(w / scale) > Math.floor(width)) {
      return this.makeSpacing(
        width,
        str,
        scale,
        ctx,
        spacing - extractLetterSpacing,
        indexLoop,
      );
    }
    return this.makeSpacing(
      width,
      str,
      scale,
      ctx,
      spacing + extractLetterSpacing,
      indexLoop,
    );
  };

  private hightlightText = async (
    pagePdf: any,
    keyword: string,
    ctx: CanvasRenderingContext2D,
    viewport: { width: number; height: number; scale: number },
    props = this.props,
  ) => {
    if (!keyword) return;
    const { items, styles } = await pagePdf.getTextContent();
    const findObject = this.findObjects(items, keyword);
    const { objects, begin: indexBegin, end } = findObject;
    if (indexBegin < 0) return;
    if (!objects.length) return;

    const { colorHighlight = "yellow", isBorderHighlight } = props;

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
      const spacing: number = this.makeSpacing(
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

  private parseKeyword = (word: string) => {
    const { specialWordRemoves } = this.props;
    let keyword = word.replace(/\n/g, " ").trim();
    specialWordRemoves?.forEach((key) => {
      keyword = keyword.replaceAll(key, " ");
    });
    return keyword;
  };

  private deleteSpace = (word: string) => {
    return word.replaceAll(" ", "");
  };

  private get_end_pdf_Is_start_search(pdf: string, search: string) {
    let startIndex = -1;
    let length = Math.min(pdf.length, search.length);
    let longestCommon = "";
    const strBTrim = this.deleteSpace(search);
    for (let i = length; i > 0; i--) {
      const partOfString1 = pdf.substring(pdf.length - i);
      if (strBTrim.startsWith(this.deleteSpace(partOfString1))) {
        startIndex = pdf.length - i;
        longestCommon = partOfString1;
        break;
      }
    }
    return { longestCommon, startIndex };
  }

  private get_start_pdf_Is_start_search(pdf: string, search: string) {
    let startIndex = -1;
    let length = Math.min(pdf.length, search.length);
    let longestCommon = "";
    const strBTrim = this.deleteSpace(search);
    for (let i = 1; i <= length; i++) {
      const partOfString1 = pdf.substring(0, i);
      if (strBTrim.startsWith(this.deleteSpace(partOfString1))) {
        startIndex = i - partOfString1.length;
        longestCommon = partOfString1;
      }
    }
    return { longestCommon, startIndex };
  }

  private findObjects = (
    contents: Contents[],
    keyword: string,
  ): ValueFindObject => {
    const { debug, maxKeywordLength = 2000 } = this.props;
    let stringSearch = this.parseKeyword(keyword).substring(
      0,
      maxKeywordLength || 2000,
    );
    const object = contents.find((e) => e.str.includes(stringSearch));
    if (debug && __DEV__) {
      console.log(
        "------------------------------ INFO ------------------------------",
      );
      console.info(contents);
    }
    if (object) {
      const strs = this.parseKeyword(object.str).split(stringSearch);
      const { startIndex, longestCommon } = {
        startIndex: strs[0].length,
        longestCommon: strs[0],
      };
      if (debug && __DEV__) {
        console.info("start matching => ", startIndex, "keyword => ", keyword);
      }
      return {
        objects: [object],
        begin: startIndex,
        end: longestCommon.length,
        matching: keyword,
      };
    }
    let values: ValueFindObject = {
      objects: [],
      begin: -1,
      end: -1,
      matching: "",
    };

    for (let i = 0; i < contents.length; i++) {
      const str = this.parseKeyword(contents[i].str);
      if (!str.trim()) continue;
      if (!values.objects.length) {
        const { startIndex, longestCommon } = this.get_end_pdf_Is_start_search(
          str,
          stringSearch,
        );
        if (startIndex > -1) {
          values.objects.push(contents[i]);
          values.begin = startIndex;
          values.matching = longestCommon;
          stringSearch = stringSearch.trim().replace(longestCommon.trim(), "");
          if (debug && __DEV__) {
            console.info(
              "get_end_pdf_Is_start_search",
              "start matching => ",
              startIndex,
              "keyword => ",
              longestCommon,
              "object begin => ",
              contents[i],
            );
          }
        }
        continue;
      }
      if (!stringSearch.trim()) break;
      const { startIndex, longestCommon } = this.get_start_pdf_Is_start_search(
        str,
        stringSearch,
      );
      if (startIndex > -1) {
        values.objects.push(contents[i]);
        values.matching += longestCommon;
        stringSearch = stringSearch
          .trim()
          .substring(startIndex + longestCommon.length, stringSearch.length);
        values.end = longestCommon.length;
        if (debug && __DEV__) {
          console.info(values.matching);
        }
      } else {
        if (debug && __DEV__) {
          if (debug && __DEV__) {
            console.error(
              "------------------------------ NOT MATCH ------------------------------",
            );
            console.log("string check", str);
            console.log("string search", stringSearch);
            console.error(
              "------------------------------ NOT MATCH ------------------------------",
            );
          }
        }
        values.objects = [];
        values.begin = -1;
        values.end = -1;
        values.matching = "";
        stringSearch = this.parseKeyword(keyword);
      }
    }
    if (debug && __DEV__) {
      console.log(
        "------------------------------ INFO ------------------------------",
      );
    }
    return values;
  };

  render() {
    const { width = "100%", styleWrap } = this.props;
    return (
      <div
        ref={(ref) => (this.refCanvasWrap = ref)}
        style={{
          width,
          minHeight: "100%",
          overflow: "auto",
          ...(styleWrap || {}),
        }}
      />
    );
  }
}

export default PDFHighlight;
