import { create } from 'zustand';
import type { User } from '../types';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { mockUsers } from '../data/mockUsers';

interface UserStore {
  currentUserId: string;
  users: User[];
  currentUser: User | undefined;
  getUserById: (id: string) => User | undefined;
  setCurrentUser: (id: string) => void;
  initUsers: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  currentUserId: storage.get<string>(STORAGE_KEYS.CURRENT_USER_ID, 'u001'),
  users: storage.get<User[]>(STORAGE_KEYS.USERS, []),

  get currentUser() {
    const { currentUserId, users } = get();
    return users.find((u) => u.id === currentUserId);
  },

  getUserById: (id: string) => {
    return get().users.find((u) => u.id === id);
  },

  setCurrentUser: (id: string) => {
    set({ currentUserId: id });
    storage.set(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  initUsers: () => {
    const storedUsers = storage.get<User[]>(STORAGE_KEYS.USERS, []);
    if (storedUsers.length === 0) {
      storage.set(STORAGE_KEYS.USERS, mockUsers);
      set({ users: mockUsers });
    } else {
      set({ users: storedUsers });
    }
  },
}));

useUserStore.subscribe((state) => {
  storage.set(STORAGE_KEYS.USERS, state.users);
  storage.set(STORAGE_KEYS.CURRENT_USER_ID, state.currentUserId);
});
