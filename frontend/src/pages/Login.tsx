import { useAuth } from '../contexts/AuthContext';
import { Figma } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Figma size={32} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Figma Admin</h1>
        <p className="text-gray-600 mt-2">Sign in with your Figma account to continue</p>
      </div>

      <button
        onClick={login}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <Figma size={20} />
        Sign in with Figma
      </button>

      <p className="text-center text-sm text-gray-500 mt-6">
        By signing in, you agree to grant this application access to your Figma files.
      </p>
    </div>
  );
};