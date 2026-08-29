import { createContext, useContext, ReactNode } from 'react';

export const translations = {
  ar: {
    app_title: "منظومة نور البيان 2.0",
    web_version: "نسخة الويب 2026",
    school_name: "مدرسة نور البيان",
    special_edu: "للتعليم الخاص",
    academic_year: "السنة الدراسية",
    dashboard: "الرئيسية",
    students: "الطلاب والأقساط",
    financials: "الخزينة (ص/و)",
    teachers: "شئون العاملين",
    backup: "نسخ احتياطي (SQL)",
    dashboard_title: "لوحة التحكم",
    smart_advisor: "المستشار المالي الذكي",
    total_in: "إجمالي الواردات (الخزينة)",
    total_out: "إجمالي الصادرات (المصروفات)",
    net_balance: "صافي الخزينة",
    treasury_movement: "حركة الخزينة",
    registered_students: "الطلاب المسجلين",
    teachers_count: "المعلمين",
    recent_transactions: "أحدث الحركات المالية",
    no_recent_transactions: "لا توجد حركات مالية حديثة.",
  }
};

export type Language = 'ar';
export type TranslationKey = keyof typeof translations['ar'];

interface LanguageContextType {
  lang: 'ar';
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  toggleLang: () => {},
  t: (key: TranslationKey) => translations.ar[key] || '',
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const t = (key: TranslationKey) => translations.ar[key] || '';
  const toggleLang = () => {};

  return (
    <LanguageContext.Provider value={{ lang: 'ar', toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};


