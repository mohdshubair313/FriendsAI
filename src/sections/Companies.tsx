'use client'

import AcmeCorpLogo from "../assets/images/acme-corp-logo.svg";
import EchoValleyLogo from "../assets/images/echo-valley-logo.svg";
import QuantumLogo from "../assets/images/quantum-logo.svg";
import PulseLogo from "../assets/images/pulse-logo.svg";
import OutsideLogo from "../assets/images/outside-logo.svg";
import CelestialLogo from "../assets/images/celestial-logo.svg";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import { motion } from "framer-motion";

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
    <section>
      <div className="container">
        <SectionBorder>
          <SectionContent className="!pt-0">
            <h2 className="text-center text-xs font-bold uppercase tracking-widest text-gray-500">
              Empowering creators at leading companies
            </h2>

            {/* 💡 Scroll wrapper with perfect alignment */}
            <div className="relative mt-16 sm:mt-20 w-full overflow-x-auto md:overflow-visible">
              <motion.div
                className="flex gap-12 sm:gap-20 md:gap-28 px-4 sm:px-8 md:px-0 w-max md:w-full mx-auto justify-start md:justify-center"
                initial={{ x: 0 }}
                animate={{ x: "-50%" }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {[...companies, ...companies].map(({ logo: Logo }, index) => (
                  <div key={index} className="flex-shrink-0">
                    <Logo className="h-6 sm:h-8 md:h-10 opacity-80 hover:opacity-100 transition" />
                  </div>
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
