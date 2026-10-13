/* ==========================================================================
   WORDS. — SEARCH SERVICE
   ========================================================================== */

class SearchService {
    /**
     * Filters quotes matching a case-insensitive author name query.
     * @param {Array} quotes 
     * @param {string} authorQuery 
     * @returns {Array} Filtered quotes
     */
    searchByAuthor(quotes, authorQuery) {
        if (!authorQuery || authorQuery.trim() === "") {
            return quotes;
        }
        const query = authorQuery.trim().toLowerCase();
        return quotes.filter(quote => quote.author.toLowerCase().includes(query));
    }

    /**
     * Extracts a sorted list of all unique authors present in the database.
     * @param {Array} quotes 
     * @returns {Array} Sorted list of author names
     */
    getUniqueAuthors(quotes) {
        return [...new Set(quotes.map(q => q.author))].sort();
    }
}

// Instantiated as a global service for application-wide access
const searchService = new SearchService();
