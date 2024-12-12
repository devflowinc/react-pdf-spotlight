import { createContext, useEffect, useState, type ReactNode } from "react";
import pdf from "pdfjs-dist";
import { scripts } from "./scripts";

type PdfSpotlightProviderProps = {
  waitForLoad?: boolean;
  children: ReactNode;
};

type PdfSpotlightContext = {};

const defaultValue: PdfSpotlightContext = {};

const PdfSpotlightContext = createContext(defaultValue);

export const PdfSpotlightProvider = (props: PdfSpotlightProviderProps) => {
  return (
    <PdfSpotlightContext.Provider value={{}}>
      {props.children}
    </PdfSpotlightContext.Provider>
  );
};
