'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Photo } from '@/components/photo';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function HomeHero({ banner, fallbackImage }: { banner: any; fallbackImage: string }) {
  return (
    <section className="relative min-h-[650px] h-[75vh] max-h-[900px] flex items-center text-white isolate overflow-hidden">
      <motion.div 
        initial={{ scale: 1.1, opacity: 0.8 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-[-2]"
      >
        <Photo className="w-full h-full object-cover object-[center_57%]" src={banner?.imageUrl || fallbackImage} alt="Không gian phòng khách với sofa sáng màu và bàn gỗ — ảnh minh họa" eager />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 to-ink/10 z-[-1]" />
      
      <div className="px-7 md:px-[7%] max-w-[780px] w-full pt-16">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="block text-xs tracking-[0.15em] font-semibold mb-5 text-wood"
        >
          HDH FURNITURE / KHÔNG GIAN SỐNG
        </motion.span>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-[5.5vw] leading-[1.1] tracking-tight my-6 font-serif"
        >
          {banner?.title || <>Nhà là nơi<br />mình thuộc về.</>}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-[17px] leading-[1.8] text-paper mb-8 opacity-90 max-w-[500px]"
        >
          Nội thất gần gũi, đường nét tinh giản.<br />Để mỗi góc nhà đều mang dấu ấn của bạn.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Link 
            className="inline-flex items-center justify-between gap-6 bg-paper text-ink px-6 py-3 hover:bg-white transition-colors duration-300 font-medium text-[15px] min-w-[220px]" 
            href={banner?.targetUrl?.startsWith('/san-pham') ? banner.targetUrl : '/san-pham'}
          >
            Khám phá nội thất <span>↗</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
