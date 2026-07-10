import React, { createContext, useContext, ReactNode } from 'react';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';

interface AuthContextType {
  user: any;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: undefined, isLoading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: user, isLoading } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
