import { v4 as uuid } from "uuid";
import type { Account, BudgetCategory, Transaction } from "@/types/domain";

export const SEED_ACCOUNTS: Account[] = [
  {
    id: "acc-checking",
    name: "Checking",
    type: "checking",
    balance: 4820.5,
    color: "#2ecc71",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "acc-savings",
    name: "Savings",
    type: "savings",
    balance: 12500,
    color: "#3498db",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "acc-cash",
    name: "Cash",
    type: "cash",
    balance: 340,
    color: "#f39c12",
    updatedAt: new Date().toISOString(),
  },
];

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: uuid(),
    accountId: "acc-checking",
    amount: 3200,
    category: "Salary",
    note: "Paycheck",
    date: new Date().toISOString().slice(0, 10),
    type: "income",
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    accountId: "acc-checking",
    amount: 89.5,
    category: "Groceries",
    note: "Weekly shop",
    date: new Date().toISOString().slice(0, 10),
    type: "expense",
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    accountId: "acc-checking",
    amount: 45,
    category: "Transport",
    note: "Gas",
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    type: "expense",
    updatedAt: new Date().toISOString(),
  },
];

const month = new Date().toISOString().slice(0, 7);

export const SEED_BUDGET: BudgetCategory[] = [
  {
    id: uuid(),
    name: "Rent",
    limit: 1500,
    spent: 1500,
    month,
    color: "#e74c3c",
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    name: "Food",
    limit: 600,
    spent: 312,
    month,
    color: "#2ecc71",
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    name: "Entertainment",
    limit: 200,
    spent: 87,
    month,
    color: "#9b59b6",
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    name: "Transport",
    limit: 300,
    spent: 145,
    month,
    color: "#3498db",
    updatedAt: new Date().toISOString(),
  },
];

export interface BudgetSlice {
  accounts: Account[];
  transactions: Transaction[];
  budgetCategories: BudgetCategory[];
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
          ? { ...c, spent: c.spent + tx.amount, updatedAt: new Date().toISOString() }
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
          ? { ...a, balance: a.balance + delta, updatedAt: new Date().toISOString() }
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
