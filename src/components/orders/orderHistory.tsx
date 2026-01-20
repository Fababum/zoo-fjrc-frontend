import { useContext, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { getOrders } from "@/api/orders";
import type { Order } from "@/api/orders";
import { TranslationsContext } from "../TranslationsContext";

export default function OrderHistory() {
  const auth = useAuth();
  const context = useContext(TranslationsContext);
  if (!context) return null;

  const { translations, lang } = context;
  const t = translations.orderHistory;
  const langKey = lang as keyof typeof t.title;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      if (!auth.token) return;
      const storageKey = `zoo.orders.${auth.user?.id ?? "guest"}`;

      try {
        const data = await getOrders(auth.token);
        setOrders(data);
        setError("");
      } catch {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? (JSON.parse(raw) as Order[]) : [];
        setOrders(parsed);
        setError(parsed.length ? "" : t.errorNoOrders[langKey]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [auth.token, auth.user?.id]);

  if (loading) {
    return (
      <div
        className="min-h-screen px-4 py-12 flex items-center justify-center"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255, 248, 235, 0.92), rgba(255, 255, 255, 0.92)), url('/ElephantSquare.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-slate-700">{t.loading[langKey]}</div>
      </div>
    );
  }

  const localeMap: Record<typeof langKey, string> = {
    de: "de-CH",
    en: "en-US",
    it: "it-IT",
    fr: "fr-FR",
  };
  const currency = translations.common.currency[langKey] ?? "CHF";
  const formatter = new Intl.NumberFormat(localeMap[langKey], {
    style: "currency",
    currency,
  });
  const formatMoney = (value: number) => formatter.format(value);

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(255, 248, 235, 0.92), rgba(255, 255, 255, 0.92)), url('/ElephantSquare.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-xs tracking-[0.3em] uppercase text-amber-800 font-semibold">
            {translations.common.brand[langKey]}
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 mt-2">
            {t.title[langKey]}
          </h1>
          <p className="text-base text-slate-600 mt-2">
            {t.subtitle[langKey]}
          </p>
          {error ? (
            <p className="text-sm text-rose-600 mt-3">{error}</p>
          ) : null}
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-amber-100/70 rounded-2xl bg-white/90 shadow-lg p-6"
            >
              <div className="flex items-center justify-between text-sm text-slate-600">
                <div>
                  {t.orderLabel[langKey]} #{order.id}
                </div>
                <div>{new Date(order.createdAt).toLocaleDateString(localeMap[langKey])}</div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {order.items.map((item) => (
                  <div key={item.title} className="flex justify-between">
                    <span>
                      {item.qty}x {item.title}
                    </span>
                    <span>{formatMoney(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between font-semibold text-slate-900">
                <span>{t.totalLabel[langKey]}</span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </div>
          ))}

          {!orders.length && !error ? (
            <div className="text-center text-slate-600">
              {t.emptyState[langKey]}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
