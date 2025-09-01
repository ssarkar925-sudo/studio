
'use client';

import { useState, useEffect } from 'react';

type Dao<T> = {
  subscribe: (callback: (data: T[]) => void, onError: (error: Error) => void) => () => void;
};

export function useFirestoreData<T>(dao: Dao<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // The unsubscribe function is returned by dao.subscribe
    const unsubscribe = dao.subscribe(
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

    // Cleanup subscription on component unmount
    return () => {
      unsubscribe();
    };
  }, [dao]); // Rerun effect if dao changes

  return { data, isLoading, error };
}
