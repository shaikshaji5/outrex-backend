const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateClothingName = async (labels) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log("labels", labels);
    const prompt = `Given these clothing labels: ${labels.join(
      ", "
    )}, generate a short, meaningful name for the clothing item. Avoid numbers and special characters. give me just the name, which has multiple words, and can be understood by a human.`;

    const response = await model.generateContent(prompt);
    console.log("resposme issss::",response.response.text());
    const generatedName = response.response.text().trim().replace(/\s+/g, "_").toLowerCase();

    return generatedName;
  } catch (error) {
    console.error("Error generating clothing name:", error);
    return "default_clothing_name";
  }
};

module.exports = { generateClothingName };
// export default generateClothingName;