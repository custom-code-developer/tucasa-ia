const MODEL_NAME = "gemini-1.5-flash-latest";

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error de configuración del servidor. Falta la API Key." }),
    };
  }

  try {
    const { userMessage } = JSON.parse(event.body);

    if (!userMessage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No se proporcionó ningún mensaje." })
      };
    }

    const prompt = `Un cliente potencial para una constructora en Argentina te pregunta: "${userMessage}". Actúa como un asistente virtual experto en construcción. Dale una respuesta útil, breve (2 o 3 frases) y amigable que lo invite a dejar sus datos en el formulario. No te despidas, solo da la información.`;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const responseData = await apiResponse.json();
    
    if (!apiResponse.ok || !responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
      const errorMessage = responseData?.error?.message || "La IA no pudo generar una respuesta válida.";
      return {
        statusCode: 502,
        body: JSON.stringify({ error: `Hubo un problema con el servicio de IA: ${errorMessage}` }),
      };
    }
    
    const geminiResponseText = responseData.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: geminiResponseText }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Hubo un problema al procesar la solicitud: ${error.message}` }),
    };
  }
}
