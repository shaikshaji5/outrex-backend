const { GoogleGenerativeAI } = require("@google/generative-ai");
// const fs =require("fs");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const {getWeatherForecast}=require("./weatherService");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const axios= require('axios');
const { response } = require("express");
async function getClothingLabel(file) {
    try {
      const imageBase64 = file.buffer.toString("base64");
      const prompt = "Identify the type of clothing and its color in this image. give a short name that can be understood by a human. Your response should not contain any other words other than clothing name. Give the name in a crisp and clear manner ,but it should atleast contain 4 words. Do not give any '.' or new line at end of the name.Give space between each word";
      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: file.mimetype, data: imageBase64 } }] }
        ],
      });
      console.log("Clothing Label:", result.response.text());
      return result.response.text(); 
  
    } catch (error) {
      console.error("Error analyzing image with Gemini:", error);
      return null;
    }
  }



async function getPerfectOutfit(weather, filesDataInJson){
    // console.log("recommending outfit....");
    const prompt = "weather data: "+weather+", Json data for clothes"+JSON.stringify(filesDataInJson)+". Based on the given weather conditions and JSON data, suggest the most suitable outfit by returning two clothing URLs and name from the provided JSON , response must be json. And also response must only contain json no other words.";
    const result = await model.generateContent({
      contents: [
        {role: "user", parts: [{text:prompt}]}
      ],
    });
    // console.log("fffffffinal :", result.response.text());
    return result.response.text();


}
async function  getGeminiWeatherForecast(res){
    
    const prompt = JSON.stringify(res)+"Given the Json response , based on this , give the weather forecast for this day.Just give a line. "

      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: prompt }] }
        ],
      });
    return result.response.text();
    
}
// async function getBestOutfit(weatherOutput,files){
//   console.log("recommending outfit....");

//   const prompt = "Given the Json response , based on this , give the weather forecast for this day.Just give a line. "

//       const result = await model.generateContent({
//         contents: [
//           { role: "user", parts: [{ text: prompt }] }
//         ],
//       });
  
// }
// Example usage
module.exports={getClothingLabel,getPerfectOutfit,getGeminiWeatherForecast};
