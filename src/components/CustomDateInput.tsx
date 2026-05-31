import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDateInputProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  errorMessage?: string;
  onValidationChange?: (message: string | null) => void;
}

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const ARABIC_WEEK_DAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

const formatIsoToDisplay = (value: string) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${day} / ${month} / ${fullYear}`;
};

const isRealDate = (year: number, month: number, day: number) => {
  const candidate = new Date(year, month - 1, day);
  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  );
};

const parseManualDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { iso: '', isComplete: false, isValid: true };
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    if (!isRealDate(year, month, day)) {
      return { iso: '', isComplete: true, isValid: false };
    }

    return {
      iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isComplete: true,
      isValid: true,
    };
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (!isRealDate(year, month, day)) {
      return { iso: '', isComplete: true, isValid: false };
    }

    return {
      iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isComplete: true,
      isValid: true,
    };
  }

  return { iso: '', isComplete: false, isValid: false };
};

const formatDateToIso = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getCalendarDays = (year: number, monthIndex: number) => {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const monthStartOffset = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, monthIndex, 0).getDate();
  const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  for (let offset = monthStartOffset - 1; offset >= 0; offset -= 1) {
    days.push({
      date: new Date(year, monthIndex - 1, daysInPreviousMonth - offset),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      date: new Date(year, monthIndex, day),
      isCurrentMonth: true,
    });
  }

  while (days.length < 42) {
    const nextDay = days.length - (monthStartOffset + daysInMonth) + 1;
    days.push({
      date: new Date(year, monthIndex + 1, nextDay),
      isCurrentMonth: false,
    });
  }

  return days;
};

export const CustomDateInput = ({
  value,
  onChange,
  className = "",
  placeholder = "اختر التاريخ أو اكتبه يدويًا",
  disabled = false,
  errorMessage,
  onValidationChange,
}: CustomDateInputProps) => {
  const [textValue, setTextValue] = useState('');
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialDate = value ? new Date(value) : new Date();
  const [calendarMonth, setCalendarMonth] = useState(initialDate.getMonth());
  const [calendarYear, setCalendarYear] = useState(initialDate.getFullYear());

  useEffect(() => {
    if (value) {
      setTextValue(formatIsoToDisplay(value));
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setCalendarMonth(parsedDate.getMonth());
        setCalendarYear(parsedDate.getFullYear());
      }
    } else {
      setTextValue('');
    }
  }, [value]);

  useEffect(() => {
    onValidationChange?.(internalError);
  }, [internalError, onValidationChange]);

  useEffect(() => {
    if (!isCalendarOpen) return undefined;

    const handleOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isCalendarOpen]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);

    const parsed = parseManualDate(val);
    if (!val.trim()) {
      setInternalError(null);
      onChange('');
      return;
    }

    if (parsed.isComplete && parsed.isValid) {
      setInternalError(null);
      onChange(parsed.iso);
      return;
    }

    if (parsed.isComplete && !parsed.isValid) {
      setInternalError('صيغة التاريخ غير صحيحة');
      return;
    }

    setInternalError(null);
  };

  const handleBlur = () => {
    if (!textValue.trim()) {
      setInternalError(null);
      return;
    }

    const parsed = parseManualDate(textValue);
    if (parsed.isComplete && parsed.isValid) {
      setTextValue(formatIsoToDisplay(parsed.iso));
      setInternalError(null);
      return;
    }

    setInternalError('صيغة التاريخ غير صحيحة');
  };

  const openPicker = () => {
    if (disabled) return;
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 380);
    }
    setIsCalendarOpen(true);
  };

  const closePicker = () => {
    setIsCalendarOpen(false);
  };

  const selectedIso = value || '';
  const todayIso = useMemo(() => formatDateToIso(new Date()), []);
  const calendarDays = useMemo(() => getCalendarDays(calendarYear, calendarMonth), [calendarYear, calendarMonth]);

  const changeMonth = (direction: -1 | 1) => {
    const nextDate = new Date(calendarYear, calendarMonth + direction, 1);
    setCalendarMonth(nextDate.getMonth());
    setCalendarYear(nextDate.getFullYear());
  };

  const handleDateSelection = (date: Date) => {
    const isoDate = formatDateToIso(date);
    setInternalError(null);
    onChange(isoDate);
    setTextValue(formatIsoToDisplay(isoDate));
    closePicker();
  };

  const handleToday = () => {
    handleDateSelection(new Date());
  };

  const handleClear = () => {
    setInternalError(null);
    setTextValue('');
    onChange('');
    closePicker();
  };

  const resolvedError = errorMessage ?? internalError;

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        className={`relative flex items-center bg-white border rounded-xl px-3 gap-3 transition-all whitespace-nowrap print:border-none print:bg-transparent print:px-0 print:gap-0 print:rounded-none ${resolvedError ? 'border-rose-300 focus-within:ring-2 focus-within:ring-rose-500' : 'border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500'} ${disabled ? 'cursor-default' : 'cursor-text'} print:focus-within:ring-0`}
        onClick={() => {
          openPicker();
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onFocus={openPicker}
          placeholder={placeholder}
          disabled={disabled}
          dir="ltr"
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-mono font-bold outline-none placeholder-slate-300 text-sm disabled:text-slate-400 disabled:cursor-default print:border-none print:bg-transparent print:p-0"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsCalendarOpen((prev) => !prev);
          }}
          disabled={disabled}
          className="p-1 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-default print:hidden"
        >
          <CalendarIcon size={18} />
        </button>
      </div>
      {isCalendarOpen && !disabled && (
        <div className={`absolute right-0 z-[120] w-full min-w-[320px] max-w-[360px] rounded-2xl border border-emerald-100 bg-white p-4 shadow-[0_22px_55px_-22px_rgba(15,23,42,0.45)] ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              aria-label="الشهر التالي"
            >
              <ChevronRight size={18} />
            </button>
            <div className="text-center">
              <p className="text-base font-black text-slate-800">{ARABIC_MONTHS[calendarMonth]}</p>
              <p className="text-xs font-bold text-slate-400">{calendarYear}</p>
            </div>
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              aria-label="الشهر السابق"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center">
            {ARABIC_WEEK_DAYS.map((day) => (
              <div key={day} className="py-1 text-xs font-black text-slate-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isoDate = formatDateToIso(day.date);
              const isSelected = selectedIso === isoDate;
              const isToday = todayIso === isoDate;

              return (
                <button
                  key={`${isoDate}-${index}`}
                  type="button"
                  onClick={() => handleDateSelection(day.date)}
                  className={`h-10 rounded-xl text-sm font-bold transition-all ${isSelected ? 'bg-emerald-600 text-white shadow-sm' : isToday ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : day.isCurrentMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-50'}`}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl px-3 py-2 text-xs font-black text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              اليوم
            </button>
          </div>
        </div>
      )}
      {resolvedError && (
        <p className="mt-1 text-xs font-bold text-rose-600">{resolvedError}</p>
      )}
    </div>
  );
};
