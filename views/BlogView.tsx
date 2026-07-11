import React, { useState, useEffect } from 'react';
import { blogService } from '../services/blogService';
import { BlogPost, User, BarberShop } from '../types';
import { BookOpen, Calendar, User as UserIcon, Clock, Share2, ArrowLeft, Plus, Edit, Trash2, Check, Eye, MessageSquare, Tag, FileText } from 'lucide-react';

interface BlogViewProps {
  currentUser: User | null;
  currentShop: BarberShop;
  onNavigateBack?: () => void;
}

const BlogView: React.FC<BlogViewProps> = ({ currentUser, currentShop, onNavigateBack }) => {
  const isOwner = currentUser?.role === 'shopOwner' || currentUser?.role === 'platformAdmin';
  
  // View states
  const [activeTab, setActiveTab] = useState<'reader' | 'editor'>(isOwner ? 'editor' : 'reader');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selected post for reader
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  
  // Editing/Creating post state
  const [isEditing, setIsEditing] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Tendencias');
  const [tagsInput, setTagsInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [authorName, setAuthorName] = useState(currentUser?.name || 'Master Estilista');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: 'success' });

  // Load posts for this shop
  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const fetched = await blogService.fetchPostsByShop(currentShop.id, !isOwner);
      setPosts(fetched);
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [currentShop.id, isOwner]);

  // Handle auto-generating Meta Title and Description based on post title & content
  useEffect(() => {
    if (title) {
      setMetaTitle(`${title} | Blog ${currentShop.name}`);
      const cleanText = content.replace(/[#*`_]/g, '').slice(0, 150);
      setMetaDescription(cleanText || `Lee nuestro último artículo sobre ${title} en ${currentShop.name}.`);
    } else {
      setMetaTitle('');
      setMetaDescription('');
    }
  }, [title, content, currentShop.name]);

  const handleCreateNew = () => {
    setTitle('');
    setContent('# Escribe tu artículo aquí\n\nUsa títulos con ## para generar automáticamente un Índice de contenidos.');
    setCategory('Tendencias');
    setTagsInput('Corte, Estilo, Tendencia');
    setFeaturedImage('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800');
    setIsPublished(true);
    setEditPostId(null);
    setIsEditing(true);
  };

  const handleEdit = (post: BlogPost) => {
    setEditPostId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setCategory(post.categories[0] || 'Tendencias');
    setTagsInput(post.tags.join(', '));
    setFeaturedImage(post.featuredImage);
    setMetaTitle(post.metaTitle);
    setMetaDescription(post.metaDescription);
    setIsPublished(post.isPublished);
    setAuthorName(post.authorName);
    setIsEditing(true);
  };

  const handleDelete = async (postId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este artículo?')) {
      const success = await blogService.deletePost(postId);
      if (success) {
        showFeedback('Artículo eliminado correctamente.', 'success');
        loadPosts();
        if (selectedPost?.id === postId) setSelectedPost(null);
      } else {
        showFeedback('No se pudo eliminar el artículo.', 'error');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      showFeedback('Por favor complete el título y el contenido.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const postData: any = {
        shopId: currentShop.id,
        title,
        content,
        categories: [category],
        tags: parsedTags,
        featuredImage: featuredImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800',
        metaTitle: metaTitle || `${title} | ${currentShop.name}`,
        metaDescription: metaDescription || content.slice(0, 150),
        authorName: authorName || currentUser?.name || 'Estilista Master',
        isPublished,
        comments: editPostId ? (posts.find(p => p.id === editPostId)?.comments || []) : [],
      };

      if (editPostId) {
        postData.id = editPostId;
        const currentPost = posts.find(p => p.id === editPostId);
        if (currentPost) postData.createdAt = currentPost.createdAt;
      }

      const saved = await blogService.savePost(postData);
      if (saved) {
        showFeedback(editPostId ? 'Artículo actualizado correctamente.' : 'Artículo creado y optimizado para SEO.', 'success');
        setIsEditing(false);
        loadPosts();
      } else {
        showFeedback('Error al guardar el artículo.', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Ocurrió un error inesperado al guardar.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: 'success' }), 4000);
  };

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/barberias/${currentShop.id}/blog/${slug}`;
    navigator.clipboard.writeText(url);
    showFeedback('Enlace SEO de este artículo copiado al portapapeles.', 'success');
  };

  // Safe markdown render helpers
  const renderSimpleMarkdown = (text: string) => {
    return text.split('\n').map((para, i) => {
      if (para.startsWith('# ')) {
        return <h1 key={i} className="text-3xl font-black text-slate-900 mt-6 mb-4 leading-tight border-b border-slate-100 pb-2 uppercase tracking-tight">{para.replace('# ', '')}</h1>;
      }
      if (para.startsWith('## ')) {
        return <h2 key={i} id={para.replace('## ', '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')} className="text-xl font-bold text-slate-900 mt-6 mb-3 leading-snug border-l-4 border-red-600 pl-3">{para.replace('## ', '')}</h2>;
      }
      if (para.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-2">{para.replace('### ', '')}</h3>;
      }
      if (para.startsWith('- ') || para.startsWith('* ')) {
        return <li key={i} className="ml-5 list-disc text-slate-600 text-sm leading-relaxed mb-1">{para.slice(2)}</li>;
      }
      if (para.trim() === '') return <div key={i} className="h-2"></div>;
      return <p key={i} className="text-slate-600 text-sm leading-relaxed mb-4">{para}</p>;
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Breadcrumb & Feedback Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span className="hover:underline cursor-pointer" onClick={onNavigateBack}>Inicio</span>
            <span>/</span>
            <span className="hover:underline cursor-pointer" onClick={() => { setSelectedPost(null); setIsEditing(false); }}>Blog</span>
            {selectedPost && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium truncate max-w-[200px]">{selectedPost.title}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-red-600" />
            Centro de Contenido SEO <span className="text-xs px-2 py-0.5 bg-slate-900 text-white rounded-full font-bold ml-2">SaaS Multi-Tenant</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Artículos, consejos y tendencias locales de <span className="font-bold text-slate-700">{currentShop.name}</span> para potenciar Google Authority.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isOwner && !isEditing && (
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 w-full sm:w-auto shadow-sm">
              <button 
                onClick={() => { setActiveTab('editor'); setSelectedPost(null); }}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'editor' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-600 hover:text-slate-950'}`}
              >
                Panel Editor
              </button>
              <button 
                onClick={() => { setActiveTab('reader'); setSelectedPost(null); }}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'reader' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-600 hover:text-slate-950'}`}
              >
                Vista Lector
              </button>
            </div>
          )}

          {isOwner && activeTab === 'editor' && !isEditing && (
            <button
              onClick={handleCreateNew}
              className="flex items-center justify-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/10 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Crear Artículo
            </button>
          )}
        </div>
      </div>

      {/* Floating feedback alert */}
      {feedbackMsg.text && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-2xl shadow-xl z-50 text-xs font-black uppercase tracking-wider flex items-center gap-2 border animate-bounce ${
          feedbackMsg.type === 'success' ? 'bg-slate-900 text-white border-slate-800' : 'bg-red-550 text-white border-red-600'
        }`}>
          <Check className="w-4 h-4 text-emerald-400" />
          {feedbackMsg.text}
        </div>
      )}

      {/* Editing Workspace */}
      {isEditing ? (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Main Content Workspace */}
          <div className="lg:col-span-2 space-y-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-red-600" />
                {editPostId ? 'Editar Artículo' : 'Nuevo Artículo Optimizado'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Cancelar
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Título del Artículo *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Los 5 Mejores Peinados con Corte Fade para este Verano"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white text-slate-900 transition-all font-bold placeholder:font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Contenido (Markdown básico) *</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={14}
                  placeholder="Usa # para Títulos, ## para Subtítulos. Esto generará la Tabla de Contenidos estructurada automáticamente."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white text-slate-900 font-mono transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* SEO & Publication Controls Sidebar */}
          <div className="space-y-6">
            
            {/* SEO Automation Panel */}
            <div className="bg-slate-950 text-white p-6 rounded-3xl space-y-4 shadow-xl border border-slate-900 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl"></div>
              <h4 className="text-xs font-black text-red-500 uppercase tracking-widest pb-2 border-b border-slate-900">
                ⚡ SaaS SEO Automator
              </h4>
              
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Meta Title (Auto-Generado)</label>
                  <input 
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-red-600"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Recomendado: Menos de 60 caracteres. Espectacular para Google SERP.</p>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Meta Description (Auto-Generada)</label>
                  <textarea 
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-red-600"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Recomendado: Entre 120-160 caracteres. Atrae clics orgánicos.</p>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Auto-Slug Generado</label>
                  <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 select-all overflow-x-auto whitespace-nowrap">
                    /blog/{generateSlug(title) || 'el-titulo-del-articulo'}
                  </div>
                </div>
              </div>
            </div>

            {/* Categorization & Visual Assets */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-2 border-b border-slate-50">
                📁 Configuración del Artículo
              </h4>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Categoría Primaria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="Tendencias">✂️ Tendencias de Corte</option>
                    <option value="Consejos">💡 Consejos de Visagismo</option>
                    <option value="Productos">🧴 Productos y Peinado</option>
                    <option value="Eventos">📅 Eventos de Barbería</option>
                    <option value="Estilo">✨ Estilo de Vida</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Etiquetas (Separadas por comas)</label>
                  <input 
                    type="text" 
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Fade, Mullet, Cera Mate"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Imagen Destacada (URL)</label>
                  <input 
                    type="text" 
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Autor</label>
                  <input 
                    type="text" 
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="isPublished"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-red-600 bg-slate-100 border-slate-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="isPublished" className="text-[10px] font-black text-slate-700 uppercase tracking-wider cursor-pointer">
                    Publicar Artículo Inmediatamente
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Guardar y Optimizar
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </form>
      ) : selectedPost ? (
        
        /* High-End Public Blog Post Reader Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
          
          {/* Main Article column */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Back button */}
            <button 
              onClick={() => setSelectedPost(null)}
              className="px-4 py-2 bg-white text-slate-800 hover:bg-slate-50 text-xs font-black uppercase tracking-widest border border-slate-100 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a Todos los Artículos
            </button>

            {/* Post Card details */}
            <article className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              
              {/* Featured Image */}
              <div className="h-64 sm:h-96 w-full relative">
                <img 
                  src={selectedPost.featuredImage} 
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="px-3 py-1 bg-red-600 text-white font-black text-[9px] uppercase tracking-widest rounded-full mb-2.5 inline-block">
                    {selectedPost.categories[0]}
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                    {selectedPost.title}
                  </h2>
                </div>
              </div>

              {/* Author & Info bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-red-600" /> Por {selectedPost.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-red-600" /> {new Date(selectedPost.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-red-600" /> {selectedPost.readTime} de lectura
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => copyToClipboard(selectedPost.slug)}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all shadow-sm flex items-center gap-1"
                    title="Copiar URL para compartir"
                  >
                    <Share2 className="w-3.5 h-3.5 text-red-600" /> Compartir
                  </button>
                </div>
              </div>

              {/* Structured Body content */}
              <div className="p-6 sm:p-10 prose max-w-none">
                {renderSimpleMarkdown(selectedPost.content)}
              </div>

              {/* Tags & Actions */}
              <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex flex-wrap gap-2">
                {selectedPost.tags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-0.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    <Tag className="w-2.5 h-2.5 text-slate-400" /> {tag}
                  </span>
                ))}
              </div>
            </article>

            {/* Architecture: Mock Comment section (Comments disabled message) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-50">
                <MessageSquare className="w-4 h-4 text-red-600" />
                Comentarios del Artículo (0)
              </h3>
              <p className="text-slate-400 text-xs italic">
                El canal de comentarios está actualmente cerrado por moderación de spam. Agende una cita para hablar directamente con su barbero.
              </p>
            </div>

          </div>

          {/* Table of Contents & Related Posts sidebar */}
          <div className="space-y-6">
            
            {/* Table of Contents widget */}
            {selectedPost.tableOfContents && selectedPost.tableOfContents.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-2 border-b border-slate-50">
                  📑 Tabla de Contenidos
                </h4>
                <ul className="space-y-2 text-xs">
                  {selectedPost.tableOfContents.map((head, i) => (
                    <li 
                      key={i} 
                      className={`font-bold uppercase tracking-wide hover:text-red-600 transition-colors cursor-pointer ${
                        head.level === 1 ? 'pl-0 text-slate-900' : head.level === 2 ? 'pl-3 text-slate-600' : 'pl-6 text-slate-400'
                      }`}
                      onClick={() => {
                        const el = document.getElementById(head.id);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      {head.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Platform SEO multi-tenant benefit notice */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-6 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <h4 className="text-xs font-black uppercase tracking-widest">💡 Beneficio Multi-Tenant</h4>
              <p className="text-[11px] leading-relaxed opacity-90">
                Este artículo se publica de manera única bajo la dirección SEO <span className="font-mono bg-black/20 p-1 rounded">/barberias/{currentShop.id}/blog</span>. Google rastrea este contenido indexando tu barbería y aumentando la relevancia local de inmediato.
              </p>
            </div>

            {/* Related Posts */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-2 border-b border-slate-50">
                📚 Artículos Relacionados
              </h4>
              <div className="space-y-4">
                {posts
                  .filter(p => p.id !== selectedPost.id)
                  .slice(0, 3)
                  .map((post) => (
                    <div 
                      key={post.id} 
                      className="group flex gap-3 cursor-pointer items-start hover:bg-slate-50 p-2 rounded-xl transition-all"
                      onClick={() => setSelectedPost(post)}
                    >
                      <img 
                        src={post.featuredImage} 
                        alt={post.title} 
                        className="w-14 h-14 object-cover rounded-lg shadow-sm border border-slate-100"
                      />
                      <div className="space-y-1">
                        <h5 className="text-xs font-black uppercase tracking-tight text-slate-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {post.title}
                        </h5>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(post.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                {posts.filter(p => p.id !== selectedPost.id).length === 0 && (
                  <p className="text-[11px] text-slate-400 italic">No hay otros artículos publicados en este salón.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      ) : (
        
        /* Grid List of Articles (Tab selected) */
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4 animate-pulse">
                  <div className="h-48 bg-slate-200 rounded-2xl w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : activeTab === 'editor' ? (
            
            /* Editor Panel Table list */
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="p-4 pl-6">Artículo</th>
                      <th className="p-4">Categoría</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4">Creado</th>
                      <th className="p-4 pr-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 flex items-center space-x-3">
                          <img 
                            src={post.featuredImage} 
                            alt={post.title} 
                            className="w-12 h-12 object-cover rounded-xl shadow-sm border border-slate-100"
                          />
                          <div>
                            <p className="font-black text-slate-950 uppercase tracking-tight line-clamp-1">{post.title}</p>
                            <p className="text-[10px] text-slate-400 font-medium font-mono">/{post.slug}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                            {post.categories[0]}
                          </span>
                        </td>
                        <td className="p-4">
                          {post.isPublished ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center w-fit gap-1">
                              <Check className="w-3 h-3" /> Público
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center w-fit gap-1">
                              <Eye className="w-3 h-3" /> Borrador
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400 font-medium">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 pr-6 text-right space-x-1 whitespace-nowrap">
                          <button 
                            onClick={() => setSelectedPost(post)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors inline-block"
                            title="Ver en vista de lectura"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(post)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors inline-block"
                            title="Editar artículo"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(post.id)}
                            className="p-1.5 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors inline-block"
                            title="Eliminar artículo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {posts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                          No tienes artículos creados. ¡Sé el primero en publicar!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          ) : (
            
            /* Public Reader List view (grid of nice cards) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <article 
                  key={post.id} 
                  className="group bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="h-48 w-full relative overflow-hidden">
                    <img 
                      src={post.featuredImage} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white font-black text-[8px] uppercase tracking-widest rounded-lg">
                        {post.categories[0]}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3 text-red-600" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-red-600" /> {post.readTime}</span>
                      </div>
                      <h3 className="text-base font-black text-slate-950 uppercase tracking-tight group-hover:text-red-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 font-medium">
                        {post.metaDescription}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-slate-400" /> Por {post.authorName}
                      </span>
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Leer Más →
                      </span>
                    </div>
                  </div>
                </article>
              ))}
              {posts.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">No hay artículos publicados en este blog.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogView;
