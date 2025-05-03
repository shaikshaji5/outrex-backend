# Outrex Backend

This is the backend server for the Outrex outfit recommendation web application. It handles file uploads, image processing using AWS Rekognition and Gemini AI, weather-based logic, and provides outfit recommendations. It also includes infrastructure-as-code using Terraform for deployment.

---

## 📁 Folder Structure

```
services/
├── ClothLabelAI.js        # Handles OpenAI/Gemini-based clothing description
├── extractColor.js        # Extracts dominant color from clothing
├── geminiService.js       # Handles integration with Gemini API
├── listClothes.js         # Manages clothing inventory logic
├── rekognition.js         # AWS Rekognition-based analysis
├── weatherService.js      # Weather API integration
terraform/
└── main.tf                # Terraform script for deploying backend
node-app.zip               # Deployment archive for AWS Lambda (if needed)
server.js                  # Main Express server
```

---

## 🚀 Features

- Upload and categorize clothes
- Process and analyze clothes using AWS Rekognition
- Generate outfit recommendations using Gemini/OpenAI
- Respond based on current weather using external weather APIs
- Terraform support for deployment automation (e.g. EC2 or Lambda)

---

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root:

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=your-region
S3_BUCKET=your-bucket-name
OPENAI_API_KEY=your-api-key
WEATHER_API_KEY=your-weather-api-key
```

### 3. Run the Server

```bash
node server.js
```

Server will start on default port `5000` unless specified otherwise.

---

## 🧪 API Endpoints

| Method | Endpoint             | Description                        |
|--------|----------------------|------------------------------------|
| POST   | /upload              | Upload clothing image              |
| GET    | /inventory           | List uploaded clothes              |
| POST   | /recommend           | Get outfit recommendation          |
| GET    | /weather             | Fetch current weather              |

---

## ☁️ Deploy with Terraform

To deploy your backend using Terraform:

```bash
cd services/terraform
terraform init
terraform apply
```

Update `main.tf` with your AWS configuration and resources (e.g. EC2 instance, Lambda function, etc.)

---

## 🧠 AI/ML Services Used

- **AWS Rekognition** – image labeling
- **Gemini/OpenAI** – natural language outfit reasoning
- **External Weather API** – context-based suggestions

---

## 📦 Packaging for Deployment

If deploying as a Lambda function:

```bash
zip -r node-app.zip .
```

## LINK for frontend application
link: https://github.com/shaikshaji5/outrex

Upload the `node-app.zip` through the AWS Lambda Console or automate using Terraform.

---
