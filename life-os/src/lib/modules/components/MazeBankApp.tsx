"use client";

import { useState } from "react";
import { useLifeStore } from "@/lib/store";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function MazeBankApp() {
  const accounts = useLifeStore((s) => s.accounts);
  const transactions = useLifeStore((s) => s.transactions);
  const budgetCategories = useLifeStore((s) => s.budgetCategories);
  const addTransaction = useLifeStore((s) => s.addTransaction);
  const addAccount = useLifeStore((s) => s.addAccount);
  const addBudgetCategory = useLifeStore((s) => s.addBudgetCategory);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [newAccountName, setNewAccountName] = useState("Checking");

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const empty = accounts.length === 0;

  function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    const name = newAccountName.trim() || "Checking";
    addAccount({
      name,
      type: "checking",
      balance: 0,
      color: "#2ecc71",
    });
    setNewAccountName("");
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0 || !accounts[0]) return;
    const cat = category.trim() || "General";
    addTransaction({
      accountId: accounts[0].id,
      amount: num,
      category: cat,
      note: note.trim() || cat,
      date: new Date().toISOString().slice(0, 10),
      type,
    });
    if (
      type === "expense" &&
      !budgetCategories.some((c) => c.name.toLowerCase() === cat.toLowerCase())
    ) {
      addBudgetCategory({
        name: cat,
        limit: 500,
        spent: num,
        month: new Date().toISOString().slice(0, 7),
        color: "#3498db",
      });
    }
    setAmount("");
    setNote("");
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f0f4f0] text-sm text-gray-900">
      <header className="shrink-0 border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 to-emerald-700 px-4 py-3 text-white">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-wide">MAZE BANK</h2>
            <p className="text-xs text-emerald-200">Online Banking</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-200">Balance</p>
            <p className="text-xl font-bold tabular-nums">{fmt(totalBalance)}</p>
          </div>
        </div>
      </header>

      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-3xl">🏦</p>
          <div>
            <p className="font-semibold">Welcome to Maze Bank</p>
            <p className="mt-1 text-xs text-gray-500">
              Your accounts are empty. Create one to start tracking.
            </p>
          </div>
          <form onSubmit={handleAddAccount} className="flex w-full max-w-xs gap-2">
            <input
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              placeholder="Account name"
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className="rounded bg-emerald-700 px-3 py-2 text-xs font-medium text-white"
            >
              Create
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 p-3 pb-6 md:flex-row">
          <aside className="shrink-0 md:w-40">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Accounts
            </p>
            <div className="flex gap-2 overflow-x-auto md:flex-col">
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="min-w-[7.5rem] rounded border border-gray-200 bg-white p-2 md:min-w-0"
                >
                  <p className="text-[10px] text-gray-500">{a.name}</p>
                  <p className="font-semibold tabular-nums" style={{ color: a.color }}>
                    {fmt(a.balance)}
                  </p>
                </div>
              ))}
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col gap-3">
            {budgetCategories.length > 0 && (
              <section className="rounded border border-gray-200 bg-white p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Budget
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {budgetCategories.map((c) => {
                    const pct = Math.min(100, (c.spent / Math.max(c.limit, 1)) * 100);
                    const over = c.spent > c.limit;
                    return (
                      <div key={c.id}>
                        <div className="flex justify-between text-xs">
                          <span>{c.name}</span>
                          <span className={over ? "text-red-600" : "text-gray-500"}>
                            {fmt(c.spent)} / {fmt(c.limit)}
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: over ? "#e74c3c" : c.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="flex min-h-0 flex-1 flex-col rounded border border-gray-200 bg-white">
              <p className="border-b border-gray-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Transactions
              </p>
              {transactions.length === 0 ? (
                <p className="p-4 text-center text-xs text-gray-400">
                  No transactions yet
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{t.category}</p>
                        <p className="truncate text-[10px] text-gray-400">
                          {t.date}
                          {t.note ? ` · ${t.note}` : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 tabular-nums font-medium ${
                          t.type === "income" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {fmt(t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <form
              onSubmit={handleAdd}
              className="grid grid-cols-2 gap-2 rounded border border-gray-200 bg-white p-3 sm:grid-cols-5"
            >
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "income" | "expense")}
                className="rounded border border-gray-300 px-2 py-2 text-xs"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded border border-gray-300 px-2 py-2 text-xs"
                placeholder="Amount"
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded border border-gray-300 px-2 py-2 text-xs"
                placeholder="Category"
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="rounded border border-gray-300 px-2 py-2 text-xs"
                placeholder="Note"
              />
              <button
                type="submit"
                className="col-span-2 rounded bg-emerald-700 py-2 text-xs font-medium text-white sm:col-span-1"
              >
                Add
              </button>
            </form>
          </main>
        </div>
      )}
    </div>
  );
}
