import { menuPhotos } from '../server/menu-photos.js';
export async function POST(request: Request) { return menuPhotos(request); }
export async function OPTIONS(request: Request) { return menuPhotos(request); }
