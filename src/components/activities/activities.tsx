
import { useContext } from "react";
import { TranslationsContext } from "../TranslationsContext";

function Activities() {
  const context = useContext(TranslationsContext);
  if (!context) return null;

  const { translations, lang } = context;
  const t = translations.activities;
  const langKey = lang as keyof typeof t.title;

  return <div>{t.title[langKey]}</div>;
}

export default Activities;
