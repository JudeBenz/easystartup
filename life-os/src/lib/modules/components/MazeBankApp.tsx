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

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    addTransaction({
      accountId: accounts[0]?.id ?? "",
      amount: num,
      category,
      note,
      date: new Date().toISOString().slice(0, 10),
      type,
    });
    setAmount("");
    setNote("");
  }

  return (
    <div className="flex h-full flex-col bg-[#f0f4f0] text-sm text-gray-900">
      <header className="border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 to-emerald-700 px-4 py-2 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-wide">MAZE BANK</h2>
            <p className="text-xs text-emerald-200">Online Banking</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-200">Total Balance</p>
            <p className="text-xl font-bold">{fmt(totalBalance)}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-44 shrink-0 border-r border-gray-300 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Accounts
          </p>
          {accounts.map((a) => (
            <div key={a.id} className="mb-2 rounded border border-gray-200 p-2">
              <p className="text-xs text-gray-500">{a.name}</p>
              <p className="font-semibold" style={{ color: a.color }}>
                {fmt(a.balance)}
              </p>
            </div>
          ))}
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <section className="border-b border-gray-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              This Month&apos;s Budget
            </p>
            <div className="grid grid-cols-2 gap-2">
              {budgetCategories.map((c) => {
                const pct = Math.min(100, (c.spent / c.limit) * 100);
                const over = c.spent > c.limit;
                return (
                  <div key={c.id} className="rounded border border-gray-200 p-2">
                    <div className="flex justify-between text-xs">
                      <span>{c.name}</span>
                      <span className={over ? "text-red-600" : "text-gray-500"}>
                        {fmt(c.spent)} / {fmt(c.limit)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full transition-all"
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

          <section className="flex flex-1 flex-col overflow-hidden p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Recent Transactions
              </p>
            </div>
            <div className="flex-1 overflow-y-auto rounded border border-gray-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 font-medium">Date</th>
                    <th className="px-2 py-1.5 font-medium">Category</th>
                    <th className="px-2 py-1.5 font-medium">Note</th>
                    <th className="px-2 py-1.5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 text-gray-500">{t.date}</td>
                      <td className="px-2 py-1.5">{t.category}</td>
                      <td className="px-2 py-1.5 text-gray-600">{t.note}</td>
                      <td
                        className={`px-2 py-1.5 text-right font-medium ${
                          t.type === "income" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {fmt(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form
              onSubmit={handleAdd}
              className="mt-2 flex flex-wrap items-end gap-2 rounded border border-gray-200 bg-white p-2"
            >
              <label className="flex flex-col gap-0.5 text-xs">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "income" | "expense")}
                  className="rounded border border-gray-300 px-2 py-1"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>
              <label className="flex flex-col gap-0.5 text-xs">
                Amount
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                  placeholder="0.00"
                />
              </label>
              <label className="flex flex-col gap-0.5 text-xs">
                Category
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-28 rounded border border-gray-300 px-2 py-1"
                />
              </label>
              <label className="flex flex-1 flex-col gap-0.5 text-xs">
                Note
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1"
                  placeholder="Description"
                />
              </label>
              <button
                type="submit"
                className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
              >
                Add
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
