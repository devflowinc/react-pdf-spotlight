import { PdfSpotlight } from "react-pdf-spotlight";

export const Cards = () => {
  return (
    <div className="bg-neutral-400 h-screen">
      <div>Cards</div>
      <div className="grid grid-cols-3 p-4 gap-2">
        <Card page={1} search="Overview" />
        <Card page={5} search="system" />
      </div>
    </div>
  );
};

const Card = ({ page, search }: any) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-3 flex flex-col justify-between">
      <div className="justify-between"></div>
      <div className="border border-neutral-400">
        <PdfSpotlight
          page={page}
          padding={{
            horizontal: 80,
            vertical: 90,
          }}
          searchFor={search}
          url={
            "http://127.0.0.1:9000/trieve/6d8abbb5-e2a5-4b0f-80cc-3b4378d71063?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ZaaZZaaZZaaZZaaZZaaZ%2F20241221%2F%2Fs3%2Faws4_request&X-Amz-Date=20241221T221713Z&X-Amz-Expires=6000&X-Amz-SignedHeaders=host&response-content-type=application%2Fpdf&response-content-disposition=attachment%3B%20filename%2A%3Dutf-8%27%27projdesc2.pdf&X-Amz-Signature=52cb5aacacd21516460725d09ad4fc4c25ebeb96f0725ed0332e4632c261ca23"
          }
        />
      </div>
    </div>
  );
};
