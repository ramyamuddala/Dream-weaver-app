# Dreamscape Weaver 🌙✨

**Dreamscape Weaver** is an AI-powered application that interprets your dreams and transforms them into stunning visual art. By whispering your midnight wanderings to the machine, it unravels the symbolism using Google's Gemini AI and paints the subconscious using Stability AI.

## 🚀 Features

-   **🔮 Deep Dream Analysis**: Uses **Google Gemini** to interpret symbols, emotional tone, and psychological meaning behind your dreams.
-   **🎨 AI Image Generation**: Converts your dream narrative into a high-quality, artistic visualization using **Stability AI (Stable Diffusion XL)**.
-   **👤 Context Refinement**: Allows users to specify gender and specific details to ensure the generated imagery matches their identity and vision.
-   **🖼️ Dynamic Atmosphere**: Fetches thematic background fragments using the **Pexels API** while processing.
-   **✨ Immersive UI**: Built with **React** and **Tailwind CSS**, featuring deep space aesthetics, smooth animations, and a glassmorphism design.

## 🛠️ Tech Stack

-   **Frontend**: React.js (Vite)
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **AI Models**:
    -   Text/Analysis: Google Gemini API
    -   Image Generation: Stability AI API
-   **Assets**: Pexels API

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository
```bash
git clone https://github.com/ramyamuddala/Dream-weaver-app.git
cd dream-weaver-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add your API keys. 
*Note: Never commit this file to GitHub.*

```env
VITE_GEMINI_API_KEY=your_google_gemini_key
VITE_STABILITY_API_KEY=your_stability_ai_key
VITE_PEXELS_API_KEY=your_pexels_api_key
```

> **Where to get keys:**
> - Google AI Studio (Gemini)
> - Stability AI
> - Pexels API

### 4. Run the Application
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

## 🌍 Deployment

### Deploying to Netlify

1.  Push your code to **GitHub**.
2.  Log in to **Netlify** and select **"Import from Git"**.
3.  Choose your repository.
4.  **Build Settings**:
    -   Build Command: `npm run build`
    -   Publish Directory: `dist`
5.  **Environment Variables** (Crucial Step):
    -   Go to **Site Settings > Environment Variables**.
    -   Add `VITE_GEMINI_API_KEY`, `VITE_STABILITY_API_KEY`, and `VITE_PEXELS_API_KEY` with your actual values.
6.  Click **Deploy**.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.
