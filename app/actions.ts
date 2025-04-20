"use server";

import { Config, configSchema, explanationsSchema, Result } from "@/lib/types";
import { openai } from "@ai-sdk/openai";
import { sql } from "@vercel/postgres";
import { generateObject } from "ai";
import { z } from "zod";

export const generateQuery = async (input: string) => {
	"use server";
	try {
		const result = await generateObject({
			model: openai("gpt-4o"),
			system: `
      Kamu adalah database SQL  postgres dan ahli visualisasi data. Tugas kamu adalah menulis SQL query untuk membaca data yang saya butuhkan. Skema tabel potensi adalah sebagai berikut:

      potensi (
      cifid SERIAL PRIMARY KEY,
      nama_lengkap TEXT,
      handphone TEXT,
      pengeluaran INTEGER,
      gaji INTEGER,
      tunjangan INTEGER      
    );

    Kamu hanya membuat SQL query untuk membaca.    

    Untuk nama orang dan field dengan jenis string, gunakan operator ILIKE, dan ubah kata pencarian dan field data menjadi huruf kecil menggunakan fungsi LOWER(). Contohnya: LOWER (nama) ILIKE LOWER('%search_term%').

    Ketika menjawab pertanyaan berkaitan dengan field tertentu, pastikan kamu menggunakan field identitas.

    Setiap query harus menghasilkan data kuantitatif dalam bentuk angka yang dapat digunakan untuk membuat grafik diagram. Setiap query juga menghasilkan paling sedikit 2 field. Kalau pengguna menanyakan data untuk satu field, selalu kembalikan data field tersebut dan jumlah field kolom.
    `,
			prompt: `Buat SQL query yang dibutuhkan untuk menghasilkan data: ${input}`,
			schema: z.object({
				query: z.string(),
			}),
		});
		return result.object.query;
	} catch (e) {
		console.error(e);
		throw new Error("Gagal membuat query");
	}
};

export const runGenerateSQLQuery = async (query: string) => {
	"use server";
	// Check if the query is a SELECT statement
	if (
		!query.trim().toLowerCase().startsWith("select") ||
		query.trim().toLowerCase().includes("drop") ||
		query.trim().toLowerCase().includes("delete") ||
		query.trim().toLowerCase().includes("insert") ||
		query.trim().toLowerCase().includes("update") ||
		query.trim().toLowerCase().includes("alter") ||
		query.trim().toLowerCase().includes("truncate") ||
		query.trim().toLowerCase().includes("create") ||
		query.trim().toLowerCase().includes("grant") ||
		query.trim().toLowerCase().includes("revoke")
	) {
		throw new Error("Only SELECT queries are allowed");
	}

	let data: any;
	try {
		data = await sql.query(query);
	} catch (e: any) {
		if (e.message.includes("Data potensi tidak ada")) {
			console.log("Table data potensi tidak ada...");
			// throw error
			throw Error("Table data potensi tidak ada");
		} else {
			throw e;
		}
	}

	return data.rows as Result[];
};

export const explainQuery = async (input: string, sqlQuery: string) => {
	"use server";
	try {
		const result = await generateObject({
			model: openai("gpt-4o"),
			schema: z.object({
				explanations: explanationsSchema,
			}),
			system: `Kamu adalah ahli database SQL (postgres). Tugas kamu adalah menjelaskan SQL query yang kamu buat untuk menghasilkan data yang diminta oleh pengguna. Skema tabel potensi adalah sebagai berikut:

    potensi (
      cifid SERIAL PRIMARY KEY,
      nama_lengkap TEXT,
      handphone TEXT,
      pengeluaran INTEGER,
      gaji INTEGER,
      tunjangan INTEGER      
    );

    Saat kamu menjelaskan query, kamu harus menggunakan setiap bagian dari query dan memberi penjelasan. Setiap "bagian" harus unik.
    Contohnya untuk query: "SELECT * FROM potensi limit 10", bagian-bagian dari query tersebut adalah: "SELECT *", "FROM potensi", "LIMIT 10". 
    Kalau ada bagian yang tidak memiliki penjelasan, tetap ikut sertakan, tapi penjelasan kosong.
    `,
			prompt: `Jelaskan SQL query uang kamu buat utuk membaca data yang diminta oleh pengguna. Buat asumsi bahwa pengguna tidak ahli SQL. Buat penjelasan yang ringkas.
      User Query:
      ${input}

      Generated SQL Query:
      ${sqlQuery}`,
		});
		return result.object;
	} catch (e) {
		console.error(e);
		throw new Error("Failed to generate query");
	}
};

export const generateChartConfig = async (
	results: Result[],
	userQuery: string
) => {
	"use server";
	const system = `Kamu adalah ahli visualiasi data. `;

	try {
		const { object: config } = await generateObject({
			model: openai("gpt-4o"),
			system,
			prompt: `Berdasarkan data dari SQL query, buat grafik diagram yang menjelaskan dan menjawab data yang diminta pengguna.

      For multiple groups use multi-lines.

      Ini adalah contoh  konfigurasi lengkap:
      export const chartConfig = {
        type: "pie",
        xKey: "month",
        yKeys: ["sales", "profit", "expenses"],
        colors: {
          sales: "#4CAF50",    // Green for sales
          profit: "#2196F3",   // Blue for profit
          expenses: "#F44336"  // Red for expenses
        },
        legend: true
      }

      User Query:
      ${userQuery}

      Data:
      ${JSON.stringify(results, null, 2)}`,
			schema: configSchema,
		});

		const colors: Record<string, string> = {};
		config.yKeys.forEach((key, index) => {
			colors[key] = `hsl(var(--chart-${index + 1}))`;
		});

		const updatedConfig: Config = { ...config, colors };
		return { config: updatedConfig };
	} catch (e) {
		// @ts-expect-errore
		console.error(e.message);
		throw new Error("Failed to generate chart suggestion");
	}
};
