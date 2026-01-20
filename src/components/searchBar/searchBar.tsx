import { Search } from "lucide-react"
import { useContext, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { TranslationsContext } from "../TranslationsContext"

const SUPPORTED_LANGS = ["de", "en", "fr", "it"] as const
type SupportedLang = (typeof SUPPORTED_LANGS)[number]

function resolvePath(path: string) {
  const segment = window.location.pathname.split("/")[1]
  const isLang = SUPPORTED_LANGS.includes(segment as SupportedLang)
  if (!isLang) return path
  if (path === "/") return `/${segment}`
  return `/${segment}${path.startsWith("/") ? path : `/${path}`}`
}

function SearchBar() {
  const context = useContext(TranslationsContext)
  if (!context) return null

  const { translations, lang } = context
  const t = translations.searchBar
  const langKey = lang as keyof typeof t.placeholder
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const navigate = useNavigate()

  const pages = useMemo(
    () => [
      {
        key: "home",
        label: t.pages.home.label[langKey],
        path: "/",
        keywords: t.pages.home.keywords[langKey],
      },
      {
        key: "signIn",
        label: t.pages.signIn.label[langKey],
        path: "/signIn",
        keywords: t.pages.signIn.keywords[langKey],
      },
      {
        key: "signUp",
        label: t.pages.signUp.label[langKey],
        path: "/signUp",
        keywords: t.pages.signUp.keywords[langKey],
      },
      {
        key: "signUpConfirmation",
        label: t.pages.signUpConfirmation.label[langKey],
        path: "/signUpConfirmation",
        keywords: t.pages.signUpConfirmation.keywords[langKey],
      },
      {
        key: "articles",
        label: t.pages.articles.label[langKey],
        path: "/articles",
        keywords: t.pages.articles.keywords[langKey],
      },
      {
        key: "map",
        label: t.pages.map.label[langKey],
        path: "/map",
        keywords: t.pages.map.keywords[langKey],
      },
      {
        key: "chatbot",
        label: t.pages.chatbot.label[langKey],
        path: "/chatbot",
        keywords: t.pages.chatbot.keywords[langKey],
      },
      {
        key: "purchaseTickets",
        label: t.pages.purchaseTickets.label[langKey],
        path: "/purchaseTickets",
        keywords: t.pages.purchaseTickets.keywords[langKey],
      },
      {
        key: "orders",
        label: t.pages.orders.label[langKey],
        path: "/orders",
        keywords: t.pages.orders.keywords[langKey],
      },
    ],
    [langKey, t.pages]
  )

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredPages = normalizedQuery
    ? pages.filter(
        (page) =>
          page.label.toLowerCase().includes(normalizedQuery) ||
          page.keywords.some((keyword: string) =>
            keyword.toLowerCase().includes(normalizedQuery)
          )
      )
    : []

  const handleSelectPage = (path: string) => {
    navigate(resolvePath(path))
    setSearchQuery("")
    setShowSuggestions(false)
  }

  return (
    <div className="relative flex items-center h-10">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="search"
        placeholder={t.placeholder[langKey]}
        className="h-10 w-64 rounded-full border border-amber-100 bg-white/90 pl-9 shadow-sm transition hover:shadow-md focus-visible:ring-1 focus-visible:ring-amber-200"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      
      {showSuggestions && filteredPages.length > 0 && (
        <div className="absolute top-full mt-1 w-full rounded-xl border border-amber-100 bg-white shadow-lg max-h-60 overflow-y-auto z-50">
          {filteredPages.map((page) => (
            <button
              key={page.path}
              onClick={() => handleSelectPage(page.path)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-amber-50 first:rounded-t-xl last:rounded-b-xl"
            >
              {page.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
