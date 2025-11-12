
import React, { useState, useCallback, ChangeEvent, FormEvent, ReactNode } from 'react';
import { FunnelData, MarketingAngle, GeneratedCopy, GeneratedImage } from './types';
import { generateMarketingAngles, generateLandingPageCopy, generateImages, createZipFile, fileToBase64 } from './services/aiService';
import Stepper from './components/Stepper';
import Loader from './components/Loader';
import { UploadIcon, CheckCircleIcon, MagicWandIcon, ArrowRightIcon, DownloadIcon } from './components/icons';

const initialFunnelData: FunnelData = {
  product: { imageFile: null, imageBase64: '', name: '', details: '' },
  marketing: { angles: [], selectedAngleTitle: '', customAngle: '' },
  addons: {
    orderBump: { enabled: false, name: '', price: '', imageFile: null, imageBase64: '' },
    upsell: { enabled: false, name: '', price: '', imageFile: null, imageBase64: '' },
  },
  brand: { brandName: '', price: '', freeShipping: true, guarantee: { enabled: true, days: 30 } },
};

const Card: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 ${className}`}>
        {children}
    </div>
);

const App: React.FC = () => {
    const [step, setStep] = useState(1);
    const [funnelData, setFunnelData] = useState<FunnelData>(initialFunnelData);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isFunnelReady, setIsFunnelReady] = useState(false);

    const handleFunnelDataChange = (path: string, value: any) => {
        setFunnelData(prev => {
            const keys = path.split('.');
            let current = prev;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return { ...prev };
        });
    };
    
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, path: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await fileToBase64(file);
            const mimeType = file.type;
            
            setFunnelData(prev => {
                const keys = path.split('.');
                let current = prev;
                for (let i = 0; i < keys.length - 1; i++) {
                    current = current[keys[i]];
                }
                current.imageFile = file;
                current.imageBase64 = base64;
                current.imageMimeType = mimeType;
                return { ...prev };
            });
        }
    };

    const handleNextStep1 = async () => {
        if (!funnelData.product.imageFile || !funnelData.product.name || !funnelData.product.details) {
            setError('Por favor, completa todos los campos del producto.');
            return;
        }
        setError(null);
        setLoading(true);
        setLoadingMessage('Analizando tu producto y generando ángulos de venta...');
        try {
            const angles = await generateMarketingAngles({
                name: funnelData.product.name,
                details: funnelData.product.details,
                imageBase64: funnelData.product.imageBase64,
                imageMimeType: funnelData.product.imageFile.type,
            });
            const recommendedAngle = angles.find(a => a.recommended) || angles[0];
            setFunnelData(prev => ({
                ...prev,
                marketing: { ...prev.marketing, angles, selectedAngleTitle: recommendedAngle.title }
            }));
            setStep(2);
        } catch (err) {
            setError('Hubo un error al generar los ángulos de marketing. Por favor, intenta de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleGenerateFunnel = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            setLoadingMessage('Escribiendo el copy de tu página de ventas...');
            const copy = await generateLandingPageCopy(funnelData);
            
            setLoadingMessage('Diseñando imágenes de producto impactantes...');
            const images = await generateImages(funnelData, copy);

            setLoadingMessage('Ensamblando tu embudo mágico...');
            await createZipFile(funnelData, copy, images);

            setIsFunnelReady(true);
        } catch (err) {
            setError('Ocurrió un error al crear tu embudo. Revisa tu API Key y vuelve a intentarlo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const steps = ["Producto", "Marketing", "Ventas extra", "Marca y Oferta"];

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            {loading && <Loader message={loadingMessage} />}

            <div className="w-full max-w-4xl mx-auto">
                <header className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-500 text-transparent bg-clip-text">
                        FunnelGenius
                    </h1>
                    <p className="mt-3 text-lg text-slate-400">Crea páginas de venta de alta conversión en minutos con IA.</p>
                </header>

                {!isFunnelReady ? (
                <>
                <div className="mb-12 flex justify-center">
                    <Stepper currentStep={step} steps={steps} />
                </div>
                
                <main>
                    {step === 1 && (
                        <Card>
                            <h2 className="text-2xl font-bold mb-1 text-center">Paso 1: Describe tu Producto</h2>
                            <p className="text-slate-400 mb-6 text-center">Empecemos con lo básico. ¿Qué vendes?</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col items-center justify-center bg-slate-900 p-4 rounded-lg border-2 border-dashed border-slate-700">
                                     <input type="file" id="product-image" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileChange(e, 'product')} />
                                    <label htmlFor="product-image" className="cursor-pointer text-center">
                                        {funnelData.product.imageBase64 ? (
                                            <>
                                                <img src={`data:${funnelData.product.imageFile?.type};base64,${funnelData.product.imageBase64}`} alt="Vista previa del producto" className="max-h-48 rounded-lg mx-auto mb-2" />
                                                <span className="text-sm text-green-400 flex items-center justify-center"><CheckCircleIcon className="w-4 h-4 mr-1" /> Imagen cargada. Click para cambiar.</span>
                                            </>
                                        ) : (
                                            <>
                                                <UploadIcon className="w-12 h-12 mx-auto text-slate-500" />
                                                <span className="mt-2 block text-sm font-medium text-slate-300">Sube una imagen del producto</span>
                                                <span className="block text-xs text-slate-500">PNG, JPG, WEBP</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="product-name" className="block text-sm font-medium text-slate-300">Nombre del producto</label>
                                        <input type="text" id="product-name" value={funnelData.product.name} onChange={(e) => handleFunnelDataChange('product.name', e.target.value)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2" />
                                    </div>
                                    <div>
                                        <label htmlFor="product-details" className="block text-sm font-medium text-slate-300">Detalles del producto ({funnelData.product.details.length}/300)</label>
                                        <textarea id="product-details" value={funnelData.product.details} onChange={(e) => handleFunnelDataChange('product.details', e.target.value)} maxLength={300} rows={4} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2" placeholder="Describe las características y beneficios principales en 2 o 3 líneas..."></textarea>
                                    </div>
                                </div>
                            </div>
                            {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                            <div className="mt-8 text-right">
                                <button onClick={handleNextStep1} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 inline-flex items-center">
                                    Siguiente <ArrowRightIcon className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card>
                            <h2 className="text-2xl font-bold mb-1 text-center">Paso 2: Elige tu Enfoque de Marketing</h2>
                            <p className="text-slate-400 mb-6 text-center">La IA ha generado estos ángulos de venta para ti. Elige uno o crea el tuyo.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {funnelData.marketing.angles.map(angle => (
                                    <button key={angle.title} onClick={() => handleFunnelDataChange('marketing.selectedAngleTitle', angle.title)} className={`p-4 rounded-lg text-left transition duration-300 border-2 ${funnelData.marketing.selectedAngleTitle === angle.title ? 'bg-indigo-900 border-indigo-500' : 'bg-slate-700 border-slate-600 hover:border-indigo-500'}`}>
                                        <h3 className="font-bold text-white">{angle.title} {angle.recommended && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">Recomendado</span>}</h3>
                                        <p className="text-sm text-slate-400 mt-1">{angle.description}</p>
                                    </button>
                                ))}
                                 <button onClick={() => handleFunnelDataChange('marketing.selectedAngleTitle', 'custom')} className={`p-4 rounded-lg text-left transition duration-300 border-2 ${funnelData.marketing.selectedAngleTitle === 'custom' ? 'bg-indigo-900 border-indigo-500' : 'bg-slate-700 border-slate-600 hover:border-indigo-500'}`}>
                                    <h3 className="font-bold text-white">Ángulo personalizado</h3>
                                    <p className="text-sm text-slate-400 mt-1">Define tu propio enfoque de venta.</p>
                                </button>
                            </div>
                             {funnelData.marketing.selectedAngleTitle === 'custom' && (
                                 <div className="mt-4">
                                    <textarea value={funnelData.marketing.customAngle} onChange={e => handleFunnelDataChange('marketing.customAngle', e.target.value)} className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm p-2" placeholder="Escribe tu ángulo de venta aquí..."></textarea>
                                 </div>
                             )}
                            <div className="mt-8 flex justify-between">
                                <button onClick={() => setStep(1)} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition">Atrás</button>
                                <button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition">Siguiente</button>
                            </div>
                        </Card>
                    )}

                    {step === 3 && (
                        <Card>
                             <h2 className="text-2xl font-bold mb-1 text-center">Paso 3: Aumenta tus Ventas (Opcional)</h2>
                             <p className="text-slate-400 mb-6 text-center">Añade ofertas adicionales para maximizar cada venta.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Order Bump */}
                                <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold">Order Bump</h3>
                                        <button onClick={() => handleFunnelDataChange('addons.orderBump.enabled', !funnelData.addons.orderBump.enabled)} className={`${funnelData.addons.orderBump.enabled ? 'bg-indigo-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition`}>
                                            <span className={`${funnelData.addons.orderBump.enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
                                        </button>
                                    </div>
                                    {funnelData.addons.orderBump.enabled && (
                                    <div className="space-y-4">
                                        <input type="text" placeholder="Nombre del producto" value={funnelData.addons.orderBump.name} onChange={e => handleFunnelDataChange('addons.orderBump.name', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" />
                                        <input type="text" placeholder="Precio" value={funnelData.addons.orderBump.price} onChange={e => handleFunnelDataChange('addons.orderBump.price', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" />
                                        {/* File input for order bump is omitted for simplicity */}
                                    </div>
                                    )}
                                </div>
                                {/* Upsell */}
                                <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold">Upsell</h3>
                                        <button onClick={() => handleFunnelDataChange('addons.upsell.enabled', !funnelData.addons.upsell.enabled)} className={`${funnelData.addons.upsell.enabled ? 'bg-indigo-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition`}>
                                            <span className={`${funnelData.addons.upsell.enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
                                        </button>
                                    </div>
                                     {funnelData.addons.upsell.enabled && (
                                    <div className="space-y-4">
                                        <input type="text" placeholder="Nombre del producto" value={funnelData.addons.upsell.name} onChange={e => handleFunnelDataChange('addons.upsell.name', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" />
                                        <input type="text" placeholder="Precio" value={funnelData.addons.upsell.price} onChange={e => handleFunnelDataChange('addons.upsell.price', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" />
                                    </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8 flex justify-between">
                                <button onClick={() => setStep(2)} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition">Atrás</button>
                                <button onClick={() => setStep(4)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition">Siguiente</button>
                            </div>
                        </Card>
                    )}

                    {step === 4 && (
                        <Card>
                             <h2 className="text-2xl font-bold mb-1 text-center">Paso 4: Define tu Marca y Oferta</h2>
                             <p className="text-slate-400 mb-6 text-center">Los últimos detalles antes de crear la magia.</p>
                             <form onSubmit={handleGenerateFunnel} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300">Nombre de la marca</label>
                                        <input type="text" value={funnelData.brand.brandName} onChange={e => handleFunnelDataChange('brand.brandName', e.target.value)} className="mt-1 w-full bg-slate-700 p-2 rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300">Precio del producto principal</label>
                                        <input type="text" value={funnelData.brand.price} onChange={e => handleFunnelDataChange('brand.price', e.target.value)} className="mt-1 w-full bg-slate-700 p-2 rounded-md" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-lg">
                                    <label>Envío Gratis</label>
                                    <button type="button" onClick={() => handleFunnelDataChange('brand.freeShipping', !funnelData.brand.freeShipping)} className={`${funnelData.brand.freeShipping ? 'bg-indigo-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition`}>
                                        <span className={`${funnelData.brand.freeShipping ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
                                    </button>
                                </div>
                                <div className="space-y-2 bg-slate-900/50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <label>Garantía de Devolución</label>
                                        <button type="button" onClick={() => handleFunnelDataChange('brand.guarantee.enabled', !funnelData.brand.guarantee.enabled)} className={`${funnelData.brand.guarantee.enabled ? 'bg-indigo-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition`}>
                                            <span className={`${funnelData.brand.guarantee.enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
                                        </button>
                                    </div>
                                    {funnelData.brand.guarantee.enabled && (
                                        <input type="number" value={funnelData.brand.guarantee.days} onChange={e => handleFunnelDataChange('brand.guarantee.days', parseInt(e.target.value, 10))} className="w-full bg-slate-700 p-2 rounded-md" placeholder="Número de días, ej: 30" />
                                    )}
                                </div>
                                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                                <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-center">
                                    <button type="button" onClick={() => setStep(3)} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition">Atrás</button>
                                    <button type="submit" className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105 shadow-lg inline-flex items-center text-lg">
                                        <MagicWandIcon className="w-6 h-6 mr-2" /> Crear mi embudo mágico
                                    </button>
                                </div>
                             </form>
                        </Card>
                    )}
                </main>
                </>
                ) : (
                    <Card className="text-center">
                        <CheckCircleIcon className="w-24 h-24 text-green-400 mx-auto" />
                        <h2 className="text-3xl font-bold mt-4">¡Tu embudo está listo!</h2>
                        <p className="text-slate-300 mt-2 max-w-lg mx-auto">Hemos empaquetado tu página de ventas de alta conversión, imágenes y estilos en un solo archivo .zip.</p>
                        <button onClick={() => window.location.reload()} className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105 shadow-lg inline-flex items-center text-lg">
                           <DownloadIcon className="w-6 h-6 mr-2" /> Descargar de nuevo
                        </button>
                        <div className="mt-8 text-sm bg-slate-900/50 p-4 rounded-lg text-slate-400">
                            <strong>Próximos pasos:</strong> Sube el contenido del archivo .zip a tu hosting (ej. en la carpeta `public_html`) y tu página estará online al instante.
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default App;
