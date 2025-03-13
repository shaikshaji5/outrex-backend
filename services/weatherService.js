const { app } = require("../server");
// const useState = require("react");
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const {getGeminiWeatherForecast} = require("./geminiService");

const getWeatherForecast = async (req) => {
  const { lat, lon } = req.query; 
  console.log("lat:", lat);
  console.log("lon:", lon);
  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and longitude are required" });
  }

  try{
    // console.log("fetching weather data...");
    const forecastUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
    const response = await fetch(forecastUrl).then((res) => res.json());
    // console.log("response after forecaste:", response);
    const wheaterAnalysisFromGemini = await getGeminiWeatherForecast(response);
    // console.log("wheaterAnalysisFromGemini:", wheaterAnalysisFromGemini);
    return wheaterAnalysisFromGemini;
  }catch(error){
    console.error("Error fetching weather data:", error);
  }
};

// app.get("/weather", async (req, res) => {
//   const [location, setLocation] = useState(null);
//       useEffect(() => {
//         if ("geolocation" in navigator) {
//           navigator.geolocation.getCurrentPosition(
//             (position) => {
//               const { latitude, longitude } = position.coords;
//               setLocation({ latitude, longitude });
//               console.log("Location:", location);
//             },
//             (error) => {
//               console.error("Error getting location:", error);
//             }
//           );
//         } else {
//           console.error("Geolocation is not supported by this browser.");
//         }
//       }, []);

//     try {
//       const city = req.query.city || "Banglore"; 
//       const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${WEATHER_API_KEY}`;
      
//       const response = await axios.get(url);
//       res.json(response.data); 
//     } catch (error) {
//       console.error("Weather API Error:", error.message);
//       res.status(500).json({ error: "Failed to fetch weather data" });
//     }
//   });
  

  // try {
  //   const apiKey = WEATHER_API_KEY;
  //   const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  //   const response = await axios.get(weatherUrl);
  //   res.json(response.data);
  //   console.log("response.data:", response.data);
  // } catch (error) {
  //   res.status(500).json({ error: "Failed to fetch weather data" });
  // }
  module.exports = { getWeatherForecast };