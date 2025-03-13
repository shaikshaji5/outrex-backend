require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const AWS = require("aws-sdk");
const axios = require("axios");
const {ListObjectsV2Command} = require("@aws-sdk/client-s3");
const { RekognitionClient, DetectLabelsCommand } = require("@aws-sdk/client-rekognition");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const {generateClothingName} = require("./services/ClothLabelAI");
const {getWeatherForecast} = require("./services/weatherService");
// const {analyzeClothing} = require("./services/rekognition");
const {detectLabels} = require("./services/rekognition");

const {getClothingLabel,getPerfectOutfit}= require("./services/geminiService");
const app = express();
app.use(express.json());
app.use(cors({
  origin: "*", // Allow all domains (Replace * with frontend URL in production)
  methods: "GET, POST, PUT, DELETE",
  allowedHeaders: "Content-Type, Authorization"
}));
app.get("/", (req, res) => {
  res.send("CORS is enabled!");
});

// AWS S3 Setup
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "MISSING_ACCESS_KEY",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "MISSING_SECRET_KEY",
  region: process.env.AWS_REGION,
});

// AWS Rekognition Setup
const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION_REKOGNITION, // Ensure this matches the Rekognition region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "MISSING_ACCESS_KEY",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "MISSING_SECRET_KEY",
  },
});

// Multer (for file uploads)
const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload", upload.array("clothes"), async (req, res) => {
    try {
      console.log("req.files:", req.files);
      const uploadPromises = req.files.map(async (file) => {
        // Rekognition Parameters
        const rekognitionParams = {
          Image: { Bytes: file.buffer },
          MaxLabels: 20,
          MinConfidence: 50,
        };
  
        // Rekognition Analysis
        const rekognitionResponse = await rekognition.send(new DetectLabelsCommand(rekognitionParams));
        const detectedLabels = rekognitionResponse.Labels.map(label => label.Name);
        console.log(`Detected Labels: ${detectedLabels}`); // this is for the catergorization of the clothes
        const newFileName = (await getClothingLabel(file)).trim().replace(/\s+/g, "_") + ".jpeg";


        // Determine Clothing Category
        const category = detectedLabels.find(label =>
          ["Shirt", "T-Shirt", "Pants", "Jacket", "Dress", "Shorts", "Skirt", "Shoes"].includes(label)
        ) || "Other";
  
        // Upload to S3 with Category
        const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `clothes/${category}/${newFileName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
  
        return s3.upload(params).promise();
      });
  
      await Promise.all(uploadPromises);
      res.json({ message: "Upload & Categorization Successful" });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).json({ error: "Upload failed", details: error.message });
    }
  });

const listClothes = async () => {
  const params = { Bucket: process.env.S3_BUCKET_NAME, Prefix: "clothes/" };
  const data = await s3.listObjectsV2(params).promise();
  let clothes = {};
  if (data.Contents) {
    for (const obj of data.Contents) {
      const parts = obj.Key.split("/");
      if (parts.length >= 3) {
        const category = parts[1]; 
        const itemName = parts[2];

        if (!clothes[category]) {
          clothes[category] = [];
        }

        clothes[category].push({
          name: itemName,
          url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${obj.Key}`,
        });
      }
    }
  }
  // console.log("Available Clothes:", clothes);
  return clothes;
};
// listClothes();


// app.post("/recommend", async (req, res) => {
//   try {
//     const { city } = req.body;
//     const weatherData = await getWeatherForecast(city);


//     const morning = weatherData.list[2];  // Forecast for ~9 AM
//     const afternoon = weatherData.list[4]; // Forecast for ~3 PM
//     const evening = weatherData.list[6];  // Forecast for ~9 PM

//     const forecast = {
//       morning: { temp: morning.main.temp, condition: morning.weather[0].description },
//       afternoon: { temp: afternoon.main.temp, condition: afternoon.weather[0].description },
//       evening: { temp: evening.main.temp, condition: evening.weather[0].description },
//     };


//     const wardrobe = await listClothes();

//     let wardrobeText = "";
//     for (const category in wardrobe) {
//       wardrobeText += `${category}: ${wardrobe[category].map(item => item.name.replace(/_/g, " ")).join(", ")}\n`;
//     }

//     const prompt = `The weather forecast for ${city} today is:\nMorning: ${forecast.morning.temp}°C, ${forecast.morning.condition}\nAfternoon: ${forecast.afternoon.temp}°C, ${forecast.afternoon.condition}\nEvening: ${forecast.evening.temp}°C, ${forecast.evening.condition}\n
//     Here is the available wardrobe:\n${wardrobeText}\nPick an outfit that is suitable for the day's forecast while maintaining good color matching. Output in JSON format: {"Shirt": "red_tshirt.jpg", "Pants": "black_jeans.jpg", "Shoes": "white_sneakers.jpg"}`;
    
//     const aiResponse = await openai.createCompletion({
//       model: "gpt-4",
//       prompt: prompt,
//       max_tokens: 150,
//     });

//     const recommendedOutfit = JSON.parse(aiResponse.data.choices[0].text.trim());

//     let outfitWithUrls = {};
//     for (const category in recommendedOutfit) {
//       const itemName = recommendedOutfit[category];
//       const item = wardrobe[category]?.find(c => c.name === itemName);
//       if (item) {
//         outfitWithUrls[category] = item.url;
//       }
//     }

//     res.json({ forecast, outfit: outfitWithUrls });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Failed to generate outfit recommendation");
//   }
// });

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

app.get("/weather", async (req, res) => {
  try {
    result = await getWeatherForecast(req);
    console.log("server js ouput :", result);
    res.json(result);
  } catch (error) {
    console.error("Error fetching weather:", error);
    res.status(500).send("Failed to getWeatherForecast");
  }
});

app.get("/clothes", async (req, res) => {
  try {
    const params = { Bucket: process.env.S3_BUCKET_NAME };
    const data = await s3.listObjectsV2(params).promise();
    
    let categorizedClothes = {};

    data.Contents.forEach((item) => {
      const keyParts = item.Key.split("/");
      if (keyParts.length > 1) {
        const category = keyParts[1]; 
        if (!categorizedClothes[category]) {
          categorizedClothes[category] = [];
        }
        categorizedClothes[category].push({
          name: keyParts.slice(2).join("/"),
          url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
        });
      }
    });

    res.json(categorizedClothes);
  } catch (error) {
    console.error("Error fetching clothes:", error);
    res.status(500).send("Failed to retrieve clothes");
  }
});
app.post("/recommend", async (req,res) =>{
  console.log("from server js :sent req to gemini to recommend outfit");
  const extractedWeatherText = req.body['weather'];
  // console.log("extractedWeatherText: ",extractedWeatherText);
  delete req.body['weather']; 
  // console.log("data from the front end:",req.body);
  const output=await getPerfectOutfit(extractedWeatherText,req.body);
  // console.log("getPerfectOutfit", output);
  res.json(output)
  console.log("output:",output);
});

// async function getOutfitRecommendation(weather, availableClothes) {
//   try {
//       const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
//       console.log("xxxxx",availableClothes)
//       console.log("before gemini req:",Object.values(availableClothes).flat().map(item => item.name));

//       const prompt = `The weather forecast for today is temperature is :${weather.list[0].main.temp} and Condition is :${weather.list[0].weather[0].description}. I have the following clothes in my wardrobe: ${Object.values(availableClothes).flat().map(item => item.name)}. Suggest a great outfit combination based on the weather.`;

//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const text = response.text();

//       console.log("Gemini's Outfit Suggestion:", text);
//       return text;
//   } catch (error) {
//       console.error("Gemini API Error:", error);
//   }
// }
// getWeatherForecast("Banglore");
// console.log(getWeatherForecast("Banglore"));
// getOutfitRecommendation(getWeatherForecast("Banglore"), listClothes());


// async function recommend() {
//   const weather = await getWeatherForecast("Bangalore");  // Wait for the Promise to resolve
//   const clothes = await listClothes();
//   // console.log("clothes:", clothes);
//   getOutfitRecommendation(weather,clothes)
//   // console.log("Wheather temp:", weather.list[0].weather[0].description);
//   // console.log("Wheather cond:", weather.list[0].main.temp);
// }
// // recommend();






const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




// app.post("/upload", upload.array("clothes"), async (req, res) => {
//   try {
//     const uploadPromises = req.files.map(async (file) => {
//       // Rekognition Parameters
//       const rekognitionParams = {
//         Image: { Bytes: file.buffer },
//         MaxLabels: 10,
//         MinConfidence: 75,
//       };

//       // Rekognition Analysis
//       const rekognitionResponse = await rekognition.send(new DetectLabelsCommand(rekognitionParams));
//       const detectedLabels = rekognitionResponse.Labels.map(label => label.Name);
//       console.log(`Detected Labels: ${detectedLabels}`);

//       // Determine Clothing Category
//       const category = detectedLabels.find(label =>
//         ["Shirt", "T-Shirt", "Pants", "Jacket", "Dress", "Shorts", "Skirt", "Shoes"].includes(label)
//       ) || "Other";

//       // Upload to S3 with Category
//       const params = {
//         Bucket: process.env.S3_BUCKET_NAME,
//         Key: `clothes/${category}/${file.originalname}`,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//       };

//       return s3.upload(params).promise();
//     });

//     await Promise.all(uploadPromises);
//     res.json({ message: "Upload & Categorization Successful" });
//   } catch (error) {
//     console.error("Upload Error:", error);
//     res.status(500).json({ error: "Upload failed", details: error.message });
//   }
// });
