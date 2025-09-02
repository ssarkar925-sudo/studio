
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { adminUsersDAO } from '@/lib/data';

type Dao<T> = {
  subscribe: (userId: string, callback: (data: T[]) => void, onError: (error: Error) => void) => () => void;
};

// Admin DAO has a different subscribe signature
type AdminDao = {
    subscribe: (callback: (data: any[]) => void, onError: (error: Error) => void) => () => void;
}

export function useFirestoreData<T>(dao: Dao<T> | AdminDao) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user && dao !== adminUsersDAO) { // adminUsersDAO doesn't need a user
      setData([]);
      setIsLoading(false);
      return;
    };
    
    setIsLoading(true);
    setError(null);
    
    let unsubscribe;

    if (dao === adminUsersDAO) {
      // Special handling for adminUsersDAO which has a different signature
      unsubscribe = (dao as AdminDao).subscribe(
          (newData) => {
              setData(newData as T[]);
              setIsLoading(false);
          },
          (err: Error) => {
              console.error("Error fetching Firestore data for admin:", err);
              setError(err);
              setIsLoading(false);
          }
      );
    } else {
        if (user) {
            unsubscribe = (dao as Dao<T>).subscribe(
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
        } else {
            // This case handles when user is null for a non-admin DAO
            setIsLoading(false);
            setData([]);
        }
    }


    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dao, user]);

  return { data, isLoading, error };
}
