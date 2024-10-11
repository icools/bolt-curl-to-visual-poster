import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ParsedCurl {
  method: string;
  url: string;
  headers: { [key: string]: string };
  body: string;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const CurlParser: React.FC<{ curlCommand: string }> = ({ curlCommand }) => {
  const [parsedCurl, setParsedCurl] = useState<ParsedCurl>({
    method: 'GET',
    url: '',
    headers: {},
    body: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseCurl = (curl: string) => {
      setError(null);
      try {
        const parsed: ParsedCurl = {
          method: 'GET',
          url: '',
          headers: {},
          body: '',
        };

        // Determine if it's a CMD curl command (contains ^)
        const isCmdCurl = curl.includes('^');

        // Remove line breaks and handle CMD-style continuations
        const cleanedCurl = curl
          .replace(/\s*\^\s*/g, ' ')  // Remove CMD line continuations
          .replace(/\\\s*\n/g, ' ')   // Remove bash line continuations
          .replace(/\n/g, ' ');       // Remove any remaining line breaks

        // Extract URL (works for both bash and CMD)
        const urlMatch = cleanedCurl.match(/curl\s+(?:"|')?([^"'\s]+)/);
        if (urlMatch) {
          parsed.url = urlMatch[1];
        } else {
          throw new Error('Unable to parse URL from curl command');
        }

        // Extract headers
        const headerRegex = isCmdCurl
          ? /-H\s+(?:"|')([^"']+)(?:"|')/g
          : /-H\s+'([^']+)'/g;

        let headerMatch;
        while ((headerMatch = headerRegex.exec(cleanedCurl)) !== null) {
          let [key, ...valueParts] = headerMatch[1].split(/:\s*/);
          let value = valueParts.join(': ').trim();
          
          // Handle escaped quotes
          value = isCmdCurl
            ? value.replace(/\^\^"/g, '"').replace(/\^"/g, '"')
            : value.replace(/\\"/g, '"');
          
          // Remove surrounding quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          
          parsed.headers[key] = value;
        }

        // Check for method
        const methodMatch = cleanedCurl.match(/-X\s+(\w+)/);
        if (methodMatch) {
          const method = methodMatch[1].toUpperCase();
          parsed.method = HTTP_METHODS.includes(method) ? method : 'GET';
        }

        // Check for body
        const bodyRegex = isCmdCurl
          ? /-d\s+(?:"|')([^"']+)(?:"|')/
          : /-d\s+'([^']+)'/;
        const bodyMatch = cleanedCurl.match(bodyRegex);
        if (bodyMatch) {
          parsed.body = bodyMatch[1];
        }

        setParsedCurl(parsed);
      } catch (err) {
        console.error('Error parsing curl command:', err);
        setError('Error parsing curl command. Please check your input.');
      }
    };

    if (curlCommand) {
      parseCurl(curlCommand);
    }
  }, [curlCommand]);

  const handleInputChange = (
    field: keyof ParsedCurl,
    value: string | { [key: string]: string }
  ) => {
    setParsedCurl((prev) => ({ ...prev, [field]: value }));
  };

  const handleHeaderChange = (key: string, value: string) => {
    setParsedCurl((prev) => ({
      ...prev,
      headers: { ...prev.headers, [key]: value },
    }));
  };

  const handleSend = async () => {
    try {
      if (!parsedCurl.url) {
        throw new Error('URL is required');
      }

      const response = await fetch(parsedCurl.url, {
        method: parsedCurl.method,
        headers: parsedCurl.headers,
        body: parsedCurl.method !== 'GET' ? parsedCurl.body : undefined,
      });
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log('Response:', data);
      alert('Request sent successfully. Check console for response.');
    } catch (error) {
      console.error('Error:', error);
      setError(`Error sending request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Method</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          value={parsedCurl.method}
          onChange={(e) => handleInputChange('method', e.target.value)}
        >
          {HTTP_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">URL</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          value={parsedCurl.url}
          onChange={(e) => handleInputChange('url', e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Headers</label>
        {Object.entries(parsedCurl.headers).map(([key, value]) => (
          <div key={key} className="flex mt-2">
            <input
              type="text"
              className="flex-1 rounded-l-md border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              value={key}
              onChange={(e) => {
                const newHeaders = { ...parsedCurl.headers };
                delete newHeaders[key];
                newHeaders[e.target.value] = value;
                handleInputChange('headers', newHeaders);
              }}
            />
            <input
              type="text"
              className="flex-1 rounded-r-md border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              value={value}
              onChange={(e) => handleHeaderChange(key, e.target.value)}
            />
          </div>
        ))}
        <button
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          onClick={() => handleHeaderChange(`header${Object.keys(parsedCurl.headers).length + 1}`, '')}
        >
          Add Header
        </button>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Body</label>
        <textarea
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          rows={4}
          value={parsedCurl.body}
          onChange={(e) => handleInputChange('body', e.target.value)}
        />
      </div>
      <button
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={handleSend}
        disabled={!parsedCurl.url}
      >
        <Send className="mr-2 h-4 w-4" /> Send Request
      </button>
    </div>
  );
};

export default CurlParser;