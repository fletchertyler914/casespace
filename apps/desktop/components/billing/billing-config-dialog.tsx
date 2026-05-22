"use client";

import { useEffect, useState } from "react";
import type { CaseBillingConfig } from "@repo/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { commandClient } from "@/lib/command-client";

interface BillingConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  onSaved?: () => void;
}

export function BillingConfigDialog({
  open,
  onOpenChange,
  caseId,
  onSaved,
}: BillingConfigDialogProps) {
  const [billingType, setBillingType] = useState("pay_rate");
  const [payRate, setPayRate] = useState("150");
  const [fixedPrice, setFixedPrice] = useState("");
  const [rateUnit, setRateUnit] = useState("hourly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const res = await commandClient.getCaseBillingConfig(caseId);
      if (res.ok && res.data) {
        applyConfig(res.data);
      }
      setError(null);
    })();
  }, [open, caseId]);

  function applyConfig(config: CaseBillingConfig) {
    setBillingType(config.billingType);
    setPayRate(String(config.payRate));
    setFixedPrice(config.fixedPrice != null ? String(config.fixedPrice) : "");
    setRateUnit(config.rateUnit);
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    const res = await commandClient.setCaseBillingConfig(caseId, {
      billingType,
      payRate: Number.parseFloat(payRate) || 150,
      fixedPrice:
        billingType === "fixed_price" && fixedPrice
          ? Number.parseFloat(fixedPrice)
          : undefined,
      rateUnit,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error?.message ?? "Failed to save billing config");
      return;
    }
    onSaved?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Billing configuration</DialogTitle>
          <DialogDescription>
            Set pay rate or fixed price for this case.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Billing type</Label>
            <Select value={billingType} onValueChange={setBillingType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pay_rate">Pay rate</SelectItem>
                <SelectItem value="fixed_price">Fixed price</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {billingType === "pay_rate" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="pay-rate">Pay rate ($)</Label>
                <Input
                  id="pay-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={payRate}
                  onChange={(e) => setPayRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Rate unit</Label>
                <Select value={rateUnit} onValueChange={setRateUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="fixed-price">Fixed price ($)</Label>
              <Input
                id="fixed-price"
                type="number"
                min="0"
                step="0.01"
                value={fixedPrice}
                onChange={(e) => setFixedPrice(e.target.value)}
              />
            </div>
          )}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={() => void handleSave()}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
