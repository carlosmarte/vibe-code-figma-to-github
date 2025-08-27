import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { Download, FileJson, Image, FileText, AlertCircle, Github, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GitHubExport } from '../components/GitHubExport';
import { useFigmaContext } from '../contexts/FigmaContext';

export const Export = () => {
  const navigate = useNavigate();
  const { fileId, selectedComponent } = useFigmaContext();
  
  const [format, setFormat] = useState<'json' | 'svg' | 'png' | 'pdf'>('json');
  const [scale, setScale] = useState(1);
  const [activeTab, setActiveTab] = useState<'traditional' | 'github'>('github'); // Default to GitHub tab

  const exportMutation = useMutation({
    mutationFn: async (data: {
      fileId: string;
      format: 'json' | 'svg' | 'png' | 'pdf';
      scale?: number;
      nodeId?: string;
    }) => {
      // Request with responseType blob to handle binary data
      const response = await api.post(`/figma/files/${data.fileId}/export`, {
        ids: data.nodeId ? [data.nodeId] : [],
        format: data.format,
        scale: data.scale
      }, {
        responseType: 'blob',
      });
      
      // Check if response is JSON (for multiple files case)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json') && response.data.size > 0) {
        // Parse JSON response for multiple files
        const text = await response.data.text();
        return JSON.parse(text);
      }
      
      // For single file, create download
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract filename from Content-Disposition header or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `figma-export-${data.fileId}.${data.format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return { success: true, downloaded: true };
    },
    onSuccess: (data) => {
      // Handle success
      if (data && data.type === 'urls') {
        // Multiple files - show links or handle differently
        console.log('Multiple files available:', data.data);
        alert('Multiple files exported. Check console for download URLs.');
      } else if (!data.downloaded) {
        console.log('Export successful');
      }
    },
    onError: (error) => {
      console.error('Export failed:', error);
      alert('Export failed. Please check the console for details.');
    },
  });

  const handleExport = () => {
    if (!fileId || !selectedComponent) {
      alert('Please select a component from the Extraction tab first');
      return;
    }

    exportMutation.mutate({
      fileId,
      format,
      scale: format === 'png' ? scale : undefined,
      nodeId: selectedComponent.id
    });
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: FileJson, description: 'Raw Figma file data' },
    { value: 'svg', label: 'SVG', icon: Image, description: 'Vector graphics format' },
    { value: 'png', label: 'PNG', icon: Image, description: 'Raster image format' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Document format' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Export Component</h1>
            <p className="text-gray-600 mt-2">
              {selectedComponent 
                ? `Export "${selectedComponent.name}" in various formats or push to GitHub`
                : 'Select a component first to export'}
            </p>
          </div>
          {!selectedComponent && (
            <button
              onClick={() => navigate('/extraction')}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              Select Component
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Export Type Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('traditional')}
                className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'traditional'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileJson size={18} />
                  Traditional Export
                </div>
              </button>
              <button
                onClick={() => setActiveTab('github')}
                className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'github'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Github size={18} />
                  GitHub Export
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'traditional' ? (
              <div className="space-y-6">
                {/* Selected Component Info */}
                {selectedComponent ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Selected Component:</p>
                      <p className="text-blue-700 mt-1">{selectedComponent.name}</p>
                      <p className="text-blue-600 text-xs mt-1">Type: {selectedComponent.type} | ID: {selectedComponent.id}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">No component selected. Please go to the Extraction tab to select a component.</p>
                  </div>
                )}

                {/* Format Selection */}
                <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                {formatOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormat(option.value as any)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        format === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon size={20} className={format === option.value ? 'text-blue-600' : 'text-gray-600'} />
                        <div>
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

                {/* Scale (for PNG) */}
                {format === 'png' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scale
                </label>
                <select
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x (Original)</option>
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                  <option value={4}>4x</option>
                </select>
              </div>
            )}


                {/* Error Message */}
                {exportMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">Failed to export file. Please try again.</p>
              </div>
            )}

                {/* Export Button */}
                <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={!fileId || !selectedComponent || exportMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Export File
                  </>
                )}
              </button>
                </div>
              </div>
            ) : (
              <GitHubExport fileId={fileId || ''} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};