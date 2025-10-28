import { UsageMetadata, GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';

export interface ProductInfo {
  product_name: string | null;
  description: string | null;
  general_product_type: string | null;
  specific_product_type: string | null;
  specifications: Record<string, unknown>;
  features: { name: string; description: string }[];
  targeted_market: string | null;
  problem_product_is_solving: string | null;
}

function computeMissingFields(product: ProductInfo): string[] {
  const missing: string[] = [];

  if (!product.product_name) missing.push('product_name');
  if (!product.description) missing.push('description');
  if (!product.general_product_type) missing.push('general_product_type');
  if (!product.specific_product_type) missing.push('specific_product_type');
  if (!product.targeted_market) missing.push('targeted_market');
  if (!product.problem_product_is_solving) missing.push('problem_product_is_solving');
  if (!product.features || product.features.length === 0) missing.push('features');
  if (!product.specifications || Object.keys(product.specifications).length === 0) missing.push('specifications');

  return missing;
}

export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface GeminiExtractionResult {
  jsonData: ProductInfo;
  tokenUsage?: TokenUsage;
  extractionMethod: string | null;
  rawResponse: string;
  missingFields: string[];
}

interface ExtractionState {
  product_name: string | null;
  description: string | null;
  method: string | null;
  htmlPreview: string | null;
}

interface GeminiCallResult {
  parsed: unknown;
  usage: UsageMetadata | undefined;
  raw: string;
}

const API_KEY: string = process.env.GEMINI_API_KEY || '';
const REQUEST_TIMEOUT = 30000;

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in the environment variables.');
}

function normalizeText(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/\r\n|\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function cleanTitle(title?: string | null): string | null {
  if (!title) return null;
  let formatted = title.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  formatted = formatted.replace(/\s*[-|—–:]\s*(buy|official|online|store|website|shop|site|\.in).*$/i, '').trim();
  return formatted || null;
}

function safeJsonParse<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    return null;
  }
}

function findBalancedObject(text: string, startIndex = 0): string | null {
  const length = text.length;
  let i = text.indexOf('{', startIndex);
  if (i === -1) return null;
  let depth = 0;
  for (let j = i; j < length; j += 1) {
    const ch = text[j];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    if (depth === 0) return text.slice(i, j + 1);
  }
  return null;
}

function extractJsonSubstring(text: string): unknown {
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '{') {
      const subsection = findBalancedObject(text, i);
      if (subsection) {
        const parsed = safeJsonParse(subsection);
        if (parsed) return parsed;
      }
    }
  }
  return null;
}

async function fetchRawHtml(url: string): Promise<string> {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
  const response = await axios.get<string>(url, { headers, timeout: REQUEST_TIMEOUT });
  return response.data;
}

async function tryProductJsonEndpoints(url: string): Promise<Record<string, unknown> | null> {
  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    const candidates: string[] = [];

    if (path.endsWith('.js') || path.endsWith('.json')) {
      candidates.push(url);
    } else {
      candidates.push(parsedUrl.origin + path + '.js');
      candidates.push(parsedUrl.origin + path + '.json');
      const productMatch = path.match(/\/products\/([a-zA-Z0-9\-_]+)/);
      if (productMatch?.[1]) {
        const handle = productMatch[1];
        candidates.push(`${parsedUrl.origin}/products/${handle}.js`);
        candidates.push(`${parsedUrl.origin}/products/${handle}.json`);
      }
    }

    for (const candidate of candidates) {
      try {
        const result = await axios.get(candidate, {
          timeout: 8000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (result.status === 200 && result.data) {
          if (typeof result.data === 'object') return result.data as Record<string, unknown>;
          const parsed = safeJsonParse<Record<string, unknown>>(result.data as string);
          if (parsed) return parsed;
          const subsection = extractJsonSubstring(String(result.data));
          if (subsection && typeof subsection === 'object') return subsection as Record<string, unknown>;
        }
      } catch (error) {
        // ignore individual endpoint failures
      }
    }
  } catch (error) {
    // ignore URL parsing issues
  }
  return null;
}

function extractJsonLdFromHtml(html: string): Record<string, unknown> | null {
  const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of matches) {
    const text = match[1].trim();
    const parsed = safeJsonParse<Record<string, unknown> | Record<string, unknown>[]>(text);
    if (!parsed) continue;

    if (Array.isArray(parsed)) {
      const product = parsed.find(item => {
        if (!item) return false;
        const type = String((item as Record<string, unknown>)['@type'] || '').toLowerCase();
        if (type.includes('product')) return true;
        const graph = (item as Record<string, unknown>)['@graph'];
        return graph ? JSON.stringify(graph).toLowerCase().includes('product') : false;
      });
      if (product) return product as Record<string, unknown>;
    } else {
      const type = String(parsed['@type'] || '').toLowerCase();
      if (type.includes('product')) return parsed;
      const graph = parsed['@graph'];
      if (graph && JSON.stringify(graph).toLowerCase().includes('product')) return parsed;
    }
  }
  return null;
}

function extractEmbeddedJsonFromHtml(html: string): Record<string, unknown> | null {
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const scriptMatch of scripts) {
    const scriptContent = scriptMatch[1];
    if (!scriptContent || scriptContent.length < 50) continue;
    if (!(/['"]@type['"]\s*:\s*['"]Product['"]/i.test(scriptContent) || /(variants|product|price|sku)/i.test(scriptContent))) {
      continue;
    }

    const productIndex = scriptContent.search(/@type['"]?\s*[:=]\s*['"]?Product['"]?/i);
    let candidate: string | null = null;
    if (productIndex >= 0) {
      candidate = findBalancedObject(scriptContent, Math.max(0, scriptContent.lastIndexOf('{', productIndex)));
    }
    if (!candidate) {
      candidate = findBalancedObject(scriptContent, 0);
    }
    if (candidate) {
      const parsed = safeJsonParse<Record<string, unknown>>(candidate);
      if (parsed) return parsed;
      const repaired = candidate.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      const parsedRepaired = safeJsonParse<Record<string, unknown>>(repaired);
      if (parsedRepaired) return parsedRepaired;
    }
  }
  return null;
}

function metaFallbackFromHtml(html: string): { title: string | null; description: string | null } {
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('meta[name="title"]').attr('content') ||
    $('title').text() ||
    $('h1').first().text() ||
    '';

  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('meta[itemprop="description"]').attr('content') ||
    $('h2').first().text() ||
    '';

  return {
    title: normalizeText(title) || null,
    description: normalizeText(description) || null
  };
}

function selectorsFallbackFromHtml(html: string): { name: string | null; description: string | null } {
  const $ = cheerio.load(html);
  const nameSelectors = [
    'h1.product-title',
    'h1.product_name',
    'h1#product_title',
    'h1.title',
    'h1[itemprop="name"]',
    'h1'
  ];
  let name: string | null = null;
  for (const selector of nameSelectors) {
    const text = normalizeText($(selector).first().text());
    if (text && text.length > 3) {
      name = text;
      break;
    }
  }

  const descriptionSelectors = [
    '#description',
    '.product-description',
    '.description',
    '.product-summary',
    'div#description',
    '[itemprop="description"]',
    '.product-details'
  ];
  let description: string | null = null;
  for (const selector of descriptionSelectors) {
    const element = $(selector).first();
    const value = (element && normalizeText(element.text())) || (element && element.attr?.('content')) || null;
    if (value && value.length > 10) {
      description = value;
      break;
    }
  }

  return { name: name || null, description: description || null };
}

function densestElementText(html: string): string {
  const $ = cheerio.load(html);
  let maxLength = 0;
  let bestText = '';

  $('body')
    .find('div, section, article, main, p')
    .each((_, element) => {
      const wrapper = $(element);
      if (wrapper.closest('nav,header,footer,aside,[role="navigation"]').length) return;
      if (wrapper.find('a').length > 10) return;
      const clone = wrapper.clone();
      clone.find('script, style, header, footer, nav, aside, form, button').remove();
      const text = normalizeText(clone.text());
      if (text.length > maxLength) {
        maxLength = text.length;
        bestText = text;
      }
    });

  if (bestText) return bestText;
  return normalizeText($('body').text());
}

async function callGemini(promptText: string, searchQuery?: string): Promise<GeminiCallResult> {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const searchContext = searchQuery
    ? `\n\nAdditional Context: This product was discovered using the search query "${searchQuery}". Use this context to better understand the product's positioning and target market.`
    : '';

  const prompt = `
Based on the following text content from a product webpage, please extract the required information.
Provide the output ONLY in a valid JSON format. Do not include any markdown formatting like \`\`\`json.
The JSON should include the following keys:
- "product_name": The full name of the product.
- "description": A concise paragraph describing the product.
- "general_product_type": General type/category of the product.
- "specific_product_type": Specific type/category of the product.
- "specifications": An object containing key-value pairs of technical specifications.
- "features": A list of objects, where each object has a "name" and "description" for a key feature.
- "targeted_market": An inferred analysis of the ideal customer for this product.
- "problem_product_is_solving": An inferred analysis of the key problems or pain points this product addresses for its target market.${searchContext}

Here is the text content:
---
${promptText}
---
`;

  await fs.writeFile('prompt_content.txt', prompt, 'utf8');

  const generated = await model.generateContent(prompt);
  const response = await generated.response;

  let raw: string;
  try {
    raw = response.text();
  } catch (error) {
    raw = JSON.stringify(response);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    parsed = extractJsonSubstring(raw);
    if (!parsed) {
      await fs.writeFile('gemini_raw.txt', raw, 'utf8');
      throw new Error('Gemini response was not valid JSON. Raw response written to gemini_raw.txt');
    }
  }

  const usage = response.usageMetadata ?? undefined;

  return { parsed, usage, raw };
}

function shapeStrict(obj: unknown): ProductInfo {
  const record = (obj && typeof obj === 'object') ? (obj as Record<string, unknown>) : {};
  const specifications = record.specifications && typeof record.specifications === 'object' && record.specifications !== null
    ? (record.specifications as Record<string, unknown>)
    : {};

  const featuresRaw = Array.isArray(record.features) ? record.features : [];
  const features = featuresRaw
    .map(feature => {
      const item = feature && typeof feature === 'object' ? (feature as Record<string, unknown>) : {};
      const name = typeof item.name === 'string' ? item.name : '';
      const description = typeof item.description === 'string' ? item.description : '';
      if (!name && !description) return null;
      return { name, description };
    })
    .filter((feature): feature is { name: string; description: string } => feature !== null);

  return {
    product_name: typeof record.product_name === 'string' ? record.product_name : null,
    description: typeof record.description === 'string' ? record.description : null,
    general_product_type: typeof record.general_product_type === 'string' ? record.general_product_type : null,
    specific_product_type: typeof record.specific_product_type === 'string' ? record.specific_product_type : null,
    specifications,
    features,
    targeted_market: typeof record.targeted_market === 'string' ? record.targeted_market : null,
    problem_product_is_solving: typeof record.problem_product_is_solving === 'string' ? record.problem_product_is_solving : null
  };
}

export async function scrapeAndExtractProductInfo(url: string, searchQuery?: string): Promise<GeminiExtractionResult | null> {
  if (!API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set.');
    return null;
  }

  console.log('Fetching URL:', url);

  let html: string | null = null;
  try {
    html = await fetchRawHtml(url);
    console.log('[SCRAPER] Server HTML length:', html.length);
  } catch (error) {
    const message = (error as Error).message || String(error);
    console.warn('[SCRAPER] Failed to fetch server HTML:', message);
  }

  const extractionState: ExtractionState = {
    product_name: null,
    description: null,
    method: null,
    htmlPreview: html ? html.slice(0, 2000) : null
  };

  if (html) {
    const productJson = await tryProductJsonEndpoints(url);
    if (productJson) {
      const name = productJson.title || productJson.name || (productJson.product as Record<string, unknown> | undefined)?.title || (productJson as Record<string, unknown>)['product_title'];
      const description =
        productJson.body_html ||
        productJson.description ||
        (productJson.product as Record<string, unknown> | undefined)?.description ||
        null;

      if (name) extractionState.product_name = normalizeText(String(name));
      if (description) extractionState.description = normalizeText(String(description).replace(/<[^>]*>/g, ''));
      extractionState.method = 'product-json-endpoint';
    }

    if ((!extractionState.product_name || !extractionState.description)) {
      const ldJson = extractJsonLdFromHtml(html);
      if (ldJson) {
        const name = ldJson.name || ldJson.title || ((ldJson['@graph'] as Record<string, unknown>[])?.find(item => item?.name)?.name) || null;
        const description = ldJson.description || ((ldJson['@graph'] as Record<string, unknown>[])?.find(item => item?.description)?.description) || null;
        if (name && !extractionState.product_name) extractionState.product_name = normalizeText(String(name));
        if (description && !extractionState.description) extractionState.description = normalizeText(String(description));
        extractionState.method = extractionState.method || 'json-ld';
      }
    }

    if ((!extractionState.product_name || !extractionState.description)) {
      const embeddedJson = extractEmbeddedJsonFromHtml(html);
      if (embeddedJson) {
        const name = embeddedJson.name || embeddedJson.title || (embeddedJson.product as Record<string, unknown> | undefined)?.title || embeddedJson.product_name || null;
        const description =
          embeddedJson.description ||
          embeddedJson.body_html ||
          (embeddedJson.product as Record<string, unknown> | undefined)?.description ||
          null;
        if (name && !extractionState.product_name) extractionState.product_name = normalizeText(String(name));
        if (description && !extractionState.description) extractionState.description = normalizeText(String(description).replace(/<[^>]*>/g, ''));
        extractionState.method = extractionState.method || 'embedded-json';
      }
    }

    if ((!extractionState.product_name || !extractionState.description)) {
      const selectorsFallback = selectorsFallbackFromHtml(html);
      if (selectorsFallback.name && !extractionState.product_name) extractionState.product_name = normalizeText(selectorsFallback.name);
      if (selectorsFallback.description && !extractionState.description) extractionState.description = normalizeText(selectorsFallback.description);
      if ((selectorsFallback.name || selectorsFallback.description) && !extractionState.method) {
        extractionState.method = 'selectors-fallback';
      }
    }

    if ((!extractionState.product_name || !extractionState.description)) {
      const meta = metaFallbackFromHtml(html);
      if (meta.title && !extractionState.product_name) extractionState.product_name = cleanTitle(meta.title);
      if (meta.description && !extractionState.description) extractionState.description = normalizeText(meta.description);
      if ((meta.title || meta.description) && !extractionState.method) {
        extractionState.method = 'meta-fallback';
      }
    }

    if ((!extractionState.product_name || !extractionState.description)) {
      const densest = densestElementText(html);
      if (!extractionState.product_name && densest) {
        const lines = densest.split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length > 0) {
          const candidateName = lines[0];
          if (candidateName && candidateName.length < 120) extractionState.product_name = normalizeText(candidateName);
          if (!extractionState.description && lines.length > 1) {
            const candidateDescription = lines.slice(1, 6).join(' ');
            extractionState.description = normalizeText(candidateDescription);
          }
        }
      }
      if (densest && !extractionState.method) extractionState.method = 'densest-fallback';
    }
  }

  extractionState.product_name = extractionState.product_name ? String(extractionState.product_name).trim() : null;
  extractionState.description = extractionState.description ? String(extractionState.description).trim() : null;

  console.log('[SCRAPER] Extraction method chosen:', extractionState.method);

  let cleanedForLLM = '';
  if (extractionState.product_name && extractionState.description) {
    cleanedForLLM = `${extractionState.product_name}\n\n${extractionState.description}`;
  } else if (extractionState.product_name) {
    cleanedForLLM = extractionState.product_name;
  } else if (extractionState.description) {
    cleanedForLLM = extractionState.description;
  } else if (html) {
    cleanedForLLM = densestElementText(html);
  }

  if (!cleanedForLLM || cleanedForLLM.length < 20) {
    console.warn('[SCRAPER] LLM input is small; Gemini may return nulls for some fields.');
  }

  try {
    console.log('[LLM] Sending cleaned text to Gemini (gemini-2.5-flash-lite)...');
    const { parsed: geminiJson, raw: geminiRaw, usage } = await callGemini(cleanedForLLM || '', searchQuery);
    const product = shapeStrict(geminiJson);
    const missingFields = computeMissingFields(product);

    console.log('\n/* JavaScript variable: product */\n');
    console.log('const product = ' + JSON.stringify(product, null, 2) + ';\n');

    const finalOutput = { product, extraction_method: extractionState.method, missing_fields: missingFields };
    await fs.writeFile('final_output.json', JSON.stringify(finalOutput, null, 2), 'utf8');

    console.log('\n--- Final output (product) ---');
    console.log(JSON.stringify(finalOutput, null, 2));

    const tokenUsage: TokenUsage | undefined = usage
      ? {
          inputTokens: usage.promptTokenCount ?? usage.totalTokenCount,
          outputTokens: usage.candidatesTokenCount,
          totalTokens: usage.totalTokenCount
        }
      : undefined;

    try {
      if (tokenUsage) {
        const input = tokenUsage.inputTokens ?? 0;
        const output = tokenUsage.outputTokens ?? 0;
        const total = tokenUsage.totalTokens ?? input + output;
        console.log('[Gemini][Extract Product Info - Service]', { inputTokens: input, outputTokens: output, totalTokens: total, context: searchQuery ? 'with-search-query' : 'no-search-query' });
      }
    } catch {}

    return {
      jsonData: product,
      tokenUsage,
      extractionMethod: extractionState.method,
      rawResponse: geminiRaw,
      missingFields
    };
  } catch (error) {
    const message = (error as Error).message || String(error);
    console.error('Fatal error:', message);
    return null;
  }
}
