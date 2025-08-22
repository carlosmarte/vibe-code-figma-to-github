import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FigmaFileViewer } from './components/FigmaFileViewer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const [fileId, setFileId] = useState('tmaZV2VEXIIrWYVjqaNUxa');
  const [submittedFileId, setSubmittedFileId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileId.trim()) {
      setSubmittedFileId(fileId.trim());
    }
  };

  const handleReset = () => {
    setFileId('');
    setSubmittedFileId('');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Figma File Viewer
            </h1>
            <p className="text-gray-600">
              Enter a Figma file ID to view and export file data
            </p>
          </header>

          {!submittedFileId ? (
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <label htmlFor="fileId" className="block text-sm font-medium text-gray-700 mb-2">
                    Figma File ID
                  </label>
                  <input
                    type="text"
                    id="fileId"
                    value={fileId}
                    onChange={(e) => setFileId(e.target.value)}
                    placeholder="Enter Figma file ID (e.g., abc123XYZ)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    You can find the file ID in the Figma URL: figma.com/file/<strong>[FILE_ID]</strong>/...
                  </p>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Load Figma File
                </button>
              </form>

              <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">Configuration Required</h3>
                <p className="text-sm text-amber-800">
                  Make sure the backend server has the FIGMA_TOKEN environment variable set with your Figma personal access token.
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Get your token from: <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noopener noreferrer" className="underline">
                    Figma Settings → Personal Access Tokens
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Viewing file: </span>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {submittedFileId}
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm bg-gray-600 text-white py-1 px-3 rounded hover:bg-gray-700 transition-colors"
                >
                  Load Different File
                </button>
              </div>
              
              <FigmaFileViewer fileId={submittedFileId} />
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;