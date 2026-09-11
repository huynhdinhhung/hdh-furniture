'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SplashIntro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show once per session
    const hasSeen = sessionStorage.getItem('hasSeenSplash');
    if (!hasSeen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const reveal = requestAnimationFrame(() => setShow(true));
      
      // Auto-hide after 2.5 seconds
      const hide = setTimeout(() => {
        setShow(false);
        sessionStorage.setItem('hasSeenSplash', 'true');
      }, 2500);
      
      // Prevent scrolling while splash is visible
      document.body.style.overflow = 'hidden';
      const unlock = setTimeout(() => {
        document.body.style.overflow = '';
      }, 3500); // Wait for exit animation
      return () => {
        cancelAnimationFrame(reveal);
        clearTimeout(hide);
        clearTimeout(unlock);
        document.body.style.overflow = '';
      };
    } else {
      const hide=requestAnimationFrame(()=>setShow(false));
      return ()=>cancelAnimationFrame(hide);
    }
  }, []);

  return (
    <>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-forest text-paper"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <motion.div 
              className="text-5xl md:text-7xl font-serif tracking-widest text-center"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              HDH
              <motion.span 
                className="block text-sm md:text-base font-sans tracking-[0.4em] mt-5 opacity-80"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                FURNITURE
              </motion.span>
            </motion.div>
            
            <motion.div 
              className="mt-10 h-[1px] bg-paper/40"
              initial={{ width: 0 }}
              animate={{ width: "120%" }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
