import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import LoadArticle from "./loadArticle";
import { useState, useEffect, useContext } from "react";
import { getAllArtikel, createArtikel } from "../../api/artikel";
import { Plus, X } from "lucide-react";
import { TranslationsContext } from "../TranslationsContext";

interface Article {
  id: string;
  title: string;
  description: string;
  image: string;
  markdownText?: string;
}

function ArticleOverview() {
  const context = useContext(TranslationsContext);
  if (!context) return null;

  const { translations, lang } = context;
  const t = translations.articlesPage;
  const langKey = lang as keyof typeof t.title;

  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [markdownInput, setMarkdownInput] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const data = await getAllArtikel();
        
        // Transform API data to Article format
        const transformedArticles = data
          .filter(artikel => artikel.isActive)
          .map((artikel) => ({
            id: artikel.id.toString(),
            title: extractTitle(artikel.markdownText),
            description: extractDescription(artikel.markdownText),
            image: extractImage(artikel.markdownText),
            markdownText: artikel.markdownText,
          }));
        
        setArticles(transformedArticles);
        setError(null);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(t.errorLoading[langKey]);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Helper functions to extract metadata from markdown
  const extractTitle = (markdown: string): string => {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : t.unknownArticleTitle[langKey];
  };

  const extractDescription = (markdown: string): string => {
    const lines = markdown.split('\n').filter(line => line.trim());
    // Find first paragraph after title (skip title and images)
    for (const line of lines) {
      if (!line.startsWith('#') && !line.startsWith('![') && line.length > 20) {
        return line.substring(0, 200) + (line.length > 200 ? '...' : '');
      }
    }
    return '';
  };

  const extractImage = (markdown: string): string => {
    const imageMatch = markdown.match(/!\[.*?\]\((.+?)\)/);
    if (imageMatch) {
      return imageMatch[1];
    }
    // Return random image as fallback
    return getRandomImage();
  };

  const getRandomImage = (): string => {
    const images = [
      '/Elephant.png',
      '/ElephantSquare.png',
      '/Fuchs.png',
      '/leu.png',
      '/Serengeti_Elefantenherde1.png'
    ];
    return images[Math.floor(Math.random() * images.length)];
  };



  const handleArticleClick = (articleId: string) => {
    const currentLang = window.location.pathname.split('/')[1];
    navigate(`/${currentLang}/articles/${articleId}`);
  };

  const handleCreateArticle = async () => {
    if (!markdownInput.trim()) return;

    try {
      setCreating(true);
      
      await createArtikel({
        markdownText: markdownInput,
        userId: 1
      });

      // Refresh articles list
      const data = await getAllArtikel();
      const transformedArticles = data
        .filter(artikel => artikel.isActive)
        .map((artikel) => ({
          id: artikel.id.toString(),
          title: extractTitle(artikel.markdownText),
          description: extractDescription(artikel.markdownText),
          image: extractImage(artikel.markdownText),
          markdownText: artikel.markdownText,
        }));
      
      setArticles(transformedArticles);
      setShowCreateModal(false);
      setMarkdownInput('');
    } catch (err) {
      console.error('Error creating article:', err);
      setError(t.errorCreating[langKey]);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-white py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">{t.loading[langKey]}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(255, 248, 235, 0.92), rgba(255, 255, 255, 0.92)), url('/Elephant.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex flex-col items-center justify-center gap-4 mb-6 sm:flex-row">
            <h1 className="text-4xl font-semibold text-slate-900">
              {t.title[langKey]}
            </h1>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2 rounded-full"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              {t.createButton[langKey]}
            </Button>
          </div>
          <p className="text-base text-slate-600">
            {t.subtitle[langKey]}
          </p>
          {error && (
            <p className="text-sm text-amber-600 mt-2">
              {error}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="overflow-hidden border border-amber-100/70 bg-white/80 shadow-lg backdrop-blur transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-xl"
              onClick={() => handleArticleClick(article.id)}
            >
              <div className="relative h-48 overflow-hidden bg-slate-200">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />

              </div>

              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  {article.title}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <CardDescription className="text-slate-600 line-clamp-3">
                  {article.description}
                </CardDescription>
              </CardContent>

              <CardFooter>
                <Button
                  variant="default"
                  className="w-full rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArticleClick(article.id);
                  }}
                >
                  {t.readMore[langKey]}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Article Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(255, 248, 235, 0.95), rgba(255, 255, 255, 0.95)), url('/ElephantSquare.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-amber-100/70">
            <div className="flex items-start justify-between gap-4 p-6 border-b border-amber-100/70 sticky top-0 bg-white/90 backdrop-blur">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {t.modalTitle[langKey]}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {t.modalSubtitle[langKey]}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-700"
                aria-label={t.closeAria[langKey]}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.contentLabel[langKey]}
                </label>
                <textarea
                  value={markdownInput}
                  onChange={(e) => setMarkdownInput(e.target.value)}
                  placeholder={t.contentPlaceholder[langKey]}
                  className="w-full h-64 p-4 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-200 font-mono text-sm shadow-sm"
                />
                <div className="mt-2 text-xs text-slate-500">
                  {t.tipPrefix[langKey]}{" "}
                  <span className="font-semibold">{t.tipTitleToken[langKey]}</span>.{" "}
                  {t.tipMiddle[langKey]}{" "}
                  <span className="font-semibold">{t.tipImageToken[langKey]}</span>.{" "}
                  {t.tipSuffix[langKey]}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() =>
                      setMarkdownInput(
                        (prev) =>
                          prev ||
                          t.defaultTemplate[langKey]
                      )
                    }
                  >
                    {t.insertTemplate[langKey]}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() =>
                      setMarkdownInput((prev) =>
                        `${prev}\n\n${t.imagePlaceholderSnippet[langKey]}`
                      )
                    }
                  >
                    {t.insertImagePlaceholder[langKey]}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 justify-end pt-4 border-t border-amber-100/70 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full"
                >
                  {t.cancel[langKey]}
                </Button>
                <Button
                  onClick={handleCreateArticle}
                  disabled={creating || !markdownInput.trim()}
                  className="rounded-full"
                >
                  {creating ? t.creating[langKey] : t.createArticle[langKey]}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Articles()  {
  const { article } = useParams<{ article?: string }>();

  return (
    <div>
      {article ? <LoadArticle /> : <ArticleOverview />}
    </div>
  );
};

export default Articles;
