const { RekognitionClient } = require("@aws-sdk/client-rekognition");
const dotenv = require("dotenv");
const fs =require("fs");
dotenv.config();

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION_REKOGNITION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const detectLabels = async (filePath) => {
  try {
    console.log("Detecting labels for image:", filePath);
    const imageBytes = fs.readFileSync(filePath);

    const params = {
      Image: { Bytes: imageBytes },
      MaxLabels: 10,
      MinConfidence: 70
    };

    const response = await rekognition.detectLabels(params).promise();
    const labels = response.Labels.map(label => label.Name);
    
    return labels; // Example output: ["Shirt", "Red", "Dots"]
  } catch (error) {
    console.error("Error detecting labels:", error);
    return ["Unknown"]; // Fallback label
  }
};

module.exports = { detectLabels };