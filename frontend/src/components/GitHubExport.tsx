import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Github, GitBranch, FileCode, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import type { GitHubExportRequest, GitHubRepoInfo, GitHubBranch } from '../../shared/types';

interface GitHubExportProps {
  fileId: string;
}

export function GitHubExport({ fileId }: GitHubExportProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [filePath, setFilePath] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [branchName, setBranchName] = useState('');
  const [targetBranch, setTargetBranch] = useState('');
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);
  const [validationError, setValidationError] = useState('');
  const [exportSuccess, setExportSuccess] = useState<{ url: string } | null>(null);

  const { data: fileData, isLoading: fileLoading } = useQuery({
    queryKey: ['figmaFile', fileId],
    queryFn: async () => {
      if (!fileId) return null;
      const response = await api.get(`/figma/files/${fileId}`);
      return response.data;
    },
    enabled: !!fileId
  });

  const validateRepoMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await api.post('/github/validate-repo', { repoUrl: url });
      return response.data.data;
    },
    onSuccess: (data: GitHubRepoInfo) => {
      setRepoInfo(data);
      setBaseBranch(data.defaultBranch);
      setTargetBranch(data.defaultBranch);
      setValidationError('');
    },
    onError: (error: any) => {
      setRepoInfo(null);
      setValidationError(error.response?.data?.error || 'Failed to validate repository');
    }
  });

  const { data: branches, refetch: refetchBranches } = useQuery({
    queryKey: ['github-branches', repoInfo?.owner, repoInfo?.repo],
    queryFn: async () => {
      if (!repoInfo) return [];
      const response = await api.get(`/github/${repoInfo.owner}/${repoInfo.repo}/branches`);
      return response.data.data as GitHubBranch[];
    },
    enabled: !!repoInfo
  });

  const exportMutation = useMutation({
    mutationFn: async (request: GitHubExportRequest) => {
      const response = await api.post('/github/export', request);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.pullRequest) {
        setExportSuccess({ url: data.pullRequest.url });
      }
    }
  });

  const { data: exportHistory } = useQuery({
    queryKey: ['github-export-history'],
    queryFn: async () => {
      const response = await api.get('/github/export/recent?limit=5');
      return response.data.data;
    }
  });

  useEffect(() => {
    if (repoUrl && repoUrl.startsWith('https://github.com/')) {
      const debounceTimer = setTimeout(() => {
        validateRepoMutation.mutate(repoUrl);
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [repoUrl]);

  const getAllComponents = (node: any, components: { id: string; name: string; type: string }[] = []): { id: string; name: string; type: string }[] => {
    if (!node) return components;
    
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' || node.type === 'FRAME') {
      components.push({
        id: node.id,
        name: node.name,
        type: node.type
      });
    }
    
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        getAllComponents(child, components);
      });
    }
    
    return components;
  };

  const availableComponents = fileData?.document ? getAllComponents(fileData.document) : [];

  const handleExport = async () => {
    if (!selectedComponent || !repoInfo || !filePath || !branchName || !baseBranch || !targetBranch) {
      return;
    }

    const selectedNode = availableComponents.find(c => c.id === selectedComponent);
    if (!selectedNode) return;

    const findNodeData = (node: any, id: string): any => {
      if (node.id === id) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNodeData(child, id);
          if (found) return found;
        }
      }
      return null;
    };

    const componentData = findNodeData(fileData.document, selectedComponent);
    
    const exportRequest: GitHubExportRequest = {
      repoUrl,
      filePath,
      componentName: selectedNode.name,
      componentData: JSON.stringify(componentData, null, 2),
      baseBranch,
      branchName,
      targetBranch
    };

    exportMutation.mutate(exportRequest);
  };

  const isFormValid = () => {
    return repoInfo && 
           filePath && 
           selectedComponent && 
           baseBranch && 
           branchName && 
           targetBranch &&
           !validateRepoMutation.isPending &&
           !exportMutation.isPending;
  };

  if (!fileId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">Please select a file first</p>
      </div>
    );
  }

  if (fileLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Loading file data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Github className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-blue-900">GitHub Export</h4>
            <p className="text-sm text-blue-700 mt-1">
              Export Figma components directly to a GitHub repository and create a pull request.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Repository URL <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repository"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {validateRepoMutation.isPending && (
            <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Validating repository...
            </p>
          )}
          {repoInfo && (
            <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
              <CheckCircle2 size={14} />
              Repository validated: {repoInfo.fullName}
            </p>
          )}
          {validationError && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={14} />
              {validationError}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File Path <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="src/components/figma-export.json"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Path where the component will be saved in the repository
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Component <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedComponent}
            onChange={(e) => setSelectedComponent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={availableComponents.length === 0}
          >
            <option value="">Choose a component...</option>
            {availableComponents.map((component) => (
              <option key={component.id} value={component.id}>
                {component.name} ({component.type})
              </option>
            ))}
          </select>
        </div>

        {repoInfo && branches && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Branch <span className="text-red-500">*</span>
              </label>
              <select
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name} {branch.protected && '(protected)'}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                The branch to create your new branch from
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Branch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="feature/figma-component-export"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Name for the new branch where changes will be committed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Branch for PR <span className="text-red-500">*</span>
              </label>
              <select
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name} {branch.protected && '(protected)'}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                The branch to merge your changes into
              </p>
            </div>
          </>
        )}

        {exportMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-red-800">
                  {(exportMutation.error as any)?.response?.data?.error || 'Failed to export to GitHub'}
                </p>
              </div>
            </div>
          </div>
        )}

        {exportSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-green-600 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-green-800 font-medium">Export successful!</p>
                <p className="text-sm text-green-700 mt-1">
                  Pull request created successfully.
                </p>
                <a
                  href={exportSuccess.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 text-sm text-green-700 hover:text-green-800 underline"
                >
                  View Pull Request
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={!isFormValid()}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isFormValid()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Exporting to GitHub...
              </>
            ) : (
              <>
                <Github size={20} />
                Export to GitHub
              </>
            )}
          </button>
        </div>
      </div>

      {exportHistory && exportHistory.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Exports</h4>
          <div className="space-y-2">
            {exportHistory.map((item: any) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.exportDetails.componentName}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {item.exportDetails.filePath} • {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href={item.pullRequest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-xs"
                  >
                    PR #{item.pullRequest.number}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}