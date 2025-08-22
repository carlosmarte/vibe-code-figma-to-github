import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { FileText, Users, FolderOpen, Activity } from 'lucide-react';

export const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [files, teams, projects] = await Promise.all([
        api.get('/files'),
        api.get('/user/teams'),
        api.get('/user/projects'),
      ]);
      return {
        filesCount: files.data.files?.length || 0,
        teamsCount: teams.data.teams?.length || 0,
        projectsCount: projects.data.projects?.length || 0,
      };
    },
  });

  const statCards = [
    {
      title: 'Total Files',
      value: stats?.filesCount || 0,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Teams',
      value: stats?.teamsCount || 0,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Projects',
      value: stats?.projectsCount || 0,
      icon: FolderOpen,
      color: 'bg-purple-500',
    },
    {
      title: 'Recent Activity',
      value: 'Active',
      icon: Activity,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your Figma Admin Portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Files</h2>
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">No recent files to display</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText size={20} className="text-gray-600 mb-2" />
              <span className="text-sm text-gray-700">Browse Files</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FolderOpen size={20} className="text-gray-600 mb-2" />
              <span className="text-sm text-gray-700">Import File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};