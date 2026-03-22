const API_KEY = "118fc165722ddf406d2a2274e98cd772";

const photoContainer = document.getElementById("photoContainer");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherCardDiv = document.getElementById("weatherCard");
const forecastContainer = document.getElementById("forecastContainer");
const errorDiv = document.getElementById("error");
const showForecastBtn = document.getElementById("showForecastBtn");
const openFavoritesBtn = document.getElementById("openFavoritesBtn");
const favoritesSection = document.getElementById("favoritesSection");
const favoritesList = document.getElementById("favoritesList");
const mainSection = document.getElementById("mainSection");
const backBtn = document.getElementById("backBtn");
const saveMessage = document.getElementById("saveMessage");

let currentCity = null;

function setupBackgroundByTime() {
    const hour = new Date().getHours();
    const clouds = document.querySelectorAll(".cloud");
    const starsContainer = document.getElementById("stars");

    if (hour >= 6 && hour < 18) {
        clouds.forEach(c => c.style.display = "block");
        starsContainer.style.display = "none";
        document.body.style.background =
            "linear-gradient(135deg, #89f7fe, #66a6ff)";
    } else {
        clouds.forEach(c => c.style.display = "none");
        starsContainer.style.display = "block";
        document.body.style.background =
            "linear-gradient(135deg, #0f2027, #203a43, #2c5364)";
        generateStars();
    }
    setInterval(() => {
        if (document.getElementById("stars").style.display !== "none") {
            createShootingStar();
        }
    }, 2000);
}

function generateStars() {
    const stars = document.getElementById("stars");
    stars.innerHTML = "";
    for (let i = 0; i < 120; i++) {
        const s = document.createElement("div");
        s.className = "star";
        s.style.top = Math.random() * 100 + "%";
        s.style.left = Math.random() * 100 + "%";
        s.style.opacity = Math.random();
        stars.appendChild(s);
    }
}

setupBackgroundByTime();


async function fetchCityPhotos(city) {
    const photoIds = ["img-L1", "img-L2", "img-R1", "img-R2"];
    photoContainer.style.display = "block";

    try {
        const wikiUrlCaption = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages|title&generator=search&gsrsearch=${encodeURIComponent(city + " landmark")}&gsrlimit=4&piprop=thumbnail&pithumbsize=400`;

        const response = await fetch(wikiUrlCaption);
        const data = await response.json();

        if (!data.query) {
            throw new Error("No images found");
        }

        const pages = Object.values(data.query.pages);

        photoIds.forEach((id, index) => {
            const img = document.getElementById(id);
            const polaroid = img.parentElement;

            let captionDiv = polaroid.querySelector(".polaroid-caption");
            if (!captionDiv) {
                captionDiv = document.createElement("div");
                captionDiv.className = "polaroid-caption";
                polaroid.appendChild(captionDiv);
            }

            polaroid.classList.remove("show");

            if (pages[index] && pages[index].thumbnail) {
                img.src = pages[index].thumbnail.source;
                captionDiv.textContent = pages[index].title;
            } else {
                img.src = `https://loremflickr.com/400/400/${encodeURIComponent(city)}?random=${index}`;
                captionDiv.textContent = city;
            }

            img.onload = () => {
                setTimeout(() => {
                    polaroid.classList.add("show");
                }, 300 + index * 200);
            };
        });

    } catch (error) {
        photoIds.forEach((id, index) => {
            const img = document.getElementById(id);
            img.src = `https://loremflickr.com/400/400/${encodeURIComponent(city)}?random=${index}`;
            img.parentElement.classList.add("show");
        });
    }
}

function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites")) || [];
}

function saveFavorite(city) {
    const favs = getFavorites();
    if (favs.includes(city)) return false;
    favs.push(city);
    localStorage.setItem("favorites", JSON.stringify(favs));
    return true;
}

function removeFavorite(city) {
    const favs = getFavorites();
    const itemDiv = [...favoritesList.children].find(div => div.querySelector("span").textContent === city);
    if (!itemDiv) return;
    itemDiv.classList.add("removing");
    setTimeout(() => {
        const newFavs = favs.filter(c => c !== city);
        localStorage.setItem("favorites", JSON.stringify(newFavs));
        showFavorites();
    }, 500);
}

async function getWeatherData(city) {
    const resCurrent = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`);
    if (!resCurrent.ok) throw new Error("City not found");
    const currentData = await resCurrent.json();
    const resForecast = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`);
    const forecastData = await resForecast.json();
    return {currentData, forecastData};
}

function showFavorites() {
    photoContainer.style.display = "none";

    favoritesList.innerHTML = "";
    const favs = getFavorites();

    if (favs.length === 0) {
        favoritesList.innerHTML = "<p>No favorite cities yet</p>";
    }

    favs.forEach(city => {
        const div = document.createElement("div");
        div.className = "fav-item";
        div.id = `fav-${city.replace(/\s+/g, '')}`;

        div.innerHTML = `
            <div class="fav-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold; flex:1; text-align:left;">${city}</span>
                <button class="delete-fav" style="background:#f46969; color:white; border:none; border-radius:6px; padding:4px 8px; cursor:pointer;">✖</button>
            </div>
            <div class="fav-details" id="details-${city.replace(/\s+/g, '')}">
                </div>
        `;

        div.querySelector("span").onclick = () => expandFavorite(city);

        div.querySelector(".delete-fav").onclick = (e) => {
            e.stopPropagation();
            removeFavorite(city);
        };

        favoritesList.appendChild(div);
    });

    mainSection.style.display = "none";
    favoritesSection.style.display = "block";
}

async function expandFavorite(city) {
    const detailsDiv = document.getElementById(`details-${city.replace(/\s+/g, '')}`);
    const parentItem = document.getElementById(`fav-${city.replace(/\s+/g, '')}`);

    if (parentItem.classList.contains("active")) {
        parentItem.classList.remove("active");
        photoContainer.style.display = "none";
        return;
    }
    document.querySelectorAll('.fav-item').forEach(item => item.classList.remove('active'));

    try {
        const {currentData} = await getWeatherData(city);
        const temp = Math.round(currentData.main.temp);
        const conditionClass = mapCondition(currentData.weather[0].main);
        detailsDiv.innerHTML = `
            <div class="weather-card ${conditionClass}" style="opacity:1; transform:none; margin-top:0; padding:10px;">
                <h3 style="margin:0; color:white;">${temp}°C</h3>
                <p style="margin:0; color:white; font-size:12px;"><i>${currentData.weather[0].description}</i></p>
                <div style="display:flex; justify-content:space-around; font-size:10px; color:white; margin-top:5px;">
                    <span>H: ${currentData.main.humidity}%</span>
                    <span>W: ${currentData.wind.speed}km/h</span>
                </div>
            </div>
        `;

        parentItem.classList.add("active");

        fetchCityPhotos(city);
        photoContainer.style.display = "block";

    } catch (err) {
        detailsDiv.innerHTML = "<p style='color:red;'>Error loading the data</p>";
    }
}

function showHome() {
    favoritesSection.style.display = "none";
    mainSection.style.display = "block";
    photoContainer.style.display = "none";
    cityInput.value = "";
    weatherCardDiv.innerHTML = "";
    document.getElementById("buttons").style.display = "none";
    forecastContainer.style.display = "none";
}

function mapCondition(cond) {
    cond = cond.toLowerCase();
    if (cond.includes("clear")) return "sunny";
    if (cond.includes("cloud")) return "cloudy";
    if (cond.includes("rain") || cond.includes("drizzle")) return "rainy";
    if (cond.includes("snow")) return "snowy";
    return "cloudy";
}

function formatTimeWithTimezone(unix, timezone) {
    const date = new Date((unix + timezone) * 1000);
    return date.toUTCString().slice(17, 22);
}

function renderWeather(city, weatherData, forecastData) {
    currentCity = city;
    const conditionClass = mapCondition(weatherData.weather[0].main);
    const temp = Math.round(weatherData.main.temp);
    const description = weatherData.weather[0].description;
    const humidity = weatherData.main.humidity;
    const wind = weatherData.wind.speed;
    const feels_like = Math.round(weatherData.main.feels_like);
    const sunrise = formatTimeWithTimezone(weatherData.sys.sunrise, weatherData.timezone);
    const sunset = formatTimeWithTimezone(weatherData.sys.sunset, weatherData.timezone);

    weatherCardDiv.innerHTML = `
            <div class="weather-card ${conditionClass}">
            <button id="saveCityBtn" class="save-btn">★</button>
            <h1 style="text-shadow: 3px 2px 5px darkslategray; color: white; margin: 0;">${city}</h1>
            <p style="margin: 5px 0; color: white;"><i>${description}</i></p>
            <p style="font-size: xx-large;text-shadow: 3px 2px 5px darkslategray; color: white; margin: 10px 0;"><strong>${temp}°C</strong></p>
            <div id="detials">
                <div>
                    <img src="images/thermometer.png" width="40px" height="40px">
                    <p><i>Feels like</i><br>${feels_like}°C</p>
                </div>
                <div>
                    <img src="images/waterdrop.png" width="40px" height="40px">
                    <p><i>Humidity</i><br>${humidity}%</p>
                </div>
                <div>
                    <img src="images/wind.png" width="40px" height="40px">
                    <p><i>Wind</i><br>${wind}km/h</p>
                </div>
            </div>
            <div id="sunsetSunrise" style="margin-top:10px;color:white;display:flex;justify-content:space-around;">
                <p>Sunrise at ${sunrise}</p>
                <p>Sunset at ${sunset}</p>
            </div>
        </div>`;

    const card = weatherCardDiv.querySelector(".weather-card");
    setTimeout(() => card.classList.add("show"), 50);

    card.querySelector(".save-btn").onclick = () => {
        const saved = saveFavorite(currentCity);
        const messageEl = document.getElementById("contextSaveMessage");

        if (saved) {
            messageEl.textContent = "City saved!";
            messageEl.style.backgroundColor = "rgba(132,227,171,0.8)";
        } else {
            messageEl.textContent = "City Already saved!";
            messageEl.style.backgroundColor = "rgba(231, 76, 60, 0.8)";
        }
        messageEl.classList.add("show");
        setTimeout(() => {
            messageEl.classList.remove("show");
        }, 3000);
    };

    forecastContainer.innerHTML = "";
    const days = forecastData.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);
    days.forEach(day => {
        const dateStr = new Date(day.dt * 1000).toLocaleDateString("en-US", {weekday: "short"});
        const iconCode = day.weather[0].icon;
        const temp = Math.round(day.main.temp);
        const description = day.weather[0].description;

        const div = document.createElement("div");
        div.className = "forecast-day";
        div.innerHTML = `
        <div class="forecast-front">
            <p><strong>${dateStr}</strong></p>
            <img src="https://openweathermap.org/img/wn/${iconCode}.png">
            <p>${temp}°C</p>
        </div>
        <div class="forecast-back">
            <p>${dateStr}</p>
            <p style="text-transform: capitalize;">${description}</p>
        </div>
    `;
        forecastContainer.appendChild(div);
    });


    document.getElementById("buttons").style.display = "flex";
    forecastContainer.style.display = "none";
    showForecastBtn.textContent = "Show 5-day forecast";
}

async function fetchWeather(city) {
    if (!city) return;
    weatherCardDiv.innerHTML = `
        <div class="loading">
            <img src="images/loading-gif.gif" alt="Loading..." width="80">
        </div>
    `;
    photoContainer.style.display = "none";
    errorDiv.textContent = "";
    try {
        const {currentData, forecastData} = await getWeatherData(city);
        renderWeather(city, currentData, forecastData);
        fetchCityPhotos(city);
    } catch (err) {
        errorDiv.textContent = "City not found!";
        weatherCardDiv.innerHTML = "";
    }
}

searchBtn.onclick = () => fetchWeather(cityInput.value.trim());
cityInput.onkeypress = (e) => {
    if (e.key === "Enter") fetchWeather(cityInput.value.trim());
};
openFavoritesBtn.onclick = showFavorites;
backBtn.onclick = showHome;

showForecastBtn.onclick = () => {
    if (forecastContainer.style.display === "none") {
        forecastContainer.style.display = "flex";
        showForecastBtn.textContent = "Hide 5-day forecast";
    } else {
        forecastContainer.style.display = "none";
        showForecastBtn.textContent = "Show 5-day forecast";
    }
};
function createShootingStar() {
    const stars = document.getElementById("stars");
    const star = document.createElement("div");
    star.className = "shooting-star";
    star.style.top = Math.random() * 30 + "%";
    star.style.left = Math.random() * 80 + "%";
    const duration = 0.8 + Math.random() * 0.8;
    star.style.animation = `shoot ${duration}s linear`;
    stars.appendChild(star);
    setTimeout(() => {
        star.remove();
    }, duration * 1000);
}

