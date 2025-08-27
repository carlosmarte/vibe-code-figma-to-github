import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Import } from './pages/Import';
import { Preview } from './pages/Preview';
import { Extraction } from './pages/Extraction';
import { Export } from './pages/Export';
import { FigmaProvider } from './contexts/FigmaContext';
import { Upload, Eye, Grid3x3, Download } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FigmaProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center space-x-8">
                    <h1 className="text-xl font-bold text-gray-900">Figma to GitHub Export</h1>
                    <div className="flex space-x-4">
                      <NavLink
                        to="/"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`
                        }
                      >
                        <Upload size={18} />
                        Import
                      </NavLink>
                      <NavLink
                        to="/preview"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`
                        }
                      >
                        <Eye size={18} />
                        Preview
                      </NavLink>
                      <NavLink
                        to="/extraction"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`
                        }
                      >
                        <Grid3x3 size={18} />
                        Extraction
                      </NavLink>
                      <NavLink
                        to="/export"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`
                        }
                      >
                        <Download size={18} />
                        Export
                      </NavLink>
                    </div>
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Import />} />
                <Route path="/preview" element={<Preview />} />
                <Route path="/extraction" element={<Extraction />} />
                <Route path="/export" element={<Export />} />
              </Routes>
            </main>
          </div>
        </Router>
      </FigmaProvider>
    </QueryClientProvider>
  );
}

export default App;