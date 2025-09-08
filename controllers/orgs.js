import * as db from '../db.js';
import { ObjectId } from 'mongodb';
import { dynamicResponse } from '../util.js';

async function getOrgsForUser(username) {
	return db.db().collection('orgs')
		.find({ members: username }, { projection: { owner: 1, members: 1, createdAt: 1 } })
		.toArray();
}

/**
 * POST /orgs/switch
 */
export async function switchOrg(req, res, _next) {
	const username = res.locals.originalUser?.username || res.locals.user?.username;
	const { orgId } = req.body;

	if (!orgId || typeof orgId !== 'string' || orgId.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'orgId required' });
	}

	let org;
	try {
		org = await db.db().collection('orgs').findOne({ _id: new ObjectId(orgId) });
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, { error: 'Invalid orgId' });
	}

	if (!org) {
		return dynamicResponse(req, res, 404, { error: 'Org not found' });
	}
	if (!Array.isArray(org?.members) || !org.members.includes(username)) {
		return dynamicResponse(req, res, 403, { error: 'Org not found' });
	}

	// persist in session
	req.session.currentOrg = orgId;
	req.session.impersonateOwner = org.owner;
	await req.session.save();

	return dynamicResponse(req, res, 200, {}); //org switched
}

/**
 * GET /orgs (page)
 */
export async function orgsPage(app, req, res, _next) {
	const username = res.locals.originalUser?.username || res.locals.user?.username;
	const orgs = await getOrgsForUser(username);
	const currentOrgId = req.session?.currentOrg;
	res.locals.data = { orgs, currentOrgId };
	return app.render(req, res, '/orgs');
}

/**
 * GET /orgs.json
 */
export async function orgsJson(req, res, _next) {
	const username = res.locals.originalUser?.username || res.locals.user?.username;
	const currentOrgId = req.session?.currentOrg;
	const orgs = await getOrgsForUser(username);
	return dynamicResponse(req, res, 200, { orgs, currentOrgId });
}

/**
 * POST /orgs/members
 */
export async function addMember(req, res, _next) {
	const username = res.locals.originalUser?.username || res.locals.user?.username;
	const { orgId, memberUsername } = req.body;
	if (!username) { return dynamicResponse(req, res, 401, { error: 'Not authenticated' }); }
	if (!orgId || !memberUsername) { return dynamicResponse(req, res, 400, { error: 'orgId and memberUsername required' }); }

	const org = await db.db().collection('orgs').findOne({ _id: new ObjectId(orgId) });
	if (!org) { return dynamicResponse(req, res, 404, { error: 'Org not found' }); }
	if (org.owner !== username) { return dynamicResponse(req, res, 403, { error: 'Only org owner can add members' }); }

	// ensure user exists
	const userExists = await db.db().collection('accounts').findOne({ _id: memberUsername }, { projection: { _id: 1 } });
	if (!userExists) { return dynamicResponse(req, res, 404, { error: 'User not found' }); }

	// add member if not present
	const result = await db.db().collection('orgs').updateOne(
		{ _id: org._id },
		{ $addToSet: { members: memberUsername } }
	);

	return dynamicResponse(req, res, 200, { ok: true, added: result.modifiedCount === 1, member: memberUsername });
}

/**
 * DELETE /orgs/members
 */
export async function removeMember(req, res, _next) {
	const username = res.locals.originalUser?.username || res.locals.user?.username;
	const { orgId, memberUsername } = req.body;
	if (!username) {
		return dynamicResponse(req, res, 401, { error: 'Not authenticated' });
	}
	if (!orgId || !memberUsername) {
		return dynamicResponse(req, res, 400, { error: 'orgId and memberUsername required' });
	}

	const org = await db.db().collection('orgs').findOne({ _id: new ObjectId(orgId) });
	if (!org) {
		return dynamicResponse(req, res, 404, { error: 'Org not found' });
	}

	if (org.owner !== username) {
		return dynamicResponse(req, res, 403, { error: 'Only org owner can remove members' });
	}
	if (memberUsername === org.owner) {
		return dynamicResponse(req, res, 400, { error: 'Cannot remove org owner' });
	}

	await db.db().collection('orgs').updateOne(
		{ _id: org._id },
		{ $pull: { members: memberUsername } }
	);

	return dynamicResponse(req, res, 200, {});
}
