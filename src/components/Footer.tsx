import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t bg-[#EFFFF8]/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#3F7F6E]">
          <div>
            <span className="font-medium text-gray-900">TaskHub</span> © {new Date().getFullYear()}
          </div>
          <div className="flex items-center gap-6">
            <a href="#/terms" className="hover:text-foreground transition">Условия использования</a>
            <a href="#/privacy" className="hover:text-foreground transition">Конфиденциальность</a>
            <a href="#/payments" className="hover:text-foreground transition">Политика платежей</a>
            <a href="#/contact" className="hover:text-foreground transition">Контакты</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
