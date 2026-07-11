
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import fs from 'fs/promises';
import { getDb, saveDb, hashPassword, generateSalt, firestore, storageBucket, firebaseConfig, isFirestoreReady, disableFirestore } from './database';
import { collection, addDoc } from 'firebase/firestore';
import Stripe from 'stripe';

// Global error handlers to prevent container crashes on unhandled exceptions (which cause 503 errors)
process.on('uncaughtException', (error) => {
    console.error('[CRITICAL SEVERE] Uncaught Exception:', error?.message || error, error?.stack || '');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL SEVERE] Unhandled Rejection at:', promise, 'reason:', reason);
});

// A highly robust fetch wrapper with native https fallback for maximum environment compatibility
async function safeFetch(url: string, options: any = {}): Promise<any> {
    const timeout = options.timeout || 10000;
    
    // Check if standard global fetch is available
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
            // If it was an abort/timeout error or if global fetch failed, try the robust https fallback
            console.warn(`[safeFetch] Global fetch failed for ${url}, attempting native HTTPS fallback...`, fetchError.message || fetchError);
        }
    }

    // Native HTTPS module fallback
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

            req.on('error', (err) => {
                reject(err);
            });

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

// Enterprise Layer Imports
import { securityHeaders, sanitizeInput, rateLimiter, validateImageUpload } from './security';
import { logAuditEvent, detectAnomalies } from './audit';
import { getAllTickets, createTicket, addTicketMessage, updateTicketStatus, knowledgeBase } from './support';
import { saveUserConsent, getUserConsents, exportUserData, eraseUserData } from './compliance';

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
    const port = process.env.NODE_ENV === 'production'
        ? (Number(process.env.PORT) || 3000)
        : 3000;

    // Enterprise Security Headers
    app.use(securityHeaders);

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
    
    // Serve uploaded images statically
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    
    // Enterprise Input Sanitization
    app.use(sanitizeInput);

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
    app.post('/api/auth/register', rateLimiter({ windowMs: 15 * 60 * 1000, max: 10, message: 'Demasiadas cuentas creadas desde esta IP. Intente de nuevo más tarde.' }), async (req, res) => {
        try {
            const { email, password, name, role } = req.body;
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Faltan campos obligatorios' });
            }

            const db = await getDb();
            const lowerEmail = email.toLowerCase();
            const existingUser = db.users.find(u => u.email?.toLowerCase() === lowerEmail);
            if (existingUser) {
                await logAuditEvent('warn', 'REGISTRATION_ATTEMPT_DUPLICATE', `Intento de registro con email duplicado: ${lowerEmail}`, req.ip);
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

            await logAuditEvent('success', 'USER_REGISTRATION', `Nuevo usuario registrado con éxito: ${lowerEmail} (${newUser.role})`, req.ip, lowerEmail);

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

    // 1b. Sync Firebase Authenticated User
    app.post('/api/auth/sync-firebase-user', async (req, res) => {
        try {
            const { user } = req.body;
            if (!user || !user.id) {
                return res.status(400).json({ error: 'Faltan datos de usuario para sincronización' });
            }

            const db = await getDb();
            let index = db.users.findIndex(u => u.id === user.id);
            let mergedUser;

            if (index > -1) {
                // Update existing user profile, keeping their assigned shopId if any
                mergedUser = { ...db.users[index], ...user };
                db.users[index] = mergedUser;
            } else {
                // Create user profile
                mergedUser = {
                    ...user,
                    shopId: undefined as string | undefined
                };

                // Automatically provision a barber shop for newly registered SaaS owners
                if (mergedUser.role === 'shopOwner') {
                    const shopId = `shop_${Date.now()}`;
                    const defaultShop = {
                        id: shopId,
                        ownerId: mergedUser.id,
                        name: `${mergedUser.name} Barbería AI`,
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
                        barbers: [{ name: mergedUser.name || 'Dueño', specialty: 'General', imageUrl: '' }],
                        plan: 'Freemium' as const,
                        billingHistory: [],
                        paymentMethod: { type: 'Visa' as const, last4: '0000', expiry: '00/00' }
                    };
                    db.shops.push(defaultShop);
                    mergedUser.shopId = shopId;
                }

                db.users.push(mergedUser);
            }

            await saveDb();
            await logAuditEvent('success', 'USER_SYNC', `Sincronización de usuario Firebase exitosa: ${mergedUser.email}`, req.ip, mergedUser.email);
            
            res.json({ success: true, user: mergedUser });
        } catch (error: any) {
            console.error('Error in /api/auth/sync-firebase-user:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 2. Auth Login
    app.post('/api/auth/login', rateLimiter({ windowMs: 10 * 60 * 1000, max: 10, message: 'Demasiados intentos de inicio de sesión. Intente más tarde.' }), async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Faltan campos obligatorios' });
            }

            const db = await getDb();
            const lowerEmail = email.toLowerCase();
            const user = db.users.find(u => u.email?.toLowerCase() === lowerEmail);
            if (!user || !user.passwordHash || !user.salt) {
                await logAuditEvent('warn', 'AUTH_FAILURE', `Intento de login fallido para usuario inexistente: ${lowerEmail}`, req.ip);
                return res.status(400).json({ error: 'Credenciales inválidas' });
            }

            const computedHash = hashPassword(password, user.salt);
            if (computedHash !== user.passwordHash) {
                await logAuditEvent('warn', 'AUTH_FAILURE', `Contraseña incorrecta para usuario: ${lowerEmail}`, req.ip, lowerEmail);
                return res.status(400).json({ error: 'Credenciales inválidas' });
            }

            await logAuditEvent('success', 'AUTH_SUCCESS', `Inicio de sesión exitoso: ${lowerEmail}`, req.ip, lowerEmail);

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
            const redirect_uri = (req.query.redirect_uri as string) || (req.query.callback as string);
            const role = (req.query.role || 'shopOwner') as string;

            if (!redirect_uri) {
                return res.status(400).json({ error: 'Falta el parámetro obligatorio redirect_uri o callback' });
            }

            const googleClientId = process.env.GOOGLE_CLIENT_ID;
            if (!googleClientId) {
                return res.status(400).json({ error: 'GOOGLE_CLIENT_ID no está configurado en el servidor' });
            }

            // Usar la redirect_uri recibida directamente sin reescrituras forzadas para soportar dominios personalizados con el Client ID del usuario
            const finalRedirectUri = redirect_uri;

            const params = new URLSearchParams({
                client_id: googleClientId,
                redirect_uri: finalRedirectUri,
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

            // Reconstruir la redirect_uri exacta basándonos en la petición actual para que coincida dinámicamente con el dominio que originó la autenticación
            const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
            const host = req.headers['x-forwarded-host'] || req.headers.host || '';
            const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

            // Canjear el código por tokens
            const tokenRes = await safeFetch('https://oauth2.googleapis.com/token', {
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
            const userInfoRes = await safeFetch('https://www.googleapis.com/oauth2/v2/userinfo', {
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
                        // Guardar en localStorage de todos modos, ya que comparten dominio y así es más robusto
                        try {
                            localStorage.setItem('mock_user_session', JSON.stringify(${JSON.stringify({
                                id: user.id,
                                name: user.name,
                                role: user.role,
                                avatarUrl: user.avatarUrl,
                                shopId: user.shopId
                            })}));
                            localStorage.setItem('userRole', '${user.role}');
                        } catch (e) {
                            console.error('Error guardando en localStorage:', e);
                        }

                        if (window.opener) {
                            try {
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
                            } catch (e) {
                                console.error('Error enviando postMessage:', e);
                            }
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
                model: 'gemini-3.5-flash',
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

    // Helper to fetch image from URL and return base64 with mimeType
    async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
        try {
            if (url.startsWith('data:')) {
                const match = url.match(/^data:([^;]+);base64,(.+)$/);
                if (match) {
                    return { mimeType: match[1], data: match[2] };
                }
            }
            
            // Robust local relative path handling
            if (url.startsWith('/') || !url.startsWith('http')) {
                console.log(`[Visagismo AI] Detectada ruta local/relativa, cargando directamente de disco: ${url}`);
                const fileName = url.split('/').pop()!;
                const filePath = path.join(process.cwd(), 'uploads', fileName);
                const buffer = await fs.readFile(filePath);
                const fileExtension = fileName.split('.').pop() || 'jpeg';
                const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
                const data = buffer.toString('base64');
                return { data, mimeType };
            }

            const res = await safeFetch(url);
            if (!res.ok) {
                throw new Error(`Fallo al descargar la imagen de la URL: ${res.statusText}`);
            }
            const arrayBuffer = await res.arrayBuffer();
            const mimeType = res.headers.get('content-type') || 'image/jpeg';
            const data = Buffer.from(arrayBuffer).toString('base64');
            return { data, mimeType };
        } catch (err: any) {
            console.error(`Error en fetchImageAsBase64 para la URL ${url}:`, err);
            throw new Error(`No se pudo obtener o procesar la imagen de origen: ${err.message || err}`);
        }
    }

    // Helper to upload base64 to Firebase Storage on the backend
    async function uploadBase64ToStorageBackend(base64: string, shopId: string, bucketType: string): Promise<string> {
        try {
            const match = base64.match(/^data:([^;]+);base64,(.+)$/);
            if (!match) {
                return base64; // Not a base64 data URI, return as is
            }

            const mimeType = match[1];
            const base64Data = match[2];
            const buffer = Buffer.from(base64Data, 'base64');

            const fileExtension = mimeType.split('/')[1] || 'jpg';
            const randomId = crypto.randomBytes(6).toString('hex');
            const targetFolder = bucketType === 'galery' ? 'haircuts' : 'avatars';
            const fileName = `${targetFolder}/${shopId}/${Date.now()}-${randomId}.${fileExtension}`;

            // Attempt Firebase Storage if available
            if (storageBucket) {
                try {
                    const fileRef = storageBucket.file(fileName);
                    await fileRef.save(buffer, {
                        metadata: {
                            contentType: mimeType,
                        }
                    });

                    // Try to make public
                    try {
                        await fileRef.makePublic();
                    } catch (makePublicErr) {
                        console.warn('[Backend Upload] Could not make public, continuing:', makePublicErr);
                    }

                    // Generate direct public Firebase Storage URL format
                    const bucketName = storageBucket.name;
                    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media`;

                    try {
                        // Try to get a signed URL with a long expiration
                        const [signedUrl] = await fileRef.getSignedUrl({
                            action: 'read',
                            expires: '01-01-2036',
                        });
                        console.log(`[Backend Upload] Generated signed URL successfully: ${signedUrl}`);
                        return signedUrl;
                    } catch (signedErr) {
                        console.warn('[Backend Upload] getSignedUrl failed, falling back to public URL:', signedErr);
                        return publicUrl;
                    }
                } catch (error: any) {
                    console.warn('[Backend Upload] Firebase Storage write failed. Falling back to secure local file storage:', error.message || error);
                }
            }

            // Local Filesystem Storage Fallback (Guarantees database is kept clean under 1MB limit)
            try {
                const uploadsDir = path.join(process.cwd(), 'uploads');
                const targetPath = path.join(uploadsDir, targetFolder, shopId);
                const localFileName = `${Date.now()}-${randomId}.${fileExtension}`;
                const fullFilePath = path.join(targetPath, localFileName);

                // Ensure directory exists
                await fs.mkdir(targetPath, { recursive: true });
                
                // Write file
                await fs.writeFile(fullFilePath, buffer);
                console.log(`[Backend Upload] Successfully saved file locally: ${fullFilePath}`);

                // Return relative route handled by static middleware
                return `/uploads/${targetFolder}/${shopId}/${localFileName}`;
            } catch (localError: any) {
                console.error('[Backend Upload] Local filesystem backup storage failed:', localError);
                return base64; // Absolute worst case fallback
            }
        } catch (error: any) {
            console.error('[Backend Upload Exception]', error);
            return base64;
        }
    }

    // Endpoint to upload base64 image from client (handles bypass of storage rules and custom domains)
    app.post('/api/upload', async (req, res) => {
        try {
            const { base64, shopId, bucket } = req.body;
            if (!base64) {
                return res.status(400).json({ error: 'No se recibieron datos de imagen' });
            }
            const url = await uploadBase64ToStorageBackend(base64, shopId || 'default_shop', bucket || 'galery');
            res.json({ url });
        } catch (error: any) {
            console.error('[API Upload Error]', error);
            res.status(500).json({ error: error.message || 'Error al subir imagen' });
        }
    });

    // 2. Style Analysis Endpoint (Real Visagismo Mirror Analysis)
    app.post('/api/analyze', async (req, res) => {
        try {
            const { frontImageUrl, sideImageUrl, frontImage, sideImage, shop, userId } = req.body;

            if (!apiKey || !ai) {
                return res.status(500).json({ error: "No fue posible completar el análisis. Inténtalo nuevamente." });
            }

            let frontData: { data: string; mimeType: string } | null = null;
            let sideData: { data: string; mimeType: string } | null = null;

            try {
                // 1. Try direct base64 payloads if provided
                if (frontImage && sideImage) {
                    console.log('[Visagismo AI] Procesando imágenes base64 recibidas directamente.');
                    frontData = {
                        data: frontImage.data,
                        mimeType: frontImage.mimeType || 'image/jpeg'
                    };
                    sideData = {
                        data: sideImage.data,
                        mimeType: sideImage.mimeType || 'image/jpeg'
                    };
                }

                // 2. Fallback to downloading from storage URLs
                if (!frontData || !sideData) {
                    if (frontImageUrl && sideImageUrl) {
                        try {
                            console.log(`[Visagismo AI] Cargando/Descargando imágenes: Frontal: ${frontImageUrl}, Perfil: ${sideImageUrl}`);
                            if (!frontData) frontData = await fetchImageAsBase64(frontImageUrl);
                            if (!sideData) sideData = await fetchImageAsBase64(sideImageUrl);
                        } catch (downloadError) {
                            console.warn('[Visagismo AI] Error cargando imágenes por URL, intentando respaldo...', downloadError);
                        }
                    }
                }

                // 3. Fallback to direct parsing if URLs themselves are base64-encoded strings
                if (!frontData && frontImageUrl && frontImageUrl.startsWith('data:')) {
                    frontData = await fetchImageAsBase64(frontImageUrl);
                }
                if (!sideData && sideImageUrl && sideImageUrl.startsWith('data:')) {
                    sideData = await fetchImageAsBase64(sideImageUrl);
                }

                if (!frontData || !sideData) {
                    return res.status(400).json({ error: "Se requieren ambas fotografías en un formato válido para realizar el análisis." });
                }
            } catch (downloadError: any) {
                console.error('[Visagismo AI] Error procesando o descargando imágenes:', downloadError);
                return res.status(500).json({ 
                    error: "No fue posible completar el análisis. Inténtalo nuevamente.",
                    details: `Error al procesar imágenes: ${downloadError.message || downloadError}`
                });
            }

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    analysisId: { type: Type.STRING },
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
            
            Debes recomendar exactamente 4 cortes de cabello masculinos/estilizados que favorezcan enormemente sus rasgos basándote en la teoría del visagismo.
            También recomienda estilos de barba/cuidado facial y productos de peinado específicos (ceras, arcillas, pomadas, aceites).
            
            Tu respuesta debe ser un objeto JSON que cumpla EXACTAMENTE con el siguiente esquema:
            {
              "analysisId": "ID único generado",
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
            
            No inventes datos. Si no puedes ver las facciones con claridad, realiza la mejor estimación posible basada en las siluetas visibles y refléjalo en el nivel de confianza.
            `;

            console.log('[Visagismo AI] Enviando imágenes a Gemini 3.5 Flash para un análisis real...');
            const startTime = Date.now();
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

            const responseTimeMs = Date.now() - startTime;
            console.log(`[Visagismo AI] Análisis completado con éxito en ${responseTimeMs}ms`);

            const parsedResult = JSON.parse(response.text || '{}');
            
            // Backward compatibility with older frontend variables
            parsedResult.styles = parsedResult.recommendedCuts || [];
            parsedResult.finalRecommendation = parsedResult.analysis || '';

            // Durable Cloud Persistence: Save the real analysis to Firestore if active
            if (isFirestoreReady()) {
                try {
                    const docRef = await addDoc(collection(firestore!, 'analyses'), {
                        userId: userId || 'guest',
                        timestamp: new Date().toISOString(),
                        frontImageUrl: frontImageUrl || 'base64_upload',
                        sideImageUrl: sideImageUrl || 'base64_upload',
                        result: parsedResult,
                        model: 'gemini-3.5-flash',
                        responseTimeMs,
                        confidence: parsedResult.confidence || 0.95
                    });
                    console.log(`[Visagismo AI] Análisis registrado exitosamente en Firestore con ID: ${docRef.id}`);
                    parsedResult.analysisId = docRef.id;
                } catch (dbError: any) {
                    const errMsg = dbError?.message || String(dbError);
                    if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('insufficient permissions') || errMsg.includes('7')) {
                        disableFirestore();
                        console.warn('[Visagismo AI] Permission denied writing to Firestore. Disabled cloud sync, falling back securely to Local Mode.');
                    } else {
                        console.warn('[Visagismo AI] Error al registrar análisis en Firestore:', errMsg);
                    }
                }
            }

            res.json(parsedResult);
        } catch (error: any) {
            console.error('Error in /api/analyze:', error);
            res.status(500).json({ 
                error: "No fue posible completar el análisis. Inténtalo nuevamente.",
                details: `Error en análisis: ${error.message || error}`,
                stack: error.stack
            });
        }
    });

    // 3. Image Generation Endpoint
    app.post('/api/generate-image', async (req, res) => {
        try {
            const { image, style, angle, lighting, type, color, masterReferenceImage } = req.body; // type: 'style', 'color', 'highlights'
            
            if (!apiKey || !ai) {
                return res.status(500).json({ error: "No fue posible generar la simulación de estilo. Inténtalo nuevamente." });
            }

            let prompt = "";
            let imagePart: any;
            if (image && image.data && (image.data.startsWith('http://') || image.data.startsWith('https://'))) {
                console.log(`[Hair Simulation AI] Descargando imagen origen de Storage URL: ${image.data}`);
                const downloaded = await fetchImageAsBase64(image.data);
                imagePart = { inlineData: { data: downloaded.data, mimeType: downloaded.mimeType } };
            } else {
                imagePart = { inlineData: { data: image.data, mimeType: image.mimeType } };
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

            console.log(`[Hair Simulation AI] Generando imagen con prompt: "${prompt.slice(0, 150)}..." usando gemini-3.1-flash-lite-image...`);
            let response;
            try {
                response = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite-image',
                    contents: { parts: contentsParts },
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                });
            } catch (liteError: any) {
                console.warn('[Hair Simulation AI] Falló con gemini-3.1-flash-lite-image, reintentando con gemini-3.1-flash-image...', liteError.message || liteError);
                response = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-image',
                    contents: { parts: contentsParts },
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                });
            }

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
                throw new Error("No image generated by Gemini");
            }

            console.log('[Hair Simulation AI] Simulación de peinado generada con éxito.');
            res.json({ image: generatedImageBase64 });

        } catch (error: any) {
            console.error('Error in /api/generate-image:', error);
            res.status(500).json({ error: "No fue posible generar la simulación de estilo. Inténtalo nuevamente." });
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

            const shopName = shop?.name || 'la Barbería';
            const serviceName = service || 'Servicio';
            const targetDate = date || new Date().toISOString().split('T')[0];

            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: `Eres el sistema de reservas para "${shopName}". Genera un conjunto de horarios disponibles para el servicio "${serviceName}" el día "${targetDate}". Devuelve un JSON con la clave "slots" conteniendo un array de strings de horas en formato HH:MM (ejemplo: "10:15"). Asegúrate de incluir entre 6 y 8 opciones distribuidas a lo largo del día.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: slotsSchema,
                    temperature: 1,
                },
            });

            res.json(JSON.parse(response.text || '{"slots": []}'));
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

    // =========================================================================
    // ENTERPRISE SAAS APIS (SECURITY, AUDITING, SUPPORT & GDPR COMPLIANCE)
    // =========================================================================

    // --- SECURITY & AUDITING ENDPOINTS ---

    // Get all Audit Logs
    app.get('/api/security/audit-logs', async (req, res) => {
        try {
            const db = await getDb();
            res.json(db.securityLogs || []);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Detect anomalies in system activity
    app.get('/api/security/anomalies', async (req, res) => {
        try {
            const anomalies = await detectAnomalies();
            res.json(anomalies);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Clear Audit Logs (Simulated Rotation)
    app.post('/api/security/logs/clear', async (req, res) => {
        try {
            const db = await getDb();
            db.securityLogs = [];
            await saveDb();
            await logAuditEvent('info', 'LOGS_CLEARED', 'El administrador vació y rotó los registros de auditoría', req.ip, 'admin@virtus.com');
            res.json({ success: true, message: 'Logs rotados exitosamente' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // --- SUPPORT CENTER ENDPOINTS ---

    // Get support tickets (filtered optionally by shopId)
    app.get('/api/support/tickets', async (req, res) => {
        try {
            const shopId = req.query.shopId as string;
            const tickets = await getAllTickets(shopId);
            res.json(tickets);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Create a new support ticket
    app.post('/api/support/tickets', async (req, res) => {
        try {
            const ticket = await createTicket(req.body);
            await logAuditEvent('info', 'SUPPORT_TICKET_CREATED', `Ticket creado por ${ticket.customerName}: ${ticket.subject}`, req.ip, ticket.email);
            res.json(ticket);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Add message to existing ticket
    app.post('/api/support/tickets/:id/messages', async (req, res) => {
        try {
            const { id } = req.params;
            const { sender, text } = req.body;
            const ticket = await addTicketMessage(id, sender, text);
            await logAuditEvent('info', 'SUPPORT_MESSAGE_ADDED', `Mensaje enviado en Ticket ${id} por ${sender}`, req.ip, sender === 'admin' ? 'admin@virtus.com' : ticket.email);
            res.json(ticket);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Update ticket status
    app.patch('/api/support/tickets/:id/status', async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const ticket = await updateTicketStatus(id, status);
            await logAuditEvent('info', 'SUPPORT_TICKET_STATUS_UPDATED', `Estado del Ticket ${id} cambiado a ${status}`, req.ip, 'admin@virtus.com');
            res.json(ticket);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get Knowledge Base FAQ articles
    app.get('/api/support/kb', (req, res) => {
        res.json(knowledgeBase);
    });

    // --- GDPR & COMPLIANCE ENDPOINTS ---

    // Record GDPR consent log
    app.post('/api/compliance/consent', async (req, res) => {
        try {
            const { userId, email, consentType, accepted } = req.body;
            const consent = await saveUserConsent(userId || 'guest', email || 'anon@virtus.com', consentType, accepted, req.ip);
            await logAuditEvent('info', 'CONSENT_RECORDED', `Consentimiento ${consentType} de ${email}: ${accepted ? 'Aceptado' : 'Rechazado'}`, req.ip, email);
            res.json(consent);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get consent log history
    app.get('/api/compliance/consent/:email', async (req, res) => {
        try {
            const consents = await getUserConsents(req.params.email);
            res.json(consents);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // GDPR Right to Portability: Download full JSON footprint
    app.post('/api/compliance/export', async (req, res) => {
        try {
            const { email } = req.body;
            const data = await exportUserData(email);
            await logAuditEvent('info', 'GDPR_DATA_EXPORT', `El usuario ${email} exportó todos sus datos (Art. 20 GDPR)`, req.ip, email);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // GDPR Right to be Forgotten: Permanently delete user from system
    app.post('/api/compliance/forget', async (req, res) => {
        try {
            const { email } = req.body;
            const result = await eraseUserData(email);
            await logAuditEvent('critical', 'GDPR_RIGHT_TO_ERASURE', `Eliminación permanente de todos los datos de ${email} (Art. 17 GDPR)`, req.ip, email);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // --- Static Frontend Serving ---
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
