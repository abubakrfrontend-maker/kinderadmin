import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  Child,
  Department,
  Employee,
  FinanceTransaction,
  AttendanceRecord,
  GroupInfo,
  Kindergarten,
} from '@/types';

// =========================
// Tenant-aware path helpers
// =========================

/** Returns a Firestore CollectionReference scoped to a kindergarten */
export function kgCollection(kindergartenId: string, collectionName: string) {
  return collection(db, 'kindergartens', kindergartenId, collectionName);
}

/** Returns a Firestore DocumentReference scoped to a kindergarten */
export function kgDoc(kindergartenId: string, collectionName: string, docId: string) {
  return doc(db, 'kindergartens', kindergartenId, collectionName, docId);
}

// =========================
// Children Service
// =========================
export const childrenService = {
  getAll: (kindergartenId: string, onData: (data: Child[]) => void, groupId?: string) => {
    let q: any = kgCollection(kindergartenId, 'children');
    if (groupId) {
      q = query(q, where('groupId', '==', groupId));
    }
    return onSnapshot(q, (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Child)));
    });
  },
  getById: async (kindergartenId: string, id: string): Promise<Child | null> => {
    const d: any = await getDoc(kgDoc(kindergartenId, 'children', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as Child) : null;
  },
  create: async (kindergartenId: string, data: Omit<Child, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(kgCollection(kindergartenId, 'children'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (kindergartenId: string, id: string, data: Partial<Child>) => {
    await updateDoc(kgDoc(kindergartenId, 'children', id), data);
  },
  delete: async (kindergartenId: string, id: string) => {
    await deleteDoc(kgDoc(kindergartenId, 'children', id));
  },
  search: async (kindergartenId: string, searchQuery: string): Promise<Child[]> => {
    const snap: any = await getDocs(kgCollection(kindergartenId, 'children'));
    const all = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Child));
    const lowerQ = searchQuery.toLowerCase();
    return all.filter((c: any) => 
      c.firstName.toLowerCase().includes(lowerQ) || 
      c.lastName.toLowerCase().includes(lowerQ)
    );
  }
};

// =========================
// Employees Service
// =========================
export const employeesService = {
  getAll: (kindergartenId: string, onData: (data: Employee[]) => void) => {
    return onSnapshot(kgCollection(kindergartenId, 'employees'), (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Employee)));
    });
  },
  getById: async (kindergartenId: string, id: string): Promise<Employee | null> => {
    const d: any = await getDoc(kgDoc(kindergartenId, 'employees', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as Employee) : null;
  },
  create: async (kindergartenId: string, data: Omit<Employee, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(kgCollection(kindergartenId, 'employees'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (kindergartenId: string, id: string, data: Partial<Employee>) => {
    await updateDoc(kgDoc(kindergartenId, 'employees', id), data);
  },
  delete: async (kindergartenId: string, id: string) => {
    await deleteDoc(kgDoc(kindergartenId, 'employees', id));
  }
};

// =========================
// Finances Service
// =========================
export const financesService = {
  getAll: (kindergartenId: string, onData: (data: FinanceTransaction[]) => void, targetMonth?: string, targetYear?: number) => {
    const q = query(kgCollection(kindergartenId, 'transactions'), orderBy('date', 'desc'));
    return onSnapshot(q, (snap: any) => {
      const all = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as FinanceTransaction));
      let filtered = all;
      if (targetMonth && targetYear) {
        // Simple string matching assuming date format is YYYY-MM-DD
        const prefix = `${targetYear}-${targetMonth.padStart(2, '0')}`;
        filtered = all.filter((t: any) => t.date.startsWith(prefix));
      }
      onData(filtered);
    });
  },
  getMonthlyStats: async (kindergartenId: string, year: number) => {
    const snap: any = await getDocs(kgCollection(kindergartenId, 'transactions'));
    const all = snap.docs.map((d: any) => d.data() as FinanceTransaction);
    const filtered = all.filter((t: any) => t.date.startsWith(`${year}-`));
    // Calculate stats... returning empty array for placeholder
    return filtered;
  },
  create: async (kindergartenId: string, data: Omit<FinanceTransaction, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(kgCollection(kindergartenId, 'transactions'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (kindergartenId: string, id: string, data: Partial<FinanceTransaction>) => {
    await updateDoc(kgDoc(kindergartenId, 'transactions', id), data);
  },
  delete: async (kindergartenId: string, id: string) => {
    await deleteDoc(kgDoc(kindergartenId, 'transactions', id));
  },
  getTotalIncome: async () => {
    return 0; // Simplified
  },
  getTotalExpense: async () => {
    return 0; // Simplified
  }
};

// =========================
// Attendance Service
// =========================
export const attendanceService = {
  getByDate: (kindergartenId: string, date: string, onData: (data: AttendanceRecord[]) => void) => {
    const q = query(kgCollection(kindergartenId, 'attendance'), where('date', '==', date));
    return onSnapshot(q, (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    });
  },
  getByDateRange: (kindergartenId: string, startDate: string, endDate: string, onData: (data: AttendanceRecord[]) => void) => {
    const q = query(kgCollection(kindergartenId, 'attendance'), 
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    return onSnapshot(q, (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    });
  },
  getByChild: async (kindergartenId: string, childId: string, startDate: string, endDate: string) => {
    const q = query(kgCollection(kindergartenId, 'attendance'), 
      where('childId', '==', childId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snap: any = await getDocs(q);
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  },
  mark: async (kindergartenId: string, childId: string, date: string, status: 'present' | 'absent' | 'late') => {
    await addDoc(kgCollection(kindergartenId, 'attendance'), {
      childId,
      date,
      status,
      markedAt: new Date().toISOString()
    });
  },
  getMonthlyReport: async () => {
    return [];
  }
};

// =========================
// Groups Service
// =========================
export const groupsService = {
  getAll: (kindergartenId: string, onData: (data: GroupInfo[]) => void) => {
    return onSnapshot(kgCollection(kindergartenId, 'groups'), (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as GroupInfo)));
    });
  },
  create: async (kindergartenId: string, data: Omit<GroupInfo, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(kgCollection(kindergartenId, 'groups'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (kindergartenId: string, id: string, data: Partial<GroupInfo>) => {
    await updateDoc(kgDoc(kindergartenId, 'groups', id), data);
  },
  delete: async (kindergartenId: string, id: string) => {
    await deleteDoc(kgDoc(kindergartenId, 'groups', id));
  }
};

// =========================
// Kindergarten Service
// =========================
export const kindergartenService = {
  getById: async (kindergartenId: string): Promise<Kindergarten | null> => {
    const d = await getDoc(doc(db, 'kindergartens', kindergartenId));
    return d.exists() ? ({ id: d.id, ...d.data() } as Kindergarten) : null;
  },
  update: async (kindergartenId: string, data: Partial<Kindergarten>) => {
    await updateDoc(doc(db, 'kindergartens', kindergartenId), data);
  },
  create: async (data: Omit<Kindergarten, 'id'>) => {
    const docRef = await addDoc(collection(db, 'kindergartens'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  }
};

// =========================
// Convenience aliases (tenant-aware)
// =========================

// Children
export const subscribeChildren = (kgId: string, onData: (data: Child[]) => void, groupId?: string) => childrenService.getAll(kgId, onData, groupId);
export const createChild = (kgId: string, data: Omit<Child, 'id' | 'createdAt'>) => childrenService.create(kgId, data);
export const updateChild = (kgId: string, data: Child) => childrenService.update(kgId, data.id, data);
export const deleteChild = (kgId: string, id: string) => archiveService.archiveChild(kgId, id);
export const permanentDeleteChild = (kgId: string, id: string) => childrenService.delete(kgId, id);

// Employees
export const subscribeEmployees = (kgId: string, onData: (data: Employee[]) => void) => employeesService.getAll(kgId, onData);
export const createEmployee = (kgId: string, data: Omit<Employee, 'id' | 'createdAt'>) => employeesService.create(kgId, data);
export const updateEmployee = (kgId: string, data: Employee) => employeesService.update(kgId, data.id, data);
export const deleteEmployee = (kgId: string, id: string, reason?: string) => archiveService.archiveEmployee(kgId, id, reason);
export const permanentDeleteEmployee = (kgId: string, id: string) => employeesService.delete(kgId, id);

// Groups
export const subscribeGroups = (kgId: string, onData: (data: GroupInfo[]) => void) => groupsService.getAll(kgId, onData);
export const createGroup = (kgId: string, data: Omit<GroupInfo, 'id' | 'createdAt'>) => groupsService.create(kgId, data);
export const updateGroup = (kgId: string, data: GroupInfo) => groupsService.update(kgId, data.id, data);
export const deleteGroup = (kgId: string, id: string) => groupsService.delete(kgId, id);

// Finances
export const subscribeTransactions = (kgId: string, onData: (data: FinanceTransaction[]) => void, targetMonth?: string, targetYear?: number) => financesService.getAll(kgId, onData, targetMonth, targetYear);
export const createTransaction = (kgId: string, data: Omit<FinanceTransaction, 'id' | 'createdAt'>) => financesService.create(kgId, data);
export const deleteTransaction = (kgId: string, id: string) => financesService.delete(kgId, id);

// Attendance
export const subscribeAttendance = (kgId: string, date: string, onData: (data: AttendanceRecord[]) => void) => attendanceService.getByDate(kgId, date, onData);
export const subscribeAttendanceByDate = (kgId: string, date: string, onData: (data: AttendanceRecord[]) => void) => attendanceService.getByDate(kgId, date, onData);
export const subscribeAttendanceByDateRange = (kgId: string, startDate: string, endDate: string, onData: (data: AttendanceRecord[]) => void) => attendanceService.getByDateRange(kgId, startDate, endDate, onData);
export const saveAttendanceForDay = async (kgId: string, data: {
  groupId: string;
  groupName: string;
  date: string;
  rows: { childId: string; childName: string; status: 'present' | 'absent' | 'late' }[];
}) => {
  const { groupId, groupName, date, rows } = data;
  const now = new Date().toISOString();

  // Upsert each child's attendance record with a deterministic doc ID
  const promises = rows.map((row) => {
    const docId = `${groupId}_${row.childId}_${date}`;
    return setDoc(kgDoc(kgId, 'attendance', docId), {
      childId: row.childId,
      childName: row.childName,
      groupId,
      group: groupName,
      date,
      status: row.status,
      checkIn: now,
      checkOut: null,
      markedAt: now,
    }, { merge: true });
  });

  await Promise.all(promises);

  // Also mark the day as closed after saving
  const metaDocId = `${groupId}_${date}`;
  await setDoc(kgDoc(kgId, 'attendanceDays', metaDocId), {
    groupId,
    groupName,
    date,
    closed: true,
    savedAt: now,
  }, { merge: true });
};

export const setAttendanceDayClosed = async (kgId: string, data: {
  groupId: string;
  groupName: string;
  date: string;
  closed: boolean;
}) => {
  const { groupId, groupName, date, closed } = data;
  const metaDocId = `${groupId}_${date}`;
  await setDoc(kgDoc(kgId, 'attendanceDays', metaDocId), {
    groupId,
    groupName,
    date,
    closed,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

export const subscribeAttendanceDay = (kgId: string, groupId: string, date: string, cb: (meta: any) => void) => {
  const metaDocId = `${groupId}_${date}`;
  return onSnapshot(kgDoc(kgId, 'attendanceDays', metaDocId), (snap: any) => {
    cb(snap.exists() ? snap.data() : null);
  });
};

// =========================
// Employee Attendance Service
// =========================
export const saveEmployeeAttendanceForDay = async (kgId: string, data: {
  date: string;
  rows: { employeeId: string; employeeName: string; status: 'present' | 'absent' | 'late' }[];
}) => {
  const { date, rows } = data;
  const now = new Date().toISOString();
  const promises = rows.map((row) => {
    const docId = `emp_${row.employeeId}_${date}`;
    return setDoc(kgDoc(kgId, 'employeeAttendance', docId), {
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      date,
      status: row.status,
      markedAt: now,
    }, { merge: true });
  });
  await Promise.all(promises);
  const metaDocId = `emp_${date}`;
  await setDoc(kgDoc(kgId, 'employeeAttendanceDays', metaDocId), {
    date, closed: true, savedAt: now,
  }, { merge: true });
};

export const subscribeEmployeeAttendanceByDate = (kgId: string, date: string, onData: (data: any[]) => void) => {
  const q = query(kgCollection(kgId, 'employeeAttendance'), where('date', '==', date));
  return onSnapshot(q, (snap: any) => {
    onData(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
  });
};

export const subscribeEmployeeAttendanceByDateRange = (kgId: string, startDate: string, endDate: string, onData: (data: any[]) => void) => {
  const q = query(kgCollection(kgId, 'employeeAttendance'), where('date', '>=', startDate), where('date', '<=', endDate));
  return onSnapshot(q, (snap: any) => {
    onData(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
  });
};

export const setEmployeeAttendanceDayClosed = async (kgId: string, date: string, closed: boolean) => {
  const metaDocId = `emp_${date}`;
  await setDoc(kgDoc(kgId, 'employeeAttendanceDays', metaDocId), {
    date, closed, updatedAt: new Date().toISOString(),
  }, { merge: true });
};

export const subscribeEmployeeAttendanceDay = (kgId: string, date: string, cb: (meta: any) => void) => {
  const metaDocId = `emp_${date}`;
  return onSnapshot(kgDoc(kgId, 'employeeAttendanceDays', metaDocId), (snap: any) => {
    cb(snap.exists() ? snap.data() : null);
  });
};
export const subscribeDepartments = (kgId: string, onData: (data: Department[]) => void) => {
  return onSnapshot(kgCollection(kgId, 'departments'), (snap: any) => {
    onData(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Department)));
  });
};
export const createDepartment = async (kgId: string, data: Omit<Department, 'id'>) => {
  const docRef = await addDoc(kgCollection(kgId, 'departments'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};
export const deleteDepartment = async (kgId: string, id: string) => {
  await deleteDoc(kgDoc(kgId, 'departments', id));
};

// =========================
// Archive Service
// =========================
export interface ArchivedItem {
  id: string;
  type: 'child' | 'employee';
  originalId: string;
  data: any;
  archivedAt: string;
  archivedBy?: string;
  reason?: string;
}

export const archiveService = {
  /** Move a child to archive and delete from children collection */
  archiveChild: async (kindergartenId: string, childId: string) => {
    const childDoc = await getDoc(kgDoc(kindergartenId, 'children', childId));
    if (!childDoc.exists()) throw new Error('Bola topilmadi');
    const childData = childDoc.data();
    
    await addDoc(kgCollection(kindergartenId, 'archive'), {
      type: 'child',
      originalId: childId,
      data: childData,
      archivedAt: new Date().toISOString(),
    });
    
    await deleteDoc(kgDoc(kindergartenId, 'children', childId));
  },

  /** Move an employee to archive and delete from employees collection */
  archiveEmployee: async (kindergartenId: string, employeeId: string, reason?: string) => {
    const empDoc = await getDoc(kgDoc(kindergartenId, 'employees', employeeId));
    if (!empDoc.exists()) throw new Error('Xodim topilmadi');
    const empData = empDoc.data();
    
    await addDoc(kgCollection(kindergartenId, 'archive'), {
      type: 'employee',
      originalId: employeeId,
      data: empData,
      archivedAt: new Date().toISOString(),
      ...(reason ? { reason } : {}),
    });
    
    await deleteDoc(kgDoc(kindergartenId, 'employees', employeeId));
  },

  /** Subscribe to all archived items */
  subscribeAll: (kindergartenId: string, onData: (items: ArchivedItem[]) => void) => {
    const q = query(kgCollection(kindergartenId, 'archive'), orderBy('archivedAt', 'desc'));
    return onSnapshot(q, (snap: any) => {
      onData(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as ArchivedItem)));
    });
  },

  /** Restore an archived item back to its original collection */
  restore: async (kindergartenId: string, archiveDocId: string) => {
    const archDoc = await getDoc(kgDoc(kindergartenId, 'archive', archiveDocId));
    if (!archDoc.exists()) throw new Error('Arxiv yozuvi topilmadi');
    const { type, data, originalId } = archDoc.data() as any;

    const targetCollection = type === 'child' ? 'children' : 'employees';
    
    // Restore to original collection with the same ID
    await setDoc(kgDoc(kindergartenId, targetCollection, originalId), {
      ...data,
      restoredAt: new Date().toISOString(),
    });
    
    // Remove from archive
    await deleteDoc(kgDoc(kindergartenId, 'archive', archiveDocId));
  },

  /** Permanently delete from archive */
  permanentDelete: async (kindergartenId: string, archiveDocId: string) => {
    await deleteDoc(kgDoc(kindergartenId, 'archive', archiveDocId));
  },
};

// Archive convenience aliases
export const archiveChild = (kgId: string, childId: string) => archiveService.archiveChild(kgId, childId);
export const archiveEmployee = (kgId: string, employeeId: string) => archiveService.archiveEmployee(kgId, employeeId);
export const subscribeArchive = (kgId: string, onData: (items: ArchivedItem[]) => void) => archiveService.subscribeAll(kgId, onData);
export const restoreFromArchive = (kgId: string, archiveDocId: string) => archiveService.restore(kgId, archiveDocId);
export const permanentDeleteFromArchive = (kgId: string, archiveDocId: string) => archiveService.permanentDelete(kgId, archiveDocId);

// =========================
// User Profile (root-level, no tenant scoping)
// =========================
export const getUserProfile = async (uid: string) => {
  const d = await getDoc(doc(db, 'users', uid));
  return d.exists() ? d.data() : null;
};
export const upsertUserProfile = async (uid: string, data: any) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
};
