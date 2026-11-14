import { translateRequest } from "../server/translate-request.js";
export async function POST(request: Request) { return translateRequest(request); }
export async function OPTIONS(request: Request) { return translateRequest(request); }
