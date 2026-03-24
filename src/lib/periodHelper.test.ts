/**
 * ملف اختبار لدوال periodHelper
 * يمكن تشغيله للتحقق من صحة الحسابات
 */

import {
  getDaysInMonth,
  parseDate,
  formatDateToISO,
  getPeriodInfo,
  getNextPeriod,
  getFirstPeriod,
  generateDates,
} from './periodHelper';

// 🧪 اختبار 1: الحصول على عدد أيام الشهر
console.log('=== اختبار 1: عدد أيام الشهر ===');
console.log('مارس 2026:', getDaysInMonth(2026, 3), '(يجب أن يكون 31)');
console.log('فبراير 2026:', getDaysInMonth(2026, 2), '(يجب أن يكون 28)');
console.log('أبريل 2026:', getDaysInMonth(2026, 4), '(يجب أن يكون 30)');

// 🧪 اختبار 2: الحصول على الفترة الأولى
console.log('\n=== اختبار 2: الفترة الأولى ===');
const firstPeriod = getFirstPeriod();
console.log('الفترة الأولى:', {
  البداية: firstPeriod.startDateStr,
  النهاية: firstPeriod.endDateStr,
  الوصف: firstPeriod.label,
});

// 🧪 اختبار 3: الفترة التالية من 1-15 إلى 16-نهاية الشهر
console.log('\n=== اختبار 3: من النصف الأول إلى النصف الثاني ===');
const nextFromFirst = getNextPeriod('2026-03-15'); // آخر يوم من النصف الأول
console.log('آخر فترة انتهت بـ: 2026-03-15 (النصف الأول)');
console.log('الفترة التالية:', {
  البداية: nextFromFirst.startDateStr,
  النهاية: nextFromFirst.endDateStr,
  الوصف: nextFromFirst.label,
});
console.log('يجب أن تكون: من 16/3 إلى 31/3');

// 🧪 اختبار 4: الفترة التالية من نهاية الشهر إلى الشهر الجديد
console.log('\n=== اختبار 4: من نهاية الشهر إلى الشهر الجديد ===');
const nextFromEnd = getNextPeriod('2026-03-31'); // آخر يوم من النصف الثاني
console.log('آخر فترة انتهت بـ: 2026-03-31 (النصف الثاني)');
console.log('الفترة التالية:', {
  البداية: nextFromEnd.startDateStr,
  النهاية: nextFromEnd.endDateStr,
  الوصف: nextFromEnd.label,
});
console.log('يجب أن تكون: من 1/4 إلى 15/4');

// 🧪 اختبار 5: عبور من فبراير إلى مارس
console.log('\n=== اختبار 5: عبور من فبراير إلى مارس (سنة عادية) ===');
const nextFromFeb = getNextPeriod('2026-02-28'); // آخر يوم من فبراير (28 يوم)
console.log('آخر فترة انتهت بـ: 2026-02-28 (النصف الثاني من فبراير)');
console.log('الفترة التالية:', {
  البداية: nextFromFeb.startDateStr,
  النهاية: nextFromFeb.endDateStr,
  الوصف: nextFromFeb.label,
});
console.log('يجب أن تكون: من 1/3 إلى 15/3');

// 🧪 اختبار 6: توليد 14 يوم من تاريخ البداية
console.log('\n=== اختبار 6: توليد 14 يوم ===');
const dates = generateDates('2026-03-01');
console.log('البداية: 2026-03-01');
console.log('عدد الأيام:', dates.length, '(يجب أن يكون 14)');
console.log('الأيام:', dates);
console.log('اليوم الأول:', dates[0], '(يجب أن يكون 2026-03-01)');
console.log('اليوم الأخير:', dates[13], '(يجب أن يكون 2026-03-14)');

// 🧪 اختبار 7: تسلسل كامل لثلاث فترات
console.log('\n=== اختبار 7: تسلسل كامل ===');
let currentEndDate = '2026-03-15'; // نهاية الفترة الأولى

console.log('الفترة 1:', {
  البداية: '2026-03-01',
  النهاية: currentEndDate,
});

const period2 = getNextPeriod(currentEndDate);
console.log('الفترة 2:', {
  البداية: period2.startDateStr,
  النهاية: period2.endDateStr,
});

const period3 = getNextPeriod(period2.endDateStr);
console.log('الفترة 3:', {
  البداية: period3.startDateStr,
  النهاية: period3.endDateStr,
});

const period4 = getNextPeriod(period3.endDateStr);
console.log('الفترة 4:', {
  البداية: period4.startDateStr,
  النهاية: period4.endDateStr,
});

console.log('\n✅ اختبارات مكتملة!');
