
export interface ProductDetails {
  imageFile: File | null;
  imageBase64: string;
  name: string;
  details: string;
}

export interface MarketingAngle {
  title: string;
  description: string;
  recommended?: boolean;
}

export interface AddonProduct {
  enabled: boolean;
  name: string;
  price: string;
  imageFile: File | null;
  imageBase64: string;
}

export interface BrandOffer {
  brandName: string;
  price: string;
  freeShipping: boolean;
  guarantee: {
    enabled: boolean;
    days: number;
  };
}

export interface FunnelData {
  product: ProductDetails;
  marketing: {
    angles: MarketingAngle[];
    selectedAngleTitle: string;
    customAngle: string;
  };
  addons: {
    orderBump: AddonProduct;
    upsell: AddonProduct;
  };
  brand: BrandOffer;
}

// AI-Generated Content Types
export interface GeneratedCopy {
  seoTitle: string;
  seoDescription: string;
  headline: string;
  subheadline: string;
  benefits: { icon: string; title: string; text: string }[];
  testimonials: { name: string; date: string; rating: number; text: string }[];
  urgencyText: string;
  ctaPrimary: string;
  footerText: string;
  imageAltTexts: string[];
}

export interface GeneratedImage {
  base64: string;
  alt: string;
}
