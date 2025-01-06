import { PdfPageHighlight, PdfSpotlight } from "react-pdf-spotlight";

export const Cards = () => {
  return (
    <div className="bg-neutral-400 h-screen">
      <div>Cards</div>
      <div className="grid grid-cols-3 p-4 gap-2">
        {/* <Card page={1} search="Overview" /> */}
        {/* <Card page={5} search="system" /> */}
      </div>
      <PdfPageHighlight
        page={5}
        searchFor="system"
        scale={2}
        url={
          "http://127.0.0.1:9000/trieve/44dce6b7-e984-4dbb-8948-a8b090206cf7?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ZaaZZaaZZaaZZaaZZaaZ%2F20250106%2F%2Fs3%2Faws4_request&X-Amz-Date=20250106T182343Z&X-Amz-Expires=6000&X-Amz-SignedHeaders=host&response-content-type=application%2Fjson&response-content-disposition=attachment%3B%20filename%3D%22projdescagainagain.pdf%22&X-Amz-Signature=a1635a38841d8385947a5f731122d67ea311db5d49af1cedd65b0419e01892e6"
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
            "http://127.0.0.1:9000/trieve/44dce6b7-e984-4dbb-8948-a8b090206cf7?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ZaaZZaaZZaaZZaaZZaaZ%2F20250106%2F%2Fs3%2Faws4_request&X-Amz-Date=20250106T182343Z&X-Amz-Expires=6000&X-Amz-SignedHeaders=host&response-content-type=application%2Fjson&response-content-disposition=attachment%3B%20filename%3D%22projdescagainagain.pdf%22&X-Amz-Signature=a1635a38841d8385947a5f731122d67ea311db5d49af1cedd65b0419e01892e6"
          }
        />
      </div>
    </div>
  );
};
