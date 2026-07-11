import { db } from '../firebase/client';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { BlogPost, BlogComment } from '../types';

// Helper to convert titles into clean URL-friendly slugs
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD') // splits accented letters into baseline letter + accent accent symbol
    .replace(/[\u0300-\u036f]/g, '') // removes accent marks
    .replace(/[^a-z0-9\s-]/g, '') // removes all non-alphanumeric chars except space and hyphen
    .replace(/\s+/g, '-') // replaces multiple spaces with a single hyphen
    .replace(/-+/g, '-'); // replaces multiple hyphens with a single hyphen
};

// Helper to calculate reading time
export const calculateReadTime = (content: string): string => {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min`;
};

// Helper to parse content headers and generate a dynamic Table of Contents
export const generateTableOfContents = (content: string) => {
  const headings: Array<{ id: string; text: string; level: number }> = [];
  const lines = content.split('\n');
  
  lines.forEach((line) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      headings.push({ id, text, level });
    }
  });
  
  return headings;
};

export const blogService = {
  // Get all blog posts for a specific barber shop
  async fetchPostsByShop(shopId: string, onlyPublished = true): Promise<BlogPost[]> {
    try {
      const postsRef = collection(db, 'blogPosts');
      const q = query(postsRef, where('shopId', '==', shopId));
      const querySnapshot = await getDocs(q);
      
      let posts: BlogPost[] = [];
      querySnapshot.forEach((docSnap) => {
        posts.push({ id: docSnap.id, ...docSnap.data() } as BlogPost);
      });
      
      // Sort by date descending
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (onlyPublished) {
        posts = posts.filter(p => p.isPublished);
      }
      
      // Seed default blog posts if the list is empty to jumpstart SEO
      if (posts.length === 0) {
        console.log(`[Blog Seeder] No posts found for shop: ${shopId}, seeding defaults...`);
        posts = await this.seedDefaultPosts(shopId);
        if (onlyPublished) {
          posts = posts.filter(p => p.isPublished);
        }
      }
      
      return posts;
    } catch (error) {
      console.error('[BlogService] fetchPostsByShop failed:', error);
      return [];
    }
  },

  // Fetch a single post by its slug (Multi-Tenant SEO URL friendly)
  async fetchPostBySlug(shopId: string, slug: string): Promise<BlogPost | null> {
    try {
      const postsRef = collection(db, 'blogPosts');
      const q = query(postsRef, where('shopId', '==', shopId), where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as BlogPost;
      }
      return null;
    } catch (error) {
      console.error('[BlogService] fetchPostBySlug failed:', error);
      return null;
    }
  },

  // Save a new or edited blog post
  async savePost(post: Omit<BlogPost, 'id' | 'slug' | 'readTime' | 'tableOfContents'> & { id?: string }): Promise<BlogPost | null> {
    try {
      const id = post.id || `post_${Date.now()}`;
      const slug = generateSlug(post.title);
      const readTime = calculateReadTime(post.content);
      const tableOfContents = generateTableOfContents(post.content);
      
      const fullPost: BlogPost = {
        ...post,
        id,
        slug,
        readTime,
        tableOfContents,
        createdAt: post.createdAt || new Date().toISOString()
      };
      
      await setDoc(doc(db, 'blogPosts', id), fullPost);
      console.log(`[BlogService] Post saved successfully: ${id} with slug ${slug}`);
      return fullPost;
    } catch (error) {
      console.error('[BlogService] savePost failed:', error);
      return null;
    }
  },

  // Delete a blog post
  async deletePost(postId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'blogPosts', postId));
      return true;
    } catch (error) {
      console.error('[BlogService] deletePost failed:', error);
      return false;
    }
  },

  // Add a comment to a blog post (architecture prepared, comments disabled/enabled by default)
  async addComment(postId: string, author: string, text: string): Promise<BlogComment | null> {
    try {
      const postRef = doc(db, 'blogPosts', postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return null;
      
      const postData = postSnap.data() as BlogPost;
      const commentId = `comment_${Date.now()}`;
      const newComment: BlogComment = {
        id: commentId,
        author,
        text,
        date: new Date().toISOString(),
        approved: true // Auto-approved for simple setup
      };
      
      const currentComments = postData.comments || [];
      await updateDoc(postRef, {
        comments: [...currentComments, newComment]
      });
      
      return newComment;
    } catch (error) {
      console.error('[BlogService] addComment failed:', error);
      return null;
    }
  },

  // Seed default posts for a shop to guarantee excellent SEO indexing immediately
  async seedDefaultPosts(shopId: string): Promise<BlogPost[]> {
    const defaultPosts: Array<Omit<BlogPost, 'id' | 'slug' | 'readTime' | 'tableOfContents'>> = [
      {
        shopId,
        title: 'Tendencias de Cortes de Cabello Masculinos para el 2026',
        metaTitle: 'Tendencias de Cortes de Cabello 2026 | Visagismo y Estilo',
        metaDescription: 'Descubre los cortes de cabello masculinos que dominarán el año 2026. Del mullet moderno al texturizado fade con análisis de visagismo de IA.',
        featuredImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200',
        content: `# Tendencias de Cortes de Cabello Masculinos para el 2026

El diseño de estilo capilar masculino ha evolucionado hacia un enfoque completamente personalizado de visagismo. En el 2026, ya no se trata de elegir un corte genérico de una revista; se trata de adaptar las proporciones faciales naturales para lograr un balance visual perfecto.

Aquí te presentamos los estilos que dominarán los salones este año.

## 1. El Mid Fade Texturizado con Navaja
Este corte se caracteriza por una transición sumamente suave en los costados que comienza a la altura media de la sien y se difumina perfectamente. La parte superior mantiene una textura densa que aporta volumen orgánico. Es ideal para rostros **óvalados** y **redondos**.

## 2. El Modern Mullet o "Wolf Cut"
Con una mezcla de herencia retro de los 80s y rebeldía moderna, el mullet en 2026 presenta líneas más suavizadas y orgánicas. Conserva el largo característico en la nuca pero integra un texturizado sutil que previene el frizz y favorece enormemente a rostros **diamante** o **rectangulares**.

## 3. Buzz Cut con Diseños Geométricos
Para los amantes del minimalismo radical, el corte militar rapado se renueva con micro-diseños grabados con navaja en los costados o en la parte posterior. Es un estilo limpio que resalta de manera increíble la estructura de la mandíbula y pómulos.

## Cuidado Capilar Esencial
Para mantener la textura de tu corte intacta, utiliza pomadas con base de agua o arcillas de acabado mate. Evitan los residuos pesados y permiten moldear el peinado múltiples veces a lo largo del día.`,
        categories: ['Tendencias', 'Cortes de Cabello'],
        tags: ['Fade', 'Mullet', '2026', 'Visagismo'],
        authorName: 'Master Barbero AI',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        comments: [],
        isPublished: true
      },
      {
        shopId,
        title: 'Guía Completa de Visagismo: Encuentra tu Corte Ideal Según tu Rostro',
        metaTitle: 'Guía de Visagismo Masculino | Barber Shop AI',
        metaDescription: '¿Qué tipo de rostro tienes y cuál corte te favorece? Aprende sobre el análisis morfológico de frente, pómulos y mandíbula con nuestra guía definitiva.',
        featuredImage: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=1200',
        content: `# Guía Completa de Visagismo: Encuentra tu Corte Ideal Según tu Rostro

El visagismo es el estudio de la morfología del rostro humano con el fin de realzar las facciones naturales y corregir visualmente las asimetrías mediante el cabello y la barba. 

Nuestra plataforma utiliza algoritmos avanzados para identificar la geometría facial de forma precisa, pero entender las reglas básicas te ayudará a comunicar mejor tus expectativas.

## Identificando las Formas Faciales

### Rostro Ovalado
Considerado el rostro ideal por su balance simétrico perfecto. Le favorece prácticamente cualquier corte, especialmente los que despejan la frente como el pompadour o los tupés con textura.

### Rostro Cuadrado
Se caracteriza por una mandíbula angulosa y una frente amplia. Para suavizar las líneas fuertes, recomendamos cortes con volumen en la coronilla y desvanecidos suaves en los costados.

### Rostro Redondo
El objetivo aquí es alargar visualmente el rostro. Evita los flequillos rectos y opta por estilos con altura y volumen superior, con degradados bien altos en las sienes.

## ¿Cómo Funciona el Espejo Virtual?
El Espejo Virtual procesa tus fotografías de frente y perfil tridimensionalmente. Analiza la proporción áurea facial para sugerir cortes de alta coherencia que optimizan tus facciones reales.`,
        categories: ['Visagismo', 'Cuidado Personal'],
        tags: ['Morfología', 'Espejo Virtual', 'Consejos', 'Barbería'],
        authorName: 'Styling Master Coach',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        comments: [],
        isPublished: true
      }
    ];

    const seededPosts: BlogPost[] = [];
    for (const post of defaultPosts) {
      const saved = await this.savePost(post);
      if (saved) {
        seededPosts.push(saved);
      }
    }
    return seededPosts;
  }
};
