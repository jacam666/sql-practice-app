import assert from "node:assert/strict"

import { questions } from "../lib/data/questions"
import { checkSqlAnswer } from "../lib/data/sql-checker"
import { executeSqlQuery } from "../lib/data/sql-runner"

function getQuestion(id: string) {
  const question = questions.find((q) => q.id === id)
  assert.ok(question, `Missing question with id: ${id}`)
  return question
}

function expectCorrect(questionId: string, sql: string) {
  const result = checkSqlAnswer(sql, getQuestion(questionId))
  assert.equal(
    result.isCorrect,
    true,
    `Expected correct for ${questionId}. Feedback: ${result.feedback}`,
  )
}

function expectIncorrect(questionId: string, sql: string) {
  const result = checkSqlAnswer(sql, getQuestion(questionId))
  assert.equal(
    result.isCorrect,
    false,
    `Expected incorrect for ${questionId}. Feedback: ${result.feedback}`,
  )
}

async function run() {
  // Correct baseline cases
  expectCorrect("city-select-distinct", "SELECT DISTINCT district FROM CITY")
  expectCorrect("city-select-3", "SELECT name, district FROM CITY")
  expectCorrect(
    "city-where-between",
    "SELECT * FROM CITY WHERE population BETWEEN 2000000 AND 10000000",
  )

  // Regression: malformed DISTINCT syntax should fail
  expectIncorrect("city-select-distinct", "SELECT district(distinct) FROM CITY")

  // Regression: DISTINCT required should fail when omitted
  expectIncorrect("city-select-distinct", "SELECT district FROM CITY")

  // Regression: DISTINCT should fail when not required
  expectIncorrect("city-select-3", "SELECT DISTINCT name, district FROM CITY")

  // Regression: unexpected clauses should fail
  expectIncorrect(
    "city-select-distinct",
    "SELECT DISTINCT district FROM CITY WHERE population > 0",
  )
  expectIncorrect(
    "city-select-distinct",
    "SELECT DISTINCT district FROM CITY ORDER BY district ASC",
  )

  // Regression: BETWEEN should validate both boundaries
  expectIncorrect(
    "city-where-between",
    "SELECT * FROM CITY WHERE population BETWEEN 2000000 AND 9000000",
  )

  // Advanced: JOIN baseline + wrong-table rejection
  expectCorrect(
    "store-join-1",
    "SELECT c.first_name, c.last_name, o.order_id, o.total_amount FROM CUSTOMERS c JOIN ORDERS o ON c.customer_id = o.customer_id",
  )
  expectIncorrect(
    "store-join-1",
    "SELECT c.first_name, c.last_name, o.order_id, o.total_amount FROM CUSTOMERS c JOIN ORDERS o ON c.customer_id = o.customer_id JOIN PRODUCTS p ON p.product_id = 1",
  )

  // Advanced: GROUP BY baseline
  expectCorrect(
    "store-groupby-2",
    "SELECT status, COUNT(*) as order_count FROM ORDERS GROUP BY status",
  )

  // Advanced: HAVING baseline + missing HAVING rejection
  expectCorrect(
    "anime-having-1",
    "SELECT g.name, COUNT(*) as anime_count FROM GENRES g JOIN ANIME_GENRES ag ON g.genre_id = ag.genre_id GROUP BY g.genre_id, g.name HAVING COUNT(*) > 2",
  )
  expectIncorrect(
    "anime-having-1",
    "SELECT g.name, COUNT(*) as anime_count FROM GENRES g JOIN ANIME_GENRES ag ON g.genre_id = ag.genre_id GROUP BY g.genre_id, g.name",
  )

  // Advanced: window function baseline + missing partition rejection
  expectCorrect(
    "gym-window-1",
    "SELECT name, membership_type, age, RANK() OVER (PARTITION BY membership_type ORDER BY age) as age_rank FROM MEMBERS",
  )
  expectIncorrect(
    "gym-window-1",
    "SELECT name, membership_type, age, RANK() OVER (ORDER BY age) as age_rank FROM MEMBERS",
  )

  // Regression: extra WHERE condition should fail for fixed-filter questions
  expectIncorrect(
    "city-where-2",
    "SELECT * FROM CITY WHERE country_code = 'USA' AND population > 1000000",
  )

  // Regression: quoted literal case should match expected data filter
  expectIncorrect(
    "city-where-2",
    "SELECT * FROM CITY WHERE country_code = 'usa'",
  )

  // Regression: quoted literals should not be scanned as identifier typos
  expectCorrect(
    "city-where-2",
    "SELECT * FROM city WHERE country_code = 'USA'",
  )

  // Regression: extra selected columns should fail when question expects exact projection
  expectIncorrect(
    "city-select-2",
    "SELECT name, population, district FROM CITY",
  )

  // Regression: extra ORDER BY column should fail
  expectIncorrect(
    "city-orderby-3",
    "SELECT * FROM COUNTRY ORDER BY continent ASC, population DESC, name ASC",
  )

  // LIMIT checks (no current question expects LIMIT, so LIMIT should be rejected)
  expectIncorrect(
    "city-select-3",
    "SELECT name, district FROM CITY LIMIT 3",
  )

  // Execution regression: lowercase table name should still resolve
  const runnerResult = await executeSqlQuery(
    "SELECT * FROM city WHERE country_code = 'USA'",
    "city",
  )
  assert.equal(runnerResult.rows.length, 1, "Expected one USA city row from lowercase table query")

  const upperColumnRunnerResult = await executeSqlQuery(
    "SELECT * FROM CITY WHERE POPULATION < 5000000",
    "city",
  )
  assert.equal(
    upperColumnRunnerResult.rows.length,
    1,
    "Expected one row when filtering with uppercase column identifier",
  )

  const joinRunnerResult = await executeSqlQuery(
    "SELECT co.continent, COUNT(*) as city_count FROM CITY ci JOIN COUNTRY co ON ci.country_code = co.code GROUP BY co.continent",
    "city",
  )
  assert.equal(joinRunnerResult.rows.length, 3, "Expected grouped continent counts to return 3 rows")

  console.log("SQL checker tests passed")
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
