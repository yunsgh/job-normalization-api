const axios = require('axios');
const cheerio = require('cheerio');

// NOUVELLE CIBLE (Plus stable pour la démonstration du scraping)
// Cible : Indeed - Recherche de postes de développeur à Paris
const TARGET_URL = 'https://fr.indeed.com/emplois?q=d%C3%A9veloppeur&l=Paris'; 

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*'); 

    const { keyword, city } = req.query;
    
    // Définir les headers pour simuler un vrai navigateur et éviter le blocage
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    // Construire l'URL avec les paramètres de l'utilisateur
    const searchUrl = `https://fr.indeed.com/emplois?q=${encodeURIComponent(keyword || 'développeur')}&l=${encodeURIComponent(city || 'Paris')}`;


    try {
        // 1. La Requête avec les Headers
        const response = await axios.get(searchUrl, { headers: headers });
        const html = response.data;
        
        // 2. Le Parsing (Nettoyage/Extraction)
        const $ = cheerio.load(html);
        const jobListings = [];
        
        // Sélecteur Indeed (celui-ci est très générique et sujet à changement, mais fonctionne pour ce test)
        $('div.jobsearch-SerpJobCard').each((i, element) => { 
            
            const titleElement = $(element).find('h2 a');
            const companyElement = $(element).find('.company');
            const locationElement = $(element).find('.location');

            const title = titleElement.text().trim();
            const company = companyElement.text().trim();
            const location = locationElement.text().trim();
            
            // Si le titre est vide (site bloqué ou structure changée), on ignore la ligne
            if (!title) return;

            // 3. La Normalisation (Le PVU)
            const normalizedTitle = title.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();

            jobListings.push({
                title_normalized: normalizedTitle,
                title_raw: title,
                company: company,
                location: location,
                // On peut ajouter ici le lien vers l'annonce
            });
        });
        
        // Si l'extraction échoue à cause du blocage, la liste sera vide
        if (jobListings.length === 0) {
             throw new Error("Aucune donnée extraite. Le site cible a probablement bloqué le bot ou changé sa structure.");
        }
        
        res.status(200).json({
            success: true,
            query: { keyword, city },
            count: jobListings.length,
            data: jobListings
        });

    } catch (error) {
        console.error("Scraping error:", error.message);
        res.status(500).json({
            success: false,
            error: "Erreur lors du scraping ou du parsing de la page cible."
        });
    }
};
