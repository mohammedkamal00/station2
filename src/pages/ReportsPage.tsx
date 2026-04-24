import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Calendar,
  TrendingDown,
  TrendingUp,
  Plus,
  Printer,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CustomDateInput } from '../components/CustomDateInput';

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
  reportFromDate: string;
  reportToDate: string;
  isCompareEnabled: boolean;
  compareFromDate: string;
  compareToDate: string;
  reportRows: ReportRow[];
  reportSummary: ReportSummary;
  compareRows: ReportRow[];
  compareSummary: ReportSummary;
  comparisonDelta: ComparisonDelta;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onCompareToggle: () => void;
  onCompareFromDateChange: (value: string) => void;
  onCompareToDateChange: (value: string) => void;
  onApplyFlexibleRange: (range: number | 'year' | 'last-statement') => void;
  onCreateNewPeriod?: () => void;
  onPrint?: () => void;
}

const formatFullDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function ReportsPage({
  reportFromDate,
  reportToDate,
  reportRows,
  reportSummary,
  onFromDateChange,
  onToDateChange,
  onApplyFlexibleRange,
  onCreateNewPeriod,
  onPrint,
}: ReportsPageProps) {
  const [showDetailTable, setShowDetailTable] = useState(false);
  const [activeQuickRange, setActiveQuickRange] = useState<'this-month' | 'prev-month' | 3 | 6 | 'year' | 'last-statement' | null>(null);
  const [fromDateError, setFromDateError] = useState<string | null>(null);
  const [toDateError, setToDateError] = useState<string | null>(null);
  const [draftFromDate, setDraftFromDate] = useState(reportFromDate);
  const [draftToDate, setDraftToDate] = useState(reportToDate);
  const manualSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftFromDate(reportFromDate);
    setDraftToDate(reportToDate);
  }, [reportFromDate, reportToDate]);

  const toIsoDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const applyDraftRange = (fromDate: string, toDate: string) => {
    onFromDateChange(fromDate);
    onToDateChange(toDate);
  };

  const manualRangeError = useMemo(() => {
    if (!draftFromDate || !draftToDate) return null;
    if (draftToDate < draftFromDate) {
      return 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية';
    }
    return null;
  }, [draftFromDate, draftToDate]);

  const hasDraftChanges = draftFromDate !== reportFromDate || draftToDate !== reportToDate;
  const canApplyFilter = !fromDateError && !toDateError && !manualRangeError && !!draftFromDate && !!draftToDate;

  const handleQuickRange = (range: 3 | 6 | 'year' | 'last-statement') => {
    onApplyFlexibleRange(range);
    setActiveQuickRange(range);
  };

  const handleManualFromChange = (value: string) => {
    setActiveQuickRange(null);
    setDraftFromDate(value);
  };

  const handleManualToChange = (value: string) => {
    setActiveQuickRange(null);
    setDraftToDate(value);
  };

  const handleApplyFilter = () => {
    if (!canApplyFilter) return;
    applyDraftRange(draftFromDate, draftToDate);
  };

  const applyFinancialPreset = (preset: 'this-month' | 'prev-month' | 3 | 6 | 'year' | 'last-statement') => {
    if (preset === 3 || preset === 6 || preset === 'year' || preset === 'last-statement') {
      handleQuickRange(preset);
      return;
    }

    const today = new Date();
    let fromDate = '';
    let toDate = '';

    if (preset === 'this-month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      fromDate = toIsoDate(first);
      toDate = toIsoDate(last);
    } else {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      fromDate = toIsoDate(first);
      toDate = toIsoDate(last);
    }

    setActiveQuickRange(preset);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    applyDraftRange(fromDate, toDate);
  };

  const handleEditSelection = () => {
    manualSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = manualSectionRef.current?.querySelector('input[type="text"]') as HTMLInputElement | null;
    input?.focus();
  };

  const clearSelection = () => {
    setActiveQuickRange(null);
    setDraftFromDate('');
    setDraftToDate('');
    onFromDateChange('');
    onToDateChange('');
    setFromDateError(null);
    setToDateError(null);
  };

  const coverageLabel = useMemo(() => {
    if (reportRows.length <= 1) return 'ضمن الفترة المحددة';
    return `يغطي ${reportRows.length} أشهر`;
  }, [reportRows.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <BarChart3 size={32} className="text-emerald-600" />
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800">التقارير المالية</h2>
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

      {reportFromDate && reportToDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-emerald-200 px-4 py-3 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <Calendar size={18} className="text-emerald-600" />
            <p className="text-sm sm:text-base font-black text-slate-800">
              الفترة المختارة: من <span className="text-emerald-600">{formatFullDateDisplay(reportFromDate)}</span> إلى{' '}
              <span className="text-emerald-600">{formatFullDateDisplay(reportToDate)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditSelection}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-black hover:bg-slate-50 transition-colors"
            >
              تعديل
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-black hover:bg-rose-100 transition-colors"
            >
              مسح
            </button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6"
        id="reports-manual-range"
        ref={manualSectionRef}
      >
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={20} className="text-slate-600" />
          <h3 className="text-lg font-black text-slate-800">اختر الفترة يدويًا</h3>
        </div>

        <p className="text-sm text-slate-500 font-semibold mb-5">اختر التاريخ أو اكتبه يدويًا</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">من تاريخ</label>
            <CustomDateInput
              value={draftFromDate}
              onChange={handleManualFromChange}
              onValidationChange={setFromDateError}
              errorMessage={fromDateError ?? undefined}
              placeholder="اختر التاريخ أو اكتبه يدويًا"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">إلى تاريخ</label>
            <CustomDateInput
              value={draftToDate}
              onChange={handleManualToChange}
              onValidationChange={setToDateError}
              errorMessage={toDateError ?? undefined}
              placeholder="اختر التاريخ أو اكتبه يدويًا"
              className="w-full"
            />
          </div>
        </div>

        {manualRangeError && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {manualRangeError}
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm font-black text-slate-700 mb-3">اختصارات سريعة</p>
          <div className="flex flex-wrap items-center gap-3.5">
            <button
              onClick={() => applyFinancialPreset('this-month')}
              className={`h-10 px-5 rounded-2xl text-xs font-black border shadow-[0_1px_2px_rgba(15,23,42,0.05)] cursor-pointer transition-all duration-200 ${activeQuickRange === 'this-month' ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.25)]' : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]'}`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => applyFinancialPreset('prev-month')}
              className={`h-10 px-5 rounded-2xl text-xs font-black border shadow-[0_1px_2px_rgba(15,23,42,0.05)] cursor-pointer transition-all duration-200 ${activeQuickRange === 'prev-month' ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.25)]' : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]'}`}
            >
              الشهر الماضي
            </button>
            <button
              onClick={() => applyFinancialPreset(3)}
              className={`h-10 px-5 rounded-2xl text-xs font-black border shadow-[0_1px_2px_rgba(15,23,42,0.05)] cursor-pointer transition-all duration-200 ${activeQuickRange === 3 ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.25)]' : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]'}`}
            >
              آخر 3 أشهر
            </button>
            <button
              onClick={() => applyFinancialPreset(6)}
              className={`h-10 px-5 rounded-2xl text-xs font-black border shadow-[0_1px_2px_rgba(15,23,42,0.05)] cursor-pointer transition-all duration-200 ${activeQuickRange === 6 ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.25)]' : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]'}`}
            >
              آخر 6 أشهر
            </button>
            <button
              onClick={() => applyFinancialPreset('year')}
              className={`h-10 px-5 rounded-2xl text-xs font-black border shadow-[0_1px_2px_rgba(15,23,42,0.05)] cursor-pointer transition-all duration-200 ${activeQuickRange === 'year' ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.25)]' : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]'}`}
            >
              من بداية السنة
            </button>
            <button
              onClick={() => applyFinancialPreset('last-statement')}
              className={`h-10 px-5 rounded-2xl text-xs font-black border shadow-[0_1px_2px_rgba(15,23,42,0.05)] cursor-pointer transition-all duration-200 ${activeQuickRange === 'last-statement' ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.25)]' : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]'}`}
            >
              آخر كشف
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-stretch sm:justify-end">
          <button
            onClick={handleApplyFilter}
            disabled={!canApplyFilter || (!hasDraftChanges && !manualRangeError)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            تطبيق الفلترة
          </button>
        </div>
      </motion.div>

      {reportRows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <h3 className="text-sm sm:text-base font-black text-slate-800">ملخص الفترة المحددة ({reportRows.length} أشهر)</h3>
            <span className="text-xs font-semibold text-slate-500">{coverageLabel}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-[1.4fr_1fr_1fr] gap-4">
            <div className={`rounded-3xl border px-6 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${reportSummary.netBalance >= 0 ? 'bg-gradient-to-br from-blue-50 via-white to-blue-100 border-blue-200' : 'bg-gradient-to-br from-amber-50 via-white to-amber-100 border-amber-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className={`text-[11px] font-black tracking-[0.18em] ${reportSummary.netBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                      صافي الرصيد
                    </p>
                    <h3 className={`text-4xl sm:text-[2.7rem] font-black font-mono leading-none ${reportSummary.netBalance >= 0 ? 'text-blue-950' : 'text-amber-950'}`}>
                      {reportSummary.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black ${reportSummary.netBalance >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {reportSummary.netBalance >= 0 ? 'فائض' : 'عجز'}
                  </span>
                </div>
                <div className={`rounded-2xl p-2 ${reportSummary.netBalance >= 0 ? 'bg-blue-600/10 text-blue-700' : 'bg-amber-600/10 text-amber-700'}`}>
                  <BarChart3 size={18} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-5 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="space-y-2">
                  <p className="text-[11px] font-black tracking-[0.16em] text-emerald-600">إجمالي المدين</p>
                  <h3 className="text-3xl sm:text-[2rem] font-black text-emerald-950 font-mono leading-none">
                    {reportSummary.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                </div>
                <div className="rounded-2xl p-2 bg-emerald-600/10 text-emerald-700">
                  <TrendingUp size={16} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-100 px-5 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="space-y-2">
                  <p className="text-[11px] font-black tracking-[0.16em] text-rose-600">إجمالي الدائن</p>
                  <h3 className="text-3xl sm:text-[2rem] font-black text-rose-950 font-mono leading-none">
                    {reportSummary.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                </div>
                <div className="rounded-2xl p-2 bg-rose-600/10 text-rose-700">
                  <TrendingDown size={16} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
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

      {reportRows.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center"
        >
          <div className="flex justify-center mb-4">
            <BarChart3 size={48} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold text-lg">لا توجد بيانات ضمن الفترة المحددة</p>
          <p className="text-slate-400 text-sm mt-2">اختر فترة زمنية مختلفة أو استخدم الأزرار السريعة</p>
        </motion.div>
      )}
    </motion.div>
  );
}