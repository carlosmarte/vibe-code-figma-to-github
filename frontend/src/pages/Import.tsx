import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { Upload, Link, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFigmaContext } from '../contexts/FigmaContext';

export const Import = () => {
  const navigate = useNavigate();
  const { setFileId, setFileData, clearState } = useFigmaContext();
  const [fileKey, setFileKey] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const importMutation = useMutation({
    mutationFn: async (data: { fileKey: string; name?: string }) => {
      const response = await api.post('/files/import', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Store in context and navigate to preview
      setFileId(data.file.fileKey);
      setFileData({
        fileKey: data.file.fileKey,
        name: data.file.name || fileName,
        lastModified: data.file.lastModified,
        version: data.file.version,
        thumbnailUrl: data.file.thumbnailUrl
      });
      navigate('/preview');
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Failed to import file');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearState(); // Clear any previous state
    
    if (!fileKey) {
      setError('Please enter a Figma file URL or key');
      return;
    }

    // Extract file key from URL if needed
    const extractedKey = fileKey.includes('figma.com') 
      ? fileKey.split('/file/')[1]?.split('/')[0]
      : fileKey;

    if (!extractedKey) {
      setError('Invalid Figma file URL or key');
      return;
    }

    importMutation.mutate({ 
      fileKey: extractedKey, 
      name: fileName || undefined 
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Import Figma File</h1>
        <p className="text-gray-600 mt-2">Import a Figma file to your admin portal</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File URL/Key Input */}
            <div>
              <label htmlFor="fileKey" className="block text-sm font-medium text-gray-700 mb-2">
                Figma File URL or Key
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="fileKey"
                  type="text"
                  value={fileKey}
                  onChange={(e) => setFileKey(e.target.value)}
                  placeholder="https://www.figma.com/file/abc123... or abc123"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Enter the Figma file URL or just the file key
              </p>
            </div>

            {/* File Name Input */}
            <div>
              <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-2">
                File Name (Optional)
              </label>
              <input
                id="fileName"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter a custom name for the file"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {importMutation.isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">File imported successfully!</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={importMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Import File
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFileKey('');
                  setFileName('');
                  setError('');
                }}
                className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">How to find your Figma file key:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Open your Figma file in the browser</li>
            <li>Copy the URL from the address bar</li>
            <li>The file key is the part after /file/ in the URL</li>
            <li>Example: figma.com/file/<strong>abc123xyz</strong>/File-Name</li>
          </ol>
        </div>
      </div>
    </div>
  );
};