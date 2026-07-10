import { Link, useLocation } from 'wouter';
import { useLogout } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { getGetMeQueryKey } from '@workspace/api-client-react';
import { LogOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  const { user } = useAuth();
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation('/login');
      }
    });
  };

  if (!user) return null;

  return (
    <header className="bg-primary text-primary-foreground shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg hover:opacity-90">
              <FileText className="w-5 h-5" />
              Orient Technologies
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium opacity-90">{user.fullName}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-primary bg-white hover:bg-gray-100 hover:text-primary">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
