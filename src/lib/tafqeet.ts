export function tafqeet(n: number): string {
  if (n === 0) return 'فقط صفر دينار ليبي لا غير';
  if (isNaN(n) || n < 0) return '';

  const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const teens = ['عشرة', 'إحدى عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertGroup(num: number): string {
    const parts: string[] = [];
    
    const h = Math.floor(num / 100);
    const remainder = num % 100;
    if (h > 0) {
      parts.push(hundreds[h]);
    }
    
    if (remainder > 0) {
      if (remainder < 10) {
        parts.push(units[remainder]);
      } else if (remainder >= 10 && remainder < 20) {
        parts.push(teens[remainder - 10]);
      } else {
        const u = remainder % 10;
        const t = Math.floor(remainder / 10);
        if (u > 0) {
          parts.push(`${units[u]} و${tens[t]}`);
        } else {
          parts.push(tens[t]);
        }
      }
    }
    return parts.join(' و');
  }

  let result = '';
  const thousands = Math.floor(n / 1000);
  const rem = Math.floor(n % 1000);

  if (thousands > 0) {
    if (thousands === 1) {
      result += 'ألف';
    } else if (thousands === 2) {
      result += 'ألفان';
    } else if (thousands >= 3 && thousands <= 10) {
      result += `${convertGroup(thousands)} آلاف`;
    } else {
      result += `${convertGroup(thousands)} ألف`;
    }
  }

  if (rem > 0) {
    if (result !== '') {
      result += ' و';
    }
    result += convertGroup(rem);
  }

  return `فقط ${result} دينار ليبي لا غير`;
}
