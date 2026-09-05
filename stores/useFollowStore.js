// stores/useFollowStore.js
import { create } from 'zustand';
import { getMyFollowingIds, followUser } from '../apis/userApi';

export const useFollowStore = create((set, get) => ({
  followingIds: new Set(),
  hydrated: false,

  hydrate: async () => {
    try {
      const res = await getMyFollowingIds();
      set({ followingIds: new Set(res.data.following), hydrated: true });
    } catch (err) {
      set({ hydrated: true }); // don't block the app on failure
    }
  },

  isFollowing: (userId) => get().followingIds.has(userId),

  follow: async (userId) => {
    const prev = get().followingIds;
    // optimistic update
    set({ followingIds: new Set(prev).add(userId) });
    try {
      await followUser(userId);
    } catch (err) {
      set({ followingIds: prev }); // rollback on failure
    }
  },

  unfollow: async (userId) => {
    const prev = get().followingIds;
    const next = new Set(prev);
    next.delete(userId);
    set({ followingIds: next }); // optimistic update
    try {
      await followUser(userId);
    } catch (err) {
      set({ followingIds: prev }); // rollback on failure
    }
  },

  reset: () => set({ followingIds: new Set(), hydrated: false }),
}));