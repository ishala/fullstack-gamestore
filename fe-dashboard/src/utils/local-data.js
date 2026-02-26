import dayjs from "dayjs";

// ==========================
// Dashboard Dummy Data
// ==========================

const generateDates = (count = 20) => {
  const dates = [];
  for (let i = count; i >= 0; i--) {
    dates.push(dayjs().subtract(i, "day").format("MM/DD"));
  }
  return dates;
};

const dates = generateDates(50);

const dummySummary = {
  totalGames: 1284,
  totalDeals: 347,
  topGenre: "Action",
  latestGame: "Elden Ring",
};

const dummyGenreChart = [
  { name: "Action", value: 312 },
  { name: "RPG", value: 215 },
  { name: "Shooter", value: 178 },
  { name: "Adventure", value: 143 },
  { name: "Strategy", value: 98 },
  { name: "Sports", value: 76 },
  { name: "Puzzle", value: 54 },
];

const dummyStoreChart = [
  { name: "Steam", value: 134 },
  { name: "Epic Games", value: 87 },
  { name: "GOG", value: 62 },
  { name: "Humble Store", value: 41 },
  { name: "GamersGate", value: 23 },
];

const dummyGamesPerDate = dates.map((date) => ({
  date,
  count: Math.floor(Math.random() * 25) + 3,
}));

const dummyDealsPerDate = dates.map((date) => ({
  date,
  count: Math.floor(Math.random() * 18) + 2,
}));

// ==========================
// Management Dummy Data
// ==========================

const mockData = [
  {
    id: 1,
    name: "Elden Ring",
    genre: "RPG",
    releaseDate: "2022-02-25",
    platform: "PC, PS5, Xbox",
    cheapest: 29.99,
    rating: 9.5,
    updatedAt: "2024-01-10",
  },
  {
    id: 2,
    name: "Cyberpunk 2077",
    genre: "Action RPG",
    releaseDate: "2020-12-10",
    platform: "PC, PS5",
    cheapest: 19.99,
    rating: 8.1,
    updatedAt: "2024-01-09",
  },
  {
    id: 3,
    name: "Hollow Knight",
    genre: "Metroidvania",
    releaseDate: "2017-02-24",
    platform: "PC, Switch",
    cheapest: 7.99,
    rating: 9.2,
    updatedAt: "2024-01-08",
  },
  {
    id: 4,
    name: "God of War",
    genre: "Action",
    releaseDate: "2022-01-14",
    platform: "PC, PS4, PS5",
    cheapest: 39.99,
    rating: 9.4,
    updatedAt: "2024-01-07",
  },
  {
    id: 5,
    name: "Stardew Valley",
    genre: "Simulation",
    releaseDate: "2016-02-26",
    platform: "PC, Switch, Mobile",
    cheapest: 4.99,
    rating: 9.0,
    updatedAt: "2024-01-06",
  },
];

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "genre", label: "Genre" },
  { key: "releaseDate", label: "Release Date" },
  { key: "platform", label: "Platform" },
  { key: "cheapest", label: "Deal" },
  { key: "rating", label: "Rating" },
];

export {
  dummySummary,
  dummyGenreChart,
  dummyStoreChart,
  dummyGamesPerDate,
  dummyDealsPerDate,
  mockData,
  COLUMNS
};
