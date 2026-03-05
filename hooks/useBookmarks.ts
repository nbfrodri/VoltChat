"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "voltchat-bookmarks";

export interface BookmarkedRoom {
  roomId: string;
  savedAt: number;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedRoom[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setBookmarks(parsed);
      }
    } catch {
      // Corrupt data — reset
    }
  }, []);

  const save = useCallback((rooms: BookmarkedRoom[]) => {
    setBookmarks(rooms);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  }, []);

  const addBookmark = useCallback(
    (roomId: string) => {
      if (bookmarks.some((b) => b.roomId === roomId)) return;
      save([...bookmarks, { roomId, savedAt: Date.now() }]);
    },
    [bookmarks, save]
  );

  const removeBookmark = useCallback(
    (roomId: string) => {
      save(bookmarks.filter((b) => b.roomId !== roomId));
    },
    [bookmarks, save]
  );

  const isBookmarked = useCallback(
    (roomId: string) => bookmarks.some((b) => b.roomId === roomId),
    [bookmarks]
  );

  const clearBookmarks = useCallback(() => {
    save([]);
  }, [save]);

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, clearBookmarks };
}
