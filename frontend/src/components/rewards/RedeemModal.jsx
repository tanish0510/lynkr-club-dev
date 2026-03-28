import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import useIsMobile from "@/hooks/useIsMobile";

const RedeemModal = ({ open, coupon, redeeming, onCancel, onConfirm }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(next) => (!next ? onCancel() : null)}>
        <DrawerContent className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] rounded-t-2xl border-border bg-background">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle className="text-lg font-bold">Confirm redemption</DrawerTitle>
            <DrawerDescription className="text-sm text-txt-secondary">
              {coupon ? (
                <>
                  Redeem <strong>{coupon.title}</strong> for <strong>{coupon.points_cost} points</strong>?
                </>
              ) : null}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="px-0 gap-2 pb-0">
            <Button variant="outline" className="min-h-10 rounded-xl font-bold border-border" onClick={onCancel}>
              Cancel
            </Button>
            <Button className="min-h-10 rounded-xl font-bold" disabled={redeeming === coupon?.id} onClick={onConfirm}>
              {redeeming === coupon?.id ? "Redeeming..." : "Confirm"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AnimatePresence>
      {open && coupon ? (
        <motion.div
          className="fixed inset-0 bg-surface-overlay/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md bg-background rounded-2xl border border-border p-6 shadow-2xl"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-xl font-bold mb-2">Confirm redemption</h3>
            <p className="text-txt-secondary text-sm mb-6">
              Redeem <strong className="text-foreground">{coupon.title}</strong> for <strong className="text-foreground">{coupon.points_cost} points</strong>?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 min-h-11 rounded-xl font-bold border-border" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                className="flex-1 min-h-11 rounded-xl font-bold"
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
