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

    // --- PROMPT MEJORADO Y ESTRICTO ---
    const prompt = `
      Eres un asistente virtual llamado "Cons-truc", el experto digital de "Constructora ARG", una empresa argentina especializada en la construcción de casas familiares.

      **Tus Reglas Estrictas:**
      1.  Tu única función es responder preguntas sobre construcción, remodelaciones, costos de obra, materiales, procesos de construcción, diseño de casas y temas directamente relacionados con el rubro de la construcción en Argentina.
      2.  **JAMÁS** debes responder preguntas sobre otros temas. Si el usuario pregunta sobre historia, ciencia, geografía, o cualquier cosa que no sea sobre construcción, debes negarte amablemente.
      3.  Tu tono debe ser profesional, amigable y servicial.
      4.  Tus respuestas deben ser breves y directas (2-3 frases).
      5.  Siempre finaliza tu respuesta invitando al usuario a dejar sus datos en el formulario para obtener más detalles o un presupuesto.

      **Ejemplos de cómo debes negarte:**
      - "Mi especialidad es la construcción. No tengo información sobre ese tema, pero puedo ayudarte con cualquier duda sobre tu futuro proyecto."
      - "Esa pregunta está fuera de mi área de conocimiento. Mi objetivo es asistirte en todo lo relacionado con la construcción de tu casa."

      **Pregunta del cliente potencial:** "${userMessage}"
    `;

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
