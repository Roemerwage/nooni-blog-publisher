
export enum Brand {
  NOONI = 'Nooni'
}

export interface BlogContent {
  title: string;
  introduction: string;
  body: string;
  conclusion: string;
  metaTitle: string;
  urlSlug: string;
  metaDescription: string;
  imageAltText: string;
  selectedImage1?: string;
  selectedImage2?: string;
  selectedImage3?: string;
  selectedImage4?: string;
  selectedImage5?: string;
  generatedImages?: string[];
}

export interface GenerationRequest {
  brand: Brand;
  userTitle: string;
  keywords: string;
  includeExternalLink: boolean;
}

export interface GalleryImage {
  filename: string;
  description: string;
}
