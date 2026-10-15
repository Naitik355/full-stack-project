import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Layers, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
        <Layers className="w-8 h-8" />
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        404 - Page Not Found
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        The workspace route or page you are looking for does not exist or has been moved.
      </p>
      <Button
        onClick={() => navigate('/')}
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};
