
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
    // Don't do anything until auth state is resolved.
    if (isAuthLoading) {
      return;
    }

    const isUserRequired = !ADMIN_DAOS.includes((dao as AdminDao).id);

    // If there's no user for a user-specific DAO, clear data and stop.
    if (isUserRequired && !user) {
      setData([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = () => {
        const handleData = (newData: T[]) => {
            setData(newData);
            setIsLoading(false);
            setError(null);
        };
        const handleError = (err: Error) => {
            console.error("Error fetching Firestore data:", err);
            setError(err);
            setIsLoading(false);
        };
        
        if (!isUserRequired) {
            return (dao as AdminDao).subscribe(handleData as (data: any[]) => void, handleError);
        } else if (user) {
            return (dao as Dao<T>).subscribe(user.uid, handleData, handleError);
        }
    };
    
    unsubscribe = setupSubscription();

    // The cleanup function will be called when the component unmounts
    // or when the dependencies (dao, user, isAuthLoading) change.
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dao, user, isAuthLoading]);

  return { data, isLoading, error };
}
