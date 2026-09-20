"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { DatePickerField } from "@/components/molecules/DatePickerField";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/types/expense";
import { applyTextRules, isFutureDate } from "@/lib/validation";

export interface ExpenseFormValues {
  category: ExpenseCategory;
  description: string;
  amount: number;
  spentOn: string;
}

export interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => void;
}

export function ExpenseForm({ open, onClose, onSubmit }: ExpenseFormProps) {
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [spentOn, setSpentOn] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setCategory("");
    setDescription("");
    setAmount("");
    setSpentOn("");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!category) nextErrors.category = "Select a category.";
    if (!description.trim()) nextErrors.description = "Add a short description.";
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) nextErrors.amount = "Enter a valid amount.";
    if (!spentOn) nextErrors.spentOn = "Select the date spent.";

    applyTextRules(nextErrors, { description: [description, "Description", { min: 3, max: 200 }] });
    if (amountNum > 10_000_000 && !nextErrors.amount) nextErrors.amount = "Amount looks too large — check the value.";
    if (spentOn && isFutureDate(spentOn)) nextErrors.spentOn = "The date spent can't be in the future.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({ category: category as ExpenseCategory, description: description.trim(), amount: amountNum, spentOn });
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Log an Expense"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit for Approval</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Category" htmlFor="expense-category" error={errors.category} required>
            <FilterDropdown
              label="Select Category"
              options={EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c }))}
              value={category}
              onChange={(v) => setCategory(v as ExpenseCategory)}
            />
          </FormField>
          <DatePickerField label="Date Spent" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} error={errors.spentOn} />
        </div>
        <FormField label="Amount (₹)" htmlFor="expense-amount" error={errors.amount} required>
          <Input id="expense-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} invalid={Boolean(errors.amount)} />
        </FormField>
        <FormField label="Description" htmlFor="expense-description" error={errors.description} required>
          <Textarea id="expense-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} invalid={Boolean(errors.description)} />
        </FormField>
      </div>
    </Modal>
  );
}
