import { analyzeMenu } from "../server/analyze-menu.js";

export async function POST(request: Request) {
  return analyzeMenu(request);
}

export async function OPTIONS(request: Request) { return analyzeMenu(request); }
