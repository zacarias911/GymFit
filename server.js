
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const db = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// PROBAR CONEXIÓN
app.get("/api/estado", async (req, res) => {
    try {
        const resultado = await db.query(
            "SELECT current_database() AS base, current_user AS usuario"
        );
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error de conexión" });
    }
});

// OBTENER SOCIOS
app.get("/api/socios", async (req, res) => {
    try {
        const resultado = await db.query(
            "SELECT * FROM socio ORDER BY id_socio"
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar socios" });
    }
});

// AGREGAR SOCIO
app.post("/api/socios", async (req, res) => {
    try {
        const { nombre, apellido, dni } = req.body;

        if (!nombre || !apellido || !dni) {
            return res.status(400).json({ error: "Completá todos los campos" });
        }

        const resultado = await db.query(
            `INSERT INTO socio (nombre, apellido, dni, fecha_alta)
             VALUES ($1, $2, $3, CURRENT_DATE)
             RETURNING *`,
            [nombre.trim(), apellido.trim(), dni.trim()]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo agregar el socio. Revisá si el DNI ya existe." });
    }
});

 // EDITAR SOCIO
app.put("/api/socios/:id", async (req, res) => {
    try {
        const { nombre, apellido, dni } = req.body;
        const { id } = req.params;

        if (!nombre || !apellido || !dni) {
            return res.status(400).json({
                error: "Completá todos los campos"
            });
        }

        const resultado = await db.query(
            `UPDATE socio
             SET nombre = $1, apellido = $2, dni = $3
             WHERE id_socio = $4
             RETURNING *`,
            [nombre.trim(), apellido.trim(), dni.trim(), id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Socio no encontrado" });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo editar el socio" });
    }
});

// ELIMINAR SOCIO
app.delete("/api/socios/:id", async (req, res) => {
    try {
        const resultado = await db.query(
            "DELETE FROM socio WHERE id_socio = $1 RETURNING *",
            [req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Socio no encontrado" });
        }

        res.json({ mensaje: "Socio eliminado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "No se pudo eliminar el socio. Puede tener inscripciones asociadas."
        });
    }
});


// OBTENER PLANES (si hay duplicados, muestra el de ID más alto)
app.get("/api/planes", async (req, res) => {
    try {
        const resultado = await db.query(`
            SELECT DISTINCT ON (nombre) *
            FROM plan
            ORDER BY nombre, id_plan DESC
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar planes" });
    }
});

// OBTENER INSCRIPCIONES
app.get("/api/inscripciones", async (req, res) => {
    try {
        const resultado = await db.query(`
            SELECT i.*, s.nombre, s.apellido, p.nombre AS plan
            FROM inscripcion i
            JOIN socio s ON i.id_socio = s.id_socio
            JOIN plan p ON i.id_plan = p.id_plan
            ORDER BY i.id_inscripcion
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar inscripciones" });
    }
});

// AGREGAR INSCRIPCIÓN
app.post("/api/inscripciones", async (req, res) => {
    try {
        const { id_socio, id_plan } = req.body;

        if (!id_socio || !id_plan) {
            return res.status(400).json({ error: "Seleccioná un socio y un plan" });
        }

        const resultado = await db.query(`
            INSERT INTO inscripcion
                (fecha_inicio, estado, id_socio, id_plan)
            VALUES (CURRENT_DATE, 'Activa', $1, $2)
            RETURNING *
        `, [id_socio, id_plan]);

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo registrar la inscripción" });
    }
});

// ELIMINAR INSCRIPCIÓN
app.delete("/api/inscripciones/:id", async (req, res) => {
    try {
        const resultado = await db.query(
            "DELETE FROM inscripcion WHERE id_inscripcion = $1 RETURNING *",
            [req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: "Inscripción no encontrada"
            });
        }

        res.json({
            mensaje: "Inscripción eliminada correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "No se pudo eliminar la inscripción"
        });
    }
});

app.listen(3000, () => {
    console.log("Servidor GymFit funcionando en http://localhost:3000");
});

