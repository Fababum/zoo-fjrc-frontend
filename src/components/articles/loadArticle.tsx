import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getArtikelById, updateArtikel, deleteArtikel } from "../../api/artikel";
import { Button } from "../ui/button";
import { Edit, Trash2, X, Save, ArrowLeft } from "lucide-react";

import "./loadArticle.css";
import "github-markdown-css/github-markdown.css";

export default function LoadArticle() {
  const { article } = useParams<{ article?: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadArticle = async () => {
      if (!article) return;

      try {
        setLoading(true);
        const articleId = parseInt(article);
        const data = await getArtikelById(articleId);
        setContent(data.markdownText);
        setEditContent(data.markdownText);
        setError(null);
      } catch (err) {
        console.error('Error loading article:', err);
        setError('Artikel konnte nicht geladen werden.');
        setContent('');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [article]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!article) return;

    try {
      setSaving(true);
      const articleId = parseInt(article);
      await updateArtikel(articleId, {
        markdownText: editContent,
      });
      setContent(editContent);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating article:', err);
      alert('Fehler beim Speichern des Artikels');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    
    if (!confirm('Möchten Sie diesen Artikel wirklich löschen?')) {
      return;
    }

    try {
      const articleId = parseInt(article);
      await deleteArtikel(articleId);
      const currentLang = window.location.pathname.split('/')[1];
      navigate(`/${currentLang}/articles`);
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Fehler beim Löschen des Artikels');
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleBack = () => {
    const currentLang = window.location.pathname.split('/')[1];
    navigate(`/${currentLang}/articles`);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Artikel wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons */}
        <div className="flex justify-center gap-2 mb-6">
        {!isEditing ? (
          <>
            <Button
              onClick={handleEdit}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Edit className="h-5 w-5" />
              Bearbeiten
            </Button>
            <Button
              onClick={handleDelete}
              className="gap-2 bg-red-600 hover:bg-red-700"
              size="lg"
            >
              <Trash2 className="h-5 w-5" />
              Löschen
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Speichert...' : 'Speichern'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="lg"
            >
              <X className="h-5 w-5" />
              Abbrechen
            </Button>
          </>
        )}
      </div>

        {/* Edit Mode or View Mode */}
        {isEditing ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              Artikel bearbeiten
            </h2>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-[70vh] p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        ) : (
          <article className="markdown-body bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ alt, ...props }) => {
                const [text, size] = (alt ?? "").split("|");

                const sizes: Record<string, string> = {
                  small: "300px",
                  medium: "500px",
                  large: "800px",
                };

                return (
                  <img
                    {...props}
                    alt={text}
                    style={{
                      maxWidth: sizes[size ?? "medium"] ?? "500px",
                      width: "100%",
                      height: "auto",
                      display: "block",
                      margin: "1.5rem auto",
                      borderRadius: "12px",
                    }}
                  />
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
          </article>
        )}

        {/* Back Button at Bottom */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleBack}
            variant="outline"
            className="gap-2"
            size="lg"
          >
            <ArrowLeft className="h-5 w-5" />
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    </div>
  );
}
