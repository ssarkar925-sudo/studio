
'use client';

import { useState, useEffect } from 'react';

// Custom event to signal data changes - This can be removed if not used elsewhere,
// as onSnapshot provides real-time updates.
const DATA_CHANGE_EVENT = 'onFirestoreDataChange';

type Dao<T> = {
  subscribe: (callback: (data: T[]) => void) => () => void;
};

export function useFirestoreData<T>(dao: Dao<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Set loading state to true whenever the hook re-runs with a new DAO.
    setIsLoading(true);
    setError(null);
    
    // The subscribe method from the DAO should return an unsubscribe function.
    // It's assumed to handle the connection to Firestore and call the callback
    // with new data.
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

    // The cleanup function that React will run when the component unmounts.
    // This is crucial to prevent memory leaks.
    return () => {
      unsubscribe();
    };
  }, [dao]); // The effect re-runs if the dao object changes.

  return { data, setData, isLoading, error };
}

// This function can be used to manually trigger a re-fetch if needed, although
// Firestore's real-time updates should handle most cases.
export function notifyDataChange() {
    window.dispatchEvent(new Event(DATA_CHANGE_EVENT));
}
