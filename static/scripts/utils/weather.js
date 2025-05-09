const API_KEY = "25f3e1edd5723516d5a24302fd21f7e6";
const API_URL = "https://api.openweathermap.org/data/2.5/forecast";

export async function fetchWeather(city = "Irbid") {
    try {
        const response = await fetch(`${API_URL}?q=${city}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error("Failed to fetch weather data");
        const data = await response.json();
        updateWeatherUI(data);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        showWeatherError();
    }
}

function showWeatherError() {
    document.getElementById("today-weather").innerHTML = `
        <div class="weather-day-content">
            <div class="weather-time">
                <h3 class="weather-day-title">Today</h3>
                <p>Day: N/A</p>
            </div>
            <div class="weather-time">
                <p>Night: N/A</p>
            </div>
        </div>
    `;
    document.getElementById("tomorrow-weather").innerHTML = `
        <div class="weather-day-content">
            <div class="weather-time">
                <h3 class="weather-day-title">Tomorrow</h3>
                <p>Day: N/A</p>
            </div>
            <div class="weather-time">
                <p>Night: N/A</p>
            </div>
        </div>
    `;
}

function updateWeatherUI(data) {
    const todayWeather = document.getElementById("today-weather");
    const tomorrowWeather = document.getElementById("tomorrow-weather");
    if (!todayWeather || !tomorrowWeather) return;

    // Get current date and tomorrow's date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Format dates for display
    const todayDate = `${today.getDate()} ${today.toLocaleString('default', { month: 'short' })}`;
    const tomorrowDate = `${tomorrow.getDate()} ${tomorrow.toLocaleString('default', { month: 'short' })}`;

    // Process weather data with timezone adjustment
    const timezoneOffset = data.city.timezone; // Timezone offset in seconds
    const todayData = getDayNightTemperatures(data.list, today, timezoneOffset);
    const tomorrowData = getDayNightTemperatures(data.list, tomorrow, timezoneOffset);

    todayWeather.innerHTML = generateWeatherHTML(todayData, "Today", todayDate);
    tomorrowWeather.innerHTML = generateWeatherHTML(tomorrowData, "Tomorrow", tomorrowDate);
}

function getDayNightTemperatures(weatherList, targetDate, timezoneOffset) {
    // Adjust targetDate for the API's timezone
    const localDate = new Date(targetDate.getTime() + timezoneOffset);

    // Define day (9AM-3PM) and night (9PM-3AM) ranges in local time
    const dayStart = new Date(localDate);
    dayStart.setHours(12, 0, 0, 0);
    const dayEnd = new Date(localDate);
    dayEnd.setHours(18, 0, 0, 0);

    const nightStart = new Date(localDate);
    nightStart.setHours(24, 0, 0, 0);
    const nightEnd = new Date(localDate);
    nightEnd.setDate(localDate.getDate() + 1); // Move to next day for night
    nightEnd.setHours(12, 0, 0, 0);

    // Find all data points within these ranges
    const dayData = weatherList.filter(item => {
        const itemDate = new Date((item.dt + timezoneOffset) * 1000); // Adjust item date for timezone
        return itemDate >= dayStart && itemDate <= dayEnd;
    });

    const nightData = weatherList.filter(item => {
        const itemDate = new Date((item.dt + timezoneOffset) * 1000); // Adjust item date for timezone
        return itemDate >= nightStart && itemDate <= nightEnd;
    });

    // Calculate averages
    return {
        dayTemp: calculateAverageTemp(dayData),
        dayIcon: getWeatherIcon(dayData),
        nightTemp: calculateAverageTemp(nightData),
        nightIcon: getWeatherIcon(nightData)
    };
}

function calculateAverageTemp(data) {
    if (!data || data.length === 0) return null;
    const sum = data.reduce((acc, item) => acc + item.main.temp, 0);
    return Math.round(sum / data.length);
}

function getWeatherIcon(data) {
    if (!data || data.length === 0) return "cloud";
    const iconCounts = {};
    data.forEach(item => {
        const icon = weatherIcon(item.weather[0].main);
        iconCounts[icon] = (iconCounts[icon] || 0) + 1;
    });
    return Object.keys(iconCounts).reduce((a, b) => iconCounts[a] > iconCounts[b] ? a : b);
}

function generateWeatherHTML(data, label, date) {
    return `
        <div class="weather-header">
            <h3 class="weather-day-title">${label}</h3>
            <div class="weather-date">${date}</div>
        </div>
        <div class="weather-content" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="weather-time day-time" style="text-align: left;">
                <div class="weather-label">Day</div>
                <div class="weather-value">
                    ${data.dayTemp !== null ? 
                        `${data.dayTemp}°C <i class="fas fa-${data.dayIcon}"></i>` : "N/A"}
                </div>
            </div>
            <div class="weather-time night-time" style="text-align: right;">
                <div class="weather-label">Night</div>
                <div class="weather-value">
                    ${data.nightTemp !== null ? 
                        `${data.nightTemp}°C <i class="fas fa-${data.nightIcon}"></i>` : "N/A"}
                </div>
            </div>
        </div>
    `;
}

function weatherIcon(condition) {
    switch (condition.toLowerCase()) {
        case "clear": return "sun";
        case "clouds": return "cloud";
        case "rain": return "cloud-rain";
        case "snow": return "snowflake";
        case "thunderstorm": return "bolt";
        case "drizzle": return "cloud-rain";
        case "mist":
        case "smoke":
        case "haze":
        case "fog": return "smog";
    }
}