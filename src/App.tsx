import React, { useState } from 'react';
import CurlParser from './components/CurlParser';

function App() {
  const [curlCommand, setCurlCommand] = useState('');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Curl Command Parser and Editor</h1>
      <div className="w-full max-w-3xl">
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          rows={4}
          placeholder="Enter your curl command here..."
          value={curlCommand}
          onChange={(e) => setCurlCommand(e.target.value)}
        />
        <CurlParser curlCommand={curlCommand} />
      </div>
    </div>
  );
}

export default App;