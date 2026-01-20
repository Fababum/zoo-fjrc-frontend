import React, { useContext } from "react";
import mapImg from "../../assets/zoo-map.jpg";
import { TranslationsContext } from "../TranslationsContext";

function MapPage() {
  const context = useContext(TranslationsContext);
  if (!context) return null;

  const { translations, lang } = context;
  const t = translations.mapPage;
  const langKey = lang as keyof typeof t.title;

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <div style={titleWrapStyle}>
          <div style={kickerStyle}>{translations.common.brand[langKey]}</div>
          <h1 style={titleStyle}>{t.title[langKey]}</h1>
          <p style={subtitleStyle}>
            {t.subtitle[langKey]}
          </p>
        </div>
        <div style={mapWrapStyle}>
        <img src={mapImg} alt={t.imageAlt[langKey]} style={mapStyle} />
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundImage:
    "linear-gradient(135deg, rgba(255, 248, 235, 0.92), rgba(255, 255, 255, 0.92)), url('/ElephantSquare.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "48px 24px",
};

const contentStyle: React.CSSProperties = {
  width: "min(1100px, 100%)",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const titleWrapStyle: React.CSSProperties = {
  textAlign: "center",
};

const kickerStyle: React.CSSProperties = {
  fontSize: "12px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#92400e",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: 700,
  color: "#111827",
  marginTop: "8px",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#4b5563",
  marginTop: "8px",
};

const mapWrapStyle: React.CSSProperties = {
  position: "relative",
  width: "min(1000px, 100%)",
  margin: "0 auto",
};

const mapStyle: React.CSSProperties = {
  width: "100%",
  height: "auto",
  borderRadius: "20px",
  boxShadow: "0 20px 45px rgba(15, 23, 42, 0.18)",
  border: "1px solid rgba(251, 191, 36, 0.5)",
};

export default MapPage;
