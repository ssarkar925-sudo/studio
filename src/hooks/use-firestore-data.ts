
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
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading) {
      // Don't do anything while auth is still loading.
      return;
    }

    if (!user && dao !== adminUsersDAO) {
      // If auth is done and there's no user, clear data and stop loading.
      setData([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    let unsubscribe;

    if (dao === adminUsersDAO) {
      // Special handling for adminUsersDAO which has a different signature and doesn't need userId
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
            // Standard DAOs that require a userId
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
            // This case should theoretically not be hit due to the check at the top,
            // but it's good for safety.
            setIsLoading(false);
            setData([]);
        }
    }


    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dao, user, isAuthLoading]); // Re-run effect when user or auth loading state changes.

  return { data, isLoading, error };
}
