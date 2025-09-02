
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import type { UserProfile } from '@/lib/data';

type Dao<T> = {
  subscribe: (userId: string, callback: (data: T[]) => void, onError: (error: Error) => void) => () => void;
};

// Admin DAO has a different subscribe signature
type AdminDao = {
    subscribe: (callback: (data: any[]) => void, onError: (error: Error) => void) => () => void;
    id: 'adminUsersDAO';
}

const ADMIN_DAOS = ['adminUsersDAO'];


export function useFirestoreData<T>(dao: Dao<T> | AdminDao) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for authentication to resolve
    }

    const isUserRequired = !ADMIN_DAOS.includes((dao as AdminDao).id);

    if (isUserRequired && !user) {
      setData([]);
      setIsLoading(false);
      return; // No user, so no data to fetch for user-specific DAOs
    }
    
    setIsLoading(true);
    
    let unsubscribe;

    if (!isUserRequired) {
      unsubscribe = (dao as AdminDao).subscribe(
          (newData) => {
              setData(newData as T[]);
              setIsLoading(false);
              setError(null);
          },
          (err: Error) => {
              console.error("Error fetching admin data:", err);
              setError(err);
              setIsLoading(false);
          }
      );
    } else if (user) {
        unsubscribe = (dao as Dao<T>).subscribe(
            user.uid,
            (newData) => {
                setData(newData);
                setIsLoading(false);
                setError(null);
            },
            (err: Error) => {
                console.error("Error fetching Firestore data:", err);
                setError(err);
                setIsLoading(false);
            }
        );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dao, user, isAuthLoading]);

  return { data, isLoading, error };
}
