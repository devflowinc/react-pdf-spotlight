import { useState } from "react";
import { PdfSpotlight } from "react-pdf-spotlight";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="max-w-[400px]">
        <PdfSpotlight
          page={1}
          scaleMultiplier={4}
          padding={{
            horizontal: 80,
            vertical: 100,
          }}
          searchFor="project"
          url="https://public.drewh.net/pdfs/projdesc.pdf"
        />
      </div>
      <h1 className="bg-blue-500">Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
