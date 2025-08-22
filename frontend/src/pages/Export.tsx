import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { Download, FileJson, Image, FileText, AlertCircle, Github } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { GitHubExport } from '../components/GitHubExport';

export const Export = () => {
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get('file');
  
  const [selectedFile, setSelectedFile] = useState(fileId || '');
  const [format, setFormat] = useState<'json' | 'svg' | 'png' | 'pdf'>('json');
  const [scale, setScale] = useState(1);
  const [nodeIds, setNodeIds] = useState('');
  const [activeTab, setActiveTab] = useState<'traditional' | 'github'>('traditional');

  const exportMutation = useMutation({
    mutationFn: async (data: {
      fileId: string;
      format: 'json' | 'svg' | 'png' | 'pdf';
      scale?: number;
      nodeIds?: string[];
    }) => {
      const response = await api.post(`/files/${data.fileId}/export`, {
        format: data.format,
        scale: data.scale,
        nodeIds: data.nodeIds,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Handle export success - download file or show link
      console.log('Export successful:', data);
      
      // Create download link for JSON format
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `figma-export-${selectedFile}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
  });

  const handleExport = () => {
    if (!selectedFile) return;

    const nodeIdArray = nodeIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id);

    exportMutation.mutate({
      fileId: selectedFile,
      format,
      scale: format === 'png' ? scale : undefined,
      nodeIds: nodeIdArray.length > 0 ? nodeIdArray : undefined,
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
        <h1 className="text-3xl font-bold text-gray-900">Export Figma File</h1>
        <p className="text-gray-600 mt-2">Export your Figma files in various formats or push to GitHub</p>
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
                {/* File Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Figma File ID
                  </label>
                  <input
                    type="text"
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    placeholder="Enter Figma file ID (e.g., tmaZV2VEXIIrWYVjqaNUxa)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {fileId && (
                    <p className="mt-1 text-sm text-gray-500">
                      Imported from: {fileId}
                    </p>
                  )}
                </div>

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

                {/* Node IDs (optional) */}
                {format !== 'json' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Node IDs (Optional)
                </label>
                <input
                  type="text"
                  value={nodeIds}
                  onChange={(e) => setNodeIds(e.target.value)}
                  placeholder="Enter comma-separated node IDs"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Leave empty to export the entire file
                </p>
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
                disabled={!selectedFile || exportMutation.isPending}
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
              <GitHubExport fileId={selectedFile} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};