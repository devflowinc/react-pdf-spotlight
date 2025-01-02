import { useState } from "react";
import { PdfSpotlight } from "react-pdf-spotlight";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="max-w-[400px]">
        <PdfSpotlight
          height={200}
          page={6}
          padding={{
            horizontal: 80,
            vertical: 100,
          }}
          searchFor="opening page"
          url={
            "http://127.0.0.1:9000/trieve/44dce6b7-e984-4dbb-8948-a8b090206cf7?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ZaaZZaaZZaaZZaaZZaaZ%2F20250102%2F%2Fs3%2Faws4_request&X-Amz-Date=20250102T182542Z&X-Amz-Expires=6000&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%2A%3Dutf-8%27%27projdescagainagain.pdf&response-content-type=application%2Fpdf&X-Amz-Signature=051b510ad543e50d78dc3398fb4431f3f514582f669934222b77825e16fd7d93"
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
