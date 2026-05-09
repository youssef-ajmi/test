// Weather App

const WeatherApp = {
    window: null,
    data: null,
    
    async open() {
        if (this.window) {
            WindowManager.restoreWindow(this.window);
            return;
        }
        
        const content = `
            <div class="weather-container" id="weather-container">
                <div style="color: var(--text-secondary);">Loading weather...</div>
            </div>
        `;
        
        this.window = WindowManager.createWindow('Weather', content, {
            width: 400,
            height: 500
        });
        
        await this.loadWeather();
    },
    
    async loadWeather() {
        const container = document.getElementById('weather-container');
        if (!container) return;
        
        try {
            // Try to get location from IP
            const ipResponse = await fetch('https://ipapi.co/json/');
            const ipData = await ipResponse.json();
            
            const city = ipData.city || 'London';
            const country = ipData.country_name || 'UK';
            
            // Use Open-Meteo API (free, no key required)
            const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
            const geoData = await geoResponse.json();
            
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('Location not found');
            }
            
            const { latitude, longitude } = geoData.results[0];
            
            // Get weather
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
            );
            const weatherData = await weatherResponse.json();
            
            this.data = {
                city,
                country,
                temp: weatherData.current_weather.temperature,
                windspeed: weatherData.current_weather.windspeed,
                winddirection: weatherData.current_weather.winddirection,
                code: weatherData.current_weather.weathercode,
                maxTemp: weatherData.daily.temperature_2m_max[0],
                minTemp: weatherData.daily.temperature_2m_min[0]
            };
            
            this.renderWeather();
            
        } catch (error) {
            console.error('Weather error:', error);
            // Show demo data
            this.data = {
                city: 'Demo City',
                country: 'Demo',
                temp: 22,
                windspeed: 10,
                winddirection: 180,
                code: 0,
                maxTemp: 25,
                minTemp: 18
            };
            this.renderWeather();
        }
    },
    
    renderWeather() {
        const container = document.getElementById('weather-container');
        if (!container || !this.data) return;
        
        const icon = this.getWeatherIcon(this.data.code);
        const desc = this.getWeatherDesc(this.data.code);
        
        container.innerHTML = `
            <div style="font-size: 18px; color: var(--text-secondary);">${this.data.city}, ${this.data.country}</div>
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">${Math.round(this.data.temp)}°C</div>
            <div class="weather-desc">${desc}</div>
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-label">High</div>
                    <div class="weather-detail-value">${Math.round(this.data.maxTemp)}°</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Low</div>
                    <div class="weather-detail-value">${Math.round(this.data.minTemp)}°</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Wind</div>
                    <div class="weather-detail-value">${this.data.windspeed} km/h</div>
                </div>
            </div>
            <div style="margin-top: 20px; font-size: 12px; color: var(--text-secondary);">
                Data from Open-Meteo
            </div>
        `;
    },
    
    getWeatherIcon(code) {
        const icons = {
            0: '☀️',  // Clear sky
            1: '🌤️',  // Mainly clear
            2: '⛅',  // Partly cloudy
            3: '☁️',  // Overcast
            45: '🌫️',  // Fog
            48: '🌫️',  // Depositing rime fog
            51: '🌦️',  // Drizzle
            53: '🌦️',
            55: '🌦️',
            61: '🌧️',  // Rain
            63: '🌧️',
            65: '🌧️',
            71: '🌨️',  // Snow
            73: '🌨️',
            75: '🌨️',
            80: '🌦️',  // Rain showers
            81: '🌧️',
            82: '⛈️',
            95: '⛈️',  // Thunderstorm
            96: '⛈️',
            99: '⛈️'
        };
        return icons[code] || '🌡️';
    },
    
    getWeatherDesc(code) {
        const descs = {
            0: 'Clear Sky',
            1: 'Mainly Clear',
            2: 'Partly Cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Rime Fog',
            51: 'Light Drizzle',
            53: 'Moderate Drizzle',
            55: 'Dense Drizzle',
            61: 'Slight Rain',
            63: 'Moderate Rain',
            65: 'Heavy Rain',
            71: 'Slight Snow',
            73: 'Moderate Snow',
            75: 'Heavy Snow',
            80: 'Rain Showers',
            81: 'Moderate Showers',
            82: 'Violent Showers',
            95: 'Thunderstorm',
            96: 'Hail Storm',
            99: 'Heavy Hail'
        };
        return descs[code] || 'Unknown';
    },
    
    close() {
        if (this.window) {
            WindowManager.closeWindow(this.window);
            this.window = null;
        }
    }
};

window.WeatherApp = WeatherApp;
