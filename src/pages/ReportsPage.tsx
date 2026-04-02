import React, { useState, useMemo } from 'react';
import { 
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Zap,
  X,
  Plus,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';

interface ReportRow {
  monthKey: string;
  label: string;
  totalDebit: number;
  totalCredit: number;
  net: number;
}

interface ReportSummary {
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

interface ComparisonDelta {
  debitDiff: number;
  creditDiff: number;
  netDiff: number;
  debitPct: number | null;
  creditPct: number | null;
  netPct: number | null;
}

interface ReportsPageProps {
  reportFromMonth: string;
  reportToMonth: string;
  isCompareEnabled: boolean;
  compareFromMonth: string;
  compareToMonth: string;
  reportRows: ReportRow[];
  reportSummary: ReportSummary;
  compareRows: ReportRow[];
  compareSummary: ReportSummary;
  comparisonDelta: ComparisonDelta;
  uniqueArchiveMonths: string[];
  onFromMonthChange: (value: string) => void;
  onToMonthChange: (value: string) => void;
  onCompareToggle: () => void;
  onCompareFromMonthChange: (value: string) => void;
  onCompareToMonthChange: (value: string) => void;
  onApplyFlexibleRange: (months: number) => void;
  onCreateNewPeriod?: () => void;
  onPrint?: () => void;
}

// دالة للحصول على تاريخ قبل عدد معين من الأشهر
const getMonthBefore = (fromDate: string, monthsBack: number): string => {
  const [year, month] = fromDate.split('-').map(Number);
  let newYear = year;
  let newMonth = month - monthsBack;
  
  while (newMonth <= 0) {
    newMonth += 12;
    newYear -= 1;
  }
  
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
};

// دالة لتنسيق الشهر واللسان بصيغة عربية
const formatMonthDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

// دالة للحصول على أول شهر من السنة الحالية
const getFirstMonthOfYear = (fromDate: string): string => {
  const [year] = fromDate.split('-');
  return `${year}-01`;
};

export default function ReportsPage({
  reportFromMonth,
  reportToMonth,
  isCompareEnabled,
  compareFromMonth,
  compareToMonth,
  reportRows,
  reportSummary,
  compareRows,
  compareSummary,
  comparisonDelta,
  uniqueArchiveMonths,
  onFromMonthChange,
  onToMonthChange,
  onCompareToggle,
  onCompareFromMonthChange,
  onCompareToMonthChange,
  onApplyFlexibleRange,
  onCreateNewPeriod,
  onPrint,
}: ReportsPageProps) {
  const [showDetailTable, setShowDetailTable] = useState(false);
  const [activeQuickRange, setActiveQuickRange] = useState<number | string | null>(null);

  // الحصول على آخر شهر متاح
  const latestMonth = useMemo(() => {
    return uniqueArchiveMonths.length > 0 ? uniqueArchiveMonths[uniqueArchiveMonths.length - 1] : '';
  }, [uniqueArchiveMonths]);

  // دوال الأزرار السريعة
  const handleQuickRange = (months: number | 'year') => {
    if (!latestMonth) return;
    
    const toMonth = latestMonth;
    let fromMonth: string;
    
    if (months === 'year') {
      fromMonth = getFirstMonthOfYear(toMonth);
      setActiveQuickRange('year');
    } else {
      fromMonth = getMonthBefore(toMonth, months - 1);
      setActiveQuickRange(months);
    }
    
    onToMonthChange(toMonth);
    onFromMonthChange(fromMonth);
  };

  // مسح الاختيار السريع عند تغيير يدوي
  const handleManualFromChange = (value: string) => {
    setActiveQuickRange(null);
    onFromMonthChange(value);
  };

  const handleManualToChange = (value: string) => {
    setActiveQuickRange(null);
    onToMonthChange(value);
  };

  const clearSelection = () => {
    setActiveQuickRange(null);
    onFromMonthChange('');
    onToMonthChange('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <BarChart3 size={32} className="text-emerald-600" />
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800">
              التقارير المالية
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {onCreateNewPeriod && (
              <button
                onClick={onCreateNewPeriod}
                className="w-full sm:w-auto justify-center bg-emerald-600 text-white px-5 py-3 rounded-xl font-black hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 active:scale-95"
              >
                <Plus size={20} />
                إنشاء فترة محاسبية جديدة
              </button>
            )}
            <button
              onClick={onPrint}
              className="w-full sm:w-auto justify-center flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-700 font-bold text-sm"
            >
              <Printer size={18} />
              طباعة الكشف
            </button>
          </div>
        </div>
        <p className="text-slate-500 font-semibold">تحليل شامل للحركات المالية عبر الفترات الزمنية</p>
      </div>

      {/* Quick Range Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200 shadow-sm p-6 mb-6"
        id="reports-controls"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap size={20} className="text-emerald-600" />
          <h3 className="text-lg font-black text-slate-800">اختر الفترة بسرعة</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleQuickRange(3)}
            className={`px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
              activeQuickRange === 3
                ? 'bg-blue-600 text-white shadow-lg border-2 border-blue-700'
                : 'bg-white text-blue-700 border-2 border-blue-200 hover:shadow-md hover:border-blue-300'
            }`}
          >
            <Zap size={16} />
            آخر 3 شهور
          </button>
          <button
            onClick={() => handleQuickRange(6)}
            className={`px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
              activeQuickRange === 6
                ? 'bg-purple-600 text-white shadow-lg border-2 border-purple-700'
                : 'bg-white text-purple-700 border-2 border-purple-200 hover:shadow-md hover:border-purple-300'
            }`}
          >
            <Zap size={16} />
            آخر 6 شهور
          </button>
          <button
            onClick={() => handleQuickRange(12)}
            className={`px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
              activeQuickRange === 12
                ? 'bg-orange-600 text-white shadow-lg border-2 border-orange-700'
                : 'bg-white text-orange-700 border-2 border-orange-200 hover:shadow-md hover:border-orange-300'
            }`}
          >
            <Zap size={16} />
            آخر 12 شهر
          </button>
          <button
            onClick={() => handleQuickRange('year')}
            className={`px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
              activeQuickRange === 'year'
                ? 'bg-emerald-600 text-white shadow-lg border-2 border-emerald-700'
                : 'bg-white text-emerald-700 border-2 border-emerald-200 hover:shadow-md hover:border-emerald-300'
            }`}
          >
            <Calendar size={16} />
            من بداية السنة
          </button>
        </div>
      </motion.div>

      {/* Selected Period Display */}
      {(reportFromMonth || reportToMonth) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-emerald-200 p-4 mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">الفترة المختارة</p>
              <p className="text-lg font-black text-slate-800">
                من <span className="text-emerald-600">{formatMonthDisplay(reportFromMonth)}</span> إلى{' '}
                <span className="text-emerald-600">{formatMonthDisplay(reportToMonth)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="مسح الاختيار"
          >
            <X size={20} />
          </button>
        </motion.div>
      )}

      {/* Manual Period Selection Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6"
        id="reports-manual-range"
      >
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={20} className="text-slate-600" />
          <h3 className="text-lg font-black text-slate-800">اختر الفترة يدويًا</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">من (الشهر/السنة)</label>
            <input
              type="month"
              value={reportFromMonth}
              onChange={(e) => handleManualFromChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">إلى (الشهر/السنة)</label>
            <input
              type="month"
              value={reportToMonth}
              onChange={(e) => handleManualToChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </motion.div>

      {/* Results Cards */}
      {reportRows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {/* Debit Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">إجمالي المدين</p>
                <h3 className="text-3xl font-black text-emerald-900 font-mono">
                  {reportSummary.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="bg-emerald-600 rounded-full p-3 text-white">
                <TrendingUp size={24} />
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-semibold">{reportRows.length} شهر</p>
          </div>

          {/* Credit Card */}
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl border border-rose-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">إجمالي الدائن</p>
                <h3 className="text-3xl font-black text-rose-900 font-mono">
                  {reportSummary.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="bg-rose-600 rounded-full p-3 text-white">
                <TrendingDown size={24} />
              </div>
            </div>
            <p className="text-xs text-rose-600 font-semibold">{reportRows.length} شهر</p>
          </div>

          {/* Net Balance Card */}
          <div className={`bg-gradient-to-br ${reportSummary.netBalance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-amber-50 to-amber-100 border-amber-200'} rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={`text-xs font-bold ${reportSummary.netBalance >= 0 ? 'text-blue-600' : 'text-amber-600'} uppercase tracking-wider mb-1`}>صافي الرصيد</p>
                <h3 className={`text-3xl font-black font-mono ${reportSummary.netBalance >= 0 ? 'text-blue-900' : 'text-amber-900'}`}>
                  {reportSummary.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className={`rounded-full p-3 text-white ${reportSummary.netBalance >= 0 ? 'bg-blue-600' : 'bg-amber-600'}`}>
                <BarChart3 size={24} />
              </div>
            </div>
            <p className={`text-xs font-semibold ${reportSummary.netBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
              {reportSummary.netBalance >= 0 ? 'فائض' : 'عجز'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Detailed Table Section */}
      {reportRows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          id="reports-table"
        >
          <div
            className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => setShowDetailTable(!showDetailTable)}
          >
            <h3 className="text-lg font-black text-slate-800">التفاصيل الشهرية</h3>
            <div className={`transform transition-transform ${showDetailTable ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {showDetailTable && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">الشهر</th>
                    <th className="px-6 py-4 text-xs font-bold text-emerald-600 uppercase tracking-wider">المدين</th>
                    <th className="px-6 py-4 text-xs font-bold text-rose-600 uppercase tracking-wider">الدائن</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, index) => (
                    <tr
                      key={row.monthKey}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-700">{row.label}</td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                        {row.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-rose-700">
                        {row.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-6 py-4 font-mono font-bold ${row.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {row.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {reportRows.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center"
        >
          <div className="flex justify-center mb-4">
            <BarChart3 size={48} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold text-lg">لا توجد بيانات للفترة المختارة</p>
          <p className="text-slate-400 text-sm mt-2">اختر فترة زمنية مختلفة أو استخدم الأزرار السريعة</p>
        </motion.div>
      )}
    </motion.div>
  );
}
