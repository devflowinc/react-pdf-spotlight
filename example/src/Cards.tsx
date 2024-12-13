import { PdfSpotlight } from "react-pdf-spotlight";

export const Cards = () => {
  return (
    <div className="bg-neutral-400 h-screen">
      <div>Cards</div>
      <div className="grid grid-cols-3 p-4 gap-2">
        <Card title="Card 1" description="This is a description for card 1" />
        <Card title="Card 2" description="This is a description for card 2" />
        <Card title="Card 3" description="This is a description for card 3" />
      </div>
    </div>
  );
};

const Card = ({ title, description }: any) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-3 flex flex-col justify-between">
      <div className="justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <span className="text-gray-500">{description}</span>
      </div>
      <div className="border border-neutral-400">
        <PdfSpotlight
          padding={{
            horizontal: 80,
            vertical: 90,
          }}
          searchFor="Visualizing and Operating"
          url="https://public.drewh.net/pdfs/projdesc.pdf"
        />
      </div>
    </div>
  );
};
