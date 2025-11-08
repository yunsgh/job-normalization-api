const axios = require('axios');
const cheerio = require('cheerio');

// L'URL cible (nous allons simuler le scraping d'un agrégateur d'emplois)
// NOTE: Le scraping direct de Google est complexe. Nous allons utiliser une URL simple pour le POC.
const TARGET_URL = 'https://jobs.github.com/positions?description=';

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*'); 

    const { keyword, city } = req.query;

    if (!keyword) {
        return res.status(400).json({
            success: false,
            error: "Veuillez fournir le paramètre 'keyword' (mot-clé de recherche)."
        });
    }

    try {
        const fullUrl = `${TARGET_URL}${encodeURIComponent(keyword)}&location=${encodeURIComponent(city || '')}`;
        
        // 1. La Requête (Scraping)
        const response = await axios.get(fullUrl);
        const html = response.data;
        
        // 2. Le Parsing (Nettoyage/Extraction)
        const $ = cheerio.load(html);
        const jobListings = [];
        
        // Simuler l'extraction de données structurées (ceci devra être adapté à la cible réelle)
        // Ici, nous simulons l'extraction des titres et des entreprises
        $('h4 a').each((i, element) => { 
            const title = $(element).text().trim();
            const company = $(element).closest('tr').find('.company').text().trim();
            
            // 3. La Normalisation (Le PVU)
            // On fait une normalisation de base (la vraie valeur serait ici)
            const normalizedTitle = title.toUpperCase();

            jobListings.push({
                title_normalized: normalizedTitle,
                title_raw: title,
                company: company,
                location: $(element).closest('tr').find('.location').text().trim(),
                link: $(element).attr('href'),
                // Ici, vous ajouteriez la détection de salaire, le tagging, etc.
            });
        });
        
        res.status(200).json({
            success: true,
            query: { keyword, city },
            count: jobListings.length,
            data: jobListings
        });

    } catch (error) {
        console.error("Scraping error:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors du scraping ou du parsing de la page cible."
        });
    }
};
