/**
 * Remove acentos, baixa a caixa e tira espaços nas pontas.
 * "São Paulo" -> "sao paulo"
 */
function normalize(text = '') {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

/**
 * Compara dois títulos de filme de fontes diferentes (TMDB x Ingresso.com),
 * que raramente vêm escritos de forma idêntica
 * (ex.: "Vingadores: Guerra Infinita" vs "Vingadores - Guerra Infinita").
 *
 * Estratégia: match exato > um contém o outro > sobreposição de palavras
 * (Jaccard) acima de 50%. Simples, mas cobre bem a maioria dos casos sem
 * precisar de uma lib de distância de string.
 */
function titlesMatch(titleA, titleB) {
    const a = normalize(titleA);
    const b = normalize(titleB);

    if (!a || !b) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;

    const wordsA = new Set(a.split(/[^a-z0-9]+/).filter((w) => w.length > 2));
    const wordsB = new Set(b.split(/[^a-z0-9]+/).filter((w) => w.length > 2));

    if (wordsA.size === 0 || wordsB.size === 0) return false;

    const intersection = [...wordsA].filter((w) => wordsB.has(w));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.length / union.size >= 0.5;
}

module.exports = { normalize, titlesMatch };
