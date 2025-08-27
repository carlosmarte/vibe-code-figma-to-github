import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Github, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import type { GitHubExportRequest, GitHubRepoInfo, GitHubBranch } from '../../../shared/types';
import { useFigmaContext } from '../contexts/FigmaContext';
import { useNavigate } from 'react-router-dom';

interface GitHubExportProps {
  fileId: string;
}

export function GitHubExport({ fileId }: GitHubExportProps) {
  const navigate = useNavigate();
  const { selectedComponent: contextSelectedComponent } = useFigmaContext();
  const [repoUrl, setRepoUrl] = useState('');
  const [filePath, setFilePath] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [branchName, setBranchName] = useState('');
  const [targetBranch, setTargetBranch] = useState('');
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);
  const [validationError, setValidationError] = useState('');
  const [exportSuccess, setExportSuccess] = useState<{ url: string } | null>(null);
  const [convertToReact, setConvertToReact] = useState(false);

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

  const { data: branches } = useQuery({
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


  // Helper function to convert component name to kebab-case filename
  const toKebabCase = (str: string): string => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase();
  };

  // Update file path when component is selected and convertToReact is checked
  useEffect(() => {
    if (convertToReact && contextSelectedComponent) {
      const filename = toKebabCase(contextSelectedComponent.name);
      const extension = convertToReact ? 'tsx' : 'json';
      
      // If filePath is empty or is a directory, generate full path
      if (!filePath || filePath.endsWith('/') || !filePath.includes('.')) {
        const directory = filePath.endsWith('/') ? filePath : (filePath ? filePath + '/' : 'src/components/');
        setFilePath(`${directory}${filename}.${extension}`);
      } else {
        // If there's already a file path with extension, just update the extension
        const pathWithoutExt = filePath.replace(/\.[^/.]+$/, '');
        setFilePath(`${pathWithoutExt}.${extension}`);
      }
    }
  }, [convertToReact, contextSelectedComponent, filePath]);

  const handleExport = async () => {
    if (!contextSelectedComponent || !repoInfo || !filePath || !branchName || !baseBranch || !targetBranch) {
      return;
    }

    // Fetch the component data if needed
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

    const componentData = fileData ? findNodeData(fileData.document, contextSelectedComponent.id) : null;
    
    const exportRequest: GitHubExportRequest = {
      repoUrl,
      filePath,
      componentName: contextSelectedComponent.name,
      componentData: JSON.stringify(componentData || contextSelectedComponent, null, 2),
      baseBranch,
      branchName,
      targetBranch,
      convertToReact,
      fileExtension: convertToReact ? 'tsx' : 'json'
    };

    exportMutation.mutate(exportRequest);
  };

  const isFormValid = () => {
    return repoInfo && 
           filePath && 
           contextSelectedComponent && 
           baseBranch && 
           branchName && 
           targetBranch &&
           !validateRepoMutation.isPending &&
           !exportMutation.isPending;
  };

  if (!fileId || !contextSelectedComponent) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">
              {!fileId ? 'No file selected' : 'No component selected'}
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              {!fileId 
                ? 'Please import a Figma file first.'
                : 'Please go to the Extraction tab and select a component to export.'}
            </p>
            <button
              onClick={() => navigate(!fileId ? '/' : '/extraction')}
              className="mt-3 text-sm text-yellow-800 underline hover:text-yellow-900"
            >
              {!fileId ? 'Go to Import →' : 'Select Component →'}
            </button>
          </div>
        </div>
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
            placeholder="src/components/figma-export.json or src/components/"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Path where the component will be saved. You can specify a full filename (e.g., button.json) or just a directory (filename will be auto-generated from component name)
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-blue-900 mb-2">
            Selected Component
          </label>
          <div className="text-sm">
            <p className="font-medium text-blue-800">{contextSelectedComponent.name}</p>
            <p className="text-blue-600 text-xs mt-1">
              Type: {contextSelectedComponent.type} | ID: {contextSelectedComponent.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="convertToReact"
            checked={convertToReact}
            onChange={(e) => setConvertToReact(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="convertToReact" className="text-sm font-medium text-gray-700">
            Convert to React Component (.tsx)
          </label>
          {convertToReact && contextSelectedComponent && (
            <span className="ml-auto text-xs text-gray-500">
              Auto-generated filename from component name
            </span>
          )}
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