
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';

type Dao<T> = {
  subscribe: (userId: string, callback: (data: T[]) => void, onError: (error: Error) => void) => () => void;
};

export function useFirestoreData<T>(dao: Dao<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setData([]);
      setIsLoading(false);
      return;
    };
    
    setIsLoading(true);
    setError(null);
    
    const unsubscribe = dao.subscribe(
      user.uid,
      (newData) => {
        setData(newData);
        setIsLoading(false);
      },
      (err: Error) => {
        console.error("Error fetching Firestore data:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [dao, user]);

  return { data, isLoading, error };
}
