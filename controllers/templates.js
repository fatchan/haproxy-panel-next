import * as db from '../db.js';
import { dynamicResponse } from '../util.js';
import update from '../update.js';

/**
 * POST /template
 * Upsert templates and delete any no longer existing templates
 */
export async function upsertTemplates (req, res) {
	if (!Array.isArray(req.body.templates) || req.body.templates.length === 0) {
		return dynamicResponse(req, res, 403, { error: 'Invalid input' });
	}

	const { type, template, data } = req.body.templates[0];
	if (!type || !template || !data) {
		return dynamicResponse(req, res, 403, { error: 'Invalid input' });
	}

	const templateNames = req.body.templates.map(x => x.template);
	for (const rec of req.body.templates) {
		await db.db().collection('templates').updateOne(
			{ type: rec.type, template: rec.template },
			{ $set: { type: rec.type, template: rec.template, data: rec.data } },
			{ upsert: true }
		);
	}

	await db.db().collection('templates').deleteMany({
		type: type,
		template: { $nin: templateNames }
	});
	return res.json({ ok: true });
}

/**
 * POST /update
 * Placeholder for update logic (to be implemented)
 */
export async function updateTemplates (_req, res) {
	await update(); //updates existing records with updated templates
	return res.json({ ok: true });
}

/**
 * POST /down
 * Update the list of down IPs
 */
export async function updateDownIPs (req, res) {
	const ips = req.body.ips.filter((x) => x && x.length > 0);
	if (ips.length === 0) {
		await db.db().collection('down').updateOne(
			{ _id: 'down' },
			{ $set: { ips: [] } },
			{ upsert: true }
		);
	} else {
		await db.db().collection('down').updateOne(
			{ _id: 'down' },
			{ $addToSet: { ips: { '$each': ips } } },
			{ upsert: true }
		);
	}
	return res.json({ ok: true });
}
