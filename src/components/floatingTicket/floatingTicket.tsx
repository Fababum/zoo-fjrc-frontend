import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { TranslationsContext } from "../TranslationsContext";


export default function FloatingTicket() {
  const context = useContext(TranslationsContext);
  if (!context) return null;

  const { translations, lang } = context;
  const t = translations.floatingTicket;
  const langKey = lang as keyof typeof t.label;

  const container: React.CSSProperties = {
    position: "fixed",
    bottom: "18px",
    left: "18px",
    zIndex: 9999,
  };

  const box: React.CSSProperties = {
    backgroundColor: "#6E5B3A",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "10px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
    fontSize: "14px",
    textDecoration: "none",
  };

  const imgStyle: React.CSSProperties = {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    objectFit: "cover",
    display: "block",
  };


  const resolvePath = (path: string) => {
    const segment = window.location.pathname.split("/")[1];
    const isLang = ["de", "en", "fr", "it"].includes(segment);
    if (!isLang) return path;
    return `/${segment}${path.startsWith("/") ? path : `/${path}`}`;
  };

  return (
    <Link
      to={resolvePath("/purchaseTickets")}
      style={container}
      aria-label={t.ariaLabel[langKey]}
      className="floating-ticket"
    >
      <div style={box}>
        <img src="/ticket.png" alt={t.imageAlt[langKey]} style={imgStyle} />
        <span>{t.label[langKey]}</span>
      </div>
    </Link>
  );
}
