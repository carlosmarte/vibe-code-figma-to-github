import { useEffect, useState } from 'react';
import { useFigmaContext } from '../contexts/FigmaContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, FileText, Clock, Package, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';

export const Preview = () => {
  const navigate = useNavigate();
  const { fileId, fileData, setPreviewUrl } = useFigmaContext();
  const [imageError, setImageError] = useState(false);

  // Fetch preview image
  const { data: previewData, isLoading: loadingPreview } = useQuery({
    queryKey: ['figma-preview', fileId],
    queryFn: async () => {
      if (!fileId) return null;
      
      // Get file data to extract thumbnail or request image export
      const response = await api.get(`/figma/files/${fileId}`);
      const file = response.data;
      
      // Get preview image for the first frame
      if (file.document?.children?.[0]?.children?.[0]) {
        const firstFrameId = file.document.children[0].children[0].id;
        const imageResponse = await api.post(`/figma/files/${fileId}/export`, {
          ids: [firstFrameId],
          format: 'png',
          scale: 2
        });
        
        if (imageResponse.data.images) {
          return {
            previewUrl: Object.values(imageResponse.data.images)[0] as string,
            fileData: file
          };
        }
      }
      
      return {
        previewUrl: file.thumbnailUrl || null,
        fileData: file
      };
    },
    enabled: !!fileId,
    staleTime: 1000 * 60 * 5 // Cache for 5 minutes
  });

  useEffect(() => {
    if (previewData?.previewUrl) {
      setPreviewUrl(previewData.previewUrl);
    }
  }, [previewData, setPreviewUrl]);

  if (!fileId) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Preview Figma File</h1>
          <p className="text-gray-600 mt-2">Preview your imported Figma design</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">No file imported yet</p>
            <p className="text-sm text-yellow-700 mt-1">Please go to the Import tab and import a Figma file first.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-3 text-sm text-yellow-800 underline hover:text-yellow-900"
            >
              Go to Import →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Preview Figma File</h1>
        <p className="text-gray-600 mt-2">Review your imported Figma design before extraction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preview Image */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye size={20} />
                File Preview
              </h2>
              {fileId && (
                <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                  {fileId}
                </span>
              )}
            </div>
            
            {loadingPreview ? (
              <div className="bg-gray-50 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Loading preview...</p>
                </div>
              </div>
            ) : previewData?.previewUrl && !imageError ? (
              <div className="bg-checkered rounded-lg overflow-hidden">
                <img
                  src={previewData.previewUrl}
                  alt="Figma file preview"
                  className="w-full h-auto"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Eye size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Preview not available</p>
                  <p className="text-xs mt-1">The file might not have a thumbnail or the preview failed to load</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* File Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <FileText size={20} />
              File Information
            </h2>
            
            {fileData || previewData?.fileData ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Name</label>
                  <p className="text-sm text-gray-900 mt-1 font-medium">
                    {fileData?.name || previewData?.fileData?.name || 'Untitled'}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Last Modified</label>
                  <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                    <Clock size={14} />
                    {fileData?.lastModified || previewData?.fileData?.lastModified 
                      ? new Date(fileData?.lastModified || previewData?.fileData?.lastModified).toLocaleString()
                      : 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Version</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {fileData?.version || previewData?.fileData?.version || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Document Structure</label>
                  <div className="mt-2 space-y-1">
                    {(previewData?.fileData?.document?.children || fileData?.document?.children || []).map((page: any) => (
                      <div key={page.id} className="text-sm text-gray-700 flex items-center gap-2">
                        <Package size={14} className="text-gray-400" />
                        <span>{page.name}</span>
                        <span className="text-xs text-gray-500">
                          ({page.children?.length || 0} items)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={() => navigate('/extraction')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue to Extraction →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No file data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .bg-checkered {
          background-image: 
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
};