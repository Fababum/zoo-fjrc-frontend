import { useContext } from "react";
import { useAuth } from "@/components/AuthContext";
import { useNavigate } from "react-router-dom";
import { TranslationsContext } from "../TranslationsContext";

function Logout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const context = useContext(TranslationsContext);
  if (!context) return null;

  const { translations, lang } = context;
  const t = translations.logout;
  const langKey = lang as keyof typeof t.button;

  const handleLogout = () => {
    auth.logout();
    navigate("/");
  };

  return (
    <div>
      <button onClick={handleLogout}>{t.button[langKey]}</button>
    </div>
  );
}

export default Logout;
