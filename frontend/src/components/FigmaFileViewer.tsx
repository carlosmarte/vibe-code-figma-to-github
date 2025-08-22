import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface FigmaFileViewerProps {
  fileId: string;
}

interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: any;
  components: any;
  styles: any;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3200';

export function FigmaFileViewer({ fileId }: FigmaFileViewerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'structure' | 'export'>('details');

  const { data: fileData, isLoading, error } = useQuery<FigmaFile>({
    queryKey: ['figmaFile', fileId],
    queryFn: async () => {
      // Don't specify depth - let Figma API return full document
      const response = await fetch(`${API_BASE_URL}/api/figma/files/${fileId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Figma file');
      }
      return response.json();
    },
    enabled: !!fileId,
  });

  const { data: versions } = useQuery({
    queryKey: ['figmaVersions', fileId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/figma/files/${fileId}/versions`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!fileId,
  });

  const handleExportJSON = () => {
    if (!fileData) return;
    
    const dataStr = JSON.stringify(fileData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${fileData.name || fileId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">Loading Figma file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-900 font-semibold mb-2">Error Loading File</h3>
        <p className="text-red-700">{(error as Error).message}</p>
        <p className="text-sm text-red-600 mt-2">
          Make sure the file ID is correct and the FIGMA_TOKEN is configured on the backend.
        </p>
      </div>
    );
  }

  if (!fileData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            File Details
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'structure'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Document Structure
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Export
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{fileData.name}</h2>
              
              {fileData.thumbnailUrl && (
                <div className="mb-6">
                  <img 
                    src={fileData.thumbnailUrl} 
                    alt={fileData.name}
                    className="rounded-lg shadow-md max-w-full h-auto"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Modified</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(fileData.lastModified).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Version</h3>
                  <p className="mt-1 text-sm text-gray-900">{fileData.version}</p>
                </div>

                {fileData.components && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Components</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {Object.keys(fileData.components).length} components
                    </p>
                  </div>
                )}

                {fileData.styles && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Styles</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {Object.keys(fileData.styles).length} styles
                    </p>
                  </div>
                )}
              </div>
            </div>

            {versions?.versions && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Version History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {versions.versions.slice(0, 10).map((version: any) => (
                    <div key={version.id} className="border-l-2 border-gray-200 pl-4 py-2">
                      <p className="text-sm font-medium text-gray-900">{version.label || `Version ${version.id}`}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(version.created_at).toLocaleString()}
                      </p>
                      {version.description && (
                        <p className="text-sm text-gray-600 mt-1">{version.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'structure' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Structure</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-xs text-gray-700">
                {JSON.stringify(fileData.document, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Export as JSON</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Download the complete file data including document structure, components, and styles.
                  </p>
                  <button
                    onClick={handleExportJSON}
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                  >
                    Download JSON
                  </button>
                </div>

                <div className="border rounded-lg p-4 opacity-50">
                  <h4 className="font-medium text-gray-900 mb-2">Export Images (Coming Soon)</h4>
                  <p className="text-sm text-gray-600">
                    Export specific nodes as PNG, SVG, or PDF files.
                  </p>
                </div>

                <div className="border rounded-lg p-4 opacity-50">
                  <h4 className="font-medium text-gray-900 mb-2">GitHub Export (Coming Soon)</h4>
                  <p className="text-sm text-gray-600">
                    Push file data directly to a GitHub repository.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}