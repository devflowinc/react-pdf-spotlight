import { useState } from "react";
import { PdfSpotlight } from "react-pdf-spotlight";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="max-w-[400px]">
        <PdfSpotlight
          page={6}
          scaleMultiplier={4}
          padding={{
            horizontal: 80,
            vertical: 100,
          }}
          searchFor="opening page"
          url={
            "https://arguflow-s3bucket.s3.amazonaws.com/arguflow-s3bucket/43a9e311-59af-45f2-9674-b2ce7c92df9e?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATYAYHRLGO765FEGX%2F20241221%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20241221T202033Z&X-Amz-Expires=6000&X-Amz-SignedHeaders=host&response-content-type=application%2Fpdf&response-content-disposition=attachment%3B%20filename%2A%3Dutf-8%27%27projdesc.pdf&X-Amz-Signature=e246bdae7d52552577f9138f67546e99917b8bdf768c7865be19edf3d2e53693"
          }
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
