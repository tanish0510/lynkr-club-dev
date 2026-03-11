import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import useIsMobile from '@/hooks/useIsMobile';

const emptyForm = {
  partner_id: '',
  order_id: '',
  transaction_id: '',
  amount: '',
};

const RaisePurchaseModal = ({ open, onOpenChange, partners, onSuccess, purchaseToEdit }) => {
  const isMobile = useIsMobile();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(purchaseToEdit?.id);
  const normalizedPartners = useMemo(() => {
    return (partners || [])
      .map((p) => ({
        id: p.id || p.partner_id || '',
        name: p.business_name || p.businessName || p.name || 'Partner',
        status: String(p.status || '').toUpperCase(),
      }))
      .filter((p) => p.id);
  }, [partners]);

  const eligiblePartners = useMemo(() => {
    const source = normalizedPartners;
    return [...source].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [normalizedPartners]);

  useEffect(() => {
    if (open && purchaseToEdit) {
      setForm({
        partner_id: purchaseToEdit.partnerId || '',
        order_id: purchaseToEdit.orderId || '',
        transaction_id: purchaseToEdit.transactionId || '',
        amount: String(purchaseToEdit.amount ?? ''),
      });
      setErrors({});
      return;
    }
    if (open) {
      setForm(emptyForm);
      setErrors({});
    }
  }, [open, purchaseToEdit]);

  const isValid = useMemo(() => {
    return (
      form.partner_id &&
      form.order_id.trim() &&
      form.transaction_id.trim() &&
      Number(form.amount) > 0
    );
  }, [form]);

  const validate = () => {
    const next = {};
    if (!form.partner_id) next.partner_id = 'Please select a partner';
    if (!form.order_id.trim()) next.order_id = 'Order ID is required';
    if (!form.transaction_id.trim()) next.transaction_id = 'Transaction ID is required';
    if (!(Number(form.amount) > 0)) next.amount = 'Enter amount greater than 0';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        partner_id: form.partner_id,
        order_id: form.order_id.trim(),
        transaction_id: form.transaction_id.trim(),
        amount: Number(form.amount),
      };
      if (isEdit) {
        await api.patch(`/user/raised-purchases/${purchaseToEdit.id}`, payload);
        toast.success('Purchase updated');
      } else {
        await api.post('/user/raise-purchase', payload);
        toast.success('Purchase submitted');
      }
      onOpenChange(false);
      await onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not submit purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={submit} className="space-y-4 text-[#E5E7EB]">
      <div>
        <Label className="mb-2 block text-[#D1D5DB]">Partner</Label>
        <Select value={form.partner_id} onValueChange={(value) => setForm({ ...form, partner_id: value })}>
          <SelectTrigger className="h-12 rounded-xl border-white/10 bg-[#1A1F2B] text-[#B8C0CC] data-[placeholder]:text-[#7B8498]">
            <SelectValue placeholder="Select registered partner" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-white/10 bg-[#111622] text-[#B8C0CC]">
            {eligiblePartners.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-[#B8C0CC] focus:bg-white/10 focus:text-[#E5E7EB]">
                {p.name}
                {p.status ? ` (${String(p.status).toUpperCase()})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isEdit && eligiblePartners.length === 0 ? (
          <p className="text-xs text-muted-foreground mt-1">No registered partners available right now.</p>
        ) : null}
        {errors.partner_id ? <p className="text-xs text-red-400 mt-1">{errors.partner_id}</p> : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block text-[#D1D5DB]">Order ID</Label>
          <Input
            value={form.order_id}
            onChange={(e) => setForm({ ...form, order_id: e.target.value })}
            className="h-12 rounded-xl border-white/10 bg-[#1A1F2B] text-[#E5E7EB] placeholder:text-[#7B8498]"
            placeholder="ORD-1234"
          />
          {errors.order_id ? <p className="text-xs text-red-400 mt-1">{errors.order_id}</p> : null}
        </div>
        <div>
          <Label className="mb-2 block text-[#D1D5DB]">Transaction ID</Label>
          <Input
            value={form.transaction_id}
            onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
            className="h-12 rounded-xl border-white/10 bg-[#1A1F2B] text-[#E5E7EB] placeholder:text-[#7B8498]"
            placeholder="TXN-5678"
          />
          {errors.transaction_id ? <p className="text-xs text-red-400 mt-1">{errors.transaction_id}</p> : null}
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-[#D1D5DB]">Amount</Label>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="h-12 rounded-xl border-white/10 bg-[#1A1F2B] text-[#E5E7EB] placeholder:text-[#7B8498]"
          placeholder="999.00"
        />
        {errors.amount ? <p className="text-xs text-red-400 mt-1">{errors.amount}</p> : null}
      </div>

      {isMobile ? (
        <DrawerFooter className="px-0 pb-0">
          <Button type="submit" className="min-h-11 rounded-full" disabled={submitting || !isValid}>
            {submitting ? 'Submitting...' : isEdit ? 'Save Changes' : 'Submit Purchase'}
          </Button>
        </DrawerFooter>
      ) : (
        <DialogFooter>
          <Button type="submit" className="min-h-11 rounded-full" disabled={submitting || !isValid}>
            {submitting ? 'Submitting...' : isEdit ? 'Save Changes' : 'Submit Purchase'}
          </Button>
        </DialogFooter>
      )}
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="border-white/10 bg-[#0F131D] text-[#E5E7EB] backdrop-blur-xl px-4 pb-6">
          <DrawerHeader>
            <DrawerTitle className="text-[#F1F5F9]">{isEdit ? 'Edit Pending Purchase' : 'Raise Purchase'}</DrawerTitle>
            <DrawerDescription className="text-[#9CA3AF]">
              {isEdit
                ? 'You can edit a pending manual purchase once before verification.'
                : 'Submit your purchase for partner verification.'}
            </DrawerDescription>
          </DrawerHeader>
          {formContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-3xl border-white/10 bg-[#0F131D] text-[#E5E7EB] backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-[#F1F5F9]">{isEdit ? 'Edit Pending Purchase' : 'Raise Purchase'}</DialogTitle>
          <DialogDescription className="text-[#9CA3AF]">
            {isEdit
              ? 'You can edit a pending manual purchase once before verification.'
              : 'Submit your purchase for partner verification.'}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default RaisePurchaseModal;
