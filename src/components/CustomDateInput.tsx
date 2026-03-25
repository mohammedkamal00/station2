import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface CustomDateInputProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomDateInput = ({
  value,
  onChange,
  className = "",
  placeholder = "DD / MM / YYYY",
  disabled = false,
}: CustomDateInputProps) => {
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
        e.stopPropagation();
        openPicker();
      }}
    >
      <input
        ref={dateInputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="hidden"
      />
      <input
        type="text"
        value={textValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-mono font-bold outline-none placeholder-slate-300 text-sm disabled:text-slate-400 disabled:cursor-default print:border-none print:bg-transparent print:p-0"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openPicker();
        }}
        disabled={disabled}
        className="p-1 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-default print:hidden"
      >
        <CalendarIcon size={18} />
      </button>
    </div>
  );
};
