import { create } from 'zustand';
import type {
  CommunicationDoc,
  DocVersion,
  ApprovalRecord,
  ApprovalStatus,
  DocumentType,
} from '../types';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { mockDocs } from '../data/mockDocs';

const generateDocId = (): string => {
  return `d${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

const generateApprovalId = (): string => {
  return `ap${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

const incrementVersion = (currentVersion: number, versions: DocVersion[]): string => {
  if (versions.length === 0) {
    return '1.0';
  }
  const lastVersion = versions[versions.length - 1].version;
  const parts = lastVersion.split('.').map(Number);
  const major = parts[0] || 1;
  const minor = (parts[1] || 0) + 1;
  if (currentVersion > Math.floor(parseFloat(lastVersion))) {
    return `${currentVersion}.0`;
  }
  return `${major}.${minor}`;
};

interface DocStore {
  docs: CommunicationDoc[];
  getDocsByEventId: (eventId: string) => CommunicationDoc[];
  getDocById: (id: string) => CommunicationDoc | undefined;
  pendingApprovalsCount: number;
  initDocs: () => void;
  addDoc: (docData: Partial<CommunicationDoc>) => CommunicationDoc;
  updateDoc: (id: string, updates: Partial<CommunicationDoc>) => void;
  addDocVersion: (docId: string, content: string, changeLog: string, createdBy: string) => void;
  submitForApproval: (docId: string, version: string) => void;
  addApproval: (
    docId: string,
    version: string,
    approverId: string,
    status: ApprovalStatus,
    comment: string
  ) => void;
}

export const useDocStore = create<DocStore>((set, get) => ({
  docs: storage.get<CommunicationDoc[]>(STORAGE_KEYS.DOCS, []),

  getDocsByEventId: (eventId: string) => {
    return get().docs.filter((d) => d.eventId === eventId);
  },

  getDocById: (id: string) => {
    return get().docs.find((d) => d.id === id);
  },

  get pendingApprovalsCount() {
    return get().docs.filter((d) => d.approvalStatus === 'pending').length;
  },

  initDocs: () => {
    const stored = storage.get<CommunicationDoc[]>(STORAGE_KEYS.DOCS, []);
    if (stored.length === 0) {
      storage.set(STORAGE_KEYS.DOCS, mockDocs);
      set({ docs: mockDocs });
    } else {
      set({ docs: stored });
    }
  },

  addDoc: (docData: Partial<CommunicationDoc>) => {
    const now = new Date().toISOString();
    const id = generateDocId();

    const newDoc: CommunicationDoc = {
      id,
      eventId: docData.eventId || '',
      title: docData.title || '未命名文档',
      type: (docData.type as DocumentType) || 'other',
      versions: [],
      currentVersion: 0,
      approvalStatus: 'draft',
      approvals: [],
      createdAt: now,
      createdBy: docData.createdBy || 'u001',
    };

    set((state) => ({ docs: [...state.docs, newDoc] }));
    return newDoc;
  },

  updateDoc: (id: string, updates: Partial<CommunicationDoc>) => {
    set((state) => ({
      docs: state.docs.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
  },

  addDocVersion: (docId: string, content: string, changeLog: string, createdBy: string) => {
    const now = new Date().toISOString();
    set((state) => ({
      docs: state.docs.map((d) => {
        if (d.id !== docId) return d;
        const newVersionNumber = d.currentVersion === 0 ? 1 : d.currentVersion;
        const versionStr = incrementVersion(newVersionNumber, d.versions);
        const newVersion: DocVersion = {
          version: versionStr,
          content,
          createdAt: now,
          createdBy,
          changeLog,
        };
        const majorVersion = Math.floor(parseFloat(versionStr));
        return {
          ...d,
          versions: [...d.versions, newVersion],
          currentVersion: majorVersion,
          approvalStatus: 'draft' as ApprovalStatus,
        };
      }),
    }));
  },

  submitForApproval: (docId: string, version: string) => {
    set((state) => ({
      docs: state.docs.map((d) => {
        if (d.id !== docId) return d;
        return {
          ...d,
          approvalStatus: 'pending' as ApprovalStatus,
        };
      }),
    }));
  },

  addApproval: (
    docId: string,
    version: string,
    approverId: string,
    status: ApprovalStatus,
    comment: string
  ) => {
    const now = new Date().toISOString();
    const id = generateApprovalId();

    set((state) => ({
      docs: state.docs.map((d) => {
        if (d.id !== docId) return d;

        const newApproval: ApprovalRecord = {
          id,
          docId,
          version,
          approverId,
          status,
          comment,
          createdAt: now,
        };

        const existingIndex = d.approvals.findIndex(
          (a) => a.version === version && a.approverId === approverId
        );
        let newApprovals: ApprovalRecord[];
        if (existingIndex >= 0) {
          newApprovals = [...d.approvals];
          newApprovals[existingIndex] = newApproval;
        } else {
          newApprovals = [...d.approvals, newApproval];
        }

        const versionApprovals = newApprovals.filter((a) => a.version === version);
        let overallStatus: ApprovalStatus = 'pending';
        if (versionApprovals.length > 0) {
          const hasRejected = versionApprovals.some((a) => a.status === 'rejected');
          const allApproved =
            versionApprovals.length >= 1 && versionApprovals.every((a) => a.status === 'approved');
          if (hasRejected) {
            overallStatus = 'rejected';
          } else if (allApproved) {
            overallStatus = 'approved';
          } else {
            overallStatus = 'pending';
          }
        }

        return {
          ...d,
          approvals: newApprovals,
          approvalStatus: overallStatus,
        };
      }),
    }));
  },
}));

useDocStore.subscribe((state) => {
  storage.set(STORAGE_KEYS.DOCS, state.docs);
});
