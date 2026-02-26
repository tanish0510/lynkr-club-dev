import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const RedeemModal = ({ open, coupon, redeeming, onCancel, onConfirm }) => {
  return (
    <AnimatePresence>
      {open && coupon ? (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md bg-card rounded-2xl border border-white/10 p-6 shadow-2xl"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-2xl font-bold mb-2">Confirm redemption</h3>
            <p className="text-muted-foreground mb-6">
              Redeem <strong>{coupon.title}</strong> for <strong>{coupon.points_cost} points</strong>?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={redeeming === coupon.id}
                onClick={onConfirm}
              >
                {redeeming === coupon.id ? "Redeeming..." : "Confirm"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default RedeemModal;
