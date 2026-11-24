import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Search, Users, UserCheck, RotateCcw, Trash2, Eye, X, Calendar, Briefcase, Phone, MapPin, GraduationCap, MessageSquare, Baby, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { subscribeArchive, restoreFromArchive, permanentDeleteFromArchive, type ArchivedItem } from '@/services/firestore';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { formatDateDisplay } from '@/utils/date';

const ITEMS_PER_PAGE = 10;

export default function ArchivePage() {
  const { kindergartenId } = useAuth();
  const [items, setItems] = useState<ArchivedItem[]>([]);
  const [filter, setFilter] = useState<'' | 'child' | 'employee'>('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ArchivedItem | null>(null);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!kindergartenId) return;
    const unsub = subscribeArchive(kindergartenId, setItems);
    return () => unsub();
  }, [kindergartenId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(item => {
      if (filter && item.type !== filter) return false;
      if (q) {
        const name = `${item.data?.firstName || ''} ${item.data?.lastName || ''}`.toLowerCase();
        return name.includes(q);
      }
      return true;
    });
  }, [items, filter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const childCount = items.filter(i => i.type === 'child').length;
  const empCount = items.filter(i => i.type === 'employee').length;

  const handleRestore = async (item: ArchivedItem) => {
    if (!confirm(`"${item.data.firstName} ${item.data.lastName}" ni qaytarishni xohlaysizmi?`)) return;
    setIsRestoring(item.id);
    try {
      await restoreFromArchive(kindergartenId!, item.id);
      toast.success("Muvaffaqiyatli qaytarildi!");
      setSelectedItem(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Xatolik"); }
    finally { setIsRestoring(null); }
  };

  const handlePermanentDelete = async (item: ArchivedItem) => {
    if (!confirm(`Butunlay o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi!`)) return;
    try {
      await permanentDeleteFromArchive(kindergartenId!, item.id);
      toast.success("Butunlay o'chirildi");
      setSelectedItem(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Xatolik"); }
  };

  const getName = (d: any) => `${d?.firstName || ''} ${d?.lastName || ''}`.trim() || 'Noma\'lum';
  const fmtDate = (s: string) => { try { return formatDateDisplay(s, 'dd.MM.yyyy'); } catch { return s; } };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <Archive className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </div>
            Arxiv
          </h1>
          <p className="text-xs sm:text-sm text-text-tertiary mt-1 ml-[46px] sm:ml-[50px]">
            O'chirilgan xodimlar va bolalar shu yerda saqlanadi
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Jami', count: items.length, icon: <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />, bg: 'bg-slate-50', ring: 'ring-slate-200' },
          { label: 'Bolalar', count: childCount, icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />, bg: 'bg-blue-50', ring: 'ring-blue-200' },
          { label: 'Xodimlar', count: empCount, icon: <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />, bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
        ].map(s => (
          <div key={s.label} className="bg-surface-primary rounded-2xl border border-border-default p-3 sm:p-4 hover:shadow-md hover:shadow-black/[0.04] transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${s.bg} ring-1 ${s.ring} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-text-primary leading-tight">{s.count}</p>
                <p className="text-[10px] sm:text-xs text-text-tertiary">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-surface-primary rounded-2xl border border-border-default overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center px-3 sm:px-4 py-3 border-b border-border-subtle">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Ism bo'yicha qidiring..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 transition-all" />
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            {([
              { key: '' as const, label: 'Barchasi', icon: <Package className="w-3.5 h-3.5" /> },
              { key: 'child' as const, label: 'Bolalar', icon: <Baby className="w-3.5 h-3.5" /> },
              { key: 'employee' as const, label: 'Xodimlar', icon: <Briefcase className="w-3.5 h-3.5" /> },
            ]).map(f => (
              <button key={f.key} onClick={() => { setFilter(f.key); setCurrentPage(1); }}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all duration-200 ${
                  filter === f.key ? 'bg-navy-900 text-white border-navy-900 shadow-sm' : 'border-border-default text-text-secondary hover:bg-surface-secondary'
                }`}>
                {f.icon}
                <span className="hidden xs:inline sm:inline">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <EmptyState icon={<Archive className="w-6 h-6 text-text-tertiary" />} title="Arxiv bo'sh" description="O'chirilgan ma'lumotlar shu yerda ko'rinadi." />
        ) : (
          <>
            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-border-subtle">
              {paginated.map((item, idx) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03, duration: 0.25 }}
                  className="px-3 py-3 hover:bg-surface-secondary/30 active:bg-surface-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ${
                      item.type === 'child' ? 'bg-blue-50 ring-blue-200' : 'bg-emerald-50 ring-emerald-200'
                    }`}>
                      {item.type === 'child' ? <Baby className="w-5 h-5 text-blue-500" /> : <Briefcase className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{getName(item.data)}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          item.type === 'child' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {item.type === 'child' ? 'Bola' : 'Xodim'}
                        </span>
                        <span className="text-[10px] text-text-tertiary">{fmtDate(item.archivedAt)}</span>
                      </div>
                      {item.reason && (
                        <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.reason}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => setSelectedItem(item)} className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRestore(item)} disabled={isRestoring === item.id}
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Turi</th>
                    <th className="text-left px-2 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Ism familiya</th>
                    <th className="text-left px-2 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider hidden lg:table-cell">Ma'lumot</th>
                    <th className="text-left px-2 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider hidden xl:table-cell">Sabab</th>
                    <th className="text-left px-2 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Sana</th>
                    <th className="text-center px-2 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item, idx) => (
                    <motion.tr key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                      className="border-b border-border-subtle last:border-0 hover:bg-surface-secondary/40 transition-colors group">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          item.type === 'child' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {item.type === 'child' ? <><Baby className="w-3.5 h-3.5" /> Bola</> : <><Briefcase className="w-3.5 h-3.5" /> Xodim</>}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <p className="text-sm font-semibold text-text-primary">{getName(item.data)}</p>
                      </td>
                      <td className="px-2 py-3 hidden lg:table-cell">
                        <p className="text-sm text-text-secondary">{item.type === 'child' ? (item.data.group || '—') : (item.data.position || '—')}</p>
                      </td>
                      <td className="px-2 py-3 hidden xl:table-cell">
                        {item.reason ? (
                          <p className="text-xs text-amber-600 max-w-[200px] truncate flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 flex-shrink-0" />{item.reason}
                          </p>
                        ) : <span className="text-xs text-text-tertiary">—</span>}
                      </td>
                      <td className="px-2 py-3"><p className="text-sm text-text-secondary">{fmtDate(item.archivedAt)}</p></td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setSelectedItem(item)}
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary opacity-60 group-hover:opacity-100 transition-all" title="Ko'rish">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRestore(item)} disabled={isRestoring === item.id}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 opacity-60 group-hover:opacity-100 transition-all disabled:opacity-50" title="Qaytarish">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button onClick={() => handlePermanentDelete(item)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 opacity-60 group-hover:opacity-100 transition-all" title="Butunlay o'chirish">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
          </>
        )}
      </motion.div>

      {/* Detail side panel */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setSelectedItem(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-screen w-full sm:w-[480px] lg:w-[520px] bg-surface-primary shadow-2xl z-50 flex flex-col">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border-default flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedItem.type === 'child' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                    {selectedItem.type === 'child' ? <Baby className="w-4 h-4 text-blue-500" /> : <Briefcase className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">{getName(selectedItem.data)}</h2>
                    <p className="text-[11px] text-text-tertiary">Arxiv yozuvi</p>
                  </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 sm:px-6 py-4">
                  {/* Archive info banner */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Archive className="w-4 h-4 text-amber-600" />
                      <p className="text-xs font-semibold text-amber-800">Arxivlangan</p>
                    </div>
                    <p className="text-xs text-amber-700">Sana: {fmtDate(selectedItem.archivedAt)}</p>
                    {selectedItem.reason && (
                      <div className="mt-2 pt-2 border-t border-amber-200/60">
                        <p className="text-xs text-amber-600 flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span className="font-medium">Sabab: {selectedItem.reason}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Detail fields */}
                  <div className="space-y-2.5">
                    {selectedItem.type === 'child' ? (
                      <ChildDetail data={selectedItem.data} fmtDate={fmtDate} />
                    ) : (
                      <EmployeeDetail data={selectedItem.data} fmtDate={fmtDate} />
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 px-5 sm:px-6 py-4 border-t border-border-default bg-surface-secondary/30 flex-shrink-0">
                <button onClick={() => handlePermanentDelete(selectedItem)}
                  className="p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-50 transition-colors" title="Butunlay o'chirish">
                  <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={() => handleRestore(selectedItem)} disabled={isRestoring === selectedItem.id}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  {isRestoring === selectedItem.id ? 'Qaytarilmoqda...' : "Bog'chaga qaytarish"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- Sub-components ---- */

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border-default hover:bg-surface-secondary/30 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-text-tertiary leading-tight">{label}</p>
        <p className="text-sm font-medium text-text-primary mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ChildDetail({ data, fmtDate }: { data: any; fmtDate: (s: string) => string }) {
  return (
    <>
      <InfoRow icon={<Users className="w-4 h-4 text-blue-500" />} label="Guruh" value={data?.group || ''} />
      <InfoRow icon={<Calendar className="w-4 h-4 text-purple-500" />} label="Tug'ilgan sanasi" value={data?.dateOfBirth ? fmtDate(data.dateOfBirth) : ''} />
      <InfoRow icon={<Calendar className="w-4 h-4 text-emerald-500" />} label="Ro'yxatga olingan" value={data?.enrollmentDate ? fmtDate(data.enrollmentDate) : ''} />
      <InfoRow icon={<MapPin className="w-4 h-4 text-amber-500" />} label="Manzil" value={data?.address || ''} />
      {data?.parents?.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Ota-onalar</p>
          {data.parents.map((p: any, i: number) => (
            <div key={i} className="p-3 rounded-xl border border-border-default bg-surface-secondary/30">
              <p className="text-sm font-medium text-text-primary">{p.firstName} {p.lastName}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{p.relation} • {p.phone}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function EmployeeDetail({ data, fmtDate }: { data: any; fmtDate: (s: string) => string }) {
  return (
    <>
      <InfoRow icon={<Briefcase className="w-4 h-4 text-blue-500" />} label="Lavozim" value={data?.position || ''} />
      <InfoRow icon={<UserCheck className="w-4 h-4 text-emerald-500" />} label="Bo'lim" value={data?.department || ''} />
      <InfoRow icon={<Phone className="w-4 h-4 text-sky-500" />} label="Telefon" value={data?.phone || ''} />
      <InfoRow icon={<Calendar className="w-4 h-4 text-purple-500" />} label="Ishga kirgan" value={data?.hireDate ? fmtDate(data.hireDate) : ''} />
      <InfoRow icon={<Calendar className="w-4 h-4 text-pink-500" />} label="Tug'ilgan sanasi" value={data?.birthDate ? fmtDate(data.birthDate) : ''} />
      <InfoRow icon={<MapPin className="w-4 h-4 text-amber-500" />} label="Manzil" value={data?.address || ''} />
      <InfoRow icon={<GraduationCap className="w-4 h-4 text-indigo-500" />} label="Ma'lumoti" value={data?.education || ''} />
      {data?.contractStartDate && (
        <InfoRow icon={<Briefcase className="w-4 h-4 text-cyan-500" />} label="Shartnoma muddati"
          value={`${fmtDate(data.contractStartDate)} — ${data.contractEndDate ? fmtDate(data.contractEndDate) : '—'}`} />
      )}
      {data?.referralSource && (
        <InfoRow icon={<MessageSquare className="w-4 h-4 text-orange-500" />} label="Qayerdan keldi" value={data.referralSource} />
      )}
    </>
  );
}
