import React, { useState, useMemo } from 'react';
import { 
  Archive,
  Plus,
  Search,
  RotateCcw,
  ArrowUpDown,
  ChevronFirst,
  ChevronLast,
  ChevronRight,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { CustomDateInput } from '../components/CustomDateInput';

const formatDateArabic = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${day} / ${month} / ${fullYear}`;
};

interface ArchivePeriod {
  id: string;
  displayLabel: string;
  startDate: string;
  endDate: string;
  closingBalance: number;
  count: number;
  monthKey: string;
  fullData: any;
  totals: any;
}

interface ArchiveListPageProps {
  archiveList: ArchivePeriod[];
  archiveSearch: string;
  archiveFromDate: string;
  archiveToDate: string;
  archiveMinTransactions: string | number;
  archiveSortField: 'date' | 'count' | 'balance';
  archiveSortDirection: 'asc' | 'desc';
  archivePage: number;
  archiveRowsPerPage: number;
  isCreatingNew: boolean;
  onSearchChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onMinTransactionsChange: (value: string | number) => void;
  onSortFieldChange: (field: 'date' | 'count' | 'balance') => void;
  onSortDirectionChange: (value: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onResetFilters: () => void;
  onCreateNewPeriod: () => void;
  onOpenPeriod: (period: ArchivePeriod) => void;
}

export default function ArchiveListPage({
  archiveList,
  archiveSearch,
  archiveFromDate,
  archiveToDate,
  archiveMinTransactions,
  archiveSortField,
  archiveSortDirection,
  archivePage,
  archiveRowsPerPage,
  isCreatingNew,
  onSearchChange,
  onFromDateChange,
  onToDateChange,
  onMinTransactionsChange,
  onSortFieldChange,
  onSortDirectionChange,
  onPageChange,
  onRowsPerPageChange,
  onResetFilters,
  onCreateNewPeriod,
  onOpenPeriod,
}: ArchiveListPageProps) {
  // Filter logic
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
      result = result.filter(p => p.count >= Number(archiveMinTransactions));
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

  // Archive stats
  const archiveStats = useMemo(() => {
    return {
      totalPeriods: archiveList.length,
      lastClosingBalance: archiveList.length > 0 ? archiveList[archiveList.length - 1].closingBalance : 0,
    };
  }, [archiveList]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 flex items-center gap-3">
            <Archive size={28} className="text-emerald-600 sm:w-9 sm:h-9" />
            الأرشيف
          </h2>
          <p className="text-slate-500 font-bold mt-2">عرض وتنظيم الفترات المحاسبية السابقة</p>
        </div>
        <button 
          onClick={onCreateNewPeriod}
          disabled={isCreatingNew}
          className={`w-full sm:w-auto justify-center bg-emerald-600 text-white px-5 py-3 rounded-xl font-black hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 ${isCreatingNew ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Archive size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">إجمالي الفترات</p>
            <p className="text-2xl font-black text-slate-800">{archiveStats.totalPeriods}</p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
            <Archive size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">آخر رصيد إغلاق</p>
            <p className="text-2xl font-black text-slate-800 font-mono">{archiveStats.lastClosingBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-[160px] relative w-full sm:w-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="بحث عن فترة (بالتاريخ)..."
            value={archiveSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">من:</span>
          <CustomDateInput 
            value={archiveFromDate}
            onChange={onFromDateChange}
            className="bg-slate-50 w-full sm:w-48"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">إلى:</span>
          <CustomDateInput 
            value={archiveToDate}
            onChange={onToDateChange}
            className="bg-slate-50 w-full sm:w-48"
          />
        </div>
        <button 
          onClick={onResetFilters}
          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
          title="إعادة تعيين الفلاتر"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">#</th>
                <th 
                  className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors"
                  onClick={() => {
                    if (archiveSortField === 'date') onSortDirectionChange(archiveSortDirection === 'asc' ? 'desc' : 'asc');
                    else { onSortFieldChange('date'); onSortDirectionChange('asc'); }
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
                    if (archiveSortField === 'balance') onSortDirectionChange(archiveSortDirection === 'asc' ? 'desc' : 'asc');
                    else { onSortFieldChange('balance'); onSortDirectionChange('desc'); }
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
                        onClick={() => onOpenPeriod(period)}
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
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="text-xs font-bold text-slate-400">عرض:</span>
            <select 
              value={archiveRowsPerPage}
              onChange={(e) => {
                onRowsPerPageChange(parseInt(e.target.value));
                onPageChange(1);
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
              onClick={() => onPageChange(1)}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all"
            >
              <ChevronFirst size={18} />
            </button>
            <button 
              disabled={archivePage === 1}
              onClick={() => onPageChange(Math.max(1, archivePage - 1))}
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
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${archivePage === pageNum ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-white border border-transparent hover:border-slate-200 text-slate-600'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button 
              disabled={archivePage === totalPages || totalPages === 0}
              onClick={() => onPageChange(Math.min(totalPages, archivePage + 1))}
              className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all font-bold text-xs"
            >
              التالي
              <ChevronLeft size={18} />
            </button>
            <button 
              disabled={archivePage === totalPages || totalPages === 0}
              onClick={() => onPageChange(totalPages)}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all"
            >
              <ChevronLast size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
