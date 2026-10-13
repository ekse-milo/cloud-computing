/* ==========================================================================
   WORDS. — SEARCH SERVICE (Microservice / Database Container Client)
   ========================================================================== */

class SearchService {
    /**
     * Queries the Search Service microservice (which queries MySQL DB container)
     * for quotes matching author name.
     * @param {Array|string} quotesOrQuery - Optional quotes array or author query string
     * @param {string} [authorQuery] - Author query string if first param was quotes array
     * @returns {Promise<Array>} Filtered quotes from MySQL DB container
     */
    async searchByAuthor(quotesOrQuery, authorQuery) {
        let query = "";
        let fallbackArray = null;

        if (Array.isArray(quotesOrQuery)) {
            fallbackArray = quotesOrQuery;
            query = authorQuery ? authorQuery.trim() : "";
        } else {
            query = quotesOrQuery ? quotesOrQuery.trim() : "";
        }

        if (!query) {
            return fallbackArray || null;
        }

        try {
            let response;
            try {
                response = await fetch(`/api/search?author=${encodeURIComponent(query)}`);
            } catch (e) {
                response = await fetch(`http://localhost:3002/api/search?author=${encodeURIComponent(query)}`);
            }

            if (!response.ok) {
                throw new Error(`Search API HTTP status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            console.warn("SearchService API query failed, using in-memory fallback:", err);
            if (fallbackArray) {
                const q = query.toLowerCase();
                return fallbackArray.filter(quote => quote.author.toLowerCase().includes(q));
            }
            return [];
        }
    }

    getUniqueAuthors(quotes) {
        if (!quotes) return [];
        return [...new Set(quotes.map(q => q.author))].sort();
    }
}

const searchService = new SearchService();
