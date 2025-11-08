// api/jobs.js - Normalisation Salariale

const REGEX_SALARY = /(\d[\d\s.,]*[Kk]?)\s*-\s*(\d[\d\s.,]*[Kk]?)\s*(eur|usd|gbp|aed|dh|€|\$|£|dh|aed)/i;

function cleanValue(text) {
    if (!text) return 0;
    // Supprime les virgules, espaces, points (pour gestion des milliers)
    let cleaned = text.replace(/[\s,.]/g, ''); 
    // Convertit 'K' ou 'k' en milliers
    if (cleaned.toLowerCase().includes('k')) {
        return parseFloat(cleaned.replace(/k/i, '')) * 1000;
    }
    return parseFloat(cleaned);
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*'); 

    const { salary_text } = req.body; // Nouvelle entrée POST

    if (!salary_text || typeof salary_text !== 'string') {
        return res.status(400).json({
            success: false,
            error: "Please provide 'salary_text' as a string in the request body."
        });
    }

    const match = salary_text.match(REGEX_SALARY);

    if (!match) {
        return res.status(200).json({
            success: false,
            error: "Could not detect a min/max salary range or currency in the provided text.",
            text_provided: salary_text
        });
    }

    try {
        const minRaw = match[1];
        const maxRaw = match[2];
        const currencySymbol = match[3].toUpperCase().replace('€', 'EUR').replace('$', 'USD').replace('£', 'GBP');

        const min = cleanValue(minRaw);
        const max = cleanValue(maxRaw);

        res.status(200).json({
            success: true,
            data: {
                salary_raw: salary_text,
                salary_min: min,
                salary_max: max,
                currency: currencySymbol,
                period: "Annual",
                analysis_status: "Normalized"
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: "Internal parsing error." });
    }
};
