import { PdfPageHighlight, PdfSpotlight } from "react-pdf-spotlight";

export const Cards = () => {
  return (
    <div className="bg-neutral-400 h-screen">
      <div>Cards</div>
      <div className="grid grid-cols-3 p-4 gap-2">
        <Card page={1} search="Overview" />
        <Card page={5} search="system" />
      </div>
      <PdfPageHighlight
        page={5}
        searchFor="system"
        url={
          "http://127.0.0.1:9000/trieve/44dce6b7-e984-4dbb-8948-a8b090206cf7?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ZaaZZaaZZaaZZaaZZaaZ%2F20250102%2F%2Fs3%2Faws4_request&X-Amz-Date=20250102T182542Z&X-Amz-Expires=6000&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%2A%3Dutf-8%27%27projdescagainagain.pdf&response-content-type=application%2Fpdf&X-Amz-Signature=051b510ad543e50d78dc3398fb4431f3f514582f669934222b77825e16fd7d93"
        }
      />
    </div>
  );
};

const Card = ({ page, search }: any) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-3 flex flex-col justify-between">
      <div className="justify-between"></div>
      <div className="border border-neutral-400">
        <PdfSpotlight
          height={200}
          page={page}
          padding={{
            horizontal: 180,
            vertical: 90,
          }}
          searchFor={search}
          url={
            "http://127.0.0.1:9000/trieve/44dce6b7-e984-4dbb-8948-a8b090206cf7?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ZaaZZaaZZaaZZaaZZaaZ%2F20250102%2F%2Fs3%2Faws4_request&X-Amz-Date=20250102T182542Z&X-Amz-Expires=6000&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%2A%3Dutf-8%27%27projdescagainagain.pdf&response-content-type=application%2Fpdf&X-Amz-Signature=051b510ad543e50d78dc3398fb4431f3f514582f669934222b77825e16fd7d93"
          }
        />
      </div>
    </div>
  );
};
