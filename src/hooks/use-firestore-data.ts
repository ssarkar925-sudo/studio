
'use client';

import { useState, useEffect } from 'react';

// THIS HOOK IS DEPRECATED AND WILL BE REMOVED.
// DO NOT USE. Data should be fetched on the server.

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

    return () => {
      unsubscribe();
    };
  }, [dao]);

  return { data, isLoading, error };
}
