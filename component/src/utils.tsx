type Contents = {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
};

type ValueFindObject = {
  objects: Contents[];
  begin: number;
  end: number;
  matching: string;
};

const __DEV__ = true;
const debug = true;

const parseKeyword = (word: string) => {
  let keyword = word.replace(/\n/g, " ").trim();
  return keyword;
};

const get_end_pdf_Is_start_search = (pdf: string, search: string) => {
  let startIndex = -1;
  let length = Math.min(pdf.length, search.length);
  let longestCommon = "";
  const strBTrim = search.replaceAll(" ", "");
  for (let i = length; i > 0; i--) {
    const partOfString1 = pdf.substring(pdf.length - i);
    if (strBTrim.startsWith(partOfString1.replaceAll(" ", ""))) {
      startIndex = pdf.length - i;
      longestCommon = partOfString1;
      break;
    }
  }
  return { longestCommon, startIndex };
};

const get_start_pdf_Is_start_search = (pdf: string, search: string) => {
  let startIndex = -1;
  let length = Math.min(pdf.length, search.length);
  let longestCommon = "";
  const strBTrim = search.replaceAll(" ", "");
  for (let i = 1; i <= length; i++) {
    const partOfString1 = pdf.substring(0, i);
    if (strBTrim.startsWith(partOfString1.replaceAll(" ", ""))) {
      startIndex = i - partOfString1.length;
      longestCommon = partOfString1;
    }
  }
  return { longestCommon, startIndex };
};

export const findObjects = (
  contents: Contents[],
  keyword: string,
): ValueFindObject => {
  const maxKeywordLength = 2000;
  let stringSearch = parseKeyword(keyword).substring(
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
    const strs = parseKeyword(object.str).split(stringSearch);
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
    const str = parseKeyword(contents[i].str);
    if (!str.trim()) continue;
    if (!values.objects.length) {
      const { startIndex, longestCommon } = get_end_pdf_Is_start_search(
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
    const { startIndex, longestCommon } = get_start_pdf_Is_start_search(
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
      stringSearch = parseKeyword(keyword);
    }
  }
  if (debug && __DEV__) {
    console.log(
      "------------------------------ INFO ------------------------------",
    );
  }
  return values;
};

export const makeSpacing = (
  width: number,
  str: string,
  scale: number,
  ctx: CanvasRenderingContext2D,
  spacing: number,
  indexLoop: number,
): number => {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari || indexLoop > 500) return spacing;
  // const { extractLetterSpacing = 0.1 } = this.props;
  const extractLetterSpacing = 0.1;

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
    return makeSpacing(
      width,
      str,
      scale,
      ctx,
      spacing - extractLetterSpacing,
      indexLoop,
    );
  }
  return makeSpacing(
    width,
    str,
    scale,
    ctx,
    spacing + extractLetterSpacing,
    indexLoop,
  );
};
