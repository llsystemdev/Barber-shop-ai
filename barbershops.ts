import { BarberShop } from './types';

export const barbershops: BarberShop[] = [
  {
    id: '1',
    name: 'The Dapper Cut',
    aiName: 'Leo',
    welcomeMessage: '¡Bienvenido a The Dapper Cut! Soy Leo, tu estilista AI. ¿Listo para encontrar tu próximo gran look? Sube tus fotos para empezar.',
    aiPersona: 'Eres Leo, el estilista principal de The Dapper Cut. Tu estilo es clásico, sofisticado y preciso. Te especializas en cortes atemporales como el pompadour, side-part y slick-back. Eres educado, profesional y das consejos basados en la elegancia y la buena presentación.',
    description: 'The Dapper Cut es un santuario para el caballero moderno. Nos especializamos en cortes clásicos con un toque contemporáneo, afeitados a navaja y el cuidado experto de la barba. Nuestro ambiente refinado y atención al detalle garantizan una experiencia de primera.',
    address: '123 Elegance Ave, Metropolis, 10101',
    phone: '(555) 123-4567',
    hours: {
      'Lunes-Viernes': '09:00 - 19:00',
      'Sábado': '10:00 - 17:00',
      'Domingo': 'Cerrado'
    },
    gallery: [
        'https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        'https://images.pexels.com/photos/2061821/pexels-photo-2061821.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        'https://images.pexels.com/photos/897251/pexels-photo-897251.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    ],
    services: [
        { name: 'Corte Clásico (Pompadour, Side-Part)', price: '$45' },
        { name: 'Afeitado a Navaja Tradicional', price: '$40' },
        { name: 'Arreglo de Barba Premium', price: '$30' },
        { name: 'El Paquete Dapper (Corte y Afeitado)', price: '$80' },
    ],
    barbers: [
        { name: 'Arthur Pendleton', specialty: 'Maestro de los Clásicos', imageUrl: 'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { name: 'James Sullivan', specialty: 'Experto en Afeitado', imageUrl: 'https://images.pexels.com/photos/428364/pexels-photo-428364.jpeg?auto=compress&cs=tinysrgb&w=800' }
    ],
    plan: 'Básico',
    billingHistory: [
        { id: 'inv_1', date: '2024-07-01', amount: '$1.00', status: 'Pagado' },
        { id: 'inv_2', date: '2024-06-01', amount: '$1.00', status: 'Pagado' },
        { id: 'inv_3', date: '2024-05-01', amount: '$1.00', status: 'Pagado' },
    ],
    paymentMethod: {
        type: 'Visa',
        last4: '4242',
        expiry: '12/26'
    }
  },
  {
    id: '2',
    name: 'Urban Edge Barbers',
    aiName: 'Alex',
    welcomeMessage: '¡Qué tal! Estás en Urban Edge Barbers. Soy Alex, tu asistente de IA. Si buscas un estilo moderno y atrevido, estás en el lugar correcto. Sube tus fotos y vemos qué se nos ocurre.',
    aiPersona: 'Eres Alex, un barbero experto en Urban Edge Barbers. Tu rollo es moderno, urbano y creativo. Dominas los fades, texturizados, y estilos más atrevidos. Eres relajado, directo y usas un lenguaje más casual. Te apasionan las últimas tendencias y no temes experimentar.',
    description: 'En Urban Edge, rompemos las reglas. Somos un colectivo de artistas del cabello dedicados a los estilos más frescos y las tendencias urbanas. Desde fades impecables hasta diseños creativos, si lo puedes imaginar, lo podemos cortar. Nuestro espacio es vibrante, con buena música y mejor rollo.',
    address: '456 Trend St, Downtown, 20202',
    phone: '(555) 987-6543',
    hours: {
      'Lunes-Sábado': '10:00 - 20:00',
      'Domingo': '12:00 - 18:00'
    },
    gallery: [
        'https://images.pexels.com/photos/3160453/pexels-photo-3160453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        'https://images.pexels.com/photos/853427/pexels-photo-853427.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        'https://images.pexels.com/photos/1805600/pexels-photo-1805600.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    ],
    services: [
        { name: 'Low Fade / Mid Fade / High Fade', price: '$40' },
        { name: 'Corte Texturizado (Crop Top, etc.)', price: '$45' },
        { name: 'Diseño de Cabello (Hair Tattoo)', price: 'Desde $25' },
        { name: 'Color Fantasía', price: 'Consultar' },
    ],
    barbers: [
        { name: 'Javier "Javi" Rojas', specialty: 'Rey de los Fades', imageUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { name: 'Marco Diaz', specialty: 'Artista del Color', imageUrl: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { name: 'Sofia Chen', specialty: 'Cortes Creativos', imageUrl: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=800' }
    ],
    plan: 'Profesional',
    billingHistory: [
        { id: 'inv_4', date: '2024-07-15', amount: '$10.00', status: 'Pagado' },
        { id: 'inv_5', date: '2024-06-15', amount: '$10.00', status: 'Pagado' },
    ],
    paymentMethod: {
        type: 'Mastercard',
        last4: '5555',
        expiry: '08/25'
    }
  },
  {
    id: '3',
    name: 'Barbería "El Don"',
    aiName: 'Don José',
    welcomeMessage: 'Buenos días, bienvenido a la Barbería "El Don". Soy Don José, su asistente virtual. Aquí valoramos la tradición y la maestría. Por favor, suba sus fotografías para una consulta de estilo clásica.',
    aiPersona: 'Eres Don José, el maestro barbero de la Barbería "El Don". Llevas 40 años en el oficio. Tu especialidad son los cortes a navaja, los rituales de afeitado clásico y los estilos que nunca pasan de moda. Eres respetuoso, sabio, un poco formal y te diriges a los clientes con un toque de "vieja escuela".',
    description: 'La Barbería "El Don" es un homenaje a la barbería de toda la vida. Un lugar donde el tiempo se detiene y la tradición se respeta. Ofrecemos cortes y afeitados realizados con las técnicas que han pasado de generación en generación. Aquí no hay prisas, solo maestría y un servicio impecable.',
    address: '789 Heritage Ln, Old Town, 30303',
    phone: '(555) 555-1212',
    hours: {
      'Martes-Viernes': '08:00 - 18:00',
      'Sábado': '08:00 - 14:00',
      'Lunes y Domingo': 'Cerrado'
    },
    gallery: [
        'https://images.pexels.com/photos/5212703/pexels-photo-5212703.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        'https://images.pexels.com/photos/3998419/pexels-photo-3998419.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        'https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    ],
    services: [
        { name: 'Corte a Tijera y Navaja', price: '$50' },
        { name: 'Afeitado Ritual con Toalla Caliente', price: '$55' },
        { name: 'Arreglo de Bigote y Barba', price: '$35' },
        { name: 'Tratamiento Capilar Fortificante', price: '$40' },
    ],
    barbers: [
        { name: 'Don Ricardo', specialty: 'Maestro Barbero (40 años exp.)', imageUrl: 'https://images.pexels.com/photos/1813947/pexels-photo-1813947.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { name: 'Miguel Herrero', specialty: 'Cortes a Navaja', imageUrl: 'https://images.pexels.com/photos/532220/pexels-photo-532220.jpeg?auto=compress&cs=tinysrgb&w=800' }
    ],
    plan: 'Freemium',
    billingHistory: [
        { id: 'inv_6', date: '2024-07-20', amount: '$0.00', status: 'Pagado' },
        { id: 'inv_7', date: '2024-06-20', amount: '$0.00', status: 'Pagado' },
        { id: 'inv_8', date: '2024-05-20', amount: '$0.00', status: 'Pagado' },
        { id: 'inv_9', date: '2024-04-20', amount: '$0.00', status: 'Pagado' },
    ],
    paymentMethod: {
        type: 'Amex',
        last4: '8431',
        expiry: '01/28'
    }
  }
];