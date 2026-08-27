import { v4 as uuid } from "uuid";
import type { Account, BudgetCategory, Transaction } from "@/types/domain";

/** Fresh account — no mock money */
export const SEED_ACCOUNTS: Account[] = [];
export const SEED_TRANSACTIONS: Transaction[] = [];
export const SEED_BUDGET: BudgetCategory[] = [];

export interface BudgetSlice {
  accounts: Account[];
  transactions: Transaction[];
  budgetCategories: BudgetCategory[];
  addAccount: (account: Omit<Account, "id" | "updatedAt">) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "updatedAt">) => void;
  updateAccountBalance: (accountId: string, delta: number) => void;
  addBudgetCategory: (cat: Omit<BudgetCategory, "id" | "updatedAt">) => void;
}

export const createBudgetSlice = (
  set: (fn: (state: BudgetSlice) => Partial<BudgetSlice>) => void,
): BudgetSlice => ({
  accounts: SEED_ACCOUNTS,
  transactions: SEED_TRANSACTIONS,
  budgetCategories: SEED_BUDGET,

  addAccount: (account) =>
    set((state) => ({
      accounts: [
        ...state.accounts,
        { ...account, id: uuid(), updatedAt: new Date().toISOString() },
      ],
    })),

  addTransaction: (tx) =>
    set((state) => {
      const newTx: Transaction = {
        ...tx,
        id: uuid(),
        updatedAt: new Date().toISOString(),
      };
      const accounts = state.accounts.map((a) =>
        a.id === tx.accountId
          ? {
              ...a,
              balance:
                tx.type === "expense"
                  ? a.balance - tx.amount
                  : a.balance + tx.amount,
              updatedAt: new Date().toISOString(),
            }
          : a,
      );
      const budgetCategories = state.budgetCategories.map((c) =>
        c.name === tx.category && tx.type === "expense"
          ? {
              ...c,
              spent: c.spent + tx.amount,
              updatedAt: new Date().toISOString(),
            }
          : c,
      );
      return {
        transactions: [newTx, ...state.transactions],
        accounts,
        budgetCategories,
      };
    }),

  updateAccountBalance: (accountId, delta) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === accountId
          ? {
              ...a,
              balance: a.balance + delta,
              updatedAt: new Date().toISOString(),
            }
          : a,
      ),
    })),

  addBudgetCategory: (cat) =>
    set((state) => ({
      budgetCategories: [
        ...state.budgetCategories,
        { ...cat, id: uuid(), updatedAt: new Date().toISOString() },
      ],
    })),
});
