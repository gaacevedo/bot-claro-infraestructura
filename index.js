const { ActivityHandler, MessageFactory } = require('botbuilder');

const sql = require('mssql');



// Configuración de la base de datos

const dbConfig = {

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    server: process.env.DB_SERVER,

    database: process.env.DB_NAME,

    options: { encrypt: true }

};



class ClaroBot extends ActivityHandler {

    constructor(luisRecognizer) {

        super();

        this.luisRecognizer = luisRecognizer;



        this.onMessage(async (context, next) => {

            // 1. Llamada a LUIS para entender al cliente

            const luisResult = await this.luisRecognizer.recognize(context);

            const intent = luisResult.luisResult.prediction.topIntent;



            // 2. Lógica según la intención (Ejemplo: Reporte Falla)

            if (intent === 'ReporteFalla') {

                const linea = luisResult.entities.NumeroLinea[0];

                await this.saveToDb(linea, 'ReporteFalla', context.activity.text);

                await context.sendActivity(`He registrado tu reporte para la línea ${linea}.`);

            }

            // 3. Manejo de baja confianza (< 70%) según requerimiento [cite: 137, 138]

            else if (luisResult.luisResult.prediction.confidence < 0.70) {

                await context.sendActivity("No estoy seguro de entenderte, te transferiré con un humano.");

            }



            await next();

        });

    }



    async saveToDb(linea, intencion, texto) {

        let pool = await sql.connect(dbConfig);

        await pool.request()

            .input('linea', sql.VarChar, linea)

            .input('intencion', sql.VarChar, intencion)

            .input('texto', sql.NVarChar, texto)

            .query('INSERT INTO ConsultasSoporte (NumeroLinea, IntencionDetectada, MensajeUsuario) VALUES (@linea, @intencion, @texto)');

    }

}
