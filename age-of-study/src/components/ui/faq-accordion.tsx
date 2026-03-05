"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full border-t border-white/20">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="border-b border-white/20">
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full flex items-center justify-between py-6 text-left focus:outline-none group"
              aria-expanded={isOpen}
            >
              <h4 className="text-xl font-medium tracking-wide group-hover:text-gray-300 transition-colors">
                {item.question}
              </h4>
              <div className="flex-shrink-0 ml-4 w-10 h-10 border border-white/20 flex items-center justify-center transition-colors group-hover:bg-white group-hover:text-black">
                {isOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </div>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-8 text-gray-400 text-lg leading-relaxed">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
