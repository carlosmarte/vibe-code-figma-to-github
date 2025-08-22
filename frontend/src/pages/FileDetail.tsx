import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ArrowLeft, Download, Clock, MessageSquare, GitBranch } from 'lucide-react';

export const FileDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: file, isLoading } = useQuery({
    queryKey: ['file', id],
    queryFn: async () => {
      const response = await api.get(`/files/${id}`);
      return response.data.file;
    },
    enabled: !!id,
  });

  const { data: versions } = useQuery({
    queryKey: ['file-versions', id],
    queryFn: async () => {
      const response = await api.get(`/files/${id}/versions`);
      return response.data.versions;
    },
    enabled: !!id,
  });

  const { data: comments } = useQuery({
    queryKey: ['file-comments', id],
    queryFn: async () => {
      const response = await api.get(`/files/${id}/comments`);
      return response.data.comments;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/files"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Files
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{file?.name}</h1>
            <p className="text-gray-600 mt-2">
              Last modified: {file?.lastModified ? new Date(file.lastModified).toLocaleString() : 'Unknown'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to={`/export?file=${id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={20} />
              Export
            </Link>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
              <p className="text-gray-500">File preview would appear here</p>
            </div>
          </div>

          {/* File Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">File Key</dt>
                <dd className="text-sm font-medium text-gray-900">{id}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Version</dt>
                <dd className="text-sm font-medium text-gray-900">{file?.version || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Pages</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {file?.document?.children?.length || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Components</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {Object.keys(file?.components || {}).length}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Versions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Versions</h2>
            </div>
            <div className="space-y-3">
              {versions?.slice(0, 5).map((version: any) => (
                <div key={version.id} className="flex items-start gap-3">
                  <Clock size={16} className="text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {version.label || `Version ${version.id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(version.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No versions available</p>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
            </div>
            <div className="space-y-3">
              {comments?.slice(0, 5).map((comment: any) => (
                <div key={comment.id} className="border-l-2 border-gray-200 pl-3">
                  <p className="text-sm text-gray-900">{comment.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {comment.user?.handle} • {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No comments available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};