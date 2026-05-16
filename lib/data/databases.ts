import type { Database } from "./types";

export const databases: Database[] = [
  {
    id: "city",
    name: "City Database",
    description: "Geographic data with cities, countries, and weather stations",
    tables: [
      {
        name: "CITY",
        columns: [
          { name: "id", type: "INT", primaryKey: true },
          { name: "name", type: "VARCHAR(100)" },
          { name: "country_code", type: "CHAR(3)", foreignKey: { table: "COUNTRY", column: "code" } },
          { name: "population", type: "INT" },
          { name: "district", type: "VARCHAR(100)" },
        ],
        sampleData: [
          { id: 1, name: "Tokyo", country_code: "JPN", population: 13960000, district: "Kanto" },
          { id: 2, name: "Mumbai", country_code: "IND", population: 12478447, district: "Maharashtra" },
          { id: 3, name: "New York", country_code: "USA", population: 8336817, district: "New York" },
          { id: 4, name: "London", country_code: "GBR", population: 8982000, district: "England" },
          { id: 5, name: "Paris", country_code: "FRA", population: 2161000, district: "Ile-de-France" },
        ],
      },
      {
        name: "COUNTRY",
        columns: [
          { name: "code", type: "CHAR(3)", primaryKey: true },
          { name: "name", type: "VARCHAR(100)" },
          { name: "continent", type: "VARCHAR(50)" },
          { name: "region", type: "VARCHAR(100)" },
          { name: "surface_area", type: "DECIMAL(10,2)" },
          { name: "population", type: "BIGINT" },
        ],
        sampleData: [
          { code: "JPN", name: "Japan", continent: "Asia", region: "Eastern Asia", surface_area: 377930, population: 126476461 },
          { code: "IND", name: "India", continent: "Asia", region: "Southern Asia", surface_area: 3287263, population: 1380004385 },
          { code: "USA", name: "United States", continent: "North America", region: "Northern America", surface_area: 9372610, population: 331002651 },
          { code: "GBR", name: "United Kingdom", continent: "Europe", region: "British Islands", surface_area: 242900, population: 67886011 },
          { code: "FRA", name: "France", continent: "Europe", region: "Western Europe", surface_area: 551500, population: 65273511 },
        ],
      },
      {
        name: "STATION",
        columns: [
          { name: "id", type: "INT", primaryKey: true },
          { name: "city", type: "VARCHAR(100)" },
          { name: "state", type: "CHAR(2)" },
          { name: "lat_n", type: "DECIMAL(8,4)" },
          { name: "long_w", type: "DECIMAL(8,4)" },
        ],
        sampleData: [
          { id: 1, city: "Albany", state: "NY", lat_n: 42.6526, long_w: 73.7562 },
          { id: 2, city: "Austin", state: "TX", lat_n: 30.2672, long_w: 97.7431 },
          { id: 3, city: "Seattle", state: "WA", lat_n: 47.6062, long_w: 122.3321 },
          { id: 4, city: "Miami", state: "FL", lat_n: 25.7617, long_w: 80.1918 },
          { id: 5, city: "Denver", state: "CO", lat_n: 39.7392, long_w: 104.9903 },
        ],
      },
    ],
  },
  {
    id: "store",
    name: "Store Database",
    description: "E-commerce data with customers, orders, and products",
    tables: [
      {
        name: "CUSTOMERS",
        columns: [
          { name: "customer_id", type: "INT", primaryKey: true },
          { name: "first_name", type: "VARCHAR(50)" },
          { name: "last_name", type: "VARCHAR(50)" },
          { name: "email", type: "VARCHAR(100)" },
          { name: "city", type: "VARCHAR(100)" },
          { name: "join_date", type: "DATE" },
        ],
        sampleData: [
          { customer_id: 1, first_name: "John", last_name: "Smith", email: "john.smith@email.com", city: "New York", join_date: "2023-01-15" },
          { customer_id: 2, first_name: "Emma", last_name: "Wilson", email: "emma.w@email.com", city: "Los Angeles", join_date: "2023-02-20" },
          { customer_id: 3, first_name: "Michael", last_name: "Brown", email: "mbrown@email.com", city: "Chicago", join_date: "2023-03-10" },
          { customer_id: 4, first_name: "Sarah", last_name: "Davis", email: "sdavis@email.com", city: "Houston", join_date: "2023-04-05" },
          { customer_id: 5, first_name: "David", last_name: "Miller", email: "dmiller@email.com", city: "Phoenix", join_date: "2023-05-22" },
        ],
      },
      {
        name: "PRODUCTS",
        columns: [
          { name: "product_id", type: "INT", primaryKey: true },
          { name: "name", type: "VARCHAR(100)" },
          { name: "category", type: "VARCHAR(50)" },
          { name: "price", type: "DECIMAL(10,2)" },
          { name: "stock_quantity", type: "INT" },
        ],
        sampleData: [
          { product_id: 1, name: "Wireless Mouse", category: "Electronics", price: 29.99, stock_quantity: 150 },
          { product_id: 2, name: "USB-C Cable", category: "Electronics", price: 12.99, stock_quantity: 300 },
          { product_id: 3, name: "Notebook Set", category: "Office", price: 15.49, stock_quantity: 200 },
          { product_id: 4, name: "Desk Lamp", category: "Home", price: 45.00, stock_quantity: 75 },
          { product_id: 5, name: "Coffee Mug", category: "Home", price: 8.99, stock_quantity: 500 },
        ],
      },
      {
        name: "ORDERS",
        columns: [
          { name: "order_id", type: "INT", primaryKey: true },
          { name: "customer_id", type: "INT", foreignKey: { table: "CUSTOMERS", column: "customer_id" } },
          { name: "order_date", type: "DATE" },
          { name: "total_amount", type: "DECIMAL(10,2)" },
          { name: "status", type: "VARCHAR(20)" },
        ],
        sampleData: [
          { order_id: 101, customer_id: 1, order_date: "2024-01-10", total_amount: 89.97, status: "delivered" },
          { order_id: 102, customer_id: 2, order_date: "2024-01-12", total_amount: 45.00, status: "delivered" },
          { order_id: 103, customer_id: 1, order_date: "2024-01-15", total_amount: 28.48, status: "shipped" },
          { order_id: 104, customer_id: 3, order_date: "2024-01-18", total_amount: 134.96, status: "processing" },
          { order_id: 105, customer_id: 4, order_date: "2024-01-20", total_amount: 8.99, status: "delivered" },
        ],
      },
      {
        name: "ORDER_ITEMS",
        columns: [
          { name: "item_id", type: "INT", primaryKey: true },
          { name: "order_id", type: "INT", foreignKey: { table: "ORDERS", column: "order_id" } },
          { name: "product_id", type: "INT", foreignKey: { table: "PRODUCTS", column: "product_id" } },
          { name: "quantity", type: "INT" },
          { name: "unit_price", type: "DECIMAL(10,2)" },
        ],
        sampleData: [
          { item_id: 1, order_id: 101, product_id: 1, quantity: 2, unit_price: 29.99 },
          { item_id: 2, order_id: 101, product_id: 2, quantity: 1, unit_price: 12.99 },
          { item_id: 3, order_id: 102, product_id: 4, quantity: 1, unit_price: 45.00 },
          { item_id: 4, order_id: 103, product_id: 3, quantity: 1, unit_price: 15.49 },
          { item_id: 5, order_id: 103, product_id: 2, quantity: 1, unit_price: 12.99 },
        ],
      },
    ],
  },
  {
    id: "gym",
    name: "Gym Database",
    description: "Fitness center data with members, classes, and trainers",
    tables: [
      {
        name: "MEMBERS",
        columns: [
          { name: "member_id", type: "INT", primaryKey: true },
          { name: "name", type: "VARCHAR(100)" },
          { name: "email", type: "VARCHAR(100)" },
          { name: "membership_type", type: "VARCHAR(20)" },
          { name: "join_date", type: "DATE" },
          { name: "age", type: "INT" },
        ],
        sampleData: [
          { member_id: 1, name: "Alex Johnson", email: "alex.j@email.com", membership_type: "premium", join_date: "2023-01-10", age: 28 },
          { member_id: 2, name: "Maria Garcia", email: "mgarcia@email.com", membership_type: "basic", join_date: "2023-02-15", age: 35 },
          { member_id: 3, name: "Chris Lee", email: "clee@email.com", membership_type: "premium", join_date: "2023-03-20", age: 42 },
          { member_id: 4, name: "Taylor Swift", email: "tswift@email.com", membership_type: "basic", join_date: "2023-04-05", age: 24 },
          { member_id: 5, name: "Jordan Park", email: "jpark@email.com", membership_type: "premium", join_date: "2023-05-12", age: 31 },
        ],
      },
      {
        name: "TRAINERS",
        columns: [
          { name: "trainer_id", type: "INT", primaryKey: true },
          { name: "name", type: "VARCHAR(100)" },
          { name: "specialty", type: "VARCHAR(50)" },
          { name: "hire_date", type: "DATE" },
          { name: "hourly_rate", type: "DECIMAL(6,2)" },
        ],
        sampleData: [
          { trainer_id: 1, name: "Mike Strong", specialty: "Strength Training", hire_date: "2020-06-01", hourly_rate: 65.00 },
          { trainer_id: 2, name: "Lisa Flex", specialty: "Yoga", hire_date: "2021-03-15", hourly_rate: 55.00 },
          { trainer_id: 3, name: "Tom Cardio", specialty: "HIIT", hire_date: "2019-09-20", hourly_rate: 60.00 },
          { trainer_id: 4, name: "Nina Core", specialty: "Pilates", hire_date: "2022-01-10", hourly_rate: 58.00 },
        ],
      },
      {
        name: "CLASSES",
        columns: [
          { name: "class_id", type: "INT", primaryKey: true },
          { name: "name", type: "VARCHAR(100)" },
          { name: "trainer_id", type: "INT", foreignKey: { table: "TRAINERS", column: "trainer_id" } },
          { name: "day_of_week", type: "VARCHAR(10)" },
          { name: "start_time", type: "TIME" },
          { name: "capacity", type: "INT" },
        ],
        sampleData: [
          { class_id: 1, name: "Power Lifting", trainer_id: 1, day_of_week: "Monday", start_time: "09:00", capacity: 15 },
          { class_id: 2, name: "Morning Yoga", trainer_id: 2, day_of_week: "Tuesday", start_time: "07:00", capacity: 20 },
          { class_id: 3, name: "HIIT Blast", trainer_id: 3, day_of_week: "Wednesday", start_time: "18:00", capacity: 25 },
          { class_id: 4, name: "Core Pilates", trainer_id: 4, day_of_week: "Thursday", start_time: "10:00", capacity: 15 },
          { class_id: 5, name: "Evening Yoga", trainer_id: 2, day_of_week: "Friday", start_time: "19:00", capacity: 20 },
        ],
      },
      {
        name: "ATTENDANCE",
        columns: [
          { name: "attendance_id", type: "INT", primaryKey: true },
          { name: "member_id", type: "INT", foreignKey: { table: "MEMBERS", column: "member_id" } },
          { name: "class_id", type: "INT", foreignKey: { table: "CLASSES", column: "class_id" } },
          { name: "attendance_date", type: "DATE" },
          { name: "rating", type: "INT", nullable: true },
        ],
        sampleData: [
          { attendance_id: 1, member_id: 1, class_id: 1, attendance_date: "2024-01-08", rating: 5 },
          { attendance_id: 2, member_id: 2, class_id: 2, attendance_date: "2024-01-09", rating: 4 },
          { attendance_id: 3, member_id: 1, class_id: 3, attendance_date: "2024-01-10", rating: 5 },
          { attendance_id: 4, member_id: 3, class_id: 4, attendance_date: "2024-01-11", rating: 3 },
          { attendance_id: 5, member_id: 4, class_id: 5, attendance_date: "2024-01-12", rating: 5 },
        ],
      },
    ],
  },
  {
    id: "anime",
    name: "Anime Database",
    description: "Anime series data with genres and production studios",
    tables: [
      {
        name: "ANIME",
        columns: [
          { name: "anime_id", type: "INT", primaryKey: true },
          { name: "title", type: "VARCHAR(200)" },
          { name: "studio_id", type: "INT", foreignKey: { table: "STUDIOS", column: "studio_id" } },
          { name: "episodes", type: "INT" },
          { name: "rating", type: "DECIMAL(3,2)" },
          { name: "release_year", type: "INT" },
        ],
        sampleData: [
          { anime_id: 1, title: "Attack on Titan", studio_id: 1, episodes: 87, rating: 9.1, release_year: 2013 },
          { anime_id: 2, title: "My Hero Academia", studio_id: 2, episodes: 138, rating: 8.5, release_year: 2016 },
          { anime_id: 3, title: "Demon Slayer", studio_id: 3, episodes: 44, rating: 8.9, release_year: 2019 },
          { anime_id: 4, title: "Jujutsu Kaisen", studio_id: 4, episodes: 47, rating: 8.8, release_year: 2020 },
          { anime_id: 5, title: "Spy x Family", studio_id: 1, episodes: 37, rating: 8.6, release_year: 2022 },
        ],
      },
      {
        name: "STUDIOS",
        columns: [
          { name: "studio_id", type: "INT", primaryKey: true },
          { name: "name", type: "VARCHAR(100)" },
          { name: "founded_year", type: "INT" },
          { name: "headquarters", type: "VARCHAR(100)" },
        ],
        sampleData: [
          { studio_id: 1, name: "Wit Studio", founded_year: 2012, headquarters: "Tokyo" },
          { studio_id: 2, name: "Bones", founded_year: 1998, headquarters: "Tokyo" },
          { studio_id: 3, name: "ufotable", founded_year: 2000, headquarters: "Tokyo" },
          { studio_id: 4, name: "MAPPA", founded_year: 2011, headquarters: "Tokyo" },
          { studio_id: 5, name: "Kyoto Animation", founded_year: 1981, headquarters: "Kyoto" },
        ],
      },
      {
        name: "GENRES",
        columns: [
          { name: "genre_id", type: "INT", primaryKey: true },
          { name: "name", type: "VARCHAR(50)" },
          { name: "description", type: "VARCHAR(200)" },
        ],
        sampleData: [
          { genre_id: 1, name: "Action", description: "Features combat and physical challenges" },
          { genre_id: 2, name: "Fantasy", description: "Includes magical or supernatural elements" },
          { genre_id: 3, name: "Shonen", description: "Targeted at young male audience" },
          { genre_id: 4, name: "Comedy", description: "Focuses on humor and entertainment" },
          { genre_id: 5, name: "Drama", description: "Emphasizes emotional narratives" },
        ],
      },
      {
        name: "ANIME_GENRES",
        columns: [
          { name: "anime_id", type: "INT", foreignKey: { table: "ANIME", column: "anime_id" } },
          { name: "genre_id", type: "INT", foreignKey: { table: "GENRES", column: "genre_id" } },
        ],
        sampleData: [
          { anime_id: 1, genre_id: 1 },
          { anime_id: 1, genre_id: 2 },
          { anime_id: 1, genre_id: 3 },
          { anime_id: 2, genre_id: 1 },
          { anime_id: 2, genre_id: 3 },
          { anime_id: 3, genre_id: 1 },
          { anime_id: 3, genre_id: 2 },
          { anime_id: 4, genre_id: 1 },
          { anime_id: 4, genre_id: 2 },
          { anime_id: 5, genre_id: 4 },
          { anime_id: 5, genre_id: 5 },
        ],
      },
    ],
  },
];

export function getDatabase(id: string): Database | undefined {
  return databases.find((db) => db.id === id);
}
