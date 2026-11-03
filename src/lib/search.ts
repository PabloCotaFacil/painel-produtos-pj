// Motor de Busca Inteligente CotaFácil
// Suporta busca por termo único ou múltiplos termos combinados,
// insensível a acentos/maiúsculas, com plural/singular, tolerância a pequenos erros de digitação e ranking de relevância.

const STOPWORDS = new Set([
  'a', 'as', 'o', 'os', 'um', 'uma', 'uns', 'umas',
  'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'por', 'pelo', 'pela', 'pelos', 'pelas', 'para', 'pra', 'pro',
  'com', 'sem', 'sob', 'sobre', 'entre', 'ate', 'como', 'onde',
  'qual', 'quais', 'que', 'e', 'ou', 'se', 'ao', 'aos',
]);

/**
 * Remove tags HTML, acentos, pontuação e converte para minúsculas.
 */
export function normalizeSearchText(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, ' ') // Remove tags HTML
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos (á -> a, ç -> c, etc.)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Substitui pontuação por espaço
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai os termos relevantes da busca (funciona para 1 termo ou vários termos juntos).
 */
export function extractQueryTokens(rawQuery: string): string[] {
  const normalized = normalizeSearchText(rawQuery);
  if (!normalized) return [];

  const allWords = normalized.split(' ').filter((w) => w.length > 0);
  if (allWords.length <= 1) {
    return allWords;
  }

  // Se o usuário digitou várias palavras, filtra preposições/artigos (stopwords)
  const filtered = allWords.filter((w) => !STOPWORDS.has(w) && w.length >= 2);
  return filtered.length > 0 ? filtered : allWords;
}

/**
 * Gera variações de radical (singular/plural em português) para encontrar termos aproximados.
 */
function getStemVariants(token: string): string[] {
  const variants = new Set<string>([token]);

  if (token.length >= 4) {
    // Plural simples terminando em 's' (ex: regras -> regra, manuais/bancos -> banco)
    if (token.endsWith('oes') && token.length >= 5) {
      variants.add(token.slice(0, -3) + 'ao'); // comissoes -> comissao
      variants.add(token.slice(0, -3));
    } else if (token.endsWith('ais') && token.length >= 5) {
      variants.add(token.slice(0, -3) + 'al'); // manuais -> manual
    } else if (token.endsWith('eis') && token.length >= 5) {
      variants.add(token.slice(0, -3) + 'el'); // imoveis -> imovel
    } else if (token.endsWith('res') && token.length >= 5) {
      variants.add(token.slice(0, -2)); // indexadores -> indexador
    } else if (token.endsWith('s')) {
      variants.add(token.slice(0, -1)); // treinamentos -> treinamento
    } else {
      // Se digitou no singular, adiciona variação sem a última vogal para casar com plural/derivados
      variants.add(token + 's');
      if (token.endsWith('ao') && token.length >= 4) {
        variants.add(token.slice(0, -2) + 'oes');
      }
      if (token.endsWith('al') && token.length >= 4) {
        variants.add(token.slice(0, -2) + 'ais');
      }
    }
  }

  if (token.length >= 6) {
    // Radical base (ex: financiament, imobiliari, treinament)
    variants.add(token.slice(0, -1));
    variants.add(token.slice(0, -2));
  }

  return Array.from(variants);
}

/**
 * Distância de edição (Levenshtein) rápida para tolerar 1 erro de digitação em palavras médias/longas.
 */
function isWithinEditDistanceOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let edits = 0;
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else {
      edits++;
      if (edits > 1) return false;
      if (a.length > b.length) {
        i++;
      } else if (b.length > a.length) {
        j++;
      } else {
        i++;
        j++;
      }
    }
  }

  if (i < a.length || j < b.length) edits++;
  return edits <= 1;
}

/**
 * Verifica se um termo da busca casa com um campo de texto normalizado.
 * Retorna o nível de precisão: 2 = exato/substring direta, 1 = radical/plural/erro de digitação, 0 = sem match.
 */
function matchTokenInField(token: string, normalizedField: string, fieldWords: string[]): number {
  if (!normalizedField) return 0;

  // 1. Substring direta ou palavra exata
  if (normalizedField.includes(token)) {
    return 2;
  }

  // 2. Variações de singular/plural ou radical
  const variants = getStemVariants(token);
  for (const variant of variants) {
    if (variant.length >= 3 && normalizedField.includes(variant)) {
      return 1;
    }
  }

  // 3. Tolerância a 1 erro de digitação para palavras com 5+ letras
  if (token.length >= 5) {
    for (const word of fieldWords) {
      if (word.length >= 4 && isWithinEditDistanceOne(token, word)) {
        return 1;
      }
    }
  }

  return 0;
}

export interface SearchableArticle {
  id: string;
  title: string;
  summary: string;
  content?: string | null;
  videoUrl?: string | null;
  videoType?: string | null;
  category?: {
    id?: string;
    name: string;
    slug: string;
  } | null;
  attachments?: Array<{
    id?: string;
    name: string;
    fileUrl?: string;
    fileType?: string;
  }>;
  updatedAt?: Date | string;
}

/**
 * Filtra e ordena artigos de forma inteligente para 1 ou múltiplos termos pesquisados.
 */
export function smartSearchArticles<T extends SearchableArticle>(
  articles: T[],
  rawQuery: string
): T[] {
  const normalizedFullQuery = normalizeSearchText(rawQuery);
  if (!normalizedFullQuery) return articles;

  const tokens = extractQueryTokens(rawQuery);
  if (tokens.length === 0) return articles;

  const scoredResults: Array<{
    article: T;
    score: number;
    matchedTokensCount: number;
  }> = [];

  for (const article of articles) {
    const normTitle = normalizeSearchText(article.title);
    const normSummary = normalizeSearchText(article.summary);
    const normContent = normalizeSearchText(article.content);
    const normCategory = normalizeSearchText(article.category?.name);
    const normAttachments = normalizeSearchText(
      (article.attachments || []).map((a) => a.name).join(' ')
    );

    const titleWords = normTitle.split(' ').filter(Boolean);
    const summaryWords = normSummary.split(' ').filter(Boolean);
    const contentWords = normContent.split(' ').filter(Boolean);
    const categoryWords = normCategory.split(' ').filter(Boolean);
    const attachmentWords = normAttachments.split(' ').filter(Boolean);

    let score = 0;
    let matchedTokensCount = 0;

    // Bônus se a frase inteira pesquisada aparecer exatamente junta
    if (tokens.length > 1) {
      if (normTitle.includes(normalizedFullQuery)) score += 120;
      if (normAttachments.includes(normalizedFullQuery)) score += 90;
      if (normSummary.includes(normalizedFullQuery)) score += 70;
      if (normContent.includes(normalizedFullQuery)) score += 40;
    }

    for (const token of tokens) {
      const titleMatch = matchTokenInField(token, normTitle, titleWords);
      const attachmentMatch = matchTokenInField(token, normAttachments, attachmentWords);
      const categoryMatch = matchTokenInField(token, normCategory, categoryWords);
      const summaryMatch = matchTokenInField(token, normSummary, summaryWords);
      const contentMatch = matchTokenInField(token, normContent, contentWords);

      const bestMatch = Math.max(
        titleMatch,
        attachmentMatch,
        categoryMatch,
        summaryMatch,
        contentMatch
      );

      if (bestMatch > 0) {
        matchedTokensCount++;
        score += titleMatch === 2 ? 45 : titleMatch === 1 ? 28 : 0;
        score += attachmentMatch === 2 ? 38 : attachmentMatch === 1 ? 22 : 0;
        score += categoryMatch === 2 ? 25 : categoryMatch === 1 ? 15 : 0;
        score += summaryMatch === 2 ? 22 : summaryMatch === 1 ? 14 : 0;
        score += contentMatch === 2 ? 12 : contentMatch === 1 ? 7 : 0;
      }
    }

    if (matchedTokensCount > 0) {
      // Bônus forte quando o material contém TODOS os termos pesquisados pelo franqueado
      if (matchedTokensCount === tokens.length) {
        score += 150;
      } else {
        score += matchedTokensCount * 35;
      }

      scoredResults.push({
        article,
        score,
        matchedTokensCount,
      });
    }
  }

  // Ordena primeiro por quem acertou mais termos da busca, depois pelo score de relevância
  scoredResults.sort((a, b) => {
    if (b.matchedTokensCount !== a.matchedTokensCount) {
      return b.matchedTokensCount - a.matchedTokensCount;
    }
    return b.score - a.score;
  });

  return scoredResults.map((r) => r.article);
}

export interface SearchableReel {
  id: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  categoryTag?: string | null;
}

/**
 * Filtra e ordena pílulas/reels usando a mesma inteligência de múltiplos termos.
 */
export function smartSearchReels<T extends SearchableReel>(
  reels: T[],
  rawQuery: string
): T[] {
  const normalizedFullQuery = normalizeSearchText(rawQuery);
  if (!normalizedFullQuery) return reels;

  const tokens = extractQueryTokens(rawQuery);
  if (tokens.length === 0) return reels;

  const scored: Array<{ reel: T; score: number; matchedCount: number }> = [];

  for (const reel of reels) {
    const normTitle = normalizeSearchText(reel.title);
    const normDesc = normalizeSearchText(reel.description);
    const normTag = normalizeSearchText(reel.categoryTag);

    const titleWords = normTitle.split(' ').filter(Boolean);
    const descWords = normDesc.split(' ').filter(Boolean);
    const tagWords = normTag.split(' ').filter(Boolean);

    let score = 0;
    let matchedCount = 0;

    for (const token of tokens) {
      const mTitle = matchTokenInField(token, normTitle, titleWords);
      const mDesc = matchTokenInField(token, normDesc, descWords);
      const mTag = matchTokenInField(token, normTag, tagWords);

      if (Math.max(mTitle, mDesc, mTag) > 0) {
        matchedCount++;
        score += mTitle * 25 + mDesc * 15 + mTag * 10;
      }
    }

    if (matchedCount > 0) {
      if (matchedCount === tokens.length) score += 100;
      scored.push({ reel, score, matchedCount });
    }
  }

  scored.sort((a, b) => {
    if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
    return b.score - a.score;
  });

  return scored.map((s) => s.reel);
}
