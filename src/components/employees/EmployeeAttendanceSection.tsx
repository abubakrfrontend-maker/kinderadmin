import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, UserX, Clock, Save, RotateCcw, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Employee } from '@/types';
import {
  saveEmployeeAttendanceForDay,
  setEmployeeAttendanceDayClosed,
  subscribeEmployeeAttendanceByDate,
  subscribeEmployeeAttendanceDay,
} from '@/services/firestore';
import { useAuth } from '@/context/AuthContext';
import { formatDateDisplay } from '@/utils/date';

type Status = 'present' | 'absent' | 'late';

const statusCfg: Record<Status, { label: string; icon: React.ReactNode; bg: string; text: string; border: string; dot: string }> = {
  present: { label: 'Keldi', icon: <CheckCircle2 className="w-3.5 h-3.5" />, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  absent:  { label: 'Kelmadi', icon: <UserX className="w-3.5 h-3.5" />, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-300', dot: 'bg-red-500' },
  late:    { label: 'Kechikdi', icon: <Clock className="w-3.5 h-3.5" />, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
};

interface Props {
  employees: Employee[];
}

export default function EmployeeAttendanceSection({ employees }: Props) {
  const { kindergartenId } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<any[]>([]);
  const [draft, setDraft] = useState<Record<string, Status>>({});
  const [dayClosed, setDayClosed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeEmployees = useMemo(
    () => employees.filter(e => e.status === 'active').sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [employees]
  );

  useEffect(() => {
    if (!kindergartenId) return;
    const unsub1 = subscribeEmployeeAttendanceByDate(kindergartenId, selectedDate, setRecords);
    const unsub2 = subscribeEmployeeAttendanceDay(kindergartenId, selectedDate, (meta: any) => setDayClosed(Boolean(meta?.closed)));
    return () => { unsub1(); unsub2(); };
  }, [kindergartenId, selectedDate]);

  useEffect(() => {
    const next: Record<string, Status> = {};
    activeEmployees.forEach(emp => {
      const rec = records.find((r: any) => r.employeeId === emp.id);
      next[emp.id] = (rec?.status ?? 'absent') as Status;
    });
    setDraft(next);
  }, [activeEmployees, records]);

  const handleToggle = (empId: string, status: Status) => {
    if (dayClosed) return;
    setDraft(prev => ({ ...prev, [empId]: status }));
  };

  const handleSave = async () => {
    if (!kindergartenId || dayClosed) return;
    setIsSaving(true);
    try {
      await saveEmployeeAttendanceForDay(kindergartenId, {
        date: selectedDate,
        rows: activeEmployees.map(emp => ({
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          status: draft[emp.id] ?? 'absent',
        })),
      });
      toast.success('Davomat saqlandi');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Xatolik'); }
    finally { setIsSaving(false); }
  };

  const handleReopen = async () => {
    if (!kindergartenId) return;
    try {
      await setEmployeeAttendanceDayClosed(kindergartenId, selectedDate, false);
      toast.success('Davomat qayta ochildi');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Xatolik'); }
  };

  const summary = useMemo(() => {
    let present = 0, absent = 0, late = 0;
    activeEmployees.forEach(e => {
      const s = draft[e.id] ?? 'absent';
      if (s === 'present') present++;
      else if (s === 'late') late++;
      else absent++;
    });
    return { present, absent, late, total: activeEmployees.length };
  }, [activeEmployees, draft]);

  if (activeEmployees.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-surface-primary rounded-2xl border border-border-default overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-4 border-b border-border-subtle bg-gradient-to-r from-surface-secondary/50 to-surface-primary">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Xodimlar davomati</h3>
              <p className="text-xs text-text-tertiary">{formatDateDisplay(selectedDate, 'dd.MM.yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 px-4 sm:px-5 py-3 border-b border-border-subtle bg-surface-secondary/20">
        {[
          { label: 'Jami', val: summary.total, color: 'text-text-primary', icon: <Users className="w-3.5 h-3.5 text-slate-400" /> },
          { label: 'Keldi', val: summary.present, color: 'text-emerald-600', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
          { label: 'Kelmadi', val: summary.absent, color: 'text-red-600', icon: <UserX className="w-3.5 h-3.5 text-red-500" /> },
          { label: 'Kechikdi', val: summary.late, color: 'text-amber-600', icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            {s.icon}
            <div>
              <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-text-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Employee list */}
      <div className="divide-y divide-border-subtle max-h-[500px] overflow-y-auto">
        {activeEmployees.map((emp, idx) => {
          const status = draft[emp.id] ?? 'absent';
          return (
            <motion.div key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
              className={`flex items-center gap-3 px-4 sm:px-5 py-3 transition-colors ${dayClosed ? 'opacity-70' : 'hover:bg-surface-secondary/30'}`}>
              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{emp.firstName} {emp.lastName}</p>
                <p className="text-[11px] text-text-tertiary">{emp.position}</p>
              </div>
              {/* Status buttons */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {(['present', 'absent', 'late'] as Status[]).map(s => {
                  const cfg = statusCfg[s];
                  const active = status === s;
                  return (
                    <button key={s} onClick={() => handleToggle(emp.id, s)} disabled={dayClosed}
                      className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border transition-all duration-150 ${
                        active ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'border-transparent text-text-tertiary hover:bg-surface-secondary'
                      } disabled:cursor-not-allowed`}>
                      {cfg.icon}
                      <span className="hidden sm:inline">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-border-subtle bg-surface-secondary/30">
        {dayClosed ? (
          <>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Davomat saqlangan
            </p>
            <button onClick={handleReopen}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-default text-xs font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Tahrirlash
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-text-tertiary">
              {summary.present + summary.late}/{summary.total} xodim keldi
            </p>
            <button onClick={handleSave} disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-semibold hover:bg-navy-800 transition-colors disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
