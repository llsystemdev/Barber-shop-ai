
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDb, hashPassword, generateSalt } from './database';
import Stripe from 'stripe';

dotenv.config();

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

async function startServer() {
    const app = express();
    const port = Number(process.env.PORT) || 3000;

    // Strip dynamic applet upload prefix from requests
    app.use((req, res, next) => {
        const match = req.url.match(/^\/upload\/[a-fA-F0-9-]{36}/);
        if (match) {
            req.url = req.url.substring(match[0].length) || '/';
        }
        next();
    });

    // Enable CORS and JSON body parsing (large limit for images)
    app.use(cors());
    app.use(express.json({ limit: '50mb' }) as any);

    // Initialize Gemini Client safely
    let ai: any = null;
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        console.warn("WARNING: GEMINI_API_KEY or API_KEY is not set in environment variables.");
    } else {
        try {
            ai = new GoogleGenAI({ apiKey });
        } catch (err) {
            console.error("Failed to initialize GoogleGenAI:", err);
        }
    }

    // Helper function for System Instructions
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

    // --- API Endpoints ---
    // IMPORTANT: All API routes MUST start with /api to distinguish from static files

    app.get('/api/health', (req, res) => {
        res.send('Barber Shop AI Backend is running! 💈🤖');
    });

    // --- Real Database Auth Endpoints ---

    // 1. Auth Register
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { email, password, name, role } = req.body;
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Faltan campos obligatorios' });
            }

            const db = await getDb();
            const lowerEmail = email.toLowerCase();
            const existingUser = db.users.find(u => u.email?.toLowerCase() === lowerEmail);
            if (existingUser) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            const salt = generateSalt();
            const passwordHash = hashPassword(password, salt);
            const userId = `user_${Date.now()}`;
            
            const newUser = {
                id: userId,
                name,
                email: lowerEmail,
                role: (role || 'shopOwner') as any,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
                passwordHash,
                salt,
                shopId: undefined as string | undefined
            };

            let defaultShop = null;
            if (newUser.role === 'shopOwner') {
                const shopId = `shop_${Date.now()}`;
                defaultShop = {
                    id: shopId,
                    ownerId: userId,
                    name: `${name} Barbería AI`,
                    aiName: 'Asistente AI',
                    welcomeMessage: '¡Hola! Bienvenido. Soy tu Asistente AI de Estilismo. ¿Qué estilo te gustaría ver hoy?',
                    aiPersona: 'Profesional, amable y experto en visagismo de cabello.',
                    description: 'Nueva barbería registrada y potenciada con Inteligencia Artificial.',
                    address: 'Calle del Estilo 123, Ciudad',
                    phone: '555-0199',
                    hours: { 'Lunes-Viernes': '09:00 - 18:00' },
                    gallery: [
                      'https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
                      'https://images.pexels.com/photos/2061821/pexels-photo-2061821.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                    ],
                    services: [{ name: 'Corte de Cabello Premium', price: '$25' }],
                    barbers: [{ name: name || 'Dueño', specialty: 'General', imageUrl: '' }],
                    plan: 'Freemium' as const,
                    billingHistory: [],
                    paymentMethod: { type: 'Visa' as const, last4: '0000', expiry: '00/00' }
                };
                db.shops.push(defaultShop);
                newUser.shopId = shopId;
            }

            db.users.push(newUser);
            await saveDb();

            res.json({
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    role: newUser.role,
                    avatarUrl: newUser.avatarUrl,
                    shopId: newUser.shopId
                }
            });
        } catch (error: any) {
            console.error('Error in /api/auth/register:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 2. Auth Login
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Faltan campos obligatorios' });
            }

            const db = await getDb();
            const lowerEmail = email.toLowerCase();
            const user = db.users.find(u => u.email?.toLowerCase() === lowerEmail);
            if (!user || !user.passwordHash || !user.salt) {
                return res.status(400).json({ error: 'Credenciales inválidas' });
            }

            const computedHash = hashPassword(password, user.salt);
            if (computedHash !== user.passwordHash) {
                return res.status(400).json({ error: 'Credenciales inválidas' });
            }

            res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    avatarUrl: user.avatarUrl,
                    shopId: user.shopId
                }
            });
        } catch (error: any) {
            console.error('Error in /api/auth/login:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 3. Auth Google URL: Devuelve la URL de autorización para el login de Google
    app.get('/api/auth/google/url', async (req, res) => {
        try {
            const redirect_uri = req.query.redirect_uri as string;
            const role = (req.query.role || 'shopOwner') as string;

            if (!redirect_uri) {
                return res.status(400).json({ error: 'Falta el parámetro obligatorio redirect_uri' });
            }

            const googleClientId = process.env.GOOGLE_CLIENT_ID;
            if (!googleClientId) {
                return res.status(400).json({ error: 'GOOGLE_CLIENT_ID no está configurado en el servidor' });
            }

            const params = new URLSearchParams({
                client_id: googleClientId,
                redirect_uri: redirect_uri,
                response_type: 'code',
                scope: 'openid email profile',
                access_type: 'offline',
                prompt: 'select_account',
                state: JSON.stringify({ role })
            });

            const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
            res.json({ url });
        } catch (error: any) {
            console.error('Error en /api/auth/google/url:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 4. Auth Google Callback: Procesa la redirección de Google con el código de autorización
    app.get(['/api/auth/google/callback', '/auth/google/callback'], async (req, res) => {
        try {
            const { code, state } = req.query;
            if (!code) {
                return res.status(400).send('Falta el código de autorización de Google.');
            }

            let role = 'shopOwner';
            try {
                if (state) {
                    const parsedState = JSON.parse(state as string);
                    if (parsedState.role) role = parsedState.role;
                }
            } catch (e) {
                console.warn('No se pudo analizar el estado de Google OAuth:', e);
            }

            const googleClientId = process.env.GOOGLE_CLIENT_ID;
            const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

            if (!googleClientId || !googleClientSecret) {
                return res.status(500).send('GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no están configurados en el servidor.');
            }

            // Reconstruir la redirect_uri exacta para el canje del código
            const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
            const host = req.headers['x-forwarded-host'] || req.headers.host;
            const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

            // Canjear el código por tokens
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code: code as string,
                    client_id: googleClientId,
                    client_secret: googleClientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code'
                }).toString()
            });

            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) {
                console.error('Error al canjear el código de Google:', tokenData);
                return res.status(400).send(`Error al canjear el código de Google: ${tokenData.error_description || tokenData.error}`);
            }

            const { access_token } = tokenData;

            // Obtener la información de perfil del usuario
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const userInfo = await userInfoRes.json();
            if (!userInfoRes.ok) {
                console.error('Error al obtener la información de Google:', userInfo);
                return res.status(400).send('Error al obtener la información del perfil del usuario.');
            }

            const { id: googleId, email, name, picture } = userInfo;
            if (!email) {
                return res.status(400).send('No se recibió el correo del usuario desde Google.');
            }

            const db = await getDb();
            const lowerEmail = email.toLowerCase();
            let user = db.users.find(u => u.email?.toLowerCase() === lowerEmail);

            if (!user) {
                const userId = `google-${googleId || crypto.randomBytes(8).toString('hex')}`;
                const shopId = `shop-${crypto.randomBytes(8).toString('hex')}`;

                user = {
                    id: userId,
                    name: name || 'Usuario de Google',
                    email: lowerEmail,
                    role: (role || 'shopOwner') as any,
                    avatarUrl: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'Google')}`,
                    shopId: role === 'shopOwner' ? shopId : undefined
                };

                if (role === 'shopOwner') {
                    const defaultShop = {
                        id: shopId,
                        ownerId: userId,
                        name: `Barbería de ${name || 'Google User'}`,
                        aiName: 'Leo, tu estilista AI',
                        welcomeMessage: `¡Hola! Soy Leo, tu estilista experto e Inteligencia Artificial de la Barbería. ¿Qué corte o estilo tienes en mente hoy? Sube una foto de tu rostro o de un corte que te guste y la analizamos de inmediato.`,
                        aiPersona: `un barbero Master de clase mundial: profesional, carismático, experto en tendencias actuales y extremadamente atento al detalle. Hablas con confianza pero siempre con un tono cercano y motivador.`,
                        description: 'Una barbería moderna con estilo de vanguardia.',
                        address: 'Calle Principal #123',
                        phone: '555-0199',
                        hours: {
                            'Lunes-Viernes': '9:00 AM - 8:00 PM',
                            'Sábados': '9:00 AM - 6:00 PM',
                            'Domingos': 'Cerrado'
                        },
                        gallery: [
                            'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',
                            'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600'
                        ],
                        services: [{ name: 'Corte de Cabello Premium', price: '$25' }],
                        barbers: [{ name: name || 'Dueño', specialty: 'General', imageUrl: '' }],
                        plan: 'Freemium' as const,
                        billingHistory: [],
                        paymentMethod: { type: 'Visa' as const, last4: '0000', expiry: '00/00' }
                    };
                    db.shops.push(defaultShop);
                }

                db.users.push(user);
                await saveDb();
            } else {
                let updated = false;
                if (name && user.name !== name) {
                    user.name = name;
                    updated = true;
                }
                if (picture && user.avatarUrl !== picture) {
                    user.avatarUrl = picture;
                    updated = true;
                }
                if (updated) {
                    await saveDb();
                }
            }

            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Autenticación Exitosa</title>
                </head>
                <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f9fafb; color: #111827;">
                    <div style="max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        <h2 style="color: #10B981; margin-top: 0;">¡Conectado con Google!</h2>
                        <p>Iniciando sesión en Barber Shop AI...</p>
                        <p style="font-size: 14px; color: #6B7280;">Esta ventana se cerrará automáticamente en un momento.</p>
                    </div>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'GOOGLE_AUTH_SUCCESS',
                                user: ${JSON.stringify({
                                    id: user.id,
                                    name: user.name,
                                    role: user.role,
                                    avatarUrl: user.avatarUrl,
                                    shopId: user.shopId
                                })}
                            }, '*');
                            window.close();
                        } else {
                            window.location.href = '/';
                        }
                    </script>
                </body>
                </html>
            `);

        } catch (error: any) {
            console.error('Error en /api/auth/google/callback:', error);
            res.status(500).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Error de Autenticación</title>
                </head>
                <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f9fafb; color: #111827;">
                    <div style="max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        <h2 style="color: #EF4444; margin-top: 0;">Error de Autenticación</h2>
                        <p>Ocurrió un error al iniciar sesión con Google.</p>
                        <p style="font-size: 14px; color: #EF4444;">${error.message}</p>
                        <button onclick="window.close()" style="margin-top: 15px; padding: 8px 16px; background: #EF4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Cerrar Ventana</button>
                   </div>
                </body>
                </html>
            `);
        }
    });

    // --- BarberShop REST Endpoints ---

    // 1. Get All Shops
    app.get('/api/shops', async (req, res) => {
        try {
            const db = await getDb();
            res.json(db.shops);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // 2. Get Shop for User
    app.get('/api/shops/user/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const db = await getDb();
            let shop = db.shops.find(s => s.ownerId === userId);
            
            // Fallback default shop owner binding
            if (!shop && userId === 'mock-user-owner') {
                shop = db.shops.find(s => s.id === '1');
            }

            res.json(shop || null);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // 3. Create Shop
    app.post('/api/shops', async (req, res) => {
        try {
            const shop = req.body;
            const db = await getDb();
            db.shops.push(shop);
            await saveDb();
            res.json({ data: shop, error: null });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // 4. Update Shop
    app.put('/api/shops/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            const db = await getDb();
            const index = db.shops.findIndex(s => s.id === id);
            if (index > -1) {
                db.shops[index] = { ...db.shops[index], ...updates };
                await saveDb();
                res.json({ success: true, shop: db.shops[index] });
            } else {
                res.status(404).json({ error: 'Barbería no encontrada' });
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // --- Booking REST Endpoints ---

    // 1. Get Bookings for a Shop
    app.get('/api/bookings/shop/:shopNameOrId', async (req, res) => {
        try {
            const { shopNameOrId } = req.params;
            const db = await getDb();
            const filtered = db.bookings.filter(b => b.shopName === shopNameOrId || b.id === shopNameOrId);
            res.json(filtered);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // 2. Save New Booking
    app.post('/api/bookings', async (req, res) => {
        try {
            const booking = req.body;
            const db = await getDb();
            const newBooking = {
                id: `booking_${Date.now()}`,
                ...booking,
                createdAt: new Date().toISOString()
            };
            db.bookings.push(newBooking);
            await saveDb();
            res.json({ data: newBooking, error: null });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // 1. Chat Endpoint
    app.post('/api/chat', async (req, res) => {
        try {
            const { message, history, shop } = req.body;
            
            if (!apiKey || !ai) {
                const msgLower = message.toLowerCase();
                let reply = `¡Excelente pregunta! Como estilista master de ${shop.name}, te sugiero cuidar de tu cabello diariamente. Puedes probar nuestro 'Espejo Virtual' para un análisis de visagismo completo o agendar tu cita en 'Agendar Cita'. ¿Hay algo más en lo que te pueda asesorar?`;
                if (msgLower.includes("hola") || msgLower.includes("buenos") || msgLower.includes("buenas")) {
                    reply = `¡Hola! Bienvenido/a a ${shop.name}. Soy ${shop.aiName || 'tu Asistente AI'}, tu estilista virtual personal de visagismo. ¿Listo para renovar tu estilo hoy?`;
                } else if (msgLower.includes("precio") || msgLower.includes("costo") || msgLower.includes("servicio") || msgLower.includes("cuanto cuesta")) {
                    reply = `En ${shop.name} contamos con excelentes servicios premium:\n\n` + 
                        shop.services.map((s: any) => `- **${s.name}**: ${s.price}`).join("\n") + 
                        `\n\nPuedes consultar todos los detalles en la pestaña 'Perfil de la Barbería'.`;
                } else if (msgLower.includes("cortar") || msgLower.includes("corte") || msgLower.includes("estilo") || msgLower.includes("peinado") || msgLower.includes("look")) {
                    reply = `Para recomendarte el corte ideal, te invito a probar el 'Espejo Virtual'. Analizaré tu visagismo con fotos de frente y de perfil para sugerir los 4 mejores cortes modernos que te favorezcan.`;
                } else if (msgLower.includes("cita") || msgLower.includes("reservar") || msgLower.includes("turno") || msgLower.includes("agendar")) {
                    reply = `¡Claro! Agenda tu cita al instante en la sección **'Agendar Cita'** del menú lateral. Selecciona el servicio, fecha, hora libre y tu barbero preferido.`;
                }
                return res.json({ text: reply });
            }

            const contents = history.map((msg: any) => ({
                role: msg.role,
                parts: [{ text: msg.parts[0].text }]
            }));

            contents.push({ role: 'user', parts: [{ text: message }] });

            const model = ai.models.generateContent({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: createSystemInstruction(shop),
                    temperature: 0.7,
                },
                contents: contents
            });
            
            const response = await model;
            res.json({ text: response.text });
        } catch (error: any) {
            console.error('Error in /api/chat:', error);
            res.status(500).json({ error: error.message || 'Internal Server Error' });
        }
    });

    // 2. Style Analysis Endpoint
    app.post('/api/analyze', async (req, res) => {
        try {
            const { frontImage, sideImage, shop } = req.body;

            if (!apiKey || !ai) {
                return res.json({
                    styles: [
                        "Modern Fade con Textura",
                        "Classic Pompadour Modernizado",
                        "Taper Fade con Flequillo Corto",
                        "Low Fade con Textura Desordenada"
                    ],
                    finalRecommendation: `Basado en la estructura de tu rostro y el contorno de tus facciones, un corte con degradado (Fade) acentuará tu línea de la mandíbula aportando definición y carácter. Recomendamos usar cera mate (Clay) de fijación fuerte para peinar el cabello superior hacia adelante o hacia un lado para lograr el máximo dinamismo y textura.`
                });
            }

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    styles: {
                        type: Type.ARRAY,
                        description: 'Una lista de exactamente 4 nombres de estilos de corte de cabello recomendados.',
                        items: { type: Type.STRING }
                    },
                    finalRecommendation: {
                        type: Type.STRING,
                        description: 'Una recomendación final y concluyente.'
                    }
                },
                required: ['styles', 'finalRecommendation']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: frontImage.mimeType, data: frontImage.data } },
                        { inlineData: { mimeType: sideImage.mimeType, data: sideImage.data } },
                        { text: "Analiza estas dos fotos (frente y perfil) de un cliente. Recomienda 4 estilos y una recomendación final. Responde solo con JSON." }
                    ]
                },
                config: {
                    systemInstruction: createSystemInstruction(shop),
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    temperature: 0.5,
                },
            });

            res.json(JSON.parse(response.text || '{}'));
        } catch (error: any) {
            console.error('Error in /api/analyze:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 3. Image Generation Endpoint
    app.post('/api/generate-image', async (req, res) => {
        try {
            const { image, style, angle, lighting, type, color } = req.body; // type: 'style', 'color', 'highlights'
            
            if (!apiKey || !ai) {
                const stylePhotos: { [key: string]: string } = {
                    "Modern Fade con Textura": "https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=800",
                    "Classic Pompadour Modernizado": "https://images.pexels.com/photos/2061821/pexels-photo-2061821.jpeg?auto=compress&cs=tinysrgb&w=800",
                    "Taper Fade con Flequillo Corto": "https://images.pexels.com/photos/897251/pexels-photo-897251.jpeg?auto=compress&cs=tinysrgb&w=800",
                    "Low Fade con Textura Desordenada": "https://images.pexels.com/photos/1805600/pexels-photo-1805600.jpeg?auto=compress&cs=tinysrgb&w=800"
                };
                const coloredPhotos: { [key: string]: string } = {
                    "Rubio": "https://images.pexels.com/photos/3160453/pexels-photo-3160453.jpeg?auto=compress&cs=tinysrgb&w=800",
                    "Platinado": "https://images.pexels.com/photos/3160453/pexels-photo-3160453.jpeg?auto=compress&cs=tinysrgb&w=800",
                    "Castaño": "https://images.pexels.com/photos/897251/pexels-photo-897251.jpeg?auto=compress&cs=tinysrgb&w=800",
                    "Rojo": "https://images.pexels.com/photos/853427/pexels-photo-853427.jpeg?auto=compress&cs=tinysrgb&w=800",
                    "Negro": "https://images.pexels.com/photos/1805600/pexels-photo-1805600.jpeg?auto=compress&cs=tinysrgb&w=800"
                };

                let imgUrl = stylePhotos[style] || stylePhotos["Modern Fade con Textura"];
                if (type === 'color' && color && coloredPhotos[color]) {
                    imgUrl = coloredPhotos[color];
                } else if (type === 'highlights' && color && coloredPhotos[color]) {
                    imgUrl = coloredPhotos[color];
                }
                return res.json({ image: imgUrl });
            }

            let prompt = "";
            const imagePart = { inlineData: { data: image.data, mimeType: image.mimeType } };

            if (type === 'style') {
                const angleInstruction = {
                    'Frente': 'desde un ángulo frontal (front view)',
                    'Perfil': 'desde un ángulo de perfil (side view)',
                    'Tres Cuartos': 'desde un ángulo de tres cuartos (three-quarter view)',
                }[angle as string] || 'frontal';
                
                const lightingInstruction = lighting !== 'Natural' ? `La iluminación debe ser '${lighting}'.` : '';
                prompt = `Aplica el siguiente peinado a la persona en la foto: '${style}'. La vista debe ser ${angleInstruction}. ${lightingInstruction} El resultado debe ser fotorrealista, cambiando solo el cabello.`;
            
            } else if (type === 'color') {
                prompt = `Cambia el color del cabello de la persona en la foto a ${color}. El resultado debe ser fotorrealista, manteniendo el peinado y los rasgos faciales.`;
            } else if (type === 'highlights') {
                prompt = `Añade mechas de color '${color}' al cabello en la foto. El resultado debe ser fotorrealista, manteniendo el peinado y el color base.`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, { text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

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
                throw new Error("No image generated");
            }

            res.json({ image: generatedImageBase64 });

        } catch (error: any) {
            console.error('Error in /api/generate-image:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // --- Stripe Checkout Endpoints ---
    app.post('/api/stripe/create-checkout-session', async (req, res) => {
        try {
            const { plan, isYearly, shopId } = req.body;
            
            // Map plan to pricing
            let unitAmount = 0;
            if (plan === 'Básico') {
                unitAmount = isYearly ? 1500 : 1900; // $15 or $19 in cents
            } else if (plan === 'Profesional') {
                unitAmount = isYearly ? 3900 : 4900; // $39 or $49 in cents
            } else {
                return res.status(400).json({ error: 'Plan no válido para facturación' });
            }

            const stripe = getStripe();
            
            // Get original requester's host/referrer to redirect back
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

            console.log(`[Stripe] Creating checkout session for plan: ${plan}, amount: ${unitAmount}, origin: ${origin}`);

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
                success_url: `${origin}/?stripe_status=success&plan=${encodeURIComponent(plan)}&shopId=${encodeURIComponent(shopId)}`,
                cancel_url: `${origin}/?stripe_status=cancel`,
            });

            res.json({ url: session.url });
        } catch (error: any) {
            console.error('Error in /api/stripe/create-checkout-session:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 4. Slots Endpoint
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

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Eres el sistema de reservas para "${shop.name}". Genera horarios disponibles para "${service}" el "${date}". Devuelve JSON con clave "slots".`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: slotsSchema,
                    temperature: 1,
                },
            });

            res.json(JSON.parse(response.text || '{}'));
        } catch (error: any) {
            console.error('Error in /api/slots:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 5. Send Confirmation Email Endpoint (SIMULATED)
    app.post('/api/send-email', async (req, res) => {
        try {
            const { email, booking } = req.body;
            
            console.log("==================================================");
            console.log("📧 EMAIL SERVICE SIMULATION");
            console.log(`TO: ${email}`);
            console.log("==================================================");
            res.json({ success: true, message: "Email queued successfully" });
        } catch (error: any) {
            console.error('Error sending email:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // --- Static Frontend Serving ---
    const base = '/';
    if (process.env.NODE_ENV !== 'production') {
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
        app.use(base, express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    // Listen on port
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
});
