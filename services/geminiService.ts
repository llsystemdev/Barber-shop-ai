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

export async function getStyleRecommendations(frontImage: any, sideImage: any, shop: BarberShop): Promise<{ styles: string[], finalRecommendation: string }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                styles: [
                    "Modern Fade con Textura",
                    "Classic Pompadour Modernizado",
                    "Taper Fade con Flequillo Corto",
                    "Low Fade con Textura Desordenada"
                ],
                finalRecommendation: `Basado en la estructura de tu rostro y el contorno de tus facciones, un corte con degradado (Fade) acentuará tu línea de la mandíbula aportando definición y carácter. Recomendamos usar cera mate (Clay) de fijación fuerte para peinar el cabello superior hacia adelante o hacia un lado para lograr el máximo dinamismo y textura.`
            });
        }, 1500); // realistic load time
    });
}

export async function generateStyledImage(
    base64ImageData: string, 
    mimeType: string, 
    style: string, 
    angle: string, 
    lighting: string,
    color?: string,
    highlights?: string
): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Priority: if color is specified, return appropriate colored photo, else style photo
            let resultUrl = stylePhotos[style] || stylePhotos.default;
            if (color && coloredPhotos[color]) {
                resultUrl = coloredPhotos[color];
            } else if (highlights && coloredPhotos[highlights]) {
                resultUrl = coloredPhotos[highlights];
            }
            resolve(resultUrl);
        }, 1200);
    });
}

export async function getAvailableSlots(date: string, service: string, shop: BarberShop): Promise<string[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(["09:30", "10:15", "11:00", "12:30", "14:00", "15:15", "16:30", "17:15"]);
        }, 800);
    });
}

export async function sendBookingConfirmationEmail(email: string, booking: Omit<Booking, 'id'>): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("==================================================");
            console.log("📧 MOCK EMAIL SENT");
            console.log(`To: ${email}`);
            console.log(`Subject: Confirmación de reserva - ${booking.shopName}`);
            console.log(`Details: ${booking.service} on ${booking.date} at ${booking.time}`);
            console.log("==================================================");
            resolve();
        }, 500);
    });
}
