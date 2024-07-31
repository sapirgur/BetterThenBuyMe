const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/api/get-weather', async (req, res) => {
    try {
        const response = await axios.get('https://api.open-meteo.com/v1/forecast?latitude=32.0853&longitude=34.7818&hourly=temperature_2m,wind_speed_10m');
        const data = response.data;

        const currentHourIndex = 0;
        const time = data.hourly.time[currentHourIndex];
        const temp = data.hourly.temperature_2m[currentHourIndex];
        const windSpeed = data.hourly.wind_speed_10m[currentHourIndex];

        res.json({
            time,
            temp: `${temp} °C`,
            windSpeed: `${windSpeed} km/h`
        });
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

module.exports = router;
