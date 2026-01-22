export const parseTranscriptCSV = (csvText) => {
    const lines = csvText.split(/\r?\n/);
    const terms = [];
    let currentTerm = null;
    let termCounter = 1;
    let rowCounter = 1;

    // Helper to clean CSV fields (remove quotes, trim)
    const clean = (str) => str ? str.replace(/^"|"$/g, '').trim() : '';

    // Regex for Term Header: matches "YYYY [Season] Semester" or "YYYY Term X" with a date range
    // Supports:
    // - 2005 Fall Semester
    // - 2025 Term 1
    // - 2025 Semester Spring
    const termRegex = /(\d{4}\s+(?:Fall|Winter|Spring|Summer|Term\s+\d+|Semester\s+[A-Za-z]+).*?)(\d{1,2}\/\d{1,2}\/\d{4})/;
    
    // Regex for Transfer Term
    const transferRegex = /Transfer Term/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Robust CSV Split: Splits by comma ONLY if not inside quotes.
        // Handles "Social Dance, Beginning" as one field.
        const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        // 1. Check for Term Header
        const termCandidate = columns.find(c => termRegex.test(c) || transferRegex.test(c));
        if (termCandidate) {
            let termName = "Unknown Term";
            if (transferRegex.test(termCandidate)) {
                // User Request: Ignore "Transfer Term" and its courses entirely.
                currentTerm = null;
                continue;
            }

            const match = termCandidate.match(termRegex);
            if (match) {
                termName = match[1].trim(); // e.g., "2005 Fall Semester"
            } else {
                // If it matched neither transfer nor standard term regex but got here? 
                // (The `find` condition ensures it matched one of them).
                // If we are here, it must be termRegex.
                continue;
            }
            
            // Consolidate headers: If this header matches the current term, don't create a new one.
            if (currentTerm && currentTerm.name === termName) {
                continue;
            }
            
            // Create new term
            currentTerm = {
                termIndex: termCounter++,
                name: termName,
                rows: []
            };
            terms.push(currentTerm);
            continue;
        }

        // 2. Check for Course Data
        // Valid row looks like: ..., CODE, NAME, CREDITS, EARNED, QP, GRADE, ...
        // We need to find the "Grade" column. It's usually a letter grade (A, A-, B+, P, etc.)
        // And it should be preceded by numbers.
        
        // Let's look for the pattern: [Number] [Number] [Number] [Grade]
        // In sample: 3.00, 3.00, 10.20, B+
        
        for (let j = 0; j < columns.length - 3; j++) {
            const gradeCand = clean(columns[j+3]);
            const qpCand = clean(columns[j+2]);
            const earnedCand = clean(columns[j+1]);
            const attCand = clean(columns[j]);
            
            // Check if Grade is valid (A-F, P, W, etc)
            const validGrades = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E", "F", "UW", "W", "P"];
            // Grade in CSV might have space "A "
            const gradeClean = gradeCand.split(' ')[0]; // "A " -> "A"
            
            if (validGrades.includes(gradeClean)) {
                // Verify preceding columns are numbers
                const isNum = (n) => !isNaN(parseFloat(n)) && isFinite(n);
                
                if (isNum(attCand) && isNum(earnedCand)) {
                    // Found a match!
                    // Course Code is likely at j-2 or j-3?
                    // Sample: CODE, Name, Att, Earn, QP, Grade
                    // Index:  k     k+1   k+2  k+3   k+4  k+5
                    // My loop `j` started at `attCand`. So `j` is `k+2`.
                    // So Code is at `j-2`. Name is at `j-1`.
                    
                    const courseCode = clean(columns[j-2]);
                    const courseName = clean(columns[j-1]);
                    const credits = parseFloat(attCand);
                    
                    if (courseCode && currentTerm) {
                        currentTerm.rows.push({
                            id: String(rowCounter++),
                            name: courseCode, // Only use Course Code per user request
                            units: credits,
                            grade: gradeClean,
                            retakeOf: null
                        });
                        break; // Stop looking in this line
                    }
                }
            }
        }
    }
    
    return { terms, nextRowId: rowCounter };
};