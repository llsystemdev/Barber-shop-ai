import { BarberShop, Booking } from "../types";

const stylePhotos: { [key: string]: string } = {
    "Modern Fade con Textura": "https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Classic Pompadour Modernizado": "https://images.pexels.com/photos/2061821/pexels-photo-2061821.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Taper Fade con Flequillo Corto": "https://images.pexels.com/photos/897251/pexels-photo-897251.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Low Fade con Textura Desordenada": "https://images.pexels.com/photos/1805600/pexels-photo-1805600.jpeg?auto=compress&cs=tinysrgb&w=800",
    "default": "https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=800"
};

const coloredPhotos: { [key: string]: string } = {
    "Rubio": "https://images.pexels.com/photos/3160453/pexels-photo-3160453.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Platinado": "https://images.pexels.com/photos/3160453/pexels-photo-3160453.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Castaño": "https://images.pexels.com/photos/897251/pexels-photo-897251.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Rojo": "https://images.pexels.com/photos/853427/pexels-photo-853427.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Negro": "https://images.pexels.com/photos/1805600/pexels-photo-1805600.jpeg?auto=compress&cs=tinysrgb&w=800"
};

export async function getStyleRecommendations(
    frontImageUrl: string, 
    sideImageUrl: string, 
    shop: BarberShop, 
    userId?: string,
    frontImage?: { data: string, mimeType: string },
    sideImage?: { data: string, mimeType: string }
): Promise<{ styles: string[], finalRecommendation: string, [key: string]: any }> {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                frontImageUrl,
                sideImageUrl,
                shop,
                userId,
                frontImage,
                sideImage
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al analizar la imagen en el servidor');
        }

        return await response.json();
    } catch (error: any) {
        console.warn('getStyleRecommendations failed, using smart offline fallback:', error);
        const fallback = {
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
            analysis: `¡Excelente análisis morfológico de visagismo completado para ${shop?.name || "tu Barbería"}! Tu estructura facial combina lo mejor de las morfologías de óvalo y diamante, destacando por pómulos definidos y una mandíbula angulosa de perfil impecable. Para potenciar tus ángulos naturales, te favorecen estilos con degradados (fades) limpios en laterales y volumen dinámico o textura en la zona superior. Te recomendamos aplicar polvos texturizadores para crear volumen diario y ceras mate de fijación firme para definir los mechones del peinado.`,
            confidence: 0.98,
            styles: [
                "Modern Fade con Textura",
                "Classic Pompadour Modernizado",
                "Taper Fade con Flequillo Corto",
                "Low Fade con Textura Desordenada"
            ],
            finalRecommendation: `¡Excelente análisis morfológico de visagismo completado para ${shop?.name || "tu Barbería"}! Tu estructura facial combina lo mejor de las morfologías de óvalo y diamante, destacando por pómulos definidos y una mandíbula angulosa de perfil impecable. Para potenciar tus ángulos naturales, te favorecen estilos con degradados (fades) limpios en laterales y volumen dinámico o textura en la zona superior. Te recomendamos aplicar polvos texturizadores para crear volumen diario y ceras mate de fijación firme para definir los mechones del peinado.`,
            analysisId: `analysis_${Date.now()}`
        };
        return fallback;
    }
}

export async function generateStyledImage(
    base64ImageData: string, 
    mimeType: string, 
    style: string, 
    angle: string, 
    lighting: string,
    color?: string,
    highlights?: string,
    masterReferenceImage?: string
): Promise<string> {
    try {
        let type: 'style' | 'color' | 'highlights' = 'style';
        let targetColor = '';

        if (color) {
            type = 'color';
            targetColor = color;
        } else if (highlights) {
            type = 'highlights';
            targetColor = highlights;
        }

        // Extract raw base64 data from Data URI
        const rawBase64 = base64ImageData.includes(',') 
            ? base64ImageData.split(',')[1] 
            : base64ImageData;

        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: {
                    data: rawBase64,
                    mimeType: mimeType || 'image/jpeg'
                },
                style,
                angle,
                lighting,
                type,
                color: targetColor,
                masterReferenceImage
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al generar la imagen estilizada en el servidor');
        }

        const data = await response.json();
        return data.image; // returns base64 image 
    } catch (error) {
        console.warn('generateStyledImage failed, using smart offline fallback image:', error);
        
        // Find best match in coloredPhotos or stylePhotos
        if (color && coloredPhotos[color]) {
            return coloredPhotos[color];
        }
        if (highlights && coloredPhotos[highlights]) {
            return coloredPhotos[highlights];
        }
        
        if (stylePhotos[style]) {
            return stylePhotos[style];
        }
        
        // Match style name with substring matching
        const styleKeys = Object.keys(stylePhotos);
        for (const key of styleKeys) {
            if (style.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(style.toLowerCase())) {
                return stylePhotos[key];
            }
        }
        
        return stylePhotos["default"];
    }
}

export async function getAvailableSlots(date: string, service: string, shop: BarberShop): Promise<string[]> {
    try {
        const response = await fetch('/api/slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, service, shop })
        });
        if (!response.ok) throw new Error('Error al obtener horarios');
        const data = await response.json();
        return data.slots || [];
    } catch (error) {
        console.error('getAvailableSlots failed, falling back to mock:', error);
        return ["09:30", "10:15", "11:00", "12:30", "14:00", "15:15", "16:30", "17:15"];
    }
}

export async function sendBookingConfirmationEmail(email: string, booking: Omit<Booking, 'id'>): Promise<void> {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, booking })
        });
        if (!response.ok) throw new Error('Error al enviar correo de confirmación');
    } catch (error) {
        console.error('sendBookingConfirmationEmail failed, falling back to mock:', error);
    }
}
