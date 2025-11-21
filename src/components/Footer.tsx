import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t bg-[#EFFFF8]/30">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 text-sm text-[#3F7F6E]">
          <div className="text-center text-xs sm:text-sm">
            <span className="font-medium text-gray-900">TaskHub</span> © {new Date().getFullYear()}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-[10px] sm:text-sm leading-tight">
            <a href="#/terms" className="hover:text-foreground transition whitespace-nowrap">Условия</a>
            <a href="#/privacy" className="hover:text-foreground transition whitespace-nowrap">Конфиденциальность</a>
            <a href="#/payments" className="hover:text-foreground transition whitespace-nowrap">Платежи</a>
            <a href="#/contact" className="hover:text-foreground transition whitespace-nowrap">Контакты</a>
            <a href="#/admin" className="hover:text-foreground transition whitespace-nowrap opacity-30 hover:opacity-60">Админ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
