import { motion } from "framer-motion";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import underlineImage from "@/assets/images/underline.svg?url";
import clsx from "clsx";

export default function ChatNavbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={clsx(
        "sticky top-0 z-50 w-full px-6 py-4",
        "backdrop-blur-md bg-white/10 dark:bg-black/20",
        "border-b border-white/10 shadow-lg",
        "flex items-center justify-between"
      )}
    >
      <Select defaultValue="Motivated">
        <SelectTrigger className="w-[180px] backdrop-blur-lg bg-black/30 border border-white/20 text-white">
          <SelectValue placeholder="Select a Mood" />
        </SelectTrigger>
        <SelectContent className="bg-black text-white border border-white/10">
          <SelectGroup>
            <SelectLabel className="text-sm text-gray-400">Moods</SelectLabel>
            <SelectItem value="Motivated">Motivated 😤</SelectItem>
            <SelectItem value="Excited">Excited 🤩</SelectItem>
            <SelectItem value="Lover">Lover 🥰</SelectItem>
            <SelectItem value="Friendly">Friendly 🤗</SelectItem>
            <SelectItem value="Supportive">Supportive 🤝</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-3xl font-bold relative text-white tracking-tight"
      >
        Friends AI
        <span
          className="absolute w-full left-0 top-full h-5 bg-gradient-to-r from-amber-300 via-teal-300 to-fuchsia-400"
          style={{
            maskImage: `url(${underlineImage.src})`,
            maskSize: "contain",
            maskPosition: "center",
            maskRepeat: "no-repeat",
            WebkitMaskImage: `url(${underlineImage.src})`,
          }}
        ></span>
      </motion.h1>
    </motion.header>
  );
}
