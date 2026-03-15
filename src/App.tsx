/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Save, 
  Calculator, 
  Calendar as CalendarIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Info,
  History,
  Archive,
  RotateCcw,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  ArrowUpDown,
  ChevronFirst,
  ChevronLast,
  LayoutDashboard,
  Clock,
  CalendarDays,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  createArchive,
  deleteAllEntries,
  deleteEntryById,
  listArchives,
  listEntries,
  listSettings,
  setSetting,
  upsertEntries,
} from './lib/storage';
import { useAuth } from './auth/AuthContext';
import LoginPage from './components/LoginPage';

interface Entry {
  id: string;
  date: string;
  revenue: number; // إيداع
  coupons: number; // بونات
  debitNote: string; // مذكرة خطأ مدين
  invoices: number; // فواتير
  creditNote: string; // مذكرة خطأ دائن
}

interface BalanceEntry extends Entry {
  balance: number;
}

interface Period {
  key: string;
  startDate: string;
  endDate: string;
  displayLabel: string;
  entries: BalanceEntry[];
  count: number;
  closingBalance: number;
}

const INITIAL_ENTRIES: Entry[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (13 - i));
  return {
    id: Math.random().toString(36).substr(2, 9),
    date: date.toISOString().split('T')[0],
    revenue: 0,
    coupons: 0,
    debitNote: '',
    invoices: 0,
    creditNote: '',
  };
});

type View = 'ledger' | 'archive-list';

const getPeriodForDate = (date: Date) => {
  const anchor = new Date('2026-01-05').getTime();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const PERIOD_MS = 14 * DAY_MS;
  
  const diff = date.getTime() - anchor;
  const periodIndex = Math.floor(diff / PERIOD_MS);
  const periodStart = new Date(anchor + periodIndex * PERIOD_MS);
  const periodEnd = new Date(anchor + (periodIndex + 1) * PERIOD_MS - DAY_MS);
  
  return {
    start: periodStart.toISOString().split('T')[0],
    end: periodEnd.toISOString().split('T')[0],
    startDate: periodStart,
    endDate: periodEnd
  };
};

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null); // null means current
  const [view, setView] = useState<View>('ledger');
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [archiveSortOrder, setArchiveSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveFromDate, setArchiveFromDate] = useState('');
  const [archiveToDate, setArchiveToDate] = useState('');
  const [archiveMinTransactions, setArchiveMinTransactions] = useState<number | ''>('');
  const [archivePage, setArchivePage] = useState(1);
  const [archiveRowsPerPage, setArchiveRowsPerPage] = useState(10);
  const [archiveSortField, setArchiveSortField] = useState<'date' | 'count' | 'balance'>('date');
  const [archiveSortDirection, setArchiveSortDirection] = useState<'asc' | 'desc'>('desc');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [currentPeriodDates, setCurrentPeriodDates] = useState<string[]>([]);
  const [hasInitializedPeriod, setHasInitializedPeriod] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [archives, setArchives] = useState<any[]>([]);
  const [viewingArchive, setViewingArchive] = useState<any | null>(null);

  const fetchEntries = async () => {
    try {
      const data = await listEntries();
      if (data.length > 0) {
        setAllEntries(data);
      } else {
        setAllEntries(INITIAL_ENTRIES);
        await upsertEntries(INITIAL_ENTRIES);
      }
    } catch (err) {
      console.error("Failed to fetch entries", err);
    }
  };

  const scrollToSummary = () => {
    const element = document.getElementById('summary-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToLedger = () => {
    const element = document.getElementById('ledger-table');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await listSettings();
      if (data.openingBalance !== undefined) {
        setOpeningBalance(parseFloat(data.openingBalance) || 0);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const fetchArchives = async () => {
    try {
      const data = await listArchives();
      setArchives(data);
    } catch (err) {
      console.error("Failed to fetch archives", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchEntries();
    fetchSettings();
    fetchArchives();
  }, [user]);

  // Refresh data when navigating between views to ensure latest state
  useEffect(() => {
    if (!user) return;
    if (view === 'ledger') {
      fetchEntries();
      fetchSettings();
    } else if (view === 'archive-list') {
      fetchArchives();
    }
  }, [view, user]);

  // Initialize currentPeriodDates when selectedPeriod changes or on first load
  useEffect(() => {
    let startDate: string;
    if (!selectedPeriod) {
      const now = new Date();
      const p = getPeriodForDate(now);
      startDate = p.start;
    } else {
      [startDate] = selectedPeriod.split(' → ');
    }

    const dates: string[] = [];
    const curr = new Date(startDate);
    for (let i = 0; i < 14; i++) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    setCurrentPeriodDates(dates);
    setHasInitializedPeriod(true);
  }, [selectedPeriod]);

  const saveEntries = async (entriesToSave: Entry[]) => {
    try {
      await upsertEntries(entriesToSave);
    } catch (err) {
      console.error("Failed to save entries", err);
    }
  };

  const saveOpeningBalance = async (val: number) => {
    try {
      await setSetting('openingBalance', val.toString());
    } catch (err) {
      console.error("Failed to save opening balance", err);
    }
  };

  const handleSaveAndArchive = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // 1. Save all entries to ensure everything is up to date
      await upsertEntries(allEntries);

      // 2. Create a snapshot for the archive
      let currentPeriod;
      if (selectedPeriod) {
        currentPeriod = periods.find(p => p.key === selectedPeriod);
      } else {
        // For the current period, we can derive the label from the current view dates
        const start = currentPeriodDates[0];
        const end = currentPeriodDates[currentPeriodDates.length - 1];
        currentPeriod = {
          key: `${start} → ${end}`,
          displayLabel: `${formatDateArabic(start)} ← ${formatDateArabic(end)}`
        };
      }
      
      if (currentPeriod) {
        const archiveData = {
          entries: currentViewEntries,
          totals: totals,
          openingBalance: openingBalance,
          periodKey: currentPeriod.key,
          displayLabel: currentPeriod.displayLabel
        };

        await createArchive({
          id: Math.random().toString(36).substr(2, 9),
          name: currentPeriod.displayLabel,
          data: archiveData,
        });
      }
      
      // 3. Refresh archives
      await fetchArchives();

      // 4. Show success message
      setNotification({ message: 'تم حفظ وأرشفة الفترة بنجاح', type: 'success' });
      
      // 5. Wait a bit then navigate to archive
      setTimeout(() => {
        setView('archive-list');
        setNotification(null);
      }, 1500);
    } catch (err) {
      console.error("Failed to save and archive", err);
      setNotification({ message: 'فشل حفظ الفترة، يرجى المحاولة مرة أخرى', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewPeriod = async () => {
    console.log("handleCreateNewPeriod clicked");
    if (isCreatingNew) return;
    setIsCreatingNew(true);
    
    try {
      // 1. Clear entries in Supabase
      await deleteAllEntries();
      
      // 2. Generate new entries
      console.log("Generating new entries");
      const newEntries = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (13 - i));
        return {
          id: Math.random().toString(36).substr(2, 9),
          date: date.toISOString().split('T')[0],
          revenue: 0,
          coupons: 0,
          debitNote: '',
          invoices: 0,
          creditNote: '',
        };
      });

      // 3. Save new state to server first to ensure persistence
      console.log("Saving new entries to server");
      await saveEntries(newEntries);
      console.log("Saving opening balance to server");
      await saveOpeningBalance(0);
      
      // 4. Update all states at once
      console.log("Updating local state");
      setAllEntries(newEntries);
      setOpeningBalance(0);
      setSelectedPeriod(null);
      setViewingArchive(null);
      setView('ledger');
      window.scrollTo(0, 0);
      
      setNotification({ message: 'تم إنشاء فترة محاسبية جديدة بنجاح', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error("Failed to create new period:", err);
      setNotification({ message: 'فشل إنشاء فترة جديدة، يرجى المحاولة مرة أخرى', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsCreatingNew(false);
    }
  };

  // Calculate cumulative balances for all entries
  const entriesWithBalance = useMemo(() => {
    const sorted = [...allEntries].sort((a, b) => a.date.localeCompare(b.date));
    let currentBalance = openingBalance;
    
    return sorted.map(entry => {
      const rowDebit = (entry.revenue || 0) + (entry.coupons || 0);
      const rowCredit = (entry.invoices || 0);
      currentBalance = currentBalance + rowDebit - rowCredit;
      return { ...entry, balance: currentBalance } as BalanceEntry;
    });
  }, [allEntries, openingBalance]);

  const formatDateArabic = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${day} / ${month} / ${fullYear}`;
  };

  // Period calculation logic
  const periods = useMemo(() => {
    if (entriesWithBalance.length === 0) return [];

    const anchor = new Date('2026-01-05').getTime();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const PERIOD_MS = 14 * DAY_MS;

    const grouped: Record<string, BalanceEntry[]> = {};
    
    entriesWithBalance.forEach(entry => {
      const entryTime = new Date(entry.date).getTime();
      if (isNaN(entryTime)) return; // Skip invalid dates
      
      const diff = entryTime - anchor;
      const periodIndex = Math.floor(diff / PERIOD_MS);
      const periodStart = new Date(anchor + periodIndex * PERIOD_MS);
      const periodEnd = new Date(anchor + (periodIndex + 1) * PERIOD_MS - DAY_MS);
      
      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) return;

      const key = `${periodStart.toISOString().split('T')[0]} → ${periodEnd.toISOString().split('T')[0]}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });

    const periodList = Object.entries(grouped).map(([key, entries]) => {
      const [start, end] = key.split(' → ');
      
      // Ensure dates are ordered correctly (oldest to newest)
      const d1 = new Date(start);
      const d2 = new Date(end);
      const actualStart = d1 < d2 ? start : end;
      const actualEnd = d1 < d2 ? end : start;
      const sortedEntries = entries.sort((a, b) => a.date.localeCompare(b.date));
      const closingBalance = sortedEntries[sortedEntries.length - 1]?.balance ?? 0;

      return {
        key,
        startDate: actualStart,
        endDate: actualEnd,
        displayLabel: `${formatDateArabic(actualStart)} ← ${formatDateArabic(actualEnd)}`,
        entries: sortedEntries,
        count: entries.length,
        closingBalance
      };
    });

    return periodList;
  }, [entriesWithBalance]);

  const archiveList = useMemo(() => {
    return archives.map(arc => {
      const entries = arc.data.entries || [];
      const totals = arc.data.totals || { finalBalance: 0 };
      return {
        id: arc.id,
        key: arc.data.periodKey,
        startDate: entries[0]?.date || '',
        endDate: entries[entries.length - 1]?.date || '',
        displayLabel: arc.name,
        entries: entries,
        count: entries.filter((e: any) => e.revenue || e.coupons || e.invoices).length,
        closingBalance: totals.finalBalance,
        fullData: arc.data
      };
    });
  }, [archives]);

  const archiveStats = useMemo(() => {
    const totalPeriods = archiveList.length;
    const totalTransactions = archiveList.reduce((acc, p) => acc + p.count, 0);
    const lastClosingBalance = archiveList.length > 0 ? archiveList[0].closingBalance : 0;
    return { totalPeriods, totalTransactions, lastClosingBalance };
  }, [archiveList]);

  const filteredPeriods = useMemo(() => {
    let result = [...archiveList];

    // Search
    if (archiveSearch) {
      const search = archiveSearch.toLowerCase();
      result = result.filter(p => 
        p.displayLabel.toLowerCase().includes(search) || 
        formatDateArabic(p.startDate).includes(search) || 
        formatDateArabic(p.endDate).includes(search)
      );
    }

    // Date filters
    if (archiveFromDate) {
      result = result.filter(p => p.startDate >= archiveFromDate);
    }
    if (archiveToDate) {
      result = result.filter(p => p.endDate <= archiveToDate);
    }

    // Min transactions
    if (archiveMinTransactions !== '') {
      result = result.filter(p => p.count >= archiveMinTransactions);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (archiveSortField === 'date') {
        comparison = a.startDate.localeCompare(b.startDate);
      } else if (archiveSortField === 'count') {
        comparison = a.count - b.count;
      } else if (archiveSortField === 'balance') {
        comparison = a.closingBalance - b.closingBalance;
      }

      return archiveSortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [archiveList, archiveSearch, archiveFromDate, archiveToDate, archiveMinTransactions, archiveSortField, archiveSortDirection]);

  const paginatedPeriods = useMemo(() => {
    const startIndex = (archivePage - 1) * archiveRowsPerPage;
    return filteredPeriods.slice(startIndex, startIndex + archiveRowsPerPage);
  }, [filteredPeriods, archivePage, archiveRowsPerPage]);

  const totalPages = Math.ceil(filteredPeriods.length / archiveRowsPerPage);

  // Filter entries for the current view
  const currentViewEntries = useMemo(() => {
    if (viewingArchive) {
      return viewingArchive.entries;
    }

    // Use the stable currentPeriodDates state
    let periodDates = [...currentPeriodDates];

    // Map dates to existing entries or virtual ones
    const entriesMap = new Map<string, BalanceEntry>();
    entriesWithBalance.forEach(e => {
      entriesMap.set(e.date, e);
    });
    
    let lastBalance = openingBalance;
    // Find the balance before the earliest date in our current view
    const earliestDate = periodDates.length > 0 ? periodDates.reduce((min, d) => d < min ? d : min, periodDates[0]) : '';
    
    const beforeEntries = entriesWithBalance.filter(e => e.date < earliestDate);
    if (beforeEntries.length > 0) {
      lastBalance = beforeEntries[beforeEntries.length - 1].balance;
    }

    return periodDates.map((date, index) => {
      const existing = entriesMap.get(date);
      if (existing) {
        lastBalance = existing.balance;
        return { ...existing, id: existing.id };
      } else {
        // Virtual entry for days with no data
        return {
          id: `virtual-${index}-${date}`,
          date,
          revenue: 0,
          coupons: 0,
          debitNote: '',
          invoices: 0,
          creditNote: '',
          balance: lastBalance
        } as BalanceEntry;
      }
    });
  }, [currentPeriodDates, entriesWithBalance, openingBalance]);

  const totals = useMemo(() => {
    if (viewingArchive) {
      return viewingArchive.totals;
    }

    const sumRevenue = currentViewEntries.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    const sumCoupons = currentViewEntries.reduce((acc, curr) => acc + (curr.coupons || 0), 0);
    const sumInvoices = currentViewEntries.reduce((acc, curr) => acc + (curr.invoices || 0), 0);
    
    const totalDebit = sumRevenue + sumCoupons;
    const totalCredit = sumInvoices;
    const finalBalance = currentViewEntries.length > 0 ? currentViewEntries[currentViewEntries.length - 1].balance : openingBalance;

    return {
      sumRevenue,
      sumCoupons,
      totalDebit,
      sumInvoices,
      totalCredit,
      finalBalance
    };
  }, [currentViewEntries, openingBalance, viewingArchive]);

  const updateRowDate = (id: string, newDate: string) => {
    if (!newDate) return;
    
    // Ensure it's a valid date string
    const dateObj = new Date(newDate);
    if (isNaN(dateObj.getTime())) return;

    // Find the old date to replace it in the current view list
    let oldDate: string | undefined;
    if (id.startsWith('virtual-')) {
      oldDate = id.split('-').slice(2).join('-');
    } else {
      const entry = allEntries.find(e => e.id === id);
      oldDate = entry?.date;
    }

    if (oldDate === newDate) return;

    if (oldDate) {
      setCurrentPeriodDates(prev => prev.map(d => d === oldDate ? newDate : d));
    }
    
    updateEntry(id, 'date', newDate);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا اليوم؟')) return;

    if (id.startsWith('virtual-')) {
      const dateToDelete = id.split('-').pop();
      setCurrentPeriodDates(prev => prev.filter(d => d !== dateToDelete));
    } else {
      const entryToDelete = allEntries.find(e => e.id === id);
      if (entryToDelete) {
        const updated = allEntries.filter(e => e.id !== id);
        setAllEntries(updated);
        setCurrentPeriodDates(prev => prev.filter(d => d !== entryToDelete.date));
        
        try {
          await deleteEntryById(id);
        } catch (err) {
          console.error("Failed to delete entry", err);
        }
      }
    }
  };

  const addNewDay = () => {
    const lastDateStr = currentPeriodDates.length > 0 
      ? currentPeriodDates[currentPeriodDates.length - 1] 
      : new Date().toISOString().split('T')[0];
    
    const lastDate = new Date(lastDateStr);
    lastDate.setDate(lastDate.getDate() + 1);
    const nextDate = lastDate.toISOString().split('T')[0];
    
    setCurrentPeriodDates(prev => {
      if (prev.includes(nextDate)) return prev;
      return [...prev, nextDate];
    });
    
    // Scroll to bottom
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const updateEntry = (id: string, field: keyof Entry, value: string | number) => {
    let updated: Entry[];
    let entryToSave: Entry | undefined;

    if (id.startsWith('virtual-')) {
      const parts = id.split('-');
      const originalDate = parts.slice(2).join('-');
      const newEntry: Entry = {
        id: Math.random().toString(36).substr(2, 9),
        date: field === 'date' ? (value as string) : originalDate,
        revenue: 0,
        coupons: 0,
        debitNote: '',
        invoices: 0,
        creditNote: '',
        [field]: value
      };
      updated = [...allEntries, newEntry];
      entryToSave = newEntry;
    } else {
      updated = allEntries.map(entry => {
        if (entry.id === id) {
          const updatedEntry = { ...entry, [field]: value };
          entryToSave = updatedEntry;
          return updatedEntry;
        }
        return entry;
      });
    }

    setAllEntries(updated);
    
    if (entryToSave) {
      saveEntries([entryToSave]);
    }
  };

  const CustomDateInput = ({ 
    value, 
    onChange, 
    className = "",
    placeholder = "DD / MM / YYYY",
    disabled = false
  }: { 
    value: string; 
    onChange: (val: string) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
  }) => {
    const [textValue, setTextValue] = useState('');
    const dateInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (value) {
        const [y, m, d] = value.split('-');
        const fullYear = y.length === 2 ? `20${y}` : y;
        setTextValue(`${d} / ${m} / ${fullYear}`);
      } else {
        setTextValue('');
      }
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setTextValue(val);
      
      const cleanVal = val.replace(/\s/g, '');
      const match = cleanVal.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const d = match[1].padStart(2, '0');
        const m = match[2].padStart(2, '0');
        const y = match[3];
        const isoDate = `${y}-${m}-${d}`;
        if (!isNaN(new Date(isoDate).getTime())) {
          onChange(isoDate);
        }
      }
    };

    const handleBlur = () => {
      if (value) {
        const [y, m, d] = value.split('-');
        const fullYear = y.length === 2 ? `20${y}` : y;
        setTextValue(`${d} / ${m} / ${fullYear}`);
      }
    };

    const openPicker = () => {
      if (disabled) return;
      if (dateInputRef.current) {
        // Focus first, then try showPicker, then fallback to click
        dateInputRef.current.focus();
        try {
          // @ts-ignore
          if (typeof dateInputRef.current.showPicker === 'function') {
            // @ts-ignore
            dateInputRef.current.showPicker();
          } else {
            dateInputRef.current.click();
          }
        } catch (err) {
          dateInputRef.current.click();
        }
      }
    };

    return (
      <div 
        className={`relative flex items-center bg-white border border-slate-200 rounded-xl px-3 gap-3 focus-within:ring-2 focus-within:ring-emerald-500 transition-all whitespace-nowrap cursor-pointer print:border-none print:bg-transparent print:px-0 print:gap-0 print:rounded-none print:focus-within:ring-0 ${className}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            openPicker();
          }
        }}
      >
        <input 
          type="text"
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          dir="ltr"
          className="w-full bg-transparent border-none focus:ring-0 text-slate-800 font-bold text-sm text-center py-2 outline-none whitespace-nowrap print:text-[11px] print:py-0"
        />
        <div className="relative flex-shrink-0 print:hidden">
          <button 
            type="button"
            onClick={openPicker}
            className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
            title="فتح التقويم"
          >
            <CalendarDays size={16} />
          </button>
          <input 
            ref={dateInputRef}
            type="date"
            value={value || ''}
            disabled={disabled}
            onChange={(e) => {
              if (e.target.value) {
                onChange(e.target.value);
              }
            }}
            className={`absolute inset-0 opacity-0 w-full h-full ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
            style={{ zIndex: 10 }}
          />
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const resetLedger = () => {
    if (confirm('هل تريد تصفير الجدول لبدء فترة جديدة؟')) {
      // Actually, we don't delete. We just add new entries for the next 14 days if they don't exist.
      // But for "reset", maybe the user wants to clear the current view?
      // The requirement says "never delete". So reset is probably not what they want.
      // I'll just disable it or make it add new empty entries.
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setSelectedPeriod(null);
      setViewingArchive(null);
      setView('ledger');
      setNotification(null);
    } catch (err) {
      console.error('Failed to logout', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-lg font-bold text-slate-700">
          جاري التحقق من الجلسة...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app-root min-h-screen bg-[#F8F9FA] text-slate-900 font-sans flex" dir="rtl">
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-0 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black ${
              notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-screen sticky top-0 print:hidden shadow-lg z-30">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
              <Calculator size={24} />
            </div>
            دفتر الصندوق
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8">
          {/* Current Period Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <LayoutDashboard size={14} />
              الفترة الحالية
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  setSelectedPeriod(null);
                  setViewingArchive(null);
                  setView('ledger');
                  scrollToLedger();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${(!selectedPeriod && !viewingArchive && view === 'ledger') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} />
                  <span className="font-bold">دفتر الحركات</span>
                </div>
              </button>
              <button 
                onClick={scrollToSummary}
                className="w-full flex items-center justify-between p-3 rounded-xl transition-all text-slate-600 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <Calculator size={18} />
                  <span className="font-bold">الملخص</span>
                </div>
              </button>
            </div>
          </div>

            {/* Archive Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Archive size={14} />
                الأرشيف
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    setView('archive-list');
                    setViewingArchive(null);
                    setSelectedPeriod(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${view === 'archive-list' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Archive size={18} />
                    <span className="font-bold">الأرشيف</span>
                  </div>
                </button>
              </div>
            </div>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase text-center">الرصيد الإجمالي</span>
            <div className={`text-lg font-black font-mono text-center py-2 rounded-lg border-2 ${
              (viewingArchive ? viewingArchive.totals.finalBalance : (entriesWithBalance.length > 0 ? entriesWithBalance[entriesWithBalance.length - 1].balance : openingBalance)) >= 0 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {(viewingArchive ? viewingArchive.totals.finalBalance : (entriesWithBalance.length > 0 ? entriesWithBalance[entriesWithBalance.length - 1].balance : openingBalance)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>

            <button
              onClick={handleLogout}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-bold text-sm"
            >
              <LogOut size={16} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-h-screen overflow-y-auto">
        {view === 'archive-list' ? (
          <div className="p-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-4xl font-black text-slate-800 flex items-center gap-3">
                  <Archive size={36} className="text-emerald-600" />
                  الأرشيف
                </h2>
                <p className="text-slate-500 font-bold mt-2">عرض وتنظيم الفترات المحاسبية السابقة</p>
              </div>
              <button 
                onClick={handleCreateNewPeriod}
                disabled={isCreatingNew}
                className={`bg-emerald-600 text-white px-6 py-3 rounded-xl font-black hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 ${isCreatingNew ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isCreatingNew ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Plus size={20} />
                )}
                {isCreatingNew ? 'جاري الإنشاء...' : 'إنشاء فترة محاسبية جديدة'}
              </button>
            </div>

            {/* Statistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <Archive size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">إجمالي الفترات</p>
                  <p className="text-2xl font-black text-slate-800">{archiveStats.totalPeriods}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
                  <Calculator size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">آخر رصيد إغلاق</p>
                  <p className="text-2xl font-black text-slate-800 font-mono">{archiveStats.lastClosingBalance.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="بحث عن فترة (بالتاريخ)..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">من:</span>
                <CustomDateInput 
                  value={archiveFromDate}
                  onChange={setArchiveFromDate}
                  className="bg-slate-50 w-48"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">إلى:</span>
                <CustomDateInput 
                  value={archiveToDate}
                  onChange={setArchiveToDate}
                  className="bg-slate-50 w-48"
                />
              </div>
              <button 
                onClick={() => {
                  setArchiveSearch('');
                  setArchiveFromDate('');
                  setArchiveToDate('');
                  setArchiveMinTransactions('');
                  setArchiveSortField('date');
                  setArchiveSortDirection('desc');
                  setArchivePage(1);
                }}
                className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                title="إعادة تعيين الفلاتر"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">#</th>
                      <th 
                        className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => {
                          if (archiveSortField === 'date') setArchiveSortDirection(archiveSortDirection === 'asc' ? 'desc' : 'asc');
                          else { setArchiveSortField('date'); setArchiveSortDirection('desc'); }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          تاريخ البداية
                          <ArrowUpDown size={14} className={archiveSortField === 'date' ? 'text-emerald-600' : 'opacity-20'} />
                        </div>
                      </th>
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">تاريخ النهاية</th>
                      <th 
                        className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors text-center"
                        onClick={() => {
                          if (archiveSortField === 'balance') setArchiveSortDirection(archiveSortDirection === 'asc' ? 'desc' : 'asc');
                          else { setArchiveSortField('balance'); setArchiveSortDirection('desc'); }
                        }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          رصيد الإغلاق
                          <ArrowUpDown size={14} className={archiveSortField === 'balance' ? 'text-emerald-600' : 'opacity-20'} />
                        </div>
                      </th>
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPeriods.length > 0 ? paginatedPeriods.map((period, index) => (
                      <tr key={period.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 font-bold text-slate-400 text-sm">
                          {(archivePage - 1) * archiveRowsPerPage + index + 1}
                        </td>
                        <td className="p-4 font-black text-slate-700 font-mono text-sm">
                          <span dir="ltr">{formatDateArabic(period.startDate)}</span>
                        </td>
                        <td className="p-4 font-black text-slate-700 font-mono text-sm">
                          <span dir="ltr">{formatDateArabic(period.endDate)}</span>
                        </td>
                        <td className="p-4 text-center font-mono font-black text-emerald-700">
                          {period.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setViewingArchive(period.fullData);
                                setView('ledger');
                              }}
                              className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                            >
                              فتح الفترة
                              <ChevronLeft size={14} />
                            </button>
                            <button 
                              className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
                              title="عرض التفاصيل"
                            >
                              <FileText size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-400">
                            <Archive size={48} className="opacity-20" />
                            <p className="font-bold">لا توجد فترات تطابق معايير البحث</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Section */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-400">عرض:</span>
                  <select 
                    value={archiveRowsPerPage}
                    onChange={(e) => {
                      setArchiveRowsPerPage(parseInt(e.target.value));
                      setArchivePage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={10}>10 فترات</option>
                    <option value={20}>20 فترة</option>
                    <option value={50}>50 فترة</option>
                  </select>
                  <span className="text-xs font-bold text-slate-400">
                    عرض {Math.min(filteredPeriods.length, (archivePage - 1) * archiveRowsPerPage + 1)} - {Math.min(filteredPeriods.length, archivePage * archiveRowsPerPage)} من {filteredPeriods.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={archivePage === 1}
                    onClick={() => setArchivePage(1)}
                    className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all"
                  >
                    <ChevronFirst size={18} />
                  </button>
                  <button 
                    disabled={archivePage === 1}
                    onClick={() => setArchivePage(prev => prev - 1)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all font-bold text-xs"
                  >
                    <ChevronRight size={18} />
                    السابق
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5 && archivePage > 3) {
                        pageNum = archivePage - 3 + i + 1;
                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                      }
                      if (pageNum <= 0) return null;
                      if (pageNum > totalPages) return null;

                      return (
                        <button 
                          key={pageNum}
                          onClick={() => setArchivePage(pageNum)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${archivePage === pageNum ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-white border border-transparent hover:border-slate-200 text-slate-600'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    disabled={archivePage === totalPages || totalPages === 0}
                    onClick={() => setArchivePage(prev => prev + 1)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all font-bold text-xs"
                  >
                    التالي
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    disabled={archivePage === totalPages || totalPages === 0}
                    onClick={() => setArchivePage(totalPages)}
                    className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all"
                  >
                    <ChevronLast size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-20 print:hidden">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {(selectedPeriod || viewingArchive) && (
                    <button 
                      onClick={() => {
                        setView('archive-list');
                        setViewingArchive(null);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-emerald-600 transition-colors"
                      title="الرجوع للأرشيف"
                    >
                      <ChevronRight size={24} />
                    </button>
                  )}
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">
                      {viewingArchive ? `أرشيف: ${viewingArchive.displayLabel}` : (selectedPeriod ? 'سجلات الأرشيف' : 'الفترة الحالية')}
                    </h2>
                    {viewingArchive ? (
                      <p className="text-rose-600 font-bold flex items-center gap-2 mt-1">
                        <Archive size={16} />
                        عرض نسخة مؤرشفة (للقراءة فقط)
                      </p>
                    ) : (selectedPeriod ? (
                      <p className="text-emerald-600 font-bold flex items-center gap-2 mt-1">
                        <Clock size={16} />
                        عرض سجلات الفترة: 
                        <span className="flex items-center gap-2" dir="ltr">
                          <span style={{ unicodeBidi: 'isolate' }}>{formatDateArabic(periods.find(p => p.key === selectedPeriod)?.startDate || '')}</span>
                          <span className="text-slate-300">←</span>
                          <span style={{ unicodeBidi: 'isolate' }}>{formatDateArabic(periods.find(p => p.key === selectedPeriod)?.endDate || '')}</span>
                        </span>
                      </p>
                    ) : (
                      <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                        <CalendarIcon size={16} />
                        كشف حساب جاري (أسبوعين)
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!viewingArchive && !selectedPeriod && (
                    <button
                      onClick={handleCreateNewPeriod}
                      disabled={isCreatingNew}
                      className={`flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm font-bold text-sm ${isCreatingNew ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isCreatingNew ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Plus size={16} />
                      )}
                      {isCreatingNew ? 'جاري الإنشاء...' : 'إنشاء فترة جديدة'}
                    </button>
                  )}
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-700 font-bold text-sm"
                  >
                    <Printer size={18} />
                    طباعة الكشف
                  </button>
                </div>
              </div>
            </header>

            <div className="p-8 max-w-6xl mx-auto">
              {selectedPeriod && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-8 flex items-center justify-between print:hidden"
                >
                  <div className="flex items-center gap-3 text-emerald-800">
                    <div className="bg-emerald-600 p-2 rounded-lg text-white">
                      <Archive size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-70">أنت تشاهد الأرشيف الآن</p>
                      <div className="font-black flex items-center gap-2" dir="ltr">
                        <span style={{ unicodeBidi: 'isolate' }}>{formatDateArabic(periods.find(p => p.key === selectedPeriod)?.startDate || '')}</span>
                        <span className="opacity-50">←</span>
                        <span style={{ unicodeBidi: 'isolate' }}>{formatDateArabic(periods.find(p => p.key === selectedPeriod)?.endDate || '')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setView('archive-list')}
                      className="bg-white text-slate-700 px-4 py-2 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      رجوع للأرشيف
                    </button>
                    <button 
                      onClick={() => setSelectedPeriod(null)}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      رجوع للفترة الحالية
                    </button>
                  </div>
                </motion.div>
              )}


          {/* Main Ledger Table */}
          <div id="ledger-table" className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8 print:shadow-none print:border-slate-300">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-3 text-slate-800 font-black border-l border-slate-300 bg-slate-200 text-center text-lg w-[26%]">
                      تاريخ
                    </th>
                    <th colSpan={3} className="p-3 text-emerald-800 font-black border-l border-slate-300 bg-emerald-50 text-center text-lg">
                      مدين
                    </th>
                    <th colSpan={2} className="p-3 text-rose-800 font-black border-l border-slate-300 bg-rose-50 text-center text-lg">
                      دائن
                    </th>
                    <th className="p-3 text-slate-800 font-black bg-slate-200 text-center text-lg">
                      رصيد
                    </th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold">
                    <th className="p-2 text-slate-600 border-l border-slate-200 text-center w-[26%]"></th>
                    <th className="p-2 text-emerald-600 border-l border-slate-200 text-center w-[12%]">إيداع</th>
                    <th className="p-2 text-emerald-600 border-l border-slate-200 text-center w-[12%]">بونات</th>
                    <th className="p-2 text-emerald-600 border-l border-slate-200 text-center w-[12%]">مذكرة خطأ</th>
                    <th className="p-2 text-rose-600 border-l border-slate-200 text-center w-[12%]">فواتير</th>
                    <th className="p-2 text-rose-600 border-l border-slate-200 text-center w-[12%]">مذكرة خطأ</th>
                    <th className="p-2 text-slate-600 text-center w-[15%]"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance Row */}
                  {!selectedPeriod && (
                    <tr className="bg-slate-50/50 border-b border-slate-100 italic">
                      <td className="p-2 border-l border-slate-200"></td>
                      <td colSpan={5} className="p-2 text-left text-slate-400 text-xs font-bold border-l border-slate-200">رصيد افتتاحي (سابق)</td>
                      <td className="p-2 bg-slate-100/50">
                        <input 
                          type="number" 
                          value={(viewingArchive ? viewingArchive.openingBalance : openingBalance) || ''}
                          placeholder="0.00"
                          readOnly={!!viewingArchive}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setOpeningBalance(val);
                            saveOpeningBalance(val);
                          }}
                          className={`w-full text-center bg-transparent border-none focus:ring-0 text-slate-800 font-black font-mono ${viewingArchive ? 'cursor-default' : ''}`}
                        />
                      </td>
                    </tr>
                  )}
                  
                  <AnimatePresence initial={false}>
                    {currentViewEntries.map((entry, index) => (
                      <motion.tr 
                        key={`${entry.id}-${index}`}
                        id={`row-${entry.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.01 }}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group"
                      >
                        {/* Date Column */}
                        <td className="p-4 border-l border-slate-200 group-hover:bg-slate-50 transition-colors align-middle">
                          <div className="relative flex items-center justify-center group/date gap-3">
                            {!viewingArchive && (
                              <button 
                                onClick={() => deleteEntry(entry.id)}
                                className="opacity-0 group-hover/date:opacity-100 p-1.5 text-rose-400 hover:text-rose-600 transition-all hover:bg-rose-50 rounded-md print:hidden"
                                title="حذف اليوم"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            <div className="relative flex-1 max-w-[280px] whitespace-nowrap">
                              <CustomDateInput 
                                value={entry.date}
                                onChange={(newVal) => updateRowDate(entry.id, newVal)}
                                className="border-none bg-transparent"
                                disabled={!!viewingArchive}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Debit Section */}
                        <td className="p-2 border-l border-slate-200 bg-emerald-50/10">
                          <input 
                            type="number" 
                            value={entry.revenue || ''}
                            placeholder="0"
                            readOnly={!!viewingArchive}
                            onChange={(e) => updateEntry(entry.id, 'revenue', parseFloat(e.target.value) || 0)}
                            className={`w-full text-center bg-transparent border-none focus:ring-0 text-emerald-700 font-bold font-mono ${viewingArchive ? 'cursor-default' : ''}`}
                          />
                        </td>
                        <td className="p-2 border-l border-slate-200 bg-emerald-50/10">
                          <input 
                            type="number" 
                            value={entry.coupons || ''}
                            placeholder="0"
                            readOnly={!!viewingArchive}
                            onChange={(e) => updateEntry(entry.id, 'coupons', parseFloat(e.target.value) || 0)}
                            className={`w-full text-center bg-transparent border-none focus:ring-0 text-emerald-700 font-bold font-mono ${viewingArchive ? 'cursor-default' : ''}`}
                          />
                        </td>
                        <td className="p-2 border-l border-slate-200 bg-emerald-50/5">
                          <input 
                            type="text" 
                            value={entry.debitNote || ''}
                            placeholder="ملاحظة"
                            readOnly={!!viewingArchive}
                            onChange={(e) => updateEntry(entry.id, 'debitNote', e.target.value)}
                            className={`w-full text-center bg-transparent border-none focus:ring-0 text-emerald-600 font-bold ${viewingArchive ? 'cursor-default' : ''}`}
                          />
                        </td>

                        {/* Credit Section */}
                        <td className="p-2 border-l border-slate-200 bg-rose-50/10">
                          <input 
                            type="number" 
                            value={entry.invoices || ''}
                            placeholder="0"
                            readOnly={!!viewingArchive}
                            onChange={(e) => updateEntry(entry.id, 'invoices', parseFloat(e.target.value) || 0)}
                            className={`w-full text-center bg-transparent border-none focus:ring-0 text-rose-700 font-bold font-mono ${viewingArchive ? 'cursor-default' : ''}`}
                          />
                        </td>
                        <td className="p-2 border-l border-slate-200 bg-rose-50/5">
                          <input 
                            type="text" 
                            value={entry.creditNote || ''}
                            placeholder="ملاحظة"
                            readOnly={!!viewingArchive}
                            onChange={(e) => updateEntry(entry.id, 'creditNote', e.target.value)}
                            className={`w-full text-center bg-transparent border-none focus:ring-0 text-rose-600 font-bold ${viewingArchive ? 'cursor-default' : ''}`}
                          />
                        </td>

                        {/* Balance Column */}
                        <td className="p-2 text-center font-mono font-black text-slate-700 bg-slate-50/30">
                          {(viewingArchive || (entry.revenue || entry.coupons || entry.invoices)) 
                            ? entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })
                            : ""}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
                  <tr>
                    <td className="p-3 border-l border-slate-700 text-center text-xs uppercase tracking-widest opacity-50">المجموع</td>
                    <td className="p-3 border-l border-slate-700 text-center font-mono text-emerald-400">
                      {totals.sumRevenue.toLocaleString()}
                    </td>
                    <td className="p-3 border-l border-slate-700 text-center font-mono text-emerald-400">
                      {totals.sumCoupons.toLocaleString()}
                    </td>
                    <td className="p-3 border-l border-slate-700 text-center font-mono text-emerald-300 text-sm">
                    </td>
                    <td className="p-3 border-l border-slate-700 text-center font-mono text-rose-400">
                      {totals.sumInvoices.toLocaleString()}
                    </td>
                    <td className="p-3 border-l border-slate-700 text-center font-mono text-rose-300 text-sm">
                    </td>
                    <td className="p-3 text-center font-mono text-lg bg-slate-800">
                      {totals.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Add Day & Save Buttons */}
            {!viewingArchive && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap justify-center gap-4 print:hidden">
                <button 
                  onClick={addNewDay}
                  className="flex items-center gap-3 px-10 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg font-black text-base group active:scale-95"
                >
                  <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                  إضافة يوم
                </button>

                <button 
                  onClick={handleSaveAndArchive}
                  disabled={isSaving}
                  className="flex items-center gap-3 px-10 py-3.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg font-black text-base group active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={22} className="group-hover:scale-110 transition-transform duration-300" />
                  )}
                  حفظ العملية
                </button>
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div id="summary-section" className="mb-12 print:block">
            {/* Detailed Summary Card */}
            <div className="w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 print:border-slate-300 print:shadow-none print:mt-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <FileText className="text-emerald-600" />
                ملخص الحساب الختامي
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {/* Debit Summary */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>إجمالي الإيداعات:</span>
                    <span className="font-mono font-semibold text-emerald-600">{totals.sumRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>إجمالي البونات:</span>
                    <span className="font-mono font-semibold text-emerald-600">{totals.sumCoupons.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800">إجمالي المدين:</span>
                    <span className="font-mono text-xl font-black text-emerald-700">{totals.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Credit Summary */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>إجمالي الفواتير:</span>
                    <span className="font-mono font-semibold text-rose-600">{totals.sumInvoices.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800">إجمالي الدائن:</span>
                    <span className="font-mono text-xl font-black text-rose-700">{totals.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Final Balance Highlight */}
              <div className="mt-10 bg-slate-900 text-white rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner print:bg-white print:text-slate-900 print:border-2 print:border-slate-900">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${totals.finalBalance >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'} print:text-slate-900`}>
                    <Calculator size={32} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm uppercase tracking-wider font-bold print:text-slate-600">صافي الفرق (الرصيد النهائي)</p>
                    <h3 className="text-3xl font-black font-mono">
                      {totals.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${totals.finalBalance >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'} print:border print:border-slate-900 print:text-slate-900`}>
                    {totals.finalBalance >= 0 ? 'فائض / رصيد إيجابي' : 'عجز / رصيد سلبي'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
  </div>

      {/* Global CSS for Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 portrait; margin: 12mm; }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide non-essential layout blocks in print */
          .app-root > * {
            display: none !important;
          }

          /* Keep only main content area */
          .app-root > .flex-1 {
            display: block !important;
            width: 100% !important;
            min-height: auto !important;
            overflow: visible !important;
          }

          /* Print only accounting period table + summary */
          #ledger-table,
          #summary-section {
            display: block !important;
          }

          #ledger-table {
            margin-bottom: 10mm !important;
            border-radius: 0 !important;
          }

          #ledger-table table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
            font-size: 11px !important;
          }

          #ledger-table thead {
            display: table-header-group;
          }

          #ledger-table tfoot {
            display: table-footer-group;
          }

          #ledger-table tr,
          #summary-section .bg-white {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          input {
            border: none !important;
            outline: none !important;
            background: transparent !important;
            color: #111827 !important;
          }

          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
}
