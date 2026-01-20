// src/pages/NotFound.tsx
import { useContext } from "react";
import "./errorpage.css";
import tumbleweed from "./Tumbleweed.png";
import errorpage from "./background.png";
import { TranslationsContext } from "../TranslationsContext";

export default function NotFound() {
  const context = useContext(TranslationsContext);
  if (!context) return null;

  const { translations, lang } = context;
  const t = translations.notFound;
  const langKey = lang as keyof typeof t.title;

  return (
    <div
      style={{
        backgroundImage: `url(${errorpage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          paddingLeft: "100px",
          paddingRight: "100px",
          paddingBottom: "20px",
          paddingTop: "0px",
          borderRadius: "10px",
          textAlign: "center",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            marginBottom: "0",
            marginTop: "20px",
          }}
        >
          {t.title[langKey]}
        </h1>
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            marginBottom: "0",
            marginTop: "-15px",
          }}
        >
          404
        </h1>
        <div
          style={{
            borderRadius: "10px",
            textAlign: "center",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        />
        <p style={{ marginBottom: "0", marginTop: "15px" }}>
          {t.subtitle[langKey]}
        </p>
        <a href="/" style={{ color: "#0066cc" }}>
          {t.backHome[langKey]}
        </a>
      </div>
      <div>
        <img
          src={tumbleweed}
          alt={t.imageAlt[langKey]}
          className="tumbleweed"
        />
      </div>
    </div>
  );
}
