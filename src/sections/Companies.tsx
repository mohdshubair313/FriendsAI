'use client'

import AcmeCorpLogo from "@/assets/images/acme-corp-logo.svg";
import EchoValleyLogo from "@/assets/images/echo-valley-logo.svg";
import QuantumLogo from "@/assets/images/quantum-logo.svg";
import PulseLogo from "@/assets/images/pulse-logo.svg";
import OutsideLogo from "@/assets/images/outside-logo.svg";
import CelestialLogo from "@/assets/images/celestial-logo.svg";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
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
      <div className="container relative z-10">
        <SectionBorder>
          <SectionContent className="!py-14">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600">
              Trusted by teams at forward-thinking companies
            </p>

            <div className="mt-10 relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
              <div className="flex gap-14 items-center w-max animate-marquee">
                {[...companies, ...companies].map(({ logo, name }, index) => (
                  <div
                    key={`${name}-${index}`}
                    className="flex items-center justify-center flex-shrink-0 px-2"
                  >
                    <Image
                      src={logo}
                      alt={name}
                      className="opacity-20 hover:opacity-40 transition-opacity duration-500 h-6 sm:h-7 w-auto grayscale"
                    />
                  </div>
                ))}
              </div>
            </div>
          </SectionContent>
        </SectionBorder>
      </div>
    </section>
  );
};

export default Companies;
