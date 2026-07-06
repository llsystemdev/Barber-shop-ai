
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDb, hashPassword, generateSalt } from './database';

dotenv.config();

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
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("WARNING: API_KEY is not set in environment variables.");
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

    // 3. Auth Google (Simulated for frontend, but registers/returns valid server user)
    app.post('/api/auth/google', async (req, res) => {
        try {
            const { role } = req.body;
            const db = await getDb();
            
            // Re-use or create default google user
            const email = 'google-user@virtus.com';
            let user = db.users.find(u => u.email === email);
            if (!user) {
                const salt = generateSalt();
                const passwordHash = hashPassword('google-secret', salt);
                const userId = 'mock-user-google';
                const name = 'Juan Pérez';
                
                user = {
                    id: userId,
                    name,
                    email,
                    role: (role || 'shopOwner') as any,
                    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
                    passwordHash,
                    salt,
                    shopId: '1' // Default "The Dapper Cut"
                };
                db.users.push(user);
                await saveDb();
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
            console.error('Error in /api/auth/google:', error);
            res.status(500).json({ error: error.message });
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
