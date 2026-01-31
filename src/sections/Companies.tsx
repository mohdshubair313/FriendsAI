'use client'

import AcmeCorpLogo from "@/assets/images/acme-corp-logo.svg";
import EchoValleyLogo from "@/assets/images/echo-valley-logo.svg";
import QuantumLogo from "@/assets/images/quantum-logo.svg";
import PulseLogo from "@/assets/images/pulse-logo.svg";
import OutsideLogo from "@/assets/images/outside-logo.svg";
import CelestialLogo from "@/assets/images/celestial-logo.svg";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import { motion } from "framer-motion";
import Image from "next/image";

export const companies = [
  { name: "Acme Corp", logo: AcmeCorpLogo },
  { name: "Echo Valley", logo: EchoValleyLogo },
  { name: "Quantum", logo: QuantumLogo },
  { name: "Pulse", logo: PulseLogo },
  { name: "Outside", logo: OutsideLogo },
  { name: "Celestial", logo: CelestialLogo },
];

export const Companies = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-50/30 to-transparent pointer-events-none" />
      
      <div className="container relative z-10">
        <SectionBorder>
          <SectionContent className="!pt-0">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center text-xs font-bold uppercase tracking-widest text-stone-500"
            >
              Empowering creators at leading companies
            </motion.h2>

            {/* Logo Grid - Centered and Clean */}
            <div className="mt-12 sm:mt-16">
              <motion.div 
                className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 md:gap-16 lg:gap-20"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {companies.map(({ logo, name }, index) => (
                  <motion.div 
                    key={name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.1, opacity: 1 }}
                    className="flex items-center justify-center p-4"
                  >
                    <Image
                      src={logo}
                      alt={name}
                      className="opacity-60 hover:opacity-100 transition-all duration-300 h-6 sm:h-8 md:h-10 w-auto grayscale hover:grayscale-0"
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </SectionContent>
        </SectionBorder>
      </div>
    </section>
  );
};

export default Companies;
