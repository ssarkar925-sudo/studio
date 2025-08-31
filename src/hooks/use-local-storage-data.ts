
'use client';

import { useState, useEffect, useCallback } from 'react';

// Custom event to signal data changes
const DATA_CHANGE_EVENT = 'onLocalStorageDataChange';

type Dao<T> = {
  load: () => T[];
};

export function useLocalStorageData<T>(dao: Dao<T>) {
  const [data, setData] = useState<T[]>([]);

  const refreshData = useCallback(() => {
    setData(dao.load());
  }, [dao]);

  useEffect(() => {
    refreshData();

    const handleDataChange = () => {
      refreshData();
    };
    
    window.addEventListener(DATA_CHANGE_EVENT, handleDataChange);

    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, handleDataChange);
    };
  }, [refreshData]);

  return { data, setData, refreshData };
}

export function notifyDataChange() {
    window.dispatchEvent(new Event(DATA_CHANGE_EVENT));
}
