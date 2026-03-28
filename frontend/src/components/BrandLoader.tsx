import React from "react";
import { motion } from "framer-motion";
import LogoAnimated from "@/components/LogoAnimated";

const BrandLoader = ({ label = "Loading Lynkr experience..." }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex w-full max-w-[320px] flex-col items-center gap-4 rounded-3xl border border-border bg-card/60 p-6">
        <LogoAnimated className="w-[180px]" />
        <motion.div
          className="h-1.5 w-32 overflow-hidden rounded-full bg-primary/20"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        >
          <motion.div
            className="h-full w-1/3 rounded-full bg-primary"
            animate={{ x: ["-10%", "220%", "-10%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        <p className="text-center text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

export default BrandLoader;
