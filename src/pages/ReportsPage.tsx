import React, { useMemo } from 'react';
import { 
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  Archive
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
            التقارير المالية
          </h2>
          <p className="text-slate-500 font-bold mt-2">تحليل وتجميع الحركات حسب الأشهر</p>
        </div>
      </div>

      {/* Advanced Report Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3 className="text-lg sm:text-xl font-black text-slate-800">إعدادات التقرير</h3>
          <div className="text-xs text-slate-400 font-bold">حدد الفترة والخيارات</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Primary Period */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-black text-slate-500 mb-3">الفترة الأساسية</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">From (من شهر/سنة)</label>
                <input
                  type="month"
                  value={reportFromMonth}
                  onChange={(e) => onFromMonthChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">To (إلى شهر/سنة)</label>
                <input
                  type="month"
                  value={reportToMonth}
                  onChange={(e) => onToMonthChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button 
                onClick={() => onApplyFlexibleRange(3)} 
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                3 شهور
              </button>
              <button 
                onClick={() => onApplyFlexibleRange(6)} 
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                6 شهور
              </button>
              <button 
                onClick={() => onApplyFlexibleRange(12)} 
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                12 شهر
              </button>
            </div>
          </div>

          {/* Comparison Period */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-black text-slate-500">فترة المقارنة</div>
              <button
                onClick={onCompareToggle}
                className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-colors ${isCompareEnabled ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
              >
                مقارنة مع فترة أخرى
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">From (مقارنة)</label>
                <input
                  type="month"
                  value={compareFromMonth}
                  onChange={(e) => onCompareFromMonthChange(e.target.value)}
                  disabled={!isCompareEnabled}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">To (مقارنة)</label>
                <input
                  type="month"
                  value={compareToMonth}
                  onChange={(e) => onCompareToMonthChange(e.target.value)}
                  disabled={!isCompareEnabled}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="text-xs text-emerald-700 font-bold">إجمالي المدين</div>
          <div className="text-2xl font-black text-emerald-800 font-mono">{reportSummary.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
          <div className="text-xs text-rose-700 font-bold">إجمالي الدائن</div>
          <div className="text-2xl font-black text-rose-800 font-mono">{reportSummary.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className={`border rounded-xl p-4 ${reportSummary.netBalance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="text-xs text-slate-600 font-bold">صافي الرصيد خلال الفترة</div>
          <div className="text-2xl font-black text-slate-800 font-mono">{reportSummary.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Comparison Delta */}
      {isCompareEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5"
        >
          <div className="text-sm font-black text-slate-700 mb-3">نتيجة المقارنة</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-bold text-slate-500">فرق المدين</div>
              <div className={`text-lg font-black font-mono ${comparisonDelta.debitDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {comparisonDelta.debitDiff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400">
                {comparisonDelta.debitPct === null ? '—' : `${comparisonDelta.debitPct.toFixed(2)}%`}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-bold text-slate-500">فرق الدائن</div>
              <div className={`text-lg font-black font-mono ${comparisonDelta.creditDiff >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {comparisonDelta.creditDiff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400">
                {comparisonDelta.creditPct === null ? '—' : `${comparisonDelta.creditPct.toFixed(2)}%`}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-bold text-slate-500">فرق صافي الرصيد</div>
              <div className={`text-lg font-black font-mono ${comparisonDelta.netDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {comparisonDelta.netDiff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400">
                {comparisonDelta.netPct === null ? '—' : `${comparisonDelta.netPct.toFixed(2)}%`}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Data Tables and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Report Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-sm font-black text-slate-700">
            جدول التقرير الشهري
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-xs font-black text-slate-400">الشهر</th>
                  <th className="p-3 text-xs font-black text-emerald-600">المدين</th>
                  <th className="p-3 text-xs font-black text-rose-600">الدائن</th>
                  <th className="p-3 text-xs font-black text-slate-700">الصافي</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.length > 0 ? reportRows.map((row) => (
                  <tr key={row.monthKey} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-sm font-bold text-slate-700">{row.label}</td>
                    <td className="p-3 text-sm font-black font-mono text-emerald-700">{row.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-sm font-black font-mono text-rose-700">{row.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`p-3 text-sm font-black font-mono ${row.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{row.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 font-bold">لا توجد بيانات ضمن هذه الفترة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          <div className="text-sm font-black text-slate-700 mb-4">رسم بياني مبسط</div>
          {(() => {
            const chartItems = [
              { label: 'المدين', value: Math.abs(reportSummary.totalDebit), actual: reportSummary.totalDebit, bar: 'bg-emerald-500' },
              { label: 'الدائن', value: Math.abs(reportSummary.totalCredit), actual: reportSummary.totalCredit, bar: 'bg-rose-500' },
              { label: 'الصافي', value: Math.abs(reportSummary.netBalance), actual: reportSummary.netBalance, bar: reportSummary.netBalance >= 0 ? 'bg-blue-500' : 'bg-amber-500' },
            ];
            const maxValue = Math.max(...chartItems.map(i => i.value), 1);

            return (
              <div className="space-y-4">
                {chartItems.map(item => {
                  const width = (item.value / maxValue) * 100;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1 text-xs font-bold">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-mono text-slate-800">{item.actual.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.bar}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </motion.div>
      </div>

      {/* Comparison Table */}
      {isCompareEnabled && compareRows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-sm font-black text-slate-700">
            جدول المقارنة الشهري
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-xs font-black text-slate-400">الشهر</th>
                  <th className="p-3 text-xs font-black text-emerald-600">المدين</th>
                  <th className="p-3 text-xs font-black text-rose-600">الدائن</th>
                  <th className="p-3 text-xs font-black text-slate-700">الصافي</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.monthKey} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-sm font-bold text-slate-700">{row.label}</td>
                    <td className="p-3 text-sm font-black font-mono text-emerald-700">{row.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-sm font-black font-mono text-rose-700">{row.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`p-3 text-sm font-black font-mono ${row.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{row.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
