
import { GoogleGenAI, Type } from "@google/genai";
import { FunnelData, GeneratedCopy, GeneratedImage, MarketingAngle } from "../types";

declare global {
    interface Window {
        JSZip: any;
    }
}

// --- File Utilities ---
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

// --- Gemini API Service ---
const getAIClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateMarketingAngles = async (product: { name: string, details: string, imageBase64: string, imageMimeType: string }): Promise<MarketingAngle[]> => {
    const ai = getAIClient();
    const prompt = `Analiza el siguiente producto de e-commerce. Basado en la imagen y los detalles proporcionados, genera 5 ángulos de marketing atractivos y distintos. Cada ángulo debe apuntar a un punto de dolor, deseo o caso de uso específico del cliente. Para cada ángulo, proporciona un 'title' (título) corto y pegadizo y una 'description' (descripción) de una oración. Designa el ángulo más prometedor como 'recommended' estableciendo una bandera booleana. El nombre del producto es "${product.name}" y los detalles son "${product.details}". Proporciona la salida en formato JSON.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { inlineData: { mimeType: product.imageMimeType, data: product.imageBase64 } },
            { text: prompt }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    angles: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                recommended: { type: Type.BOOLEAN },
                            },
                            required: ["title", "description"]
                        }
                    }
                },
                required: ["angles"]
            }
        }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.angles;
};

export const generateLandingPageCopy = async (formData: FunnelData): Promise<GeneratedCopy> => {
    const ai = getAIClient();
    const selectedAngle = formData.marketing.angles.find(a => a.title === formData.marketing.selectedAngleTitle) || { title: 'Custom', description: formData.marketing.customAngle };

    const creativeBrief = `
        CREATIVE BRIEF PARA FUNNELGENIUS AI
        - Nombre del Producto: ${formData.product.name}
        - Detalles del Producto: ${formData.product.details}
        - Ángulo de Marketing Principal: "${selectedAngle.title}" - ${selectedAngle.description}
        - Nombre de la Marca: ${formData.brand.brandName}
        - Precio: ${formData.brand.price}
        - Oferta: Envío Gratis: ${formData.brand.freeShipping ? 'Sí' : 'No'}. Garantía de Devolución: ${formData.brand.guarantee.enabled ? `${formData.brand.guarantee.days} días` : 'No'}.
        - Order Bump Opcional: ${formData.addons.orderBump.enabled ? `${formData.addons.orderBump.name} por $${formData.addons.orderBump.price}` : 'No activado'}.
        - Upsell Opcional: ${formData.addons.upsell.enabled ? `${formData.addons.upsell.name} por $${formData.addons.upsell.price}` : 'No activado'}.

        TAREA:
        Eres un redactor experto en respuesta directa especializado en páginas de ventas de e-commerce de alta conversión. Usando el creative brief proporcionado, genera todo el texto necesario para la página. El tono debe ser persuasivo, claro y centrado en los beneficios. Genera la salida como un único objeto JSON válido con la estructura exacta definida en el esquema. Asegúrate de que los testimonios sean realistas y refuercen los beneficios clave. Los beneficios deben centrarse en la transformación del cliente, no solo en las características del producto. El titular debe ser un gancho poderoso relacionado con el ángulo de marketing. Crea 5 textos alternativos para imágenes que muestren el producto en uso.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: creativeBrief,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    seoTitle: { type: Type.STRING },
                    seoDescription: { type: Type.STRING },
                    headline: { type: Type.STRING },
                    subheadline: { type: Type.STRING },
                    benefits: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                icon: { type: Type.STRING, description: "Un solo emoji de unicode, ej: '✅'" },
                                title: { type: Type.STRING },
                                text: { type: Type.STRING },
                            },
                             required: ["icon", "title", "text"]
                        }
                    },
                    testimonials: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                date: { type: Type.STRING, description: "Ej: '15 de Julio, 2024'" },
                                rating: { type: Type.INTEGER, description: "Un número entre 4 y 5" },
                                text: { type: Type.STRING },
                            },
                             required: ["name", "date", "rating", "text"]
                        }
                    },
                    urgencyText: { type: Type.STRING },
                    ctaPrimary: { type: Type.STRING },
                    footerText: { type: Type.STRING },
                    imageAltTexts: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["seoTitle", "seoDescription", "headline", "subheadline", "benefits", "testimonials", "urgencyText", "ctaPrimary", "footerText", "imageAltTexts"]
            }
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateImages = async (formData: FunnelData, copy: GeneratedCopy): Promise<GeneratedImage[]> => {
    const ai = getAIClient();
    const imagePromises: Promise<GeneratedImage>[] = [];
    const numImages = 4;

    for (let i = 0; i < numImages; i++) {
        const prompt = `Fotografía hiperrealista de alta calidad para e-commerce. Muestra el producto "${formData.product.name}" en un contexto de estilo de vida que se alinea con el titular: "${copy.headline}". La imagen debe evocar un sentimiento de ${formData.marketing.selectedAngleTitle}. El estilo visual debe ser brillante, limpio y profesional. El producto en la imagen debe ser visualmente consistente con la imagen original subida por el usuario. Sin texto ni logos en la imagen.`;

        const promise = ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '4:3',
            },
        }).then(response => {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return { base64: base64ImageBytes, alt: copy.imageAltTexts[i] || `Imagen de ${formData.product.name}` };
        });
        imagePromises.push(promise);
    }
    return Promise.all(imagePromises);
};


// --- ZIP Service ---
const generateHTML = (data: FunnelData, copy: GeneratedCopy, imageNames: string[]) => {
    const renderStars = (rating: number) => Array(5).fill(0).map((_, i) => i < rating ? '★' : '☆').join('');
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${copy.seoTitle}</title>
    <meta name="description" content="${copy.seoDescription}">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="hero">
        <div class="container">
            <h1>${copy.headline}</h1>
            <p class="subheadline">${copy.subheadline}</p>
            <img src="images/producto-original.jpg" alt="Imagen principal de ${data.product.name}" class="hero-image">
            <a href="#comprar" class="cta-button">${copy.ctaPrimary}</a>
            <p class="guarantee">${data.brand.guarantee.enabled ? `Garantía de devolución de ${data.brand.guarantee.days} días` : ''}</p>
        </div>
    </header>

    <section class="benefits">
        <div class="container">
            <h2>¿Por qué elegir ${data.product.name}?</h2>
            <div class="benefits-grid">
                ${copy.benefits.map(benefit => `
                <div class="benefit-card">
                    <span class="benefit-icon">${benefit.icon}</span>
                    <h3>${benefit.title}</h3>
                    <p>${benefit.text}</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section class="gallery">
        <div class="container">
             ${imageNames.map((name, i) => `<img src="images/${name}" alt="${copy.imageAltTexts[i]}" loading="lazy">`).join('')}
        </div>
    </section>

    <section class="testimonials">
        <div class="container">
            <h2>Lo que dicen nuestros clientes</h2>
            <div class="testimonials-grid">
                ${copy.testimonials.map(testimonial => `
                <div class="testimonial-card">
                    <div class="rating">${renderStars(testimonial.rating)}</div>
                    <p class="testimonial-text">"${testimonial.text}"</p>
                    <p class="testimonial-author">- ${testimonial.name}</p>
                    <p class="testimonial-date">${testimonial.date}</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section id="comprar" class="cta-final">
        <div class="container">
            <h2>${copy.urgencyText}</h2>
            <p>Consigue tu ${data.product.name} hoy por solo <strong>$${data.brand.price}</strong></p>
             <a href="#comprar" class="cta-button">${copy.ctaPrimary}</a>
            ${data.brand.freeShipping ? `<p class="shipping">¡Envío Gratis a todo el país!</p>` : ''}
        </div>
    </section>

    <footer>
        <div class="container">
            <p>&copy; ${new Date().getFullYear()} ${data.brand.brandName}. Todos los derechos reservados.</p>
            <p>${copy.footerText}</p>
        </div>
    </footer>
</body>
</html>`;
};

const generateCSS = () => {
    return `
:root {
    --primary-color: #4f46e5;
    --secondary-color: #111827;
    --text-color: #e5e7eb;
    --bg-color: #030712;
    --card-bg: #1f2937;
}
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
    background-color: var(--bg-color);
    color: var(--text-color);
    line-height: 1.6;
}
.container {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 1.5rem;
}
section { padding: 4rem 0; }
.hero {
    background-color: var(--secondary-color);
    text-align: center;
    padding: 4rem 0 2rem;
}
h1 { font-size: 2.8rem; margin-bottom: 1rem; color: #fff; }
.subheadline { font-size: 1.2rem; max-width: 600px; margin: 0 auto 2rem; }
.hero-image {
    max-width: 100%;
    width: 400px;
    border-radius: 12px;
    margin: 2rem auto;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.cta-button {
    display: inline-block;
    background-color: var(--primary-color);
    color: #fff;
    padding: 1rem 2.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-size: 1.2rem;
    font-weight: bold;
    transition: transform 0.2s ease, background-color 0.2s ease;
}
.cta-button:hover { transform: scale(1.05); background-color: #6366f1; }
.guarantee { font-size: 0.9rem; margin-top: 1rem; opacity: 0.8; }
h2 { text-align: center; font-size: 2.2rem; margin-bottom: 3rem; }
.benefits-grid, .testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
}
.benefit-card, .testimonial-card {
    background-color: var(--card-bg);
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
}
.benefit-icon { font-size: 2.5rem; }
.benefit-card h3 { font-size: 1.3rem; margin: 1rem 0 0.5rem; }
.gallery { background-color: var(--secondary-color); }
.gallery .container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}
.gallery img { width: 100%; border-radius: 8px; }
.testimonial-card .rating { color: #facc15; font-size: 1.2rem; margin-bottom: 1rem; }
.testimonial-text { font-style: italic; }
.testimonial-author { font-weight: bold; margin-top: 1rem; }
.testimonial-date { font-size: 0.8rem; opacity: 0.7; }
.cta-final { text-align: center; }
.cta-final p { margin-bottom: 2rem; }
.shipping { font-weight: bold; margin-top: 1rem; color: #34d399; }
footer { background-color: var(--secondary-color); padding: 2rem 0; text-align: center; font-size: 0.9rem; opacity: 0.8; }

@media (max-width: 768px) {
    h1 { font-size: 2.2rem; }
    .gallery .container { grid-template-columns: 1fr; }
}
    `;
};


export const createZipFile = async (data: FunnelData, copy: GeneratedCopy, images: GeneratedImage[]) => {
    if (!window.JSZip) {
        throw new Error("JSZip library not found.");
    }
    const zip = new window.JSZip();

    // Add HTML and CSS
    const htmlContent = generateHTML(data, copy, images.map((_, i) => `imagen-generada-${i + 1}.jpg`));
    zip.file("index.html", htmlContent);
    zip.file("style.css", generateCSS());

    // Add images
    const imgFolder = zip.folder("images");
    if (data.product.imageFile) {
        imgFolder.file("producto-original.jpg", data.product.imageFile);
    }
    images.forEach((img, i) => {
        // JSZip needs blob from base64
        const byteString = atob(img.base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let j = 0; j < byteString.length; j++) {
            ia[j] = byteString.charCodeAt(j);
        }
        const blob = new Blob([ab], { type: 'image/jpeg' });
        imgFolder.file(`imagen-generada-${i + 1}.jpg`, blob);
    });
    
    // Generate and download zip
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "funnelgenius_pagina_web.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
