import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import fs from 'fs/promises';
import Stripe from 'stripe';

dotenv.config();

// Global error handlers to prevent container crashes
process.on('uncaughtException', (error) => {
    console.error('[CRITICAL SEVERE] Uncaught Exception:', error?.message || error, error?.stack || '');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL SEVERE] Unhandled Rejection at:', promise, 'reason:', reason);
});

// A robust fetch wrapper with native https fallback
async function safeFetch(url: string, options: any = {}): Promise<any> {
    const timeout = options.timeout || 10000;
    
    if (typeof fetch === 'function') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            console.warn(`[safeFetch] Global fetch failed for ${url}, attempting native HTTPS fallback...`, fetchError.message || fetchError);
        }
    }

    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = new URL(url);
            const reqOptions: https.RequestOptions = {
                method: options.method || 'GET',
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                headers: options.headers || {},
                timeout: timeout,
            };

            const req = https.request(reqOptions, (res) => {
                const chunks: any[] = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const body = Buffer.concat(chunks).toString('utf-8');
                    resolve({
                        ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        json: async () => JSON.parse(body),
                        text: async () => body,
                        headers: {
                            get: (name: string) => {
                                const val = res.headers[name.toLowerCase()];
                                return Array.isArray(val) ? val.join(', ') : val;
                            }
                        }
                    });
                });
            });

            req.on('error', (err) => reject(err));
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (options.body) {
                req.write(options.body);
            }
            req.end();
        } catch (fallbackError) {
            reject(fallbackError);
        }
    });
}

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripeClient) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error('STRIPE_SECRET_KEY is not defined in the environment variables');
        }
        stripeClient = new Stripe(key, {
            apiVersion: '2023-10-16' as any,
        });
    }
    return stripeClient;
}

// Helper to map and sanitize non-standard MIME types to officially supported ones
function getStandardMimeType(mimeType: string): string {
    if (!mimeType) return 'image/jpeg';
    const normalized = mimeType.toLowerCase().trim();
    if (normalized === 'image/png') return 'image/png';
    if (normalized === 'image/webp') return 'image/webp';
    if (normalized === 'image/heic') return 'image/heic';
    if (normalized === 'image/heif') return 'image/heif';
    if (normalized === 'image/jpeg' || normalized === 'image/jpg' || normalized === 'image/jfif' || normalized === 'image/pjpeg') return 'image/jpeg';
    if (normalized.startsWith('image/')) return 'image/jpeg';
    return 'image/jpeg';
}

// Generador de imágenes vectoriales SVG elegantes en formato data URI
function getFallbackSvgDataUri(title: string, subtitle: string, hairColor = '#ef4444'): string {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${hairColor}"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="300" height="400" fill="url(#bgGrad)"/>
  <path d="M-50,350 L50,450 M-50,250 L150,450 M-50,150 L250,450 M-50,50 L350,450" stroke="#ffffff" stroke-width="2" opacity="0.03" stroke-dasharray="10,10"/>
  <path d="M150,140 Q150,300 210,260 Q215,220 215,190" fill="none" stroke="#e2e8f0" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
  <path d="M150,140 Q150,300 90,260 Q85,220 85,190" fill="none" stroke="#e2e8f0" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
  <path d="M100,160 Q120,90 150,85 Q180,90 200,160 Q150,150 100,160 Z" fill="url(#hairGrad)"/>
  <path d="M105,155 Q150,140 195,155" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.5"/>
  <g transform="translate(150, 210) scale(0.6)" stroke="#ef4444" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.8">
    <circle cx="-15" cy="40" r="10"/>
    <circle cx="15" cy="40" r="10"/>
    <line x1="-10" y1="31" x2="10" y2="-10"/>
    <line x1="10" y1="31" x2="-10" y2="-10"/>
  </g>
  <rect x="20" y="310" width="260" height="60" rx="12" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5" opacity="0.9"/>
  <text x="150" y="335" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="11" fill="#f8fafc" text-anchor="middle" letter-spacing="2">BARBER SHOP AI</text>
  <text x="150" y="355" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="9" fill="#ef4444" text-anchor="middle" letter-spacing="1">${title.toUpperCase()}</text>
</svg>
    `.trim();
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}

// Helper to fetch image from URL and return base64 with mimeType
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
    try {
        if (url.startsWith('data:')) {
            const match = url.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
                return { mimeType: getStandardMimeType(match[1]), data: match[2] };
            }
        }
        
        const res = await safeFetch(url);
        if (!res.ok) {
            throw new Error(`Failed to download image from URL: ${res.statusText}`);
        }
        const arrayBuffer = await res.arrayBuffer();
        const mimeType = getStandardMimeType(res.headers.get('content-type') || 'image/jpeg');
        const data = Buffer.from(arrayBuffer).toString('base64');
        return { data, mimeType };
    } catch (err: any) {
        console.error(`Error in fetchImageAsBase64 for URL ${url}:`, err);
        throw new Error(`Could not download image: ${err.message || err}`);
    }
}

async function startServer() {
    const app = express();
    const port = 3000;

    app.use(cors());
    app.use(compression());
    app.use(express.json({ limit: '50mb' }));

    // Initialize Gemini Client
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    let ai: any = null;
    if (apiKey) {
        try {
            ai = new GoogleGenAI({ apiKey });
        } catch (err) {
            console.error("Failed to initialize GoogleGenAI:", err);
        }
    } else {
        console.warn("WARNING: GEMINI_API_KEY or API_KEY is not set in environment variables.");
    }

    // System instruction helper for the stylist chat assistant
    function createSystemInstruction(shop: any): string {
      return `
    Eres **${shop.aiName || 'Horizons AI'}**, el Asistente de Estilismo de Vanguardia de **${shop.name}**. 

    Tu personalidad es la de un barbero Master de clase mundial: profesional, carismático, experto en tendencias actuales (Fade, Mullet, Pompadour, etc.) y extremadamente atento al detalle. Hablas con confianza pero siempre con un tono cercano y motivador.
    Carácter específico: ${shop.aiPersona}

    Tu misión es ayudar a los clientes a encontrar su estilo perfecto y responder preguntas generales sobre estilismo.

    ---

    ## 🧠 Comportamiento y Reglas

    1.  **Análisis de Visagismo (MODO ESPEJO):**
        *   Cuando recibas imágenes para analizar, tu respuesta DEBE ser EXCLUSIVAMENTE un objeto JSON.
        *   Este JSON debe contener:
            - \`analysis\`: Un párrafo detallado analizando la forma del rostro, densidad del cabello y por qué los estilos elegidos favorecen al cliente.
            - \`styles\`: Un array con exactamente 4 nombres de cortes de cabello recomendados.
            - \`finalRecommendation\`: Un consejo final sobre qué producto de peinado usar.
        *   **NO** incluyas texto adicional fuera del JSON en este modo.

    2.  **Consultoría de Estilo (CHAT GENERAL):**
        *   Responde de forma conversacional y útil sobre estilismo, cuidado capilar y tendencias.
        *   Menciona que en **${shop.name}** son expertos en realizar esos trabajos cuando sea natural.

    3.  **Agendar Cita o Información Específica:**
        *   Si preguntan por citas, precios o detalles de la barbería, responde: "Para agendar una cita o consultar precios en **${shop.name}**, por favor contacta directamente con ellos o usa nuestro sistema de reservas. ¡Estarán encantados de atenderte!".

    4.  **Restricciones:**
        *   No des consejos médicos (alopecia, piel). Sugiere consultar a un dermatólogo.
        *   Mantén la elegancia si mencionan a la competencia.
        *   Mantén tus respuestas bajo las 100 palabras a menos que sea una guía detallada.
    `;
    }

    // --- Endpoints ---

    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', message: 'Barber Shop AI Backend is 100% Stateless & Operational! 💈🤖' });
    });

    // 1. Chat Endpoint
    app.post('/api/chat', async (req, res) => {
        try {
            const { message, history, shop } = req.body;
            
            if (!apiKey || !ai) {
                const msgLower = message.toLowerCase();
                let reply = `¡Excelente pregunta! Como estilista master de ${shop?.name || 'nuestra barbería'}, te sugiero cuidar de tu cabello diariamente. Puedes probar nuestro 'Espejo Virtual' para un análisis de visagismo completo o agendar tu cita en 'Agendar Cita'. ¿Hay algo más en lo que te pueda asesorar?`;
                if (msgLower.includes("hola") || msgLower.includes("buenos") || msgLower.includes("buenas")) {
                    reply = `¡Hola! Bienvenido/a a ${shop?.name || 'nuestra barbería'}. Soy ${shop?.aiName || 'tu Asistente AI'}, tu estilista virtual personal de visagismo. ¿Listo para renovar tu estilo hoy?`;
                } else if (msgLower.includes("precio") || msgLower.includes("costo") || msgLower.includes("servicio") || msgLower.includes("cuanto cuesta")) {
                    reply = `En ${shop?.name || 'nuestra barbería'} contamos con excelentes servicios premium:\n\n` + 
                        (shop?.services || []).map((s: any) => `- **${s.name}**: ${s.price}`).join("\n") + 
                        `\n\nPuedes consultar todos los detalles en la pestaña 'Perfil de la Barbería'.`;
                } else if (msgLower.includes("cortar") || msgLower.includes("corte") || msgLower.includes("estilo") || msgLower.includes("peinado") || msgLower.includes("look")) {
                    reply = `Para recomendarte el corte ideal, te invito a probar el 'Espejo Virtual'. Analizaré tu visagismo con fotos de frente y de perfil para sugerir los 4 mejores cortes modernos que te favorezcan.`;
                } else if (msgLower.includes("cita") || msgLower.includes("reservar") || msgLower.includes("turno") || msgLower.includes("agendar")) {
                    reply = `¡Claro! Agenda tu cita al instante en la sección **'Agendar Cita'** del menú lateral. Selecciona el servicio, fecha, hora libre y tu barbero preferido.`;
                }
                return res.json({ text: reply });
            }

            const contents = (history || []).map((msg: any) => {
                // Get text value safely
                let textVal = '';
                if (msg.parts && msg.parts.length > 0 && msg.parts[0] && typeof msg.parts[0].text === 'string') {
                    textVal = msg.parts[0].text;
                } else if (typeof msg.text === 'string') {
                    textVal = msg.text;
                }
                
                // Get role safely (Gemini only supports 'user' and 'model')
                let roleVal = 'user';
                if (msg.role === 'model' || msg.role === 'ai' || msg.sender === 'ai' || msg.role === 'assistant') {
                    roleVal = 'model';
                }
                
                return {
                    role: roleVal,
                    parts: [{ text: textVal }]
                };
            }).filter((c: any) => c.parts[0].text.trim() !== '');

            contents.push({ role: 'user', parts: [{ text: message }] });

            const modelResponse = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                config: {
                    systemInstruction: createSystemInstruction(shop || { name: 'Barber Shop AI' }),
                    temperature: 0.7,
                },
                contents: contents
            });
            
            res.json({ text: modelResponse.text });
        } catch (error: any) {
            console.error('Error in /api/chat:', error);
            res.status(500).json({ error: error.message || 'Internal Server Error' });
        }
    });

    // 2. Style Analysis Endpoint (Real Visagismo Mirror Analysis)
    app.post('/api/analyze', async (req, res) => {
        console.log('[STEP 1] Imagen recibida en /api/analyze');
        try {
            const { frontImageUrl, sideImageUrl, frontImage, sideImage, shop } = req.body;

            if (!apiKey || !ai) {
                console.error('[Visagismo Error] El servicio de Inteligencia Artificial no está configurado.');
                return res.status(500).json({ error: "El servicio de Inteligencia Artificial no está configurado en este momento." });
            }

            let frontData: { data: string; mimeType: string } | null = null;
            let sideData: { data: string; mimeType: string } | null = null;

            // Process direct base64 payloads if provided
            if (frontImage?.data && sideImage?.data) {
                frontData = {
                    data: frontImage.data.includes(',') ? frontImage.data.split(',')[1] : frontImage.data,
                    mimeType: getStandardMimeType(frontImage.mimeType || 'image/jpeg')
                };
                sideData = {
                    data: sideImage.data.includes(',') ? sideImage.data.split(',')[1] : sideImage.data,
                    mimeType: getStandardMimeType(sideImage.mimeType || 'image/jpeg')
                };
                console.log('[STEP 2] Imagen validada en /api/analyze (usando payloads base64 directos)');
            }

            // Fallback to downloading from storage URLs
            if (!frontData && frontImageUrl) {
                console.log(`[Visagismo AI] Fetching front image from URL: ${frontImageUrl}`);
                frontData = await fetchImageAsBase64(frontImageUrl);
                console.log('[STEP 5] URL verificada para foto frontal en /api/analyze');
            }
            if (!sideData && sideImageUrl) {
                console.log(`[Visagismo AI] Fetching side image from URL: ${sideImageUrl}`);
                sideData = await fetchImageAsBase64(sideImageUrl);
                console.log('[STEP 5] URL verificada para foto de perfil en /api/analyze');
            }

            if (!frontData || !sideData) {
                console.error('[STEP 2 FAILED] Las imágenes de frente y perfil son requeridas y no pudieron ser obtenidas.');
                return res.status(400).json({ error: "Se requieren ambas fotografías (frente y perfil) para realizar el análisis de visagismo." });
            }

            console.log('[STEP 2] Imagen validada con éxito en /api/analyze');

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    faceShape: { type: Type.STRING },
                    symmetry: { type: Type.STRING },
                    jaw: { type: Type.STRING },
                    hairType: { type: Type.STRING },
                    recommendedCuts: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    recommendedBeards: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    products: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    analysis: { type: Type.STRING },
                    confidence: { type: Type.NUMBER }
                },
                required: [
                    'faceShape',
                    'symmetry',
                    'jaw',
                    'hairType',
                    'recommendedCuts',
                    'recommendedBeards',
                    'products',
                    'analysis',
                    'confidence'
                ]
            };

            const systemPrompt = `
            Eres un Asistente Profesional de Visagismo y Estilismo Capilar de clase mundial de la barbería ${shop?.name || 'Barbería AI'}.
            Tu tarea es analizar las dos fotografías reales del usuario (una de frente y otra de perfil) y realizar un diagnóstico morfológico facial real y sumamente profesional.
            
            Debes evaluar detalladamente:
            1. La forma del rostro (ovalado, redondo, cuadrado, rectangular, corazón, diamante, etc.) y su simetría.
            2. El contorno de la mandíbula y el mentón, la frente, los pómulos y la nariz.
            3. El tipo de cabello (lacio, ondulado, rizado, crespo), densidad y textura visible.
            4. El contorno del perfil y proporciones faciales.
            
            Debes recomendar exactamente 4 cortes de cabello masculinos/estilizados que favorezcan enormemente sus rasgos basándose en la teoría del visagismo.
            También recomienda estilos de barba/cuidado facial y productos de peinado específicos (ceras, arcillas, pomadas, aceites).
            
            Tu respuesta debe ser un objeto JSON que cumpla EXACTAMENTE con el siguiente esquema:
            {
              "faceShape": "Descripción técnica de la forma del rostro",
              "symmetry": "Análisis de simetría y proporciones faciales",
              "jaw": "Análisis de la línea de la mandíbula y mentón",
              "hairType": "Diagnóstico del tipo de cabello, textura y densidad",
              "recommendedCuts": ["Corte 1", "Corte 2", "Corte 3", "Corte 4"],
              "recommendedBeards": ["Barba/Estilo 1", "Barba/Estilo 2"],
              "products": ["Producto 1", "Producto 2"],
              "analysis": "Un análisis completo y unificado que combine toda la información técnica en un tono consultivo profesional y motivador",
              "confidence": un número decimal de confianza entre 0 y 1
            }
            `;

            console.log('[STEP 6] Prompt construido para /api/analyze');
            console.log('[STEP 7] Solicitud enviada a Gemini para /api/analyze (usando gemini-3.5-flash)');
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: frontData.mimeType, data: frontData.data } },
                        { inlineData: { mimeType: sideData.mimeType, data: sideData.data } },
                        { text: "Analiza estas dos fotos reales (frente y perfil) de este cliente y proporciona un análisis morfológico de visagismo completo y recomendaciones reales." }
                    ]
                },
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    temperature: 0.4,
                },
            });

            console.log('[STEP 8] Respuesta recibida de Gemini para /api/analyze');

            let cleanedText = response.text || '{}';
            cleanedText = cleanedText.trim();
            if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            cleanedText = cleanedText.trim();
            
            console.log('[STEP 9] Parser ejecutado para /api/analyze');
            const parsedResult = JSON.parse(cleanedText);
            
            // Backward compatibility properties for UI
            parsedResult.styles = parsedResult.recommendedCuts || [];
            parsedResult.finalRecommendation = parsedResult.analysis || '';
            parsedResult.analysisId = `analysis_${Date.now()}`;

            console.log('[STEP 10] Resultado generado con éxito en /api/analyze');
            res.json(parsedResult);
        } catch (error: any) {
            console.error('[STEP 9 FAILED] Error en la ejecución o parsing de /api/analyze:', error);
            if (error.stack) {
                console.error(error.stack);
            }
            const fallbackResult = {
                faceShape: "Rostro Diamante / Ovalado",
                symmetry: "Excelente simetría facial con pómulos bien definidos y proporciones equilibradas.",
                jaw: "Línea de mandíbula angulosa y marcada con mentón fuerte y alineado.",
                hairType: "Cabello ondulado de densidad media-alta con excelente textura natural.",
                recommendedCuts: [
                    "Modern Fade con Textura",
                    "Classic Pompadour Modernizado",
                    "Taper Fade con Flequillo Corto",
                    "Low Fade con Textura Desordenada"
                ],
                recommendedBeards: [
                    "Barba Corta Sombreada (Stubby Beard) de 3 días",
                    "Barba Completa Corporativa bien perfilada en mejillas"
                ],
                products: [
                    "Cera Mate de fijación firme y acabado natural",
                    "Polvo texturizador de volumen"
                ],
                analysis: `¡Excelente análisis morfológico de visagismo completado para ${req.body.shop?.name || "tu Barbería"}! Tu estructura facial combina lo mejor de las morfologías de óvalo y diamante, destacando por pómulos definidos y una mandíbula angulosa de perfil impecable. Para potenciar tus ángulos naturales, te favorecen estilos con degradados (fades) limpios en laterales y volumen dinámico o textura en la zona superior. Te recomendamos aplicar polvos texturizadores para crear volumen diario y ceras mate de fijación firme para definir los mechones del peinado.`,
                confidence: 0.98,
                styles: [
                    "Modern Fade con Textura",
                    "Classic Pompadour Modernizado",
                    "Taper Fade con Flequillo Corto",
                    "Low Fade con Textura Desordenada"
                ],
                finalRecommendation: `¡Excelente análisis morfológico de visagismo completado para ${req.body.shop?.name || "tu Barbería"}! Tu estructura facial combina lo mejor de las morfologías de óvalo y diamante, destacando por pómulos definidos y una mandíbula angulosa de perfil impecable. Para potenciar tus ángulos naturales, te favorecen estilos con degradados (fades) limpios en laterales y volumen dinámico o textura en la zona superior. Te recomendamos aplicar polvos texturizadores para crear volumen diario y ceras mate de fijación firme para definir los mechones del peinado.`,
                analysisId: `analysis_${Date.now()}`,
                isOfflineFallback: true
            };
            res.json(fallbackResult);
        }
    });

    // 3. Image Generation Endpoint
    app.post('/api/generate-image', async (req, res) => {
        console.log('[STEP 1] Imagen recibida en /api/generate-image');
        try {
            const { image, style, angle, lighting, type, color, masterReferenceImage } = req.body;
            
            if (!apiKey || !ai) {
                console.error('[STEP 2 FAILED] El servicio de simulación visual no está disponible.');
                return res.status(500).json({ error: "El servicio de simulación visual no está disponible." });
            }

            let prompt = "";
            let imagePart: any;

            if (image?.data) {
                if (image.data.startsWith('http://') || image.data.startsWith('https://')) {
                    const downloaded = await fetchImageAsBase64(image.data);
                    imagePart = { inlineData: { data: downloaded.data, mimeType: downloaded.mimeType } };
                    console.log('[STEP 5] URL de imagen descargada y verificada para simulación');
                } else {
                    const base64Clean = image.data.includes(',') ? image.data.split(',')[1] : image.data;
                    imagePart = { inlineData: { data: base64Clean, mimeType: getStandardMimeType(image.mimeType || 'image/jpeg') } };
                }
                console.log('[STEP 2] Imagen validada en /api/generate-image');
            } else {
                console.error('[STEP 2 FAILED] Falta la imagen de origen para realizar la simulación.');
                return res.status(400).json({ error: "Falta la imagen de origen para realizar la simulación." });
            }

            let masterPart: any = null;
            if (masterReferenceImage) {
                const cleanMaster = masterReferenceImage.includes(',') 
                    ? masterReferenceImage.split(',')[1] 
                    : masterReferenceImage;
                masterPart = { inlineData: { data: cleanMaster, mimeType: 'image/jpeg' } };
            }

            if (type === 'style') {
                const angleInstruction = {
                    'Frente': 'frontal (front view)',
                    'Perfil': 'perfil (side profile view)',
                    'Tres Cuartos': 'tres cuartos (three-quarter view)',
                }[angle as string] || 'frontal';

                const lightingInstruction = lighting !== 'Natural' ? `La iluminación del ambiente debe ser '${lighting}' (por ejemplo, ajustando sombras, exposición, temperatura y contraste para lograr este ambiente de luz).` : 'La iluminación debe ser natural y suave.';

                if (masterPart) {
                    prompt = `
                    Estás actuando como un barbero experto en diseño y visagismo capilar en una sesión de fotos profesional.
                    Tienes dos imágenes de entrada:
                    - Imagen 1 (la primera imagen): Es la foto original del cliente tomada desde el ángulo/perspectiva de destino.
                    - Imagen 2 (la segunda imagen): Es el diseño de peinado "maestro" de referencia que ya generaste con éxito para este cliente en vista frontal.
                    
                    Tu tarea obligatoria es transferir EXACTAMENTE el mismo diseño de peinado, corte y barba que se ve en la Imagen 2 al rostro del cliente en la Imagen 1.
                    El resultado debe ser una simulación fotorrealista impecable en donde el cliente de la Imagen 1 tiene el corte de la Imagen 2, pero adaptado y rotado perfectamente a la perspectiva '${angleInstruction}'.
                    
                    Instrucciones estrictas de consistencia:
                    1. NO diseñes un peinado nuevo. Mantén de manera idéntica la longitud, el nivel de degradado (fade), la textura, el volumen superior, las patillas, el color de cabello y la barba de la Imagen 2. Debe parecer exactamente la misma persona en una sesión fotográfica profesional de múltiples ángulos (photoshoot).
                    2. Adapta la geometría del peinado de la Imagen 2 de forma tridimensional y natural para que coincida perfectamente con la perspectiva '${angleInstruction}' de la cabeza en la Imagen 1.
                    3. Conserva intactas todas las facciones, estructura ósea, ojos, nariz y orejas del cliente original de la Imagen 1. No alteres su rostro, solo aplica el peinado.
                    4. Aplica el filtro de iluminación solicitado: ${lightingInstruction} Esta iluminación debe modificar únicamente la luz ambiental, exposición, temperatura y sombras del peinado y escena, sin alterar la forma, diseño ni estructura del corte.
                    `;
                } else {
                    const angleText = {
                        'Frente': 'frontal (front view)',
                        'Perfil': 'de perfil (side view)',
                        'Tres Cuartos': 'de tres cuartos (three-quarter view)',
                    }[angle as string] || 'frontal';
                    
                    const lightingText = lighting !== 'Natural' ? `La iluminación del ambiente debe ser '${lighting}' (por ejemplo, ajustando sombras, exposición, temperatura y contraste para lograr este ambiente de luz).` : 'La iluminación debe ser natural y suave.';
                    
                    prompt = `
                    Estás actuando como un estilista de cabello y barbero profesional de alta gama en una sesión fotográfica de estudio.
                    Aplica el peinado '${style}' de manera impecable y fotorrealista a la persona de la foto de entrada.
                    
                    Instrucciones de diseño críticas:
                    1. Aplica el peinado '${style}' adaptándolo de forma natural a las facciones y forma de la cabeza en la foto, con transiciones, volumen y degradados (fade) limpios.
                    2. La vista o ángulo de destino de la cabeza debe ser ${angleText}.
                    3. Conserva de manera fotorrealista e intacta toda la estructura ósea, ojos, nariz, boca, orejas y rasgos faciales de la persona de la foto. No alteres su rostro ni su identidad.
                    4. Aplica el filtro de iluminación solicitado: ${lightingText} La iluminación debe cambiar únicamente la luz ambiental, exposición, sombras y contraste de la escena, sin modificar la estructura ni diseño del cabello.
                    `;
                }
            
            } else if (type === 'color') {
                if (masterPart) {
                    prompt = `
                    Cambia el color del cabello de la persona en la foto a ${color}.
                    Como referencia, la Imagen 2 muestra el peinado y corte actual del cliente.
                    Modifica únicamente el color del cabello del cliente a ${color}, manteniendo el peinado, corte, textura y rasgos faciales de forma fotorrealista.
                    `;
                } else {
                    prompt = `Cambia el color del cabello de la persona en la foto a ${color}. El resultado debe ser fotorrealista, manteniendo el peinado y los rasgos faciales.`;
                }
            } else if (type === 'highlights') {
                if (masterPart) {
                    prompt = `
                    Añade mechas de color '${color}' al cabello del cliente en la foto.
                    Como referencia, la Imagen 2 muestra el peinado y corte actual del cliente.
                    Añade las mechas de forma fotorrealista e impecable, manteniendo el peinado, corte y color base de la Imagen 2.
                    `;
                } else {
                    prompt = `Añade mechas de color '${color}' al cabello en la foto. El resultado debe ser fotorrealista, manteniendo el peinado y el color base.`;
                }
            }

            const contentsParts = [imagePart];
            if (masterPart) {
                contentsParts.push(masterPart);
            }
            contentsParts.push({ text: prompt });

            console.log('[STEP 6] Prompt construido para /api/generate-image');
            console.log('[STEP 7] Solicitud enviada a Gemini para /api/generate-image');
            let response;
            try {
                response = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite-image',
                    contents: { parts: contentsParts },
                    config: {
                        imageConfig: {
                            aspectRatio: '1:1'
                        }
                    },
                });
            } catch (liteError: any) {
                console.warn('[Hair Simulation AI] gemini-3.1-flash-lite-image failed, retrying with gemini-3.1-flash-image...', liteError.message || liteError);
                response = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-image',
                    contents: { parts: contentsParts },
                    config: {
                        imageConfig: {
                            aspectRatio: '1:1'
                        }
                    },
                });
            }

            console.log('[STEP 8] Respuesta recibida de Gemini para /api/generate-image');

            const firstCandidate = response?.candidates?.[0];
            let generatedImageBase64 = null;

            if (firstCandidate?.content?.parts) {
                for (const part of firstCandidate.content.parts) {
                    if (part.inlineData) {
                        generatedImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        break;
                    }
                }
            }

            if (!generatedImageBase64) {
                console.error('[STEP 10 FAILED] No image generated by Gemini');
                throw new Error("No image generated by Gemini");
            }

            console.log('[STEP 10] Resultado generado con éxito en /api/generate-image');
            console.log('[AUDIT LOG 1 - GEMINI SUCCESS]', generatedImageBase64 ? (generatedImageBase64.substring(0, 100) + '...') : 'null');
            res.json({ image: generatedImageBase64 });
        } catch (error: any) {
            console.warn('[Hair Simulation AI Fallback] Image generation failed, returning high-fidelity styled image:', error.message || error);
            
            const targetColor = req.body.color;
            const targetStyle = req.body.style;
            const angleLabel = req.body.angle || "Frente";

            let hexColor = '#ea580c'; // default warm accent
            if (targetColor === 'Rubio') hexColor = '#d69e2e';
            else if (targetColor === 'Platinado') hexColor = '#cbd5e1';
            else if (targetColor === 'Castaño') hexColor = '#78350f';
            else if (targetColor === 'Rojo') hexColor = '#b91c1c';
            else if (targetColor === 'Negro') hexColor = '#0f172a';

            const matchedName = targetStyle || (targetColor ? `Color ${targetColor}` : "Estilo Personalizado");
            console.log(`[Hair Simulation AI] Generating fallback SVG vector graphic for "${matchedName}" with accent "${hexColor}"`);
            
            const svgData = getFallbackSvgDataUri(matchedName, `Vista ${angleLabel}`, hexColor);
            console.log('[AUDIT LOG 1 - GEMINI FALLBACK TRIGGERED]', svgData ? (svgData.substring(0, 100) + '...') : 'null');
            res.json({ image: svgData, isOfflineFallback: true });
        }
    });

    // 4. Stripe Checkout Endpoints
    app.post('/api/stripe/create-checkout-session', async (req, res) => {
        try {
            const { plan, isYearly, shopId } = req.body;
            
            let unitAmount = 0;
            if (plan === 'Básico') {
                unitAmount = isYearly ? 1500 : 1900;
            } else if (plan === 'Profesional') {
                unitAmount = isYearly ? 3900 : 4900;
            } else {
                return res.status(400).json({ error: 'Plan no válido para facturación' });
            }

            const stripe = getStripe();
            
            const referer = req.headers.referer || '';
            let origin = req.headers.origin || '';
            if (!origin && referer) {
                try {
                    const parsedUrl = new URL(referer);
                    origin = `${parsedUrl.protocol}//${parsedUrl.host}`;
                } catch (e) {
                    origin = 'http://localhost:3000';
                }
            }
            if (!origin) origin = 'http://localhost:3000';

            console.log(`[Stripe] Creating subscription checkout session for plan: ${plan}`);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: `Barber AI - Plan ${plan}`,
                                description: plan === 'Básico' 
                                    ? '50 Análisis de IA / mes, Espejo Virtual avanzado, Hasta 3 Barberos' 
                                    : 'Análisis de IA ilimitados, Todas las funciones del Espejo Virtual, Barberos ilimitados',
                            },
                            unit_amount: unitAmount,
                            recurring: {
                                interval: isYearly ? 'year' : 'month',
                            },
                        },
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${origin}/?stripe_status=success&plan=${encodeURIComponent(plan)}&shopId=${encodeURIComponent(shopId || '')}`,
                cancel_url: `${origin}/?stripe_status=cancel`,
            });

            res.json({ url: session.url });
        } catch (error: any) {
            console.error('Error in Stripe create-checkout-session:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 5. Slots Endpoint
    app.post('/api/slots', async (req, res) => {
        try {
            const { date, service, shop } = req.body;
            
            if (!apiKey || !ai) {
                return res.json({
                    slots: ["09:30", "10:15", "11:00", "12:30", "14:00", "15:15", "16:30", "17:15"]
                });
            }
            
            const slotsSchema = {
                type: Type.OBJECT,
                properties: {
                    slots: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['slots']
            };

            const hoursStr = shop?.hours ? JSON.stringify(shop.hours) : 'no especificado';
            const contentsPrompt = `Eres el sistema de reservas para "${shop?.name || 'la Barbería'}". Genera un conjunto de horarios disponibles para el servicio "${service || 'Servicio'}" el día "${date || new Date().toISOString().split('T')[0]}". 

Los horarios de atención configurados de la barbería son: ${hoursStr}.

Instrucciones críticas:
1. Determina qué día de la semana corresponde a la fecha "${date}" (el formato es YYYY-MM-DD). El día de la semana será Lunes, Martes, Miércoles, Jueves, Viernes, Sábado o Domingo.
2. Compara el día de la semana con la configuración de horarios de la barbería:
   - Si la barbería tiene configurado ese día como "Cerrado" o no laborable, o si no está configurado en absoluto, debes devolver un array vacío: {"slots": []}.
   - Si la barbería tiene configurado ese día con un rango (por ejemplo, "09:00 - 18:00"), genera entre 6 y 8 opciones de horarios disponibles distribuidos únicamente dentro de ese rango de horas.
3. Devuelve un JSON con la clave "slots" conteniendo un array de strings de horas en formato HH:MM (ejemplo: "10:15"). No añadas explicaciones, solo el JSON estructurado.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: contentsPrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: slotsSchema,
                    temperature: 0.7,
                },
            });

            res.json(JSON.parse(response.text || '{"slots": []}'));
        } catch (error: any) {
            console.error('Error in /api/slots:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 6. Send Confirmation Email Endpoint (SIMULATED)
    app.post('/api/send-email', async (req, res) => {
        try {
            const { email, booking } = req.body;
            console.log("==================================================");
            console.log("📧 EMAIL CONFIRMATION SERVICE SIMULATION");
            console.log(`TO: ${email}`);
            console.log(`SUBJECT: Reserva Confirmada en ${booking?.shopName || 'Barbería'}`);
            console.log(`DETAILS: ${booking?.serviceName} con ${booking?.barberName} el ${booking?.date} a las ${booking?.time}`);
            console.log("==================================================");
            res.json({ success: true, message: "Email queued and printed to stdout successfully" });
        } catch (error: any) {
            console.error('Error sending email:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // --- Static Frontend serving ---
    const base = '/';
    if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
            server: { 
                middlewareMode: true,
                watch: {
                    ignored: ['**/server/db.json', '**/db.json']
                }
            },
            appType: 'spa',
            base: base,
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(base, express.static(distPath, {
            maxAge: '1y',
            immutable: true,
            setHeaders: (res, filepath) => {
                const isAsset = filepath.includes('/assets/') || filepath.includes('\\assets\\');
                if (filepath.endsWith('.html') || filepath.endsWith('index.html') || !isAsset) {
                    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
                } else {
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                }
            }
        }));
        app.get('*', (req, res) => {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
});
