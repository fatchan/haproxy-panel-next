import * as db from '../db.js';
import { Binary, ObjectId } from 'mongodb';
import { dynamicResponse } from '../util.js';
import Roles from '../lib/permissions/roles.js';
import Permission from '../lib/permissions/permission.js';

async function getOrgsForUser(username) {
	return db.db().collection('orgs')
		.find({
			[`members.${username}`]: {
				$exists: true
			}
		}, {
			projection: {
				owner: 1,
				members: 1,
				createdAt: 1
			}
		})
		.toArray();
}

/**
 * POST /orgs/switch
 */
export async function switchOrg(req, res, _next) {
	const username = res.locals.originalUser.username;
	const { orgId } = req.body;

	if (!orgId || typeof orgId !== 'string' || orgId.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'orgId required' });
	}

	let org;
	try {
		org = await db.db().collection('orgs').findOne({
			_id: new ObjectId(orgId),
			[`members.${username}`]: {
				$exists: true
			}
		});
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, { error: 'Invalid orgId' });
	}

	// persist in session
	req.session.currentOrg = orgId;
	req.session.impersonateOwner = org.owner;
	await req.session.save();

	return dynamicResponse(req, res, 200, {}); //org switched
}

/**
 * GET /organisation (page)
 */
export async function organisationPage(app, req, res, _next) {
	const username = res.locals.originalUser.username;
	const orgs = await getOrgsForUser(username);
	const currentOrgId = req.session?.currentOrg;
	res.locals.data = { csrf: req.csrfToken(), orgs, currentOrgId, originalUser: res.locals.originalUser };
	return app.render(req, res, '/organisation');
}

/**
 * GET /organisation/member/:memberUsername (page)
 */
export async function organisationMemberEditPage(app, req, res, next) {
	const username = res.locals.originalUser.username;
	const currentOrgId = req.session?.currentOrg;
	const orgs = await getOrgsForUser(username);

	const { memberUsername } = req.params;
	const member = res.locals.org.members[memberUsername];
	if (!member) {
		return next();
	}

	res.locals.data = { member, csrf: req.csrfToken(), orgs, currentOrgId, originalUser: res.locals.originalUser };
	return app.render(req, res, `/organisation/member/${memberUsername}/edit`);
}

/**
 * GET /organisation/member/:memberUsername.json
 */
export async function organisationMemberJson(req, res, _next) {
	const username = res.locals.originalUser.username;
	const currentOrgId = req.session?.currentOrg;
	const orgs = await getOrgsForUser(username);

	const { memberUsername } = req.params;
	const member = res.locals.org.members[memberUsername];
	if (!member) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	return dynamicResponse(req, res, 200, { member, csrf: req.csrfToken(), orgs, currentOrgId, originalUser: res.locals.originalUser });
}

/**
 * GET /organisations.json
 */
export async function organisationsJson(req, res, _next) {
	const username = res.locals.originalUser.username;
	const currentOrgId = req.session?.currentOrg;
	const orgs = await getOrgsForUser(username);
	return dynamicResponse(req, res, 200, { csrf: req.csrfToken(), orgs, currentOrgId, originalUser: res.locals.originalUser });
}

/**
 * POST /organisation/:orgId/members
 */
export async function addMember(req, res, _next) {
	const { memberUsername } = req.body;

	if (!res.locals.org
		|| !memberUsername || typeof memberUsername !== 'string' || memberUsername.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const org = res.locals.org;
	if (!org) {
		return dynamicResponse(req, res, 404, { error: 'Org not found' });
	}

	if (org.members[memberUsername]) {
		return dynamicResponse(req, res, 409, { error: 'Member already exists' });
	}

	const userExists = await db.db().collection('accounts').findOne({ _id: memberUsername }, { projection: { _id: 1 } });
	if (!userExists) {
		return dynamicResponse(req, res, 404, { error: 'User not found' });
	}

	// add member if not present
	await db.db().collection('orgs').updateOne(
		{ _id: org._id },
		{
			$set: {
				[`members.${memberUsername}`]: {
					/* TODO: properties for perms matrix, metadata, etc */
					'addedDate': new Date(),
					permissions: Binary(Roles.roles.ORG_MEMBER.array)
				}
			}
		}
	);

	return dynamicResponse(req, res, 200, {});
}

/**
 * DELETE /organisation/:orgId/members
 */
export async function removeMember(req, res, _next) {
	const { memberUsername } = req.body;

	if (!res.locals.org
		|| !memberUsername || typeof memberUsername !== 'string' || memberUsername.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const org = res.locals.org;
	if (!org) {
		return dynamicResponse(req, res, 404, { error: 'Org not found' });
	}

	if (memberUsername === org.owner) {
		return dynamicResponse(req, res, 400, { error: 'Cannot remove org owner' });
	}

	await db.db().collection('orgs').updateOne(
		{ _id: org._id },
		{
			$unset: {
				[`members.${memberUsername}`]: '', //removes member from obj
			}
		}
	);

	return dynamicResponse(req, res, 200, {});
}

/**
 * POST /organisation/:orgId/members/:memberUsername
 */
export async function updateMember(req, res, _next) {
	const { memberUsername } = req.params;

	if (!res.locals.org
		|| !memberUsername || typeof memberUsername !== 'string' || memberUsername.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const org = res.locals.org;

	if (!org.members[memberUsername]) {
		return dynamicResponse(req, res, 404, { error: 'Member not found' });
	}

	if (memberUsername === org.owner) {
		return dynamicResponse(req, res, 400, { error: 'Cannot modify org owner permission' });
	}

	const updatingPermissions = new Permission(org.members[memberUsername].permissions.toString('base64'));
	updatingPermissions.handleBody(req.body, res.locals.permissions, true);

	await db.db().collection('orgs').updateOne(
		{ _id: org._id },
		{
			$set: {
				[`members.${memberUsername}.permissions`]: Binary(updatingPermissions.array),
			}
		}
	);

	return dynamicResponse(req, res, 200, {});
}
