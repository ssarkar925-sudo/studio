
'use client';

import { useState, useEffect, useCallback } from 'react';

// Custom event to signal data changes
const DATA_CHANGE_EVENT = 'onFirestoreDataChange';

type Dao<T> = {
  subscribe: (callback: (data: T[]) => void) => () => void;
};

export function useFirestoreData<T>(dao: Dao<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = dao.subscribe((newData) => {
        setData(newData);
        setIsLoading(false);
    });
    
    const handleDataChange = () => {
        // The subscription already handles updates. This is for manual refreshes if needed.
    };
    
    window.addEventListener(DATA_CHANGE_EVENT, handleDataChange);

    return () => {
      unsubscribe();
      window.removeEventListener(DATA_CHANGE_EVENT, handleDataChange);
    };
  }, [dao]);

  return { data, setData, isLoading };
}

export function notifyDataChange() {
    window.dispatchEvent(new Event(DATA_CHANGE_EVENT));
}
