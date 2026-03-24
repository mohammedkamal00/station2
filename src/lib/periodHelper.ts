/**
 * فئة مساعدة لإدارة إنشاء الفترات الذكية التلقائية
 */

export interface PeriodInfo {
  startDate: Date;
  endDate: Date;
  startDateStr: string; // YYYY-MM-DD
  endDateStr: string;   // YYYY-MM-DD
  startDay: number;
  endDay: number;
  month: number;
  year: number;
  label: string;
}

/**
 * الحصول على عدد أيام الشهر
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

/**
 * تحويل تاريخ نصي إلى كائن تاريخ
 */
export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * تحويل كائن تاريخ إلى نصي (YYYY-MM-DD)
 */
export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * الحصول على معلومات الفترة من تاريخ معين
 */
export const getPeriodInfo = (dateStr: string): PeriodInfo => {
  const date = parseDate(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let startDay: number, endDay: number;
  
  if (day <= 15) {
    // النصف الأول من الشهر: 1-15
    startDay = 1;
    endDay = 15;
  } else {
    // النصف الثاني من الشهر: 16 - نهاية الشهر
    startDay = 16;
    endDay = getDaysInMonth(year, month);
  }
  
  const startDate = new Date(year, month - 1, startDay);
  const endDate = new Date(year, month - 1, endDay);
  
  return {
    startDate,
    endDate,
    startDateStr: formatDateToISO(startDate),
    endDateStr: formatDateToISO(endDate),
    startDay,
    endDay,
    month,
    year,
    label: `من ${startDay} إلى ${endDay}/${month}/${year}`
  };
};

/**
 * الحصول على الفترة التالية تلقائياً بناءً على آخر فترة
 * 
 * Logic:
 * - إذا كانت آخر فترة من 1-15: التالية من 16 لنهاية الشهر
 * - إذا كانت آخر فترة من 16-نهاية الشهر: التالية من 1-15 من الشهر القادم
 */
export const getNextPeriod = (lastEndDateStr: string): PeriodInfo => {
  const lastEndDate = parseDate(lastEndDateStr);
  const lastPeriodInfo = getPeriodInfo(lastEndDateStr);
  
  let nextStartDate: Date;
  
  if (lastPeriodInfo.endDay === 15) {
    // آخر فترة انتهت في 15، الفترة التالية من 16 لنهاية الشهر
    nextStartDate = new Date(lastEndDate.getFullYear(), lastEndDate.getMonth(), 16);
  } else {
    // آخر فترة انتهت في نهاية الشهر، الفترة التالية من 1 إلى 15 من الشهر القادم
    nextStartDate = new Date(lastEndDate.getFullYear(), lastEndDate.getMonth() + 1, 1);
  }
  
  const year = nextStartDate.getFullYear();
  const month = nextStartDate.getMonth() + 1;
  const startDay = nextStartDate.getDate();
  
  // تحديد اليوم الأخير
  let endDay: number;
  if (startDay === 1) {
    endDay = 15; // النصف الأول: 1-15
  } else if (startDay === 16) {
    endDay = getDaysInMonth(year, month); // النصف الثاني: 16-نهاية الشهر
  } else {
    // حالة استثنائية (لا يجب أن تحدث عادة)
    endDay = getDaysInMonth(year, month);
  }
  
  const nextEndDate = new Date(year, month - 1, endDay);
  
  return {
    startDate: nextStartDate,
    endDate: nextEndDate,
    startDateStr: formatDateToISO(nextStartDate),
    endDateStr: formatDateToISO(nextEndDate),
    startDay,
    endDay,
    month,
    year,
    label: `من ${startDay} إلى ${endDay}/${month}/${year}`
  };
};

/**
 * الحصول على الفترة الأولى (من 1-15 من الشهر الحالي)
 */
export const getFirstPeriod = (): PeriodInfo => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  const startDate = new Date(year, now.getMonth(), 1);
  const endDate = new Date(year, now.getMonth(), 15);
  
  return {
    startDate,
    endDate,
    startDateStr: formatDateToISO(startDate),
    endDateStr: formatDateToISO(endDate),
    startDay: 1,
    endDay: 15,
    month,
    year,
    label: `من 1 إلى 15/${month}/${year}`
  };
};

/**
 * توليد كل أيام الفترة (شامل يوم البداية والنهاية)
 */
export const generateDatesForPeriod = (startDateStr: string, endDateStr: string): string[] => {
  const dates: string[] = [];
  const startDate = parseDate(startDateStr);

  const endDate = parseDate(endDateStr);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(formatDateToISO(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

/**
 * للإبقاء على التوافق: توليد 14 يوم بدءاً من تاريخ البداية
 */
export const generateDates = (startDateStr: string): string[] => {
  const startDate = parseDate(startDateStr);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 13);
  return generateDatesForPeriod(startDateStr, formatDateToISO(endDate));
};

/**
 * إنشاء Entry جديد خالي لتاريخ معين
 */
export const createEmptyEntry = (dateStr: string) => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    date: dateStr,
    revenue: 0,
    coupons: 0,
    debitNote: 0,
    invoices: 0,
    creditNote: 0,
  };
};
