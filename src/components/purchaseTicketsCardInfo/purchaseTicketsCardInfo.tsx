import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, Lock, Trash2, Edit2, X } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { createOrder } from "@/api/orders";
import type { Order } from "@/api/orders";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
} from "@/api/paymentMethods";
import type { PaymentMethod } from "@/api/paymentMethods";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { TranslationsContext } from "../TranslationsContext";

type TicketId = "adult" | "youth" | "child";
type RawCartItem = { id?: TicketId | string; title?: string; price: number; qty: number };
type CartItem = { id: TicketId; price: number; qty: number };
type SavedCard = PaymentMethod;

type CardErrors = {
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
};

function PurchaseTicketsCardInfo() {
  const location = useLocation();
  const context = useContext(TranslationsContext);
  if (!context) return null;

  const { translations, lang } = context;
  const t = translations.purchaseTicketsCardInfo;
  const langKey = lang as keyof typeof t.title;

  const rawCart: RawCartItem[] = Array.isArray((location.state as any)?.cart)
    ? ((location.state as any).cart as RawCartItem[])
    : [];
  const rawTotal: number = (location.state && (location.state as any).total) || 0;
  const ticketTranslations = translations.purchaseTickets.tickets;

  const ticketTitleLookup = useMemo(() => {
    const lookup: Record<string, TicketId> = {};
    (Object.keys(ticketTranslations) as TicketId[]).forEach((id) => {
      (["de", "en", "fr", "it"] as const).forEach((key) => {
        lookup[ticketTranslations[id].title[key].toLowerCase()] = id;
      });
    });
    return lookup;
  }, [ticketTranslations]);

  const cart: CartItem[] = useMemo(
    () =>
      rawCart.flatMap((item) => {
        const id =
          typeof item?.id === "string"
            ? (item.id as TicketId)
            : typeof item?.title === "string"
            ? ticketTitleLookup[item.title.toLowerCase()]
            : undefined;
        if (!id || !(id in ticketTranslations)) return [];
        const qty = typeof item?.qty === "number" ? item.qty : 1;
        const price = typeof item?.price === "number" ? item.price : 0;
        return [{ id, qty, price }];
      }),
    [rawCart, ticketTitleLookup, ticketTranslations]
  );

  const derivedTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = typeof rawTotal === "number" && rawTotal > 0 ? rawTotal : derivedTotal;
  const orderItems = useMemo(
    () =>
      cart.map((item) => ({
        title: ticketTranslations[item.id].title[langKey],
        price: item.price,
        qty: item.qty,
      })),
    [cart, langKey, ticketTranslations]
  );

  const localeMap: Record<typeof langKey, string> = {
    de: "de-CH",
    en: "en-US",
    it: "it-IT",
    fr: "fr-FR",
  };
  const currency = translations.common.currency[langKey] ?? "CHF";
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(localeMap[langKey], {
        style: "currency",
        currency,
      }),
    [currency, langKey]
  );
  const formatMoney = (value: number) => formatter.format(value);
  const fields = t.fields;

  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("new");
  const [showAuthNotice, setShowAuthNotice] = useState(false);

  const [cardType, setCardType] = useState("visa");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardErrors, setCardErrors] = useState<CardErrors>({});

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [addressExtra, setAddressExtra] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("CH");
  const [phone, setPhone] = useState("");

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState<SavedCard | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();
  const { toasts, pushToast, dismissToast } = useToast();

  useEffect(() => {
    const loadCards = async () => {
      if (!auth.token) {
        setSavedCards([]);
        setShowAuthNotice(true);
        return;
      }
      try {
        const data = await getPaymentMethods(auth.token);
        setSavedCards(data);
        setShowAuthNotice(false);
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          setSavedCards([]);
          setShowAuthNotice(true);
          return;
        }
        console.error(err);
      }
    };

    loadCards();
  }, [auth.token]);

  useEffect(() => {
  if (selectedCardId !== "new") {
    const card = savedCards.find(c => String(c.id) === selectedCardId);
    if (card) {
      setFirstName(card.firstName);
      setLastName(card.lastName);
      setStreet(card.street);
      setHouseNumber(card.houseNumber);
      setAddressExtra(card.addressExtra);
      setPostalCode(card.postalCode);
      setCity(card.city);
      setCountry(card.country);
      setPhone(card.phone);
    }
  } else {
    // RESET bei neuer Karte
    setFirstName("");
    setLastName("");
    setStreet("");
    setHouseNumber("");
    setAddressExtra("");
    setPostalCode("");
    setCity("");
    setCountry("CH");
    setPhone("");

    setCardNumber("");
    setExpiry("");
    setCvv("");
    setCardType("visa");
    setCardErrors({});
  }
  }, [selectedCardId, savedCards]);

  const ordersStorageKey = `zoo.orders.${auth.user?.id ?? "guest"}`;

  const persistOrder = async () => {
    if (!cart.length || !auth.token) return;

    const fallbackOrder: Order = {
      id: Date.now(),
      userId: auth.user?.id ?? 0,
      items: orderItems,
      total,
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await createOrder(
        { items: orderItems, total },
        auth.token
      );
      const raw = localStorage.getItem(ordersStorageKey);
      const parsed = raw ? (JSON.parse(raw) as Order[]) : [];
      localStorage.setItem(
        ordersStorageKey,
        JSON.stringify([created, ...parsed])
      );
    } catch {
      const raw = localStorage.getItem(ordersStorageKey);
      const parsed = raw ? (JSON.parse(raw) as Order[]) : [];
      localStorage.setItem(
        ordersStorageKey,
        JSON.stringify([fallbackOrder, ...parsed])
      );
    }
  };

  const resolveOrdersPath = () => {
    const segment = window.location.pathname.split("/")[1];
    const isLang = ["de", "en", "fr", "it"].includes(segment);
    return isLang ? `/${segment}/orders` : "/orders";
  };

  const resolveSignInPath = () => {
    const segment = window.location.pathname.split("/")[1];
    const isLang = ["de", "en", "fr", "it"].includes(segment);
    return isLang ? `/${segment}/signIn` : "/signIn";
  };

  const handleOrderSuccess = () => {
    pushToast(t.toastOrderSuccess[langKey], "success");
    window.setTimeout(() => {
      navigate(resolveOrdersPath());
    }, 600);
  };

  const isLuhnValid = (value: string) => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = value.length - 1; i >= 0; i -= 1) {
      let digit = Number(value[i]);
      if (Number.isNaN(digit)) return false;
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const validateCardFields = (
    values: { cardNumber: string; expiry: string; cvv: string },
    requireAll: boolean
  ): CardErrors => {
    const errors: CardErrors = {};
    const cleanedNumber = values.cardNumber.replace(/\s+/g, "");

    if (requireAll || cleanedNumber) {
      if (!cleanedNumber) {
        errors.cardNumber = t.validation.cardNumberRequired[langKey];
      } else if (!/^\d{13,19}$/.test(cleanedNumber) || !isLuhnValid(cleanedNumber)) {
        errors.cardNumber = t.validation.cardNumberInvalid[langKey];
      }
    }

    if (requireAll || values.expiry) {
      if (!values.expiry) {
        errors.expiry = t.validation.expiryRequired[langKey];
      } else {
        const [expYear, expMonth] = values.expiry.split("-").map((value) => Number(value));
        if (!expYear || !expMonth || expMonth < 1 || expMonth > 12) {
          errors.expiry = t.validation.expiryInvalid[langKey];
        } else {
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;
          if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
            errors.expiry = t.validation.cardExpired[langKey];
          }
        }
      }
    }

    if (requireAll || values.cvv) {
      if (!values.cvv) {
        errors.cvv = t.validation.cvvRequired[langKey];
      } else if (!/^\d{3,4}$/.test(values.cvv)) {
        errors.cvv = t.validation.cvvInvalid[langKey];
      }
    }

    return errors;
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D+/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardNumber(formatted);
    if (selectedCardId === "new") {
      const nextErrors = validateCardFields({ cardNumber: formatted, expiry, cvv }, false);
      setCardErrors((prev) => ({ ...prev, cardNumber: nextErrors.cardNumber }));
    }
  };

  const handleExpiryChange = (value: string) => {
    setExpiry(value);
    if (selectedCardId === "new") {
      const nextErrors = validateCardFields({ cardNumber, expiry: value, cvv }, false);
      setCardErrors((prev) => ({ ...prev, expiry: nextErrors.expiry }));
    }
  };

  const handleCvvChange = (value: string) => {
    const digits = value.replace(/\D+/g, "").slice(0, 4);
    setCvv(digits);
    if (selectedCardId === "new") {
      const nextErrors = validateCardFields({ cardNumber, expiry, cvv: digits }, false);
      setCardErrors((prev) => ({ ...prev, cvv: nextErrors.cvv }));
    }
  };

  const handlePay = () => {
    if (!firstName || !lastName || !street || !houseNumber || !postalCode || !city) {
      return alert(t.validation.requiredFields[langKey]);
    }

    if (selectedCardId === "new") {
      const errors = validateCardFields({ cardNumber, expiry, cvv }, true);
      setCardErrors(errors);
      if (Object.keys(errors).length > 0) {
        return;
      }
    }

    console.log("Zahlung wird verarbeitet...");

    if (selectedCardId === "new" && cardNumber && expiry && cvv) {
      setShowSaveModal(true);
    } else {
      void persistOrder();
      handleOrderSuccess();
    }
  };
  const handleSaveCard = async () => {
    if (!auth.token) return;

    const [expYear, expMonth] = expiry
      ? expiry.split("-").map((value) => Number(value))
      : [0, 0];

    try {
      const created = await createPaymentMethod(
        {
          cardType,
          last4: cardNumber.replace(/\s+/g, "").slice(-4),
          expMonth,
          expYear,
          firstName,
          lastName,
          street,
          houseNumber,
          addressExtra,
          postalCode,
          city,
          country,
          phone,
        },
        auth.token
      );
      setSavedCards((prev) => [created, ...prev]);
      setShowSaveModal(false);
      void persistOrder();
      handleOrderSuccess();
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        setShowAuthNotice(true);
        return;
      }
      console.error(err);
      alert(t.errorSaveCard[langKey]);
    }
  };

  const handleDeleteCard = async (id: number) => {
    if (confirm(t.confirmDeleteCard[langKey])) {
      if (!auth.token) return;
      try {
        await deletePaymentMethod(id, auth.token);
        const next = savedCards.filter((c) => c.id !== id);
        setSavedCards(next);
        if (String(id) === selectedCardId) {
          setSelectedCardId("new");
        }
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          setShowAuthNotice(true);
          return;
        }
        console.error(err);
        alert(t.errorDeleteCard[langKey]);
      }
    }
  };

  const handleEditCard = (card: SavedCard) => {
    setEditingCard({...card});
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;

    if (!auth.token) return;

    try {
      const updated = await updatePaymentMethod(
        editingCard.id,
        {
          cardType: editingCard.cardType,
          last4: editingCard.last4,
          expMonth: editingCard.expMonth,
          expYear: editingCard.expYear,
          firstName: editingCard.firstName,
          lastName: editingCard.lastName,
          street: editingCard.street,
          houseNumber: editingCard.houseNumber,
          addressExtra: editingCard.addressExtra,
          postalCode: editingCard.postalCode,
          city: editingCard.city,
          country: editingCard.country,
          phone: editingCard.phone,
        },
        auth.token
      );
      const next = savedCards.map((c) =>
        c.id === updated.id ? updated : c
      );
      setSavedCards(next);
      setShowEditModal(false);
      setEditingCard(null);
      alert(t.successSaveChanges[langKey]);

      if (String(updated.id) === selectedCardId) {
        setFirstName(updated.firstName);
        setLastName(updated.lastName);
        setStreet(updated.street);
        setHouseNumber(updated.houseNumber);
        setAddressExtra(updated.addressExtra);
        setPostalCode(updated.postalCode);
        setCity(updated.city);
        setPhone(updated.phone);
      }
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        setShowAuthNotice(true);
        return;
      }
      console.error(err);
      alert(t.errorSaveChanges[langKey]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 sm:p-10">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 sm:p-8">
            <div className="flex items-center gap-3 text-white">
              <Lock className="w-7 h-7" />
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t.title[langKey]}
              </h1>
            </div>
            <p className="text-gray-300 mt-2 text-sm sm:text-base">
              {t.subtitle[langKey]}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {cart.length > 0 && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-300">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t.orderSummary[langKey]}
                </h3>
                <div className="space-y-2">
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.qty}x {ticketTranslations[item.id].title[langKey]}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatMoney(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 pt-3 mt-3 flex justify-between font-bold text-lg">
                    <span>{t.totalLabel[langKey]}</span>
                    <span className="text-gray-800">{formatMoney(total)}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.paymentMethodLabel[langKey]}
              </label>
              {showAuthNotice && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <div className="font-semibold">{t.authNotice.title[langKey]}</div>
                  <p className="mt-1">
                    {t.authNotice.body[langKey]}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(resolveSignInPath())}
                    className="mt-3 inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 transition-all"
                  >
                    {t.authNotice.cta[langKey]}
                  </button>
                </div>
              )}
              <select 
                className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-base focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                value={selectedCardId} 
                onChange={e=>setSelectedCardId(e.target.value)}
              >
                <option value="new">{t.newCardOption[langKey]}</option>
                {savedCards.map(c=>(
                  <option key={c.id} value={c.id}>
                    {c.cardType.toUpperCase()} â€¢â€¢â€¢â€¢ {c.last4} ({c.firstName} {c.lastName})
                  </option>
                ))}
              </select>
            </div>

            {savedCards.length > 0 && selectedCardId !== "new" && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  {t.savedCardsTitle[langKey]}
                </h3>
                {savedCards.map(card => (
                  <div key={card.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {card.cardType.toUpperCase()} â€¢â€¢â€¢â€¢ {card.last4}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t.cardValidUntil[langKey].replace(
                        "{date}",
                        `${String(card.expMonth).padStart(2, "0")}/${card.expYear}`
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {card.firstName} {card.lastName}
                    </div>
                      <div className="text-xs text-gray-500">
                        {card.street} {card.houseNumber}, {card.postalCode} {card.city}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCard(card)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all"
                        title={t.editTitle[langKey]}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                        title={t.deleteTitle[langKey]}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedCardId === "new" && (
              <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-700" />
                  {t.newCardTitle[langKey]}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.cardTypeLabel[langKey]}
                    </label>
                    <select 
                      className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                      value={cardType} 
                      onChange={e=>setCardType(e.target.value)}
                    >
                      <option value="visa">{t.cardTypeOptions.visa[langKey]}</option>
                      <option value="mastercard">{t.cardTypeOptions.mastercard[langKey]}</option>
                      <option value="amex">{t.cardTypeOptions.amex[langKey]}</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.cardNumberLabel[langKey]}
                    </label>
                    <input 
                      className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                      placeholder={t.cardNumberPlaceholder[langKey]} 
                      value={cardNumber} 
                      onChange={e=>handleCardNumberChange(e.target.value)}
                      maxLength={23}
                      inputMode="numeric"
                      autoComplete="cc-number"
                    />
                    {cardErrors.cardNumber && (
                      <p className="text-xs text-red-600 mt-1">{cardErrors.cardNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.expiryLabel[langKey]}
                    </label>
                    <input 
                      type="month"
                      className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                      value={expiry} 
                      onChange={e=>handleExpiryChange(e.target.value)}
                      autoComplete="cc-exp"
                    />
                    {cardErrors.expiry && (
                      <p className="text-xs text-red-600 mt-1">{cardErrors.expiry}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.cvvLabel[langKey]}
                    </label>
                    <input 
                      className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                      placeholder={t.cvvPlaceholder[langKey]} 
                      value={cvv} 
                      onChange={e=>handleCvvChange(e.target.value)}
                      maxLength={4}
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                    />
                    {cardErrors.cvv && (
                      <p className="text-xs text-red-600 mt-1">{cardErrors.cvv}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                {t.billingAddressTitle[langKey]}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.firstName.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder={fields.firstName.placeholder[langKey]} 
                    value={firstName} 
                    onChange={e=>setFirstName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.lastName.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder={fields.lastName.placeholder[langKey]} 
                    value={lastName} 
                    onChange={e=>setLastName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.street.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder={fields.street.placeholder[langKey]} 
                    value={street} 
                    onChange={e=>setStreet(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.houseNumber.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder={fields.houseNumber.placeholder[langKey]} 
                    value={houseNumber} 
                    onChange={e=>setHouseNumber(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.addressExtra.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder={fields.addressExtra.placeholder[langKey]} 
                    value={addressExtra} 
                    onChange={e=>setAddressExtra(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.postalCode.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder={fields.postalCode.placeholder[langKey]} 
                    value={postalCode} 
                    onChange={e=>setPostalCode(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.city.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder={fields.city.placeholder[langKey]} 
                    value={city} 
                    onChange={e=>setCity(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.phone.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder={fields.phone.placeholder[langKey]} 
                    value={phone} 
                    onChange={e=>setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button 
                onClick={handlePay}
                className="w-full h-14 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Lock className="w-5 h-5" />
                {t.payNow[langKey].replace("{amount}", formatMoney(total))}
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                 {t.sslNote[langKey]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-6 h-6 text-gray-700" />
              <h3 className="text-xl font-bold text-gray-900">
                {t.saveCardPrompt.title[langKey]}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {t.saveCardPrompt.body[langKey]}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  void persistOrder();
                  handleOrderSuccess();
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all"
              >
                {t.saveCardPrompt.decline[langKey]}
              </button>
              <button
                onClick={handleSaveCard}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold rounded-lg transition-all"
              >
                {t.saveCardPrompt.accept[langKey]}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Edit2 className="w-6 h-6 text-gray-700" />
                <h3 className="text-xl font-bold text-gray-900">
                  {t.editModalTitle[langKey]}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCard(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.firstName.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    value={editingCard.firstName} 
                    onChange={e => setEditingCard({...editingCard, firstName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.lastName.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    value={editingCard.lastName} 
                    onChange={e => setEditingCard({...editingCard, lastName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.street.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    value={editingCard.street} 
                    onChange={e => setEditingCard({...editingCard, street: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.houseNumber.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    value={editingCard.houseNumber} 
                    onChange={e => setEditingCard({...editingCard, houseNumber: e.target.value})}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.addressExtra.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    value={editingCard.addressExtra} 
                    onChange={e => setEditingCard({...editingCard, addressExtra: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.postalCode.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    value={editingCard.postalCode} 
                    onChange={e => setEditingCard({...editingCard, postalCode: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.city.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    value={editingCard.city} 
                    onChange={e => setEditingCard({...editingCard, city: e.target.value})}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {fields.phone.label[langKey]}
                  </label>
                  <input 
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all"
                    value={editingCard.phone} 
                    onChange={e => setEditingCard({...editingCard, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCard(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all"
              >
                {t.cancel[langKey]}
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold rounded-lg transition-all"
              >
                {t.save[langKey]}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default PurchaseTicketsCardInfo;

