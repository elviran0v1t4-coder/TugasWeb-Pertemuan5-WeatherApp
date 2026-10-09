const API_KEY = "577172712fba7cff45f44736a5c7add6";
const BASE_URL ="https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL =
"https://api.openweathermap.org/data/2.5/forecast";

// DOM Elements
const form = document.querySelector("#searchForm");
const input = document.querySelector("#cityInput");
const loading = document.querySelector("#loading");
const error = document.querySelector("#error");
const result = document.querySelector("#weatherResult");

const unitButton = document.querySelector("#unitButton");

const forecast = document.querySelector("#forecast");
const forecastList = document.querySelector("#forecastList");

const history = document.querySelector("#history");
const historyList = document.querySelector("#historyList");


// Variables
let unit = "metric";
let lastCity = "";

// Fetch weather data
async function getWeather(city) {
  try {
    showLoading();
    error.classList.add("hidden");
    result.classList.add("hidden");
    forecast.classList.add("hidden");

    // Validasi input
    if (!city || city.trim() === "") {throw new Error("Nama kota tidak boleh kosong!");}
    const url =`${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${unit}&lang=id`;
    const res = await fetch(url);

    if (res.status === 404) {throw new Error(`Kota "${city}" tidak ditemukan.`);}
    if (!res.ok) {throw new Error("Server error. Coba lagi nanti.");}

    const data = await res.json();
    displayWeather(data);

    // BONUS: Forecast 5 hari
    getForecast(city);

    // BONUS: Simpan riwayat
    lastCity = data.name;
    saveHistory(data.name);
  } catch (err) {
    if (err.name === "TypeError") {
      showError(
        "🌐 Network error. Periksa koneksi internet Anda."
      );

    } else {
      showError(`❌ ${err.message}`);
    }

  } finally {
    hideLoading();
  }
}


// Display weather data
function displayWeather(data) {
  document.querySelector("#cityName").textContent =`📍 ${data.name}, ${data.sys.country}`;
  document.querySelector("#temperature").textContent =`${Math.round(data.main.temp)}${unit === "metric" ? "°C" : "°F"}`;
  document.querySelector("#description").textContent =`🌤️ ${data.weather[0].description}`;
  document.querySelector("#humidity").textContent =`💧 Kelembaban: ${data.main.humidity}%`;
  document.querySelector("#weatherIcon").src =`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  result.classList.remove("hidden");
}

// Loading
function showLoading() {loading.classList.remove("hidden");}
function hideLoading() {loading.classList.add("hidden");}

// Error
function showError(message) {error.textContent = message;
error.classList.remove("hidden");}

// ==================================================
// BONUS 1: TOGGLE °C / °F
// ==================================================
unitButton.addEventListener("click", () => {
  if (unit === "metric") {
    unit = "imperial";
    unitButton.textContent = "°F";
  } else {
    unit = "metric";
    unitButton.textContent = "°C";
  }

  if (lastCity !== "") {
    getWeather(lastCity);
  }
});

// ==================================================
// BONUS 2: FORECAST 5 HARI
// ==================================================
async function getForecast(city) {
  try {
    const url =`${FORECAST_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${unit}&lang=id`;
    const res = await fetch(url);

    if (!res.ok) {forecast.classList.add("hidden");return;}

    const data = await res.json();
    displayForecast(data.list);

  } catch (err) {
    forecast.classList.add("hidden");
  }
}

function displayForecast(listData) {

  // Ambil data pada jam 12 siang
  const perDay = listData.filter((item) =>
    item.dt_txt.includes("12:00:00")
  );

  const fiveDays = perDay.slice(0, 5);
  forecastList.innerHTML = fiveDays
    .map((item) => {
      const date = new Date(item.dt_txt);
      const dayName =
        date.toLocaleDateString("id-ID", {
          weekday: "short"
        });
      const temperature =
        Math.round(item.main.temp);
      const unitLabel =
        unit === "metric" ? "°C" : "°F";

      const icon =`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;return `
        <div class="forecast-day">
          <p>${dayName}</p>
          <img src="${icon}" alt="Weather">
          <p>${temperature}${unitLabel}</p>
        </div>
      `;

    })
    .join("");

  if (fiveDays.length > 0) {
    forecast.classList.remove("hidden");

  }
}

// ==================================================
// BONUS 3: SEARCH HISTORY
// ==================================================

function getHistory() {
  const data =localStorage.getItem("weatherHistory");

  if (data === null) {
    return [];
  }

  return JSON.parse(data);
}


function saveHistory(city) {
  let list = getHistory();

  // Hilangkan kota yang sama
  list = list.filter((item) =>
    item.toLowerCase() !== city.toLowerCase()
  );

  // Kota terbaru berada di depan
  list.unshift(city);

  // Maksimal 5 kota
  list = list.slice(0, 5);

  localStorage.setItem(
    "weatherHistory",
    JSON.stringify(list)
  );

  displayHistory();

}

function displayHistory() {
  const list = getHistory();
  if (list.length === 0) {
    history.classList.add("hidden");
    return;
  }

  history.classList.remove("hidden");
  historyList.innerHTML = "";
  list.forEach((city) => {
    const button =document.createElement("button");
    button.textContent = `📍 ${city}`;
    button.addEventListener("click", () => {
      input.value = city;
      getWeather(city);
    });

    historyList.appendChild(button);
  });
}

// Event listener
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (city) {
    getWeather(city);
  }
});

// Tampilkan history saat halaman dibuka
displayHistory();