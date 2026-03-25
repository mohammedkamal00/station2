import React, { useState, useMemo } from 'react';
import { 
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Zap
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
}: ReportsPageProps) {
  const [showDetailTable, setShowDetailTable] = useState(false);

  // الحصول على آخر شهر متاح
  const latestMonth = useMemo(() => {
    return uniqueArchiveMonths.length > 0 ? uniqueArchiveMonths[uniqueArchiveMonths.length - 1] : '';
  }, [uniqueArchiveMonths]);

  // دوال الأزرار السريعة
  const handleQuickRange = (months: number) => {
    if (!latestMonth) return;
    
    const toMonth = latestMonth;
    const fromMonth = getMonthBefore(toMonth, months - 1);
    
    onToMonthChange(toMonth);
    onFromMonthChange(fromMonth);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 flex items-center gap-3 mb-2">
          <BarChart3 size={32} className="text-emerald-600" />
          التقارير المالية
        </h2>
        <p className="text-slate-500 font-semibold">تحليل شامل للحركات المالية عبر الفترات الزمنية</p>
      </div>

      {/* Period Selection Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={20} className="text-emerald-600" />
          <h3 className="text-lg font-black text-slate-800">اختر الفترة الزمنية</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">من (الشهر/السنة)</label>
            <input
              type="month"
              value={reportFromMonth}
              onChange={(e) => onFromMonthChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">إلى (الشهر/السنة)</label>
            <input
              type="month"
              value={reportToMonth}
              onChange={(e) => onToMonthChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Quick Range Buttons */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">أزرار سريعة</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleQuickRange(3)}
              className="px-4 py-3 rounded-lg font-bold text-sm bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border border-blue-200 hover:shadow-md transition-all active:scale-95"
            >
              <Zap size={16} className="inline mr-2" />
              آخر 3 شهور
            </button>
            <button
              onClick={() => handleQuickRange(6)}
              className="px-4 py-3 rounded-lg font-bold text-sm bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border border-purple-200 hover:shadow-md transition-all active:scale-95"
            >
              <Zap size={16} className="inline mr-2" />
              آخر 6 شهور
            </button>
            <button
              onClick={() => handleQuickRange(12)}
              className="px-4 py-3 rounded-lg font-bold text-sm bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 border border-orange-200 hover:shadow-md transition-all active:scale-95"
            >
              <Zap size={16} className="inline mr-2" />
              آخر 12 شهر
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results Cards */}
      {reportRows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
