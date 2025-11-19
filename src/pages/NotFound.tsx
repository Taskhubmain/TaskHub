import React from 'react';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function NotFound() {
  return (
    <motion.div
      key="not-found"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-background flex items-center justify-center px-4"
    >
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-[#6FE7C8] mb-4">404</div>
        <h1 className="text-3xl font-bold mb-3">Страница не найдена</h1>
        <p className="text-[#3F7F6E] mb-8">
          К сожалению, страница, которую вы ищете, не существует или была перемещена.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <a href="#/">
              <Home className="h-4 w-4 mr-2" />
              На главную
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#/orders">
              <Search className="h-4 w-4 mr-2" />
              Искать заказы
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
