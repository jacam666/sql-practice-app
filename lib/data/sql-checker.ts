import type { SQLQuestion } from "./types";

interface CheckResult {
  isCorrect: boolean;
  feedback: string;
  matchedKeywords: string[];
  missingKeywords: string[];
}

// Normalize SQL for comparison
function normalizeSql(sql: string): string {
  return sql
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")")
    .replace(/\s*=\s*/g, " = ")
    .replace(/\s*>\s*/g, " > ")
    .replace(/\s*<\s*/g, " < ")
    .replace(/\s*>=\s*/g, " >= ")
    .replace(/\s*<=\s*/g, " <= ")
    .replace(/\s*<>\s*/g, " <> ")
    .replace(/\s*!=\s*/g, " != ")
    .replace(/;+\s*$/, "")
    .trim();
}

// Known columns and tables from our database schemas - COMPREHENSIVE
const KNOWN_SCHEMA: Record<string, string[]> = {
  // City database
  city: ['id', 'name', 'country_code', 'population', 'district'],
  country: ['code', 'name', 'continent', 'region', 'surface_area', 'population'],
  station: ['id', 'city', 'state', 'lat_n', 'long_w'],
  // Store database
  customers: ['customer_id', 'first_name', 'last_name', 'email', 'city', 'join_date'],
  products: ['product_id', 'name', 'category', 'price', 'stock_quantity'],
  orders: ['order_id', 'customer_id', 'order_date', 'total_amount', 'status'],
  order_items: ['item_id', 'order_id', 'product_id', 'quantity', 'unit_price'],
  // Gym database
  members: ['member_id', 'name', 'email', 'membership_type', 'join_date', 'age'],
  trainers: ['trainer_id', 'name', 'specialty', 'hire_date', 'hourly_rate'],
  classes: ['class_id', 'name', 'trainer_id', 'day_of_week', 'start_time', 'capacity', 'max_capacity'],
  attendance: ['attendance_id', 'member_id', 'class_id', 'attendance_date', 'date', 'rating'],
  // Anime database
  anime: ['anime_id', 'title', 'studio_id', 'episodes', 'rating', 'release_year'],
  studios: ['studio_id', 'name', 'founded_year', 'headquarters', 'location'],
  genres: ['genre_id', 'name', 'description'],
  anime_genres: ['anime_id', 'genre_id'],
};

// Common aliases that questions use
const VALID_ALIASES = new Set([
  'city_count', 'total_revenue', 'order_count', 'anime_count', 'avg_rating', 
  'age_rank', 'studio_name', 'trainer_name', 'genre', 'member_name', 'class_name',
  'total_population', 'avg_population', 'member_count', 'class_count', 'max_price',
  'min_price', 'avg_price', 'total_episodes', 'rating_rank', 'studio_avg_rating',
  'row_num', 'a', 'b', 'c', 'd', 'e', 's', 't', 'm', 'o', 'p', 'g', 'ag', 'oi',
  'co', 'ci', 'count', 'sum', 'avg', 'max', 'min', 'rank', 'as'
]);

// Get all valid column names
function getAllValidColumns(): Set<string> {
  const columns = new Set<string>();
  Object.values(KNOWN_SCHEMA).forEach(cols => {
    cols.forEach(col => columns.add(col.toLowerCase()));
  });
  VALID_ALIASES.forEach(alias => columns.add(alias.toLowerCase()));
  return columns;
}

// Get all valid table names
function getAllValidTables(): Set<string> {
  return new Set(Object.keys(KNOWN_SCHEMA).map(t => t.toLowerCase()));
}

// Levenshtein distance for typo detection
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Check for typos - find similar words
function findSimilar(word: string, validSet: Set<string>, threshold: number = 2): string | null {
  const wordLower = word.toLowerCase();
  
  if (validSet.has(wordLower)) return null;
  
  let bestMatch: string | null = null;
  let bestDistance = threshold + 1;
  
  for (const valid of validSet) {
    // Only compare words of similar length (within 3 chars difference)
    if (Math.abs(valid.length - wordLower.length) > 3) continue;
    
    const distance = levenshteinDistance(wordLower, valid);
    if (distance <= threshold && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = valid;
    }
  }
  
  return bestMatch;
}

// Extract table names from SQL
function extractTableNames(sql: string): string[] {
  const normalized = sql.toLowerCase();
  const tables: string[] = [];
  
  const fromMatch = normalized.match(/\bfrom\s+(\w+)/g);
  if (fromMatch) {
    fromMatch.forEach(m => {
      const table = m.replace(/\bfrom\s+/i, "").trim();
      tables.push(table);
    });
  }
  
  const joinMatch = normalized.match(/\bjoin\s+(\w+)/g);
  if (joinMatch) {
    joinMatch.forEach(m => {
      const table = m.replace(/\bjoin\s+/i, "").trim();
      tables.push(table);
    });
  }
  
  return [...new Set(tables)];
}

// Check if SQL has valid SELECT clause content
function isValidSelectClause(sql: string): { valid: boolean; reason: string } {
  const normalized = sql.toLowerCase();
  
  const match = normalized.match(/\bselect\s+(.*?)\s+from\b/s);
  if (!match) {
    return { valid: false, reason: "Missing FROM clause." };
  }
  
  const selectContent = match[1].trim();
  
  if (!selectContent) {
    return { valid: false, reason: "Your SELECT clause is empty - specify columns or use * for all columns." };
  }
  
  if (selectContent === "*") {
    return { valid: true, reason: "" };
  }
  
  if (/^distinct\s+\*$/.test(selectContent)) {
    return { valid: true, reason: "" };
  }
  
  // Check for obviously invalid characters (but allow valid SQL chars)
  // Allow: letters, numbers, underscore, space, comma, dot, parentheses, quotes, operators, asterisk
  if (/[\/\\@#$%^&!?;]/.test(selectContent)) {
    return { valid: false, reason: "Your SELECT clause contains invalid characters. Use column names or * for all columns." };
  }
  
  // Must contain at least one letter or asterisk
  if (!/[a-z*]/.test(selectContent)) {
    return { valid: false, reason: "Your SELECT clause must contain column names or * for all columns." };
  }
  
  return { valid: true, reason: "" };
}

// Extract columns from SELECT clause
function extractSelectedColumns(sql: string): string[] {
  const normalized = sql.toLowerCase();
  
  if (/\bselect\s+\*\s+from\b/.test(normalized)) {
    return ["*"];
  }
  
  if (/\bselect\s+distinct\s+\*\s+from\b/.test(normalized)) {
    return ["*"];
  }
  
  const match = normalized.match(/\bselect\s+(distinct\s+)?(.+?)\s+from\b/s);
  if (match) {
    const columnsStr = match[2];
    const columns: string[] = [];
    let depth = 0;
    let current = "";
    
    for (const char of columnsStr) {
      if (char === "(") depth++;
      else if (char === ")") depth--;
      else if (char === "," && depth === 0) {
        columns.push(current.trim());
        current = "";
        continue;
      }
      current += char;
    }
    if (current.trim()) columns.push(current.trim());
    
    return columns.map(c => {
      // Remove AS alias
      const aliasMatch = c.match(/\bas\s+\w+$/);
      if (aliasMatch) {
        c = c.replace(/\s+as\s+\w+$/, "");
      }
      // Remove table prefix
      c = c.replace(/^\w+\./, "");
      return c.trim();
    });
  }
  
  return [];
}

// Extract all identifiers from user SQL for typo checking
function extractAllIdentifiers(sql: string): string[] {
  const normalized = sql.toLowerCase();
  const sqlKeywords = new Set([
    'select', 'from', 'where', 'and', 'or', 'not', 'in', 'between', 
    'like', 'is', 'null', 'as', 'on', 'join', 'left', 'right', 'inner', 'outer', 
    'group', 'by', 'order', 'having', 'asc', 'desc', 'limit', 'distinct', 
    'count', 'sum', 'avg', 'min', 'max', 'rank', 'row_number', 'dense_rank', 
    'over', 'partition', 'offset', 'true', 'false', 'case', 'when', 'then', 
    'else', 'end', 'exists', 'any', 'all', 'union', 'intersect', 'except'
  ]);
  
  const tokens = normalized.match(/\b[a-z_][a-z0-9_]*\b/g) || [];
  return tokens.filter(t => !sqlKeywords.has(t));
}

// Extract WHERE clause
function extractWhereClause(sql: string): string | null {
  const normalized = sql.toLowerCase();
  const match = normalized.match(/\bwhere\s+(.+?)(?:\s+group\s+by|\s+order\s+by|\s+having|\s+limit|$)/);
  return match ? match[1].trim() : null;
}

// Extract elements from WHERE clause
function extractWhereElements(whereClause: string | null): { columns: string[], values: string[], operators: string[] } {
  if (!whereClause) return { columns: [], values: [], operators: [] };
  
  const columns: string[] = [];
  const values: string[] = [];
  const operators: string[] = [];
  
  // Match patterns like: column = 'value', column > 5, column LIKE '%text%', column BETWEEN x AND y
  const conditionRegex = /(\w+)\s*(=|!=|<>|>=|<=|>|<|like|in|between|is)\s*(?:'([^']*)'|"([^"]*)"|(\d+(?:\.\d+)?)|(\w+))/gi;
  let match;
  
  while ((match = conditionRegex.exec(whereClause)) !== null) {
    columns.push(match[1].toLowerCase());
    operators.push(match[2].toLowerCase());
    const value = match[3] || match[4] || match[5] || match[6];
    if (value) values.push(value.toLowerCase());
  }
  
  return { columns, values, operators };
}

// Extract ORDER BY clause
function extractOrderBy(sql: string): { clause: string | null, columns: string[], directions: string[] } {
  const normalized = sql.toLowerCase();
  const match = normalized.match(/\border\s+by\s+(.+?)(?:\s+limit|$)/);
  
  if (!match) return { clause: null, columns: [], directions: [] };
  
  const clause = match[1].trim();
  const columns: string[] = [];
  const directions: string[] = [];
  
  const parts = clause.split(',').map(p => p.trim());
  for (const part of parts) {
    const colMatch = part.match(/^(\w+(?:\.\w+)?)\s*(asc|desc)?$/i);
    if (colMatch) {
      columns.push(colMatch[1].toLowerCase().replace(/^\w+\./, ''));
      directions.push(colMatch[2]?.toLowerCase() || 'asc');
    }
  }
  
  return { clause, columns, directions };
}

// Extract GROUP BY clause
function extractGroupBy(sql: string): { clause: string | null, columns: string[] } {
  const normalized = sql.toLowerCase();
  const match = normalized.match(/\bgroup\s+by\s+(.+?)(?:\s+having|\s+order\s+by|\s+limit|$)/);
  
  if (!match) return { clause: null, columns: [] };
  
  const clause = match[1].trim();
  const columns = clause.split(',').map(c => c.trim().toLowerCase().replace(/^\w+\./, ''));
  
  return { clause, columns };
}

// Extract HAVING clause
function extractHaving(sql: string): string | null {
  const normalized = sql.toLowerCase();
  const match = normalized.match(/\bhaving\s+(.+?)(?:\s+order\s+by|\s+limit|$)/);
  return match ? match[1].trim() : null;
}

// Check for aggregate functions
function hasAggregateFunctions(sql: string): string[] {
  const normalized = sql.toLowerCase();
  const functions: string[] = [];
  
  if (/\bcount\s*\(/.test(normalized)) functions.push("COUNT");
  if (/\bsum\s*\(/.test(normalized)) functions.push("SUM");
  if (/\bavg\s*\(/.test(normalized)) functions.push("AVG");
  if (/\bmax\s*\(/.test(normalized)) functions.push("MAX");
  if (/\bmin\s*\(/.test(normalized)) functions.push("MIN");
  
  return functions;
}

// Check for window functions
function hasWindowFunctions(sql: string): string[] {
  const normalized = sql.toLowerCase();
  const functions: string[] = [];
  
  if (/\brank\s*\(/.test(normalized)) functions.push("RANK");
  if (/\brow_number\s*\(/.test(normalized)) functions.push("ROW_NUMBER");
  if (/\bdense_rank\s*\(/.test(normalized)) functions.push("DENSE_RANK");
  if (/\bover\s*\(/.test(normalized)) functions.push("OVER");
  if (/\bpartition\s+by\b/.test(normalized)) functions.push("PARTITION BY");
  
  return functions;
}

// Extract keywords for feedback
function extractKeywords(sql: string): string[] {
  const normalized = sql.toLowerCase();
  const keywords: string[] = [];
  
  if (/\bselect\b/.test(normalized)) keywords.push("SELECT");
  if (/\bselect\s+\*\s+from\b/.test(normalized)) keywords.push("*");
  if (/\bfrom\b/.test(normalized)) keywords.push("FROM");
  if (/\bwhere\b/.test(normalized)) keywords.push("WHERE");
  if (/\border\s+by\b/.test(normalized)) keywords.push("ORDER BY");
  if (/\bgroup\s+by\b/.test(normalized)) keywords.push("GROUP BY");
  if (/\bhaving\b/.test(normalized)) keywords.push("HAVING");
  if (/\bjoin\b/.test(normalized)) keywords.push("JOIN");
  if (/\bleft\s+join\b/.test(normalized)) keywords.push("LEFT JOIN");
  if (/\bright\s+join\b/.test(normalized)) keywords.push("RIGHT JOIN");
  if (/\binner\s+join\b/.test(normalized)) keywords.push("INNER JOIN");
  if (/\bon\b/.test(normalized)) keywords.push("ON");
  if (/\band\b/.test(normalized)) keywords.push("AND");
  if (/\bor\b/.test(normalized)) keywords.push("OR");
  if (/\bnot\s+in\b/.test(normalized)) keywords.push("NOT IN");
  if (/\bin\s*\(/.test(normalized) && !/\bnot\s+in\b/.test(normalized)) keywords.push("IN");
  if (/\blike\b/.test(normalized)) keywords.push("LIKE");
  if (/\bbetween\b/.test(normalized)) keywords.push("BETWEEN");
  if (/\bdistinct\b/.test(normalized)) keywords.push("DISTINCT");
  if (/\bdesc\b/.test(normalized)) keywords.push("DESC");
  if (/\basc\b/.test(normalized)) keywords.push("ASC");
  if (/\blimit\b/.test(normalized)) keywords.push("LIMIT");
  
  hasAggregateFunctions(sql).forEach(f => keywords.push(`${f}()`));
  hasWindowFunctions(sql).forEach(f => keywords.push(f.includes("BY") ? f : `${f}()`));
  
  return keywords;
}

// Main SQL checking function
export function checkSqlAnswer(
  userSql: string,
  question: SQLQuestion
): CheckResult {
  const userNormalized = normalizeSql(userSql);
  const expectedNormalized = normalizeSql(question.expectedSql);
  
  // Empty check
  if (!userSql.trim()) {
    return {
      isCorrect: false,
      feedback: "Please enter a SQL query.",
      matchedKeywords: [],
      missingKeywords: [],
    };
  }
  
  // Exact match (normalized)
  if (userNormalized === expectedNormalized) {
    return {
      isCorrect: true,
      feedback: "Perfect! Your SQL query matches the expected solution.",
      matchedKeywords: extractKeywords(userSql),
      missingKeywords: [],
    };
  }
  
  const userKeywords = extractKeywords(userSql);
  const expectedKeywords = extractKeywords(question.expectedSql);
  const matchedKeywords = userKeywords.filter(k => expectedKeywords.includes(k));
  const missingKeywords = expectedKeywords.filter(k => !userKeywords.includes(k));
  
  // 1. Check SELECT exists
  if (!/\bselect\b/i.test(userNormalized)) {
    return {
      isCorrect: false,
      feedback: "Your query needs to start with SELECT.",
      matchedKeywords,
      missingKeywords,
    };
  }
  
  // 2. Check FROM exists
  if (!/\bfrom\b/i.test(userNormalized)) {
    return {
      isCorrect: false,
      feedback: "Your query needs a FROM clause to specify which table to query.",
      matchedKeywords,
      missingKeywords,
    };
  }
  
  // 3. Validate SELECT clause (catches invalid chars like /)
  const selectValidation = isValidSelectClause(userSql);
  if (!selectValidation.valid) {
    return {
      isCorrect: false,
      feedback: selectValidation.reason,
      matchedKeywords,
      missingKeywords,
    };
  }
  
  // 4. CHECK FOR TYPOS IN ALL IDENTIFIERS
  const validTables = getAllValidTables();
  const validColumns = getAllValidColumns();
  const allValid = new Set([...validTables, ...validColumns]);
  
  const userIdentifiers = extractAllIdentifiers(userSql);
  for (const identifier of userIdentifiers) {
    // Skip numbers, short aliases (1-2 chars), and known valid identifiers
    if (/^\d+$/.test(identifier)) continue;
    if (identifier.length <= 2) continue;
    if (allValid.has(identifier)) continue;
    
    // Check if it's a typo of a valid identifier
    const suggestion = findSimilar(identifier, allValid, 2);
    if (suggestion) {
      return {
        isCorrect: false,
        feedback: `"${identifier}" looks like a typo. Did you mean "${suggestion}"?`,
        matchedKeywords,
        missingKeywords,
      };
    }
  }
  
  // Extract components for detailed validation
  const userTables = extractTableNames(userSql);
  const expectedTables = extractTableNames(question.expectedSql);
  const userColumns = extractSelectedColumns(userSql);
  const expectedColumns = extractSelectedColumns(question.expectedSql);
  
  const userWhere = extractWhereClause(userSql);
  const expectedWhere = extractWhereClause(question.expectedSql);
  const userWhereElements = extractWhereElements(userWhere);
  const expectedWhereElements = extractWhereElements(expectedWhere);
  
  const userOrderBy = extractOrderBy(userSql);
  const expectedOrderBy = extractOrderBy(question.expectedSql);
  
  const userGroupBy = extractGroupBy(userSql);
  const expectedGroupBy = extractGroupBy(question.expectedSql);
  
  const userHaving = extractHaving(userSql);
  const expectedHaving = extractHaving(question.expectedSql);
  
  const userAggregates = hasAggregateFunctions(userSql);
  const expectedAggregates = hasAggregateFunctions(question.expectedSql);
  
  const userWindowFuncs = hasWindowFunctions(userSql);
  const expectedWindowFuncs = hasWindowFunctions(question.expectedSql);
  
  const errors: string[] = [];
  
  // 5. Check table names
  const missingTables = expectedTables.filter(t => !userTables.includes(t));
  const wrongTables = userTables.filter(t => !expectedTables.includes(t) && validTables.has(t));
  
  if (missingTables.length > 0) {
    if (wrongTables.length > 0) {
      return {
        isCorrect: false,
        feedback: `You're querying "${wrongTables[0].toUpperCase()}" but this question requires the "${missingTables[0].toUpperCase()}" table.`,
        matchedKeywords,
        missingKeywords,
      };
    }
    errors.push(`You need to query from the ${missingTables.map(t => t.toUpperCase()).join(", ")} table.`);
  }
  
  // 6. Check SELECT * when expected
  if (expectedColumns.includes("*")) {
    if (!userColumns.includes("*")) {
      return {
        isCorrect: false,
        feedback: "This question expects you to select all columns using SELECT *.",
        matchedKeywords,
        missingKeywords: ["*", ...missingKeywords.filter(k => k !== "*")],
      };
    }
  }
  
  // 7. Check WHERE clause content
  if (expectedWhere && !userWhere) {
    errors.push("You need a WHERE clause to filter the results.");
  } else if (expectedWhere && userWhere) {
    // Check column names in WHERE
    const missingWhereCols = expectedWhereElements.columns.filter(c => 
      !userWhereElements.columns.includes(c)
    );
    
    if (missingWhereCols.length > 0) {
      const wrongCols = userWhereElements.columns.filter(c => 
        !expectedWhereElements.columns.includes(c)
      );
      
      if (wrongCols.length > 0) {
        // Check for typo
        const suggestion = findSimilar(wrongCols[0], new Set(expectedWhereElements.columns), 2);
        if (suggestion) {
          return {
            isCorrect: false,
            feedback: `Check your WHERE clause - "${wrongCols[0]}" might be misspelled. Did you mean "${suggestion}"?`,
            matchedKeywords,
            missingKeywords,
          };
        }
        return {
          isCorrect: false,
          feedback: `Your WHERE clause uses "${wrongCols[0]}" but should use "${missingWhereCols[0]}".`,
          matchedKeywords,
          missingKeywords,
        };
      }
      errors.push(`Your WHERE clause should filter on: ${missingWhereCols.join(", ")}.`);
    }
    
    // Check values in WHERE
    const missingWhereValues = expectedWhereElements.values.filter(v => 
      !userWhereElements.values.includes(v)
    );
    
    if (missingWhereValues.length > 0 && missingWhereCols.length === 0) {
      const wrongValues = userWhereElements.values.filter(v => 
        !expectedWhereElements.values.includes(v)
      );
      
      if (wrongValues.length > 0) {
        return {
          isCorrect: false,
          feedback: `Check the value in your WHERE clause - "${wrongValues[0]}" should be "${missingWhereValues[0]}".`,
          matchedKeywords,
          missingKeywords,
        };
      }
    }
  }
  
  // 8. Check ORDER BY clause
  if (expectedOrderBy.clause && !userOrderBy.clause) {
    errors.push("You need an ORDER BY clause to sort the results.");
  } else if (expectedOrderBy.clause && userOrderBy.clause) {
    // Check ORDER BY columns
    const missingOrderCols = expectedOrderBy.columns.filter(c => 
      !userOrderBy.columns.includes(c)
    );
    
    if (missingOrderCols.length > 0) {
      const wrongOrderCols = userOrderBy.columns.filter(c => 
        !expectedOrderBy.columns.includes(c)
      );
      
      if (wrongOrderCols.length > 0) {
        const suggestion = findSimilar(wrongOrderCols[0], new Set(expectedOrderBy.columns), 2);
        if (suggestion) {
          return {
            isCorrect: false,
            feedback: `Check your ORDER BY - "${wrongOrderCols[0]}" might be misspelled. Did you mean "${suggestion}"?`,
            matchedKeywords,
            missingKeywords,
          };
        }
      }
      errors.push(`ORDER BY should use: ${missingOrderCols.join(", ")}.`);
    }
    
    // Check ORDER BY direction (ASC/DESC)
    for (let i = 0; i < expectedOrderBy.columns.length; i++) {
      const expectedCol = expectedOrderBy.columns[i];
      const expectedDir = expectedOrderBy.directions[i];
      const userIdx = userOrderBy.columns.indexOf(expectedCol);
      
      if (userIdx !== -1 && userOrderBy.directions[userIdx] !== expectedDir) {
        return {
          isCorrect: false,
          feedback: `Check your ORDER BY direction - "${expectedCol}" should be ${expectedDir.toUpperCase()}, not ${userOrderBy.directions[userIdx].toUpperCase()}.`,
          matchedKeywords,
          missingKeywords,
        };
      }
    }
  }
  
  // 9. Check GROUP BY clause
  if (expectedGroupBy.clause && !userGroupBy.clause) {
    errors.push("You need a GROUP BY clause to group the results.");
  } else if (expectedGroupBy.clause && userGroupBy.clause) {
    const missingGroupCols = expectedGroupBy.columns.filter(c => 
      !userGroupBy.columns.some(uc => uc.includes(c) || c.includes(uc))
    );
    
    if (missingGroupCols.length > 0) {
      const wrongGroupCols = userGroupBy.columns.filter(c => 
        !expectedGroupBy.columns.some(ec => ec.includes(c) || c.includes(ec))
      );
      
      if (wrongGroupCols.length > 0) {
        const suggestion = findSimilar(wrongGroupCols[0], new Set(expectedGroupBy.columns), 2);
        if (suggestion) {
          return {
            isCorrect: false,
            feedback: `Check your GROUP BY - "${wrongGroupCols[0]}" might be misspelled. Did you mean "${suggestion}"?`,
            matchedKeywords,
            missingKeywords,
          };
        }
      }
      errors.push(`GROUP BY should include: ${missingGroupCols.join(", ")}.`);
    }
  }
  
  // 10. Check HAVING clause
  if (expectedHaving && !userHaving) {
    errors.push("You need a HAVING clause to filter grouped results.");
  }
  
  // 11. Check aggregate functions
  const missingAggregates = expectedAggregates.filter(a => !userAggregates.includes(a));
  if (missingAggregates.length > 0) {
    errors.push(`You need to use: ${missingAggregates.join(", ")}().`);
  }
  
  // 12. Check window functions
  const missingWindowFuncs = expectedWindowFuncs.filter(w => !userWindowFuncs.includes(w));
  if (missingWindowFuncs.length > 0) {
    errors.push(`You need to use window functions: ${missingWindowFuncs.join(", ")}.`);
  }
  
  // 13. Check JOINs for multi-table queries
  if (expectedTables.length > 1 && userTables.length < expectedTables.length) {
    errors.push("This question requires joining multiple tables.");
  }
  
  // Return first error
  if (errors.length > 0) {
    return {
      isCorrect: false,
      feedback: errors[0],
      matchedKeywords,
      missingKeywords,
    };
  }
  
  // Final structural check - all key elements must match
  const tablesMatch = expectedTables.every(t => userTables.includes(t));
  const columnsMatch = expectedColumns.includes("*") 
    ? userColumns.includes("*")
    : expectedColumns.every(c => {
        const cNorm = c.toLowerCase().replace(/^\w+\./, "");
        return userColumns.some(uc => uc.toLowerCase().replace(/^\w+\./, "").includes(cNorm));
      });
  const whereMatch = !expectedWhere || (userWhere && 
    expectedWhereElements.columns.every(c => userWhereElements.columns.includes(c)) &&
    expectedWhereElements.values.every(v => userWhereElements.values.includes(v))
  );
  const orderByMatch = !expectedOrderBy.clause || (userOrderBy.clause &&
    expectedOrderBy.columns.every(c => userOrderBy.columns.includes(c))
  );
  const groupByMatch = !expectedGroupBy.clause || (userGroupBy.clause &&
    expectedGroupBy.columns.every(c => userGroupBy.columns.some(uc => uc.includes(c) || c.includes(uc)))
  );
  const havingMatch = !expectedHaving || userHaving;
  const aggregatesMatch = expectedAggregates.every(a => userAggregates.includes(a));
  const windowMatch = expectedWindowFuncs.every(w => userWindowFuncs.includes(w));
  
  const isCorrect = tablesMatch && columnsMatch && whereMatch && orderByMatch && 
                    groupByMatch && havingMatch && aggregatesMatch && windowMatch;
  
  if (isCorrect) {
    return {
      isCorrect: true,
      feedback: "Good job! Your query structure is correct and should produce the expected results.",
      matchedKeywords,
      missingKeywords,
    };
  }
  
  return {
    isCorrect: false,
    feedback: "Your query structure needs adjustment. Review the hint for guidance.",
    matchedKeywords,
    missingKeywords,
  };
}
