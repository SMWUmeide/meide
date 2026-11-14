import { translateRequest } from "../server/translate-request";
export async function POST(request: Request) { return translateRequest(request); }
export async function OPTIONS(request: Request) { return translateRequest(request); }
