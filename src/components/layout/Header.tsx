import { useState, useEffect, useMemo, useRef } from 'react';
import { Sun, Moon, User, LogOut, Bell, X, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/Dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { subscribeEmployees } from '@/services/firestore';
import type { Employee } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDateDisplay } from '@/utils/date';

interface HeaderProps {
  sidebarCollapsed: boolean;
  isMobile: boolean;
}

interface ContractNotification {
  id: string;
  employeeName: string;
  daysLeft: number;
  contractEndDate: string;
  type: 'expiring' | 'expired';
}

export default function Header({ isMobile }: HeaderProps) {
  const { user, logout, kindergarten, kindergartenId } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const storageKey = `dismissed_notifs_${kindergartenId || 'default'}`;
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    if (!kindergartenId) return;
    const unsub = subscribeEmployees(kindergartenId, setEmployees);
    return () => unsub();
  }, [kindergartenId]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  const notifications = useMemo<ContractNotification[]>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const result: ContractNotification[] = [];

    employees.forEach((emp) => {
      if (!emp.contractEndDate || emp.status === 'terminated') return;
      const end = new Date(emp.contractEndDate);
      end.setHours(0, 0, 0, 0);
      const diff = end.getTime() - now.getTime();
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

      if (daysLeft <= 10) {
        result.push({
          id: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          daysLeft,
          contractEndDate: emp.contractEndDate,
          type: daysLeft < 0 ? 'expired' : 'expiring',
        });
      }
    });

    return result.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [employees]);

  const activeNotifications = notifications.filter((n) => !dismissedIds.has(n.id));
  const unreadCount = activeNotifications.length;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set([...prev, id]);
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-surface-primary border-b border-border-default z-30 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        {isMobile && <h1 className="font-bold text-xl text-primary">KinderAdmin</h1>}
        {kindergarten && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-secondary/60 border border-border-subtle">
            <span className="text-base">🏫</span>
            <span className="text-sm font-semibold text-text-primary truncate max-w-[200px]">{kindergarten.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-text-secondary hover:text-primary rounded-full hover:bg-surface-secondary transition-colors"
            aria-label="Bildirishnomalar"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 ring-2 ring-surface-primary animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Mobile overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 sm:hidden"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-x-3 top-[72px] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[380px] bg-surface-primary rounded-2xl shadow-2xl border border-border-default z-50 overflow-hidden max-h-[calc(100vh-100px)] sm:max-h-[480px] flex flex-col"
                >
                  {/* Panel header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-secondary/30 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-text-tertiary" />
                      <h3 className="text-sm font-semibold text-text-primary">Bildirishnomalar</h3>
                      {unreadCount > 0 && (
                        <span className="min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-red-100 text-red-600 text-[10px] font-bold px-1">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Notifications list */}
                  <div className="flex-1 overflow-y-auto">
                    {activeNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-text-tertiary/40 mx-auto mb-2" />
                        <p className="text-sm text-text-tertiary">Yangi bildirishnoma yo'q</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border-subtle">
                        {activeNotifications.map((notif, idx) => (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.2 }}
                            className="px-4 py-3 hover:bg-surface-secondary/50 transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                notif.type === 'expired' ? 'bg-red-50' : 'bg-amber-50'
                              }`}>
                                {notif.type === 'expired' 
                                  ? <AlertTriangle className="w-4 h-4 text-red-500" />
                                  : <FileText className="w-4 h-4 text-amber-500" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text-primary">
                                  {notif.employeeName}
                                </p>
                                <p className={`text-xs font-medium mt-0.5 ${
                                  notif.type === 'expired' ? 'text-red-600' : 'text-amber-600'
                                }`}>
                                  {notif.type === 'expired'
                                    ? `⚠️ Shartnoma muddati tugagan (${Math.abs(notif.daysLeft)} kun oldin)`
                                    : `⏰ Shartnoma tugashiga ${notif.daysLeft} kun qoldi`
                                  }
                                </p>
                                <p className="text-[11px] text-text-tertiary mt-1">
                                  Tugash sanasi: {formatDateDisplay(notif.contractEndDate, 'dd.MM.yyyy')}
                                </p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDismiss(notif.id); }}
                                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0"
                                title="Yopish"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Panel footer */}
                  {activeNotifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-border-subtle bg-surface-secondary/20 flex-shrink-0">
                      <button
                        onClick={() => { navigate('/employees'); setShowNotifications(false); }}
                        className="w-full text-center text-xs font-semibold text-primary hover:underline py-1"
                      >
                        Xodimlar bo'limiga o'tish →
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-text-secondary hover:text-primary rounded-full hover:bg-surface-secondary transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
              {user?.photoURL && <AvatarImage src={user.photoURL} alt={user?.displayName || 'User'} />}
              <AvatarFallback>{(user?.displayName || 'U').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <div className="px-3 py-2 border-b border-border-subtle">
              <p className="text-sm font-medium text-text-primary truncate">{user?.displayName}</p>
              <p className="text-xs text-text-tertiary truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                <User className="w-4 h-4 mr-2" />
                <span>Profil sozlamalari</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2 text-red-500" />
                <span className="text-red-500">Chiqish</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
