import { useState, useEffect, useMemo } from 'react';
import { useFigmaContext } from '../contexts/FigmaContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  Grid3x3, 
  Search, 
  Filter, 
  AlertCircle, 
  Package, 
  Component, 
  Frame,
  Loader2,
  Check,
  ChevronDown
} from 'lucide-react';

interface ComponentNode {
  id: string;
  name: string;
  type: string;
  path: string;
  parent?: string;
}

export const Extraction = () => {
  const navigate = useNavigate();
  const { 
    fileId, 
    selectedComponent, 
    setSelectedComponent,
    availableComponents,
    setAvailableComponents 
  } = useFigmaContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch and extract components from the file
  const { data: componentsData, isLoading } = useQuery({
    queryKey: ['figma-components', fileId],
    queryFn: async () => {
      if (!fileId) return [];
      
      const response = await api.get(`/figma/files/${fileId}`);
      const file = response.data;
      
      const components: ComponentNode[] = [];
      
      // Extract components from the document tree
      const extractComponents = (node: any, path: string[] = [], parentId?: string) => {
        if (!node) return;
        
        const currentPath = [...path, node.name || 'Unnamed'];
        
        // Add exportable nodes
        if (['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'GROUP'].includes(node.type)) {
          components.push({
            id: node.id,
            name: node.name || 'Unnamed',
            type: node.type,
            path: currentPath.join(' / '),
            parent: parentId
          });
        }
        
        // Recursively process children
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) => {
            extractComponents(child, currentPath, node.id);
          });
        }
      };
      
      // Process all pages
      if (file.document?.children) {
        file.document.children.forEach((page: any) => {
          if (page.children) {
            page.children.forEach((child: any) => {
              extractComponents(child, [page.name]);
            });
          }
        });
      }
      
      // Also extract from components object if available
      if (file.components) {
        Object.entries(file.components).forEach(([id, comp]: [string, any]) => {
          // Check if this component is already in our list
          if (!components.find(c => c.id === id)) {
            components.push({
              id,
              name: comp.name,
              type: 'COMPONENT',
              path: `Components / ${comp.name}`
            });
          }
        });
      }
      
      return components;
    },
    enabled: !!fileId
  });

  // Update context when components are loaded
  useEffect(() => {
    if (componentsData) {
      setAvailableComponents(componentsData);
    }
  }, [componentsData, setAvailableComponents]);

  // Filter components based on search and type
  const filteredComponents = useMemo(() => {
    let filtered = availableComponents;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(comp => 
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.path?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(comp => comp.type === typeFilter);
    }
    
    return filtered;
  }, [availableComponents, searchTerm, typeFilter]);

  // Get unique types for filter dropdown
  const componentTypes = useMemo(() => {
    const types = new Set(availableComponents.map(c => c.type));
    return Array.from(types).sort();
  }, [availableComponents]);

  const handleSelectComponent = (component: ComponentNode) => {
    setSelectedComponent({
      id: component.id,
      name: component.name,
      type: component.type,
      path: component.path || ''
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COMPONENT':
      case 'COMPONENT_SET':
        return <Component size={16} className="text-purple-500" />;
      case 'FRAME':
        return <Frame size={16} className="text-blue-500" />;
      case 'INSTANCE':
        return <Package size={16} className="text-green-500" />;
      default:
        return <Grid3x3 size={16} className="text-gray-500" />;
    }
  };

  if (!fileId) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Extract Components</h1>
          <p className="text-gray-600 mt-2">Select components to export from your Figma file</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">No file imported yet</p>
            <p className="text-sm text-yellow-700 mt-1">Please import a Figma file first to extract components.</p>
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
        <h1 className="text-3xl font-bold text-gray-900">Extract Components</h1>
        <p className="text-gray-600 mt-2">Select a component from your Figma file to export</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {/* Search and Filter Bar */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search components by name or path..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Filter size={18} />
                <span>Type: {typeFilter === 'all' ? 'All' : typeFilter}</span>
                <ChevronDown size={16} />
              </button>
              
              {showFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={() => {
                      setTypeFilter('all');
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                      typeFilter === 'all' ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    All Types
                  </button>
                  {componentTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setTypeFilter(type);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                        typeFilter === type ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      {getTypeIcon(type)}
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredComponents.length} components found
              {searchTerm && ` matching "${searchTerm}"`}
            </span>
            {selectedComponent && (
              <span className="text-green-600 flex items-center gap-1">
                <Check size={16} />
                Selected: {selectedComponent.name}
              </span>
            )}
          </div>
        </div>

        {/* Components Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Loading components...</p>
            </div>
          ) : filteredComponents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Grid3x3 size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No components found</p>
              {searchTerm && (
                <p className="text-xs mt-1">Try adjusting your search criteria</p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredComponents.map((component) => (
                  <tr 
                    key={component.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedComponent?.id === component.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleSelectComponent(component)}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="radio"
                        checked={selectedComponent?.id === component.id}
                        onChange={() => handleSelectComponent(component)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(component.type)}
                        <span className="text-sm font-medium text-gray-900">
                          {component.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {component.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {component.path}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-400">
                        {component.id}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Action Bar */}
        {selectedComponent && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <strong>Selected:</strong> {selectedComponent.name} ({selectedComponent.type})
              </div>
              <button
                onClick={() => navigate('/export')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue to Export →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};