import { menuPhotos } from '../server/menu-photos';
export async function POST(request: Request) { return menuPhotos(request); }
export async function OPTIONS(request: Request) { return menuPhotos(request); }
