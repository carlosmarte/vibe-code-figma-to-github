import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ComponentsShowcase } from '../samples/ComponentsShowcase';

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
  const [activeTab, setActiveTab] = useState<'details' | 'structure' | 'export' | 'components'>('details');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'svg' | 'pdf'>('png');
  const [exportScale, setExportScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  const [nodeThumbnails, setNodeThumbnails] = useState<Record<string, string>>({});
  const [isFetchingThumbnails, setIsFetchingThumbnails] = useState(false);

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

  const getAllNodeIds = (node: any, ids: string[] = []): string[] => {
    if (node.id) {
      ids.push(node.id);
    }
    if (node.children) {
      node.children.forEach((child: any) => getAllNodeIds(child, ids));
    }
    return ids;
  };

  const findNodeById = (node: any, id: string): any => {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getNodePreviewStyle = (node: any) => {
    // Extract background color or fill color for preview
    let backgroundColor = '#f3f4f6'; // default gray
    
    if (node.backgroundColor) {
      const { r, g, b, a } = node.backgroundColor;
      backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    } else if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        const { r, g, b, a } = fill.color;
        backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      }
    } else if (node.background && node.background.length > 0) {
      const bg = node.background[0];
      if (bg.type === 'SOLID' && bg.color) {
        const { r, g, b, a } = bg.color;
        backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      }
    }
    
    return { backgroundColor };
  };

  // Render node tree for export selection
  const renderNodeTree = (node: any, depth: number = 0): React.ReactElement[] => {
    const elements: React.ReactElement[] = [];
    
    if (!node || !node.id) return elements;
    
    // Don't show DOCUMENT node itself, start with its children
    if (node.type !== 'DOCUMENT') {
      elements.push(
        <label key={node.id} className={`flex items-center space-x-2`} style={{ marginLeft: `${depth * 16}px` }}>
          <input
            type="checkbox"
            value={node.id}
            checked={selectedNodes.includes(node.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedNodes([...selectedNodes, node.id]);
              } else {
                setSelectedNodes(selectedNodes.filter(id => id !== node.id));
              }
            }}
            className="rounded border-gray-300"
          />
          <span className="text-sm">
            {node.name} 
            <span className="text-gray-400 text-xs ml-1">({node.type})</span>
          </span>
        </label>
      );
    }
    
    // Recursively render children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        elements.push(...renderNodeTree(child, node.type === 'DOCUMENT' ? depth : depth + 1));
      });
    }
    
    return elements;
  };

  // Fetch thumbnails for selected nodes
  const fetchNodeThumbnails = async (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    
    setIsFetchingThumbnails(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/figma/files/${fileId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: nodeIds, // Get thumbnails for all selected nodes
          format: 'png',
          scale: 0.5, // Small scale for thumbnails
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.images) {
          setNodeThumbnails(prev => ({ ...prev, ...data.images }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch thumbnails:', error);
    } finally {
      setIsFetchingThumbnails(false);
    }
  };

  // Fetch thumbnails when selected nodes change
  useEffect(() => {
    if (selectedNodes.length > 0) {
      fetchNodeThumbnails(selectedNodes);
    } else {
      // Clear thumbnails when no nodes are selected
      setNodeThumbnails({});
    }
  }, [selectedNodes, fileId]);

  const handleExportImages = async () => {
    if (!fileData || selectedNodes.length === 0) return;
    
    setIsExporting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/figma/files/${fileId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedNodes,
          format: exportFormat,
          scale: exportScale,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export images');
      }

      const data = await response.json();
      
      // Figma returns URLs for the exported images
      if (data.images) {
        // Download each image
        for (const [nodeId, imageUrl] of Object.entries(data.images)) {
          if (imageUrl) {
            const link = document.createElement('a');
            link.href = imageUrl as string;
            link.download = `${nodeId}.${exportFormat}`;
            link.target = '_blank';
            link.click();
          }
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export images. Please try again.');
    } finally {
      setIsExporting(false);
    }
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
          <button
            onClick={() => setActiveTab('components')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'components'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Components
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

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Export Images</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Export frames and components as image files.
                  </p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left side - Selection and options */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Nodes to Export
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
                        {fileData.document && (
                          <>
                            <label className="flex items-center space-x-2 font-medium">
                              <input
                                type="checkbox"
                                checked={selectedNodes.length === getAllNodeIds(fileData.document).length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedNodes(getAllNodeIds(fileData.document));
                                  } else {
                                    setSelectedNodes([]);
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">Select All</span>
                            </label>
                            <div className="mt-2 space-y-1">
                              {renderNodeTree(fileData.document)}
                            </div>
                          </>
                        )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Format
                          </label>
                          <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="png">PNG</option>
                            <option value="jpg">JPG</option>
                            <option value="svg">SVG</option>
                            <option value="pdf">PDF</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Scale
                          </label>
                          <select
                            value={exportScale}
                            onChange={(e) => setExportScale(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="0.5">0.5x</option>
                            <option value="1">1x</option>
                            <option value="2">2x</option>
                            <option value="3">3x</option>
                            <option value="4">4x</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={handleExportImages}
                        disabled={selectedNodes.length === 0 || isExporting}
                        className={`w-full py-2 px-4 rounded transition-colors ${
                          selectedNodes.length === 0 || isExporting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isExporting ? 'Exporting...' : `Export ${selectedNodes.length} Node(s)`}
                      </button>
                    </div>

                    {/* Right side - Preview */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preview
                        {isFetchingThumbnails && (
                          <span className="ml-2 text-xs text-gray-500">(Loading thumbnails...)</span>
                        )}
                      </label>
                      <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px] max-h-[600px] overflow-y-auto">
                        {selectedNodes.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <p className="text-center">
                              Select nodes to preview
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {selectedNodes.map((nodeId) => {
                              const node = findNodeById(fileData.document, nodeId);
                              if (!node) return null;
                              
                              const style = getNodePreviewStyle(node);
                              const aspectRatio = node.absoluteBoundingBox 
                                ? node.absoluteBoundingBox.height / node.absoluteBoundingBox.width
                                : 1;
                              
                              return (
                                <div key={nodeId} className="space-y-2">
                                  <div 
                                    className="relative rounded-lg shadow-sm overflow-hidden bg-gray-100"
                                    style={{
                                      paddingBottom: `${Math.min(aspectRatio * 100, 150)}%`
                                    }}
                                  >
                                    {nodeThumbnails[nodeId] ? (
                                      <img 
                                        src={nodeThumbnails[nodeId]}
                                        alt={node.name}
                                        className="absolute inset-0 w-full h-full object-contain"
                                      />
                                    ) : (
                                      <div 
                                        className="absolute inset-0 flex items-center justify-center p-2"
                                        style={{ backgroundColor: style.backgroundColor }}
                                      >
                                        {node.type === 'TEXT' && node.characters ? (
                                          <p className="text-xs text-center truncate">
                                            {node.characters.substring(0, 30)}
                                          </p>
                                        ) : (
                                          <div className="text-xs text-gray-500">
                                            {node.type}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 truncate" title={node.name}>
                                    {node.name}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'components' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Library</h3>
            <p className="text-sm text-gray-600 mb-6">
              Sample Tailwind CSS components that can be used as design references or imported into your projects.
            </p>
            <ComponentsShowcase />
          </div>
        )}
      </div>
    </div>
  );
}