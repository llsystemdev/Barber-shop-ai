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
    userId?: string
): Promise<{ styles: string[], finalRecommendation: string, [key: string]: any }> {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                frontImageUrl,
                sideImageUrl,
                shop,
                userId
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al analizar la imagen en el servidor');
        }

        return await response.json();
    } catch (error: any) {
        console.error('getStyleRecommendations failed:', error);
        throw error;
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
        console.error('generateStyledImage failed:', error);
        throw error;
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
