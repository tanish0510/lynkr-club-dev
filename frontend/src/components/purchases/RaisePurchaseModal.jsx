import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const emptyForm = {
  partner_id: '',
  order_id: '',
  transaction_id: '',
  amount: '',
};

const RaisePurchaseModal = ({ open, onOpenChange, partners, onSuccess, purchaseToEdit }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(purchaseToEdit?.id);
  const eligiblePartners = isEdit ? partners : partners.filter((p) => p.status === 'ACTIVE');

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Pending Purchase' : 'Raise Purchase'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'You can edit a pending manual purchase once before verification.'
              : 'Submit your purchase for partner verification.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="mb-2 block">Partner</Label>
            <select
              value={form.partner_id}
              onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
              className="w-full bg-secondary/50 border border-white/10 rounded-xl h-12 px-4 text-foreground"
            >
              <option value="">Select Partner</option>
              {eligiblePartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.business_name} {p.status ? `(${p.status})` : ''}
                </option>
              ))}
            </select>
            {!isEdit && eligiblePartners.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">No ACTIVE partners available right now.</p>
            ) : null}
            {errors.partner_id ? <p className="text-xs text-red-400 mt-1">{errors.partner_id}</p> : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Order ID</Label>
              <Input
                value={form.order_id}
                onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                className="h-12 rounded-xl"
                placeholder="ORD-1234"
              />
              {errors.order_id ? <p className="text-xs text-red-400 mt-1">{errors.order_id}</p> : null}
            </div>
            <div>
              <Label className="mb-2 block">Transaction ID</Label>
              <Input
                value={form.transaction_id}
                onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                className="h-12 rounded-xl"
                placeholder="TXN-5678"
              />
              {errors.transaction_id ? <p className="text-xs text-red-400 mt-1">{errors.transaction_id}</p> : null}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Amount</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="h-12 rounded-xl"
              placeholder="999.00"
            />
            {errors.amount ? <p className="text-xs text-red-400 mt-1">{errors.amount}</p> : null}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="rounded-full"
              disabled={submitting || !isValid}
            >
              {submitting ? 'Submitting...' : isEdit ? 'Save Changes' : 'Submit Purchase'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RaisePurchaseModal;
